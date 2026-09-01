import {
  AUTO_SCROLL_SPEED,
  AUTO_SCROLL_TIME,
  BONUS_PER_COIN,
  CAR_PALETTES,
  GRID_COLUMNS,
  GRID_SIZE,
  IDLE_WARNING_TIME,
  MAX_GRID_X,
  MIN_GRID_X,
  SCORE_PER_ROW,
  SKINS,
  WOLF_CATCH_TIME,
  WOLF_CHASE_SPEED,
  WOLF_SPAWN_DELAY,
} from './constants';
import { calculateViewportBounds, worldToScreen } from './coordinates';
import { DifficultyConfig, getDifficultyForDistance } from './difficulty';
import {
  createCalibratedCar,
  generateProceduralLane,
  getProceduralRNG,
  isSafeSpawn,
  setProceduralSeed,
} from './procedural';
import { ScoreManager } from './scoring';
import { sounds } from '../services/audio';
import {
  Car,
  CarType,
  Coin,
  Decoration,
  Direction,
  FloatingText,
  Lane,
  LaneType,
  Particle,
  PlayerState,
  SkinId,
  WolfState,
} from '../types';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, coinsInRun: number, maxDistance: number, isNewRecord: boolean) => void;
  onGameOver: (finalScore: number, coinsInRun: number, reason: 'CAR' | 'WOLF') => void;
  onCoinCollected: (totalRunCoins: number) => void;
  onNewHighScore?: (score: number) => void;
  onDifficultyChange?: (tier: DifficultyConfig) => void;
}

export class GameEngine {
  public lanes: Lane[] = [];
  public player: PlayerState;
  public wolf: WolfState;
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public scoreManager: ScoreManager;

  public cameraY: number = 0; // target smooth camera Y in grid units
  public currentCameraY: number = 0;
  public cameraX: number = 0; // target smooth camera X in world pixels
  public currentCameraX: number = 0;
  public screenShake: number = 0; // 0 to 1 trauma for cartoon hit feedback

  public viewportWidth: number = 480;
  public viewportHeight: number = 800;

  public idleTimer: number = 0; // seconds spent without moving forward
  public lastMoveTime: number = 0;

  public maxDistance: number = 0;
  public coinsInRun: number = 0;
  public score: number = 0;

  public isRunning: boolean = false;
  public isPaused: boolean = false;

  public currentDifficultyTier: DifficultyConfig;

  private consecutiveState = { roadCount: 0, grassCount: 0 };

  private callbacks: GameEngineCallbacks;
  private lastTime: number = 0;
  private alertSoundTimer: number = 0;

  constructor(skinId: SkinId, initialHighScore: number, callbacks: GameEngineCallbacks) {
    this.callbacks = callbacks;
    this.scoreManager = new ScoreManager(initialHighScore);
    this.player = this.createInitialPlayer(skinId);
    this.wolf = {
      active: false,
      worldY: 0,
      x: 0,
      speed: WOLF_CHASE_SPEED,
      caughtPlayer: false,
      catchProgress: 0,
    };
    this.currentDifficultyTier = getDifficultyForDistance(0);
    this.resetRun(skinId, initialHighScore);
  }

  public setSeed(seed?: number | string | null) {
    setProceduralSeed(seed);
  }

  private createInitialPlayer(skinId: SkinId): PlayerState {
    return {
      gridX: 0,
      gridY: 0,
      targetGridX: 0,
      targetGridY: 0,
      x: 0,
      y: 0,
      facing: 'UP',
      currentAngle: 0,
      targetAngle: 0,
      isHopping: false,
      hopProgress: 0,
      hopHeight: 0,
      landingBounce: 0,
      isDead: false,
      skinId,
    };
  }

  public setSkin(skinId: SkinId) {
    this.player.skinId = skinId;
  }

  /**
   * Update viewport dimensions without resetting game state or camera.
   * Gracefully recalculates viewport metrics and keeps camera framing player.
   */
  public setViewport(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Keep player within absolute world grid boundaries [-5, +5]
    if (this.player.gridX < MIN_GRID_X || this.player.gridX > MAX_GRID_X) {
      const clampedGridX = Math.max(MIN_GRID_X, Math.min(MAX_GRID_X, this.player.gridX));
      this.player.gridX = clampedGridX;
      this.player.targetGridX = clampedGridX;
      this.player.x = clampedGridX * GRID_SIZE;
    }

    // Immediately frame camera on player
    const maxCamOffset = Math.max(0, (MAX_GRID_X * GRID_SIZE + 24) - this.viewportWidth / 2);
    this.cameraX = Math.max(-maxCamOffset, Math.min(maxCamOffset, this.player.x));
    this.currentCameraX = this.cameraX;
  }

  /**
   * Reset Player state only (used when starting a new run)
   */
  public resetPlayer(skinId?: SkinId) {
    const chosenSkin = skinId || this.player.skinId || 'classic';
    this.player = this.createInitialPlayer(chosenSkin);
  }

  /**
   * Reset Camera state only
   */
  public resetCamera() {
    this.cameraY = 0;
    this.currentCameraY = 0;
    this.cameraX = 0;
    this.currentCameraX = 0;
  }

  /**
   * Reset World lanes & decorations only
   */
  public resetWorld() {
    this.lanes = [];
    this.consecutiveState = { roadCount: 0, grassCount: 0 };
    this.currentDifficultyTier = getDifficultyForDistance(0);

    // Generate initial world lanes (-5 to +25)
    for (let i = -5; i <= 25; i++) {
      this.generateLane(i);
    }
  }

  /**
   * Reset Score & progression state only
   */
  public resetScore(initialHighScore?: number) {
    this.scoreManager.reset(initialHighScore);
    this.maxDistance = 0;
    this.coinsInRun = 0;
    this.score = 0;
  }

  /**
   * Reset entire run state (ONLY called when explicitly starting or restarting a run)
   */
  public resetRun(skinId?: SkinId, initialHighScore?: number) {
    this.resetPlayer(skinId);
    this.wolf = {
      active: false,
      worldY: 0,
      x: 0,
      speed: WOLF_CHASE_SPEED,
      caughtPlayer: false,
      catchProgress: 0,
    };

    this.resetScore(initialHighScore);
    this.particles = [];
    this.floatingTexts = [];
    this.resetCamera();
    this.idleTimer = 0;
    this.lastMoveTime = performance.now();
    this.isRunning = true;
    this.isPaused = false;
    this.alertSoundTimer = 0;
    this.resetWorld();
  }

  /**
   * Alias for resetRun for backward compatibility
   */
  public reset(skinId?: SkinId, initialHighScore?: number) {
    this.resetRun(skinId, initialHighScore);
  }

  // Generate procedural lane governed by configurable difficulty & fairness guarantees
  private generateLane(index: number): Lane {
    const lane = generateProceduralLane(
      index,
      this.lanes,
      {
        x: this.player.x,
        y: this.player.y,
        gridX: this.player.gridX,
        gridY: this.player.gridY,
      },
      this.consecutiveState
    );
    this.lanes.push(lane);
    return lane;
  }

  // Handle Player Movement (Arrow keys / WASD / Touch / Swipe)
  public move(direction: Direction) {
    if (this.player.isDead || !this.isRunning || this.isPaused) return;

    // If already hopping, commit current hop immediately to prevent missed inputs
    if (this.player.isHopping) {
      if (this.player.hopProgress < 0.45) {
        return; // Don't interrupt at the very start of hop
      }
      // Finalize previous hop to target position before starting new one
      this.player.gridX = this.player.targetGridX;
      this.player.gridY = this.player.targetGridY;
      this.player.x = this.player.gridX * GRID_SIZE;
      this.player.y = -this.player.gridY * GRID_SIZE;
      this.player.isHopping = false;
      this.player.hopProgress = 1;

      if (this.player.gridY > this.maxDistance) {
        this.handlePositionScoreUpdate(this.player.gridY);
      }
      this.checkCoinPickup();
    }

    const bounds = calculateViewportBounds(this.viewportWidth, this.viewportHeight, this.currentCameraX, this.currentCameraY);

    let nextX = this.player.gridX;
    let nextY = this.player.gridY;
    let targetAngle = this.player.targetAngle;

    if (direction === 'UP') {
      nextY += 1;
      targetAngle = 0;
    } else if (direction === 'DOWN') {
      targetAngle = Math.PI;
      const testNextY = Math.max(0, this.player.gridY - 1);
      // Check if moving DOWN would push the player past the bottom safe screen margin
      const projectedScreen = worldToScreen(
        this.player.x,
        -testNextY * GRID_SIZE,
        this.currentCameraX,
        this.currentCameraY,
        this.viewportWidth,
        this.viewportHeight
      );

      if (projectedScreen.screenY > bounds.maxScreenY || testNextY === this.player.gridY) {
        // Player turns facing DOWN but movement is safely blocked at screen edge
        this.player.facing = 'DOWN';
        this.player.targetAngle = targetAngle;
        return;
      }
      nextY = testNextY;
    } else if (direction === 'LEFT') {
      targetAngle = -Math.PI / 2;
      if (this.player.gridX <= MIN_GRID_X) {
        // Player turns facing LEFT but movement is safely blocked at world edge
        this.player.facing = 'LEFT';
        this.player.targetAngle = targetAngle;
        return;
      }
      nextX = Math.max(MIN_GRID_X, this.player.gridX - 1);
    } else if (direction === 'RIGHT') {
      targetAngle = Math.PI / 2;
      if (this.player.gridX >= MAX_GRID_X) {
        // Player turns facing RIGHT but movement is safely blocked at world edge
        this.player.facing = 'RIGHT';
        this.player.targetAngle = targetAngle;
        return;
      }
      nextX = Math.min(MAX_GRID_X, this.player.gridX + 1);
    }

    // Check Solid Obstacle (Tree) Collision
    const targetLane = this.lanes.find((l) => l.index === nextY);
    const isBlockedByTree = targetLane?.decorations?.some(
      (d) => d.type === 'TREE' && d.gridX === nextX
    );
    if (isBlockedByTree) {
      // Turn to face the obstacle without hopping into it
      this.player.facing = direction;
      this.player.targetAngle = targetAngle;
      return;
    }

    // If destination did not change, do not hop
    if (nextX === this.player.gridX && nextY === this.player.gridY) {
      this.player.facing = direction;
      this.player.targetAngle = targetAngle;
      return;
    }

    this.player.facing = direction;
    this.player.targetAngle = targetAngle;
    this.player.targetGridX = nextX;
    this.player.targetGridY = nextY;
    this.player.isHopping = true;
    this.player.hopProgress = 0;
    this.player.landingBounce = 0;

    // Reset idle timer & cancel all idle danger / wolf chase effects immediately on any move!
    this.idleTimer = 0;
    this.alertSoundTimer = 0;

    // If wolf is currently chasing or active, cancel the wolf chase immediately!
    if (this.wolf.active && !this.wolf.caughtPlayer) {
      this.wolf.active = false;
      this.wolf.caughtPlayer = false;
      this.wolf.catchProgress = 0;

      // Pop a reassuring "ESCAPED! 💨" floating text
      this.floatingTexts.push({
        id: `escaped_${Date.now()}`,
        text: 'PHEW! ESCAPED! 💨',
        x: this.player.x,
        y: this.player.y - 35,
        life: 1.0,
        maxLife: 1.0,
        color: '#4ade80',
        scale: 1.0,
      });

      // Quick cartoon puff where wolf vanished
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.particles.push({
          x: this.wolf.x,
          y: this.wolf.worldY,
          vx: Math.cos(angle) * 35,
          vy: Math.sin(angle) * 35,
          life: 0.35,
          maxLife: 0.35,
          color: '#94a3b8',
          size: 5,
          shape: 'dust',
        });
      }
    }

    // Recalibrate camera target back to player position so forced auto-scroll smoothly stops
    this.cameraY = Math.max(0, this.player.targetGridY);

    sounds.playHop();

    // Spawn hop takeoff dust particles at current feet
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() * 16 - 8),
        y: this.player.y + 10 + (Math.random() * 6 - 3),
        vx: Math.random() * 30 - 15,
        vy: Math.random() * 20 - 10,
        life: 0.25,
        maxLife: 0.25,
        color: '#ffffff',
        size: 3 + Math.random() * 2,
        shape: 'dust',
      });
    }

    // If skin has sparkles (e.g. golden skin), emit trailing sparkles
    if (SKINS[this.player.skinId]?.hasSparkles) {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: this.player.x + (Math.random() * 20 - 10),
          y: this.player.y + (Math.random() * 20 - 10),
          vx: Math.random() * 40 - 20,
          vy: -(20 + Math.random() * 30),
          life: 0.4,
          maxLife: 0.4,
          color: '#fbbf24',
          size: 4,
          shape: 'star',
        });
      }
    }
  }

  // Update Game Physics & Loop
  public update(dt: number) {
    if (!this.isRunning || this.isPaused) return;

    // Cap delta time to prevent physics explosions (max 40ms per step, equivalent to minimum 25 FPS physics tick)
    const delta = Math.min(0.04, Math.max(0, dt));

    // 1. Update Player Hop Interpolation & Smooth Rotation (framerate independent decay)
    let angleDiff = this.player.targetAngle - this.player.currentAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const angleLerp = 1 - Math.exp(-24 * delta);
    this.player.currentAngle += angleDiff * angleLerp;

    if (this.player.landingBounce > 0) {
      this.player.landingBounce = Math.max(0, this.player.landingBounce - delta * 6);
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - delta * 2.5);
    }

    if (this.player.isHopping) {
      this.player.hopProgress += delta * 7.0; // Snappy 0.14s hop
      if (this.player.hopProgress >= 1) {
        this.player.hopProgress = 1;
        this.player.isHopping = false;
        this.player.gridX = this.player.targetGridX;
        this.player.gridY = this.player.targetGridY;
        this.player.x = this.player.gridX * GRID_SIZE;
        this.player.y = -this.player.gridY * GRID_SIZE;
        this.player.landingBounce = 1.0;

        // Landing dust particles (bounded)
        if (this.particles.length < 45) {
          for (let i = 0; i < 2; i++) {
            this.particles.push({
              x: this.player.x + (Math.random() * 14 - 7),
              y: this.player.y + 12,
              vx: (Math.random() - 0.5) * 20,
              vy: (Math.random() - 0.5) * 8,
              life: 0.2,
              maxLife: 0.2,
              color: '#ffffff',
              size: 2.5,
              shape: 'dust',
            });
          }
        }

        // Check if new distance record
        if (this.player.gridY > this.maxDistance) {
          this.handlePositionScoreUpdate(this.player.gridY);
        }

        // Check coin pickup
        this.checkCoinPickup();
      } else {
        // Smooth lerp
        const startX = this.player.gridX * GRID_SIZE;
        const startY = -this.player.gridY * GRID_SIZE;
        const targetX = this.player.targetGridX * GRID_SIZE;
        const targetY = -this.player.targetGridY * GRID_SIZE;

        const p = this.player.hopProgress;
        this.player.x = startX + (targetX - startX) * p;
        this.player.y = startY + (targetY - startY) * p;
      }
    } else {
      this.player.x = this.player.gridX * GRID_SIZE;
      this.player.y = -this.player.gridY * GRID_SIZE;
      this.checkCoinPickup();
    }

    // 2. Procedural World Generation ahead of player & cleanup behind
    const targetForwardLane = this.player.gridY + 24;
    const highestLane = this.lanes.length > 0 ? this.lanes[this.lanes.length - 1].index : 0;
    if (highestLane < targetForwardLane) {
      for (let l = highestLane + 1; l <= targetForwardLane; l++) {
        this.generateLane(l);
      }
    }

    // Clean up lanes far behind player to keep memory footprint bounded
    const minKeepLane = Math.floor(this.cameraY) - 8;
    if (this.lanes.length > 32 && this.lanes[0].index < minKeepLane) {
      this.lanes = this.lanes.filter((l) => l.index >= minKeepLane);
    }

    // 3. Update Idle Timer & "Keep Moving" Danger Mechanic
    if (!this.player.isDead) {
      this.idleTimer += delta;

      // Stage 1 (>= IDLE_WARNING_TIME, e.g. 2.0s):
      if (this.idleTimer >= IDLE_WARNING_TIME) {
        this.alertSoundTimer += delta;
        const pulseInterval = this.idleTimer >= WOLF_SPAWN_DELAY ? 0.35 : (this.idleTimer >= AUTO_SCROLL_TIME ? 0.6 : 0.9);
        if (this.alertSoundTimer >= pulseInterval) {
          const urgency = this.getIdleWarningRatio();
          sounds.playIdleWarning(urgency);
          this.alertSoundTimer = 0;
        }
      }

      // Stage 2 (>= AUTO_SCROLL_TIME, e.g. 3.0s):
      if (this.idleTimer >= AUTO_SCROLL_TIME) {
        const scrollFactor = Math.min(2.0, 1.0 + (this.idleTimer - AUTO_SCROLL_TIME) * 0.4);
        this.cameraY += (AUTO_SCROLL_SPEED * scrollFactor / GRID_SIZE) * delta;
      }

      // Stage 3 (>= WOLF_SPAWN_DELAY, e.g. 4.8s):
      if (this.idleTimer >= WOLF_SPAWN_DELAY && !this.wolf.active) {
        this.wolf.active = true;
        sounds.playWolfAppear();
        this.wolf.worldY = -(this.cameraY - 3.8) * GRID_SIZE;
        this.wolf.x = this.player.x;
        this.wolf.caughtPlayer = false;
        this.wolf.catchProgress = 0;

        if (this.floatingTexts.length < 5) {
          this.floatingTexts.push({
            id: `wolf_alert_${Date.now()}`,
            text: '🐺 WOLF IS COMING! HOP!',
            x: this.player.x,
            y: this.player.y - 48,
            life: 2.0,
            maxLife: 2.0,
            color: '#ef4444',
            scale: 1.1,
          });
        }
      }
    }

    // 4. Update Wolf Movement & Chase (framerate independent)
    if (this.wolf.active) {
      if (!this.wolf.caughtPlayer) {
        sounds.playWolfChase();
        const targetWolfY = this.player.y;
        const wolfLerp = 1 - Math.exp(-5 * delta);
        this.wolf.x += (this.player.x - this.wolf.x) * wolfLerp;

        if (this.wolf.worldY > targetWolfY) {
          this.wolf.worldY -= this.wolf.speed * delta;
        }

        const distY = Math.abs(this.wolf.worldY - this.player.y);
        const distX = Math.abs(this.wolf.x - this.player.x);

        if (distY < 20 && distX < 24 && !this.player.isDead) {
          this.triggerWolfCatch();
        }
      } else {
        this.wolf.catchProgress += delta / WOLF_CATCH_TIME;
        this.wolf.worldY -= 140 * delta;
        this.player.x = this.wolf.x;
        this.player.y = this.wolf.worldY - 6;

        if (this.wolf.catchProgress >= 1.0) {
          this.triggerGameOver('WOLF');
        }
      }
    }

    // 5. Update Camera Target (Smooth Follow, framerate independent)
    const targetCameraY = Math.max(this.cameraY, this.player.gridY);
    this.cameraY = targetCameraY;
    const camLerp = 1 - Math.exp(-6 * delta);
    this.currentCameraY += (this.cameraY - this.currentCameraY) * camLerp;

    // Horizontal Camera follow for mobile / narrow viewports
    const maxCamOffset = Math.max(0, (MAX_GRID_X * GRID_SIZE + 24) - this.viewportWidth / 2);
    this.cameraX = Math.max(-maxCamOffset, Math.min(maxCamOffset, this.player.x));
    const camXLerp = 1 - Math.exp(-8 * delta);
    this.currentCameraX += (this.cameraX - this.currentCameraX) * camXLerp;

    // Safety: ensure player never exceeds top visible screen margin even during high-speed forward hops
    const bounds = calculateViewportBounds(this.viewportWidth, this.viewportHeight, this.currentCameraX, this.currentCameraY);
    const playerScreen = worldToScreen(this.player.x, this.player.y, this.currentCameraX, this.currentCameraY, this.viewportWidth, this.viewportHeight);

    if (playerScreen.screenY < bounds.minScreenY) {
      this.currentCameraY += (bounds.minScreenY - playerScreen.screenY) / GRID_SIZE;
    }

    // Fall-behind detection (when camera scrolls forward during idle and player is left far behind)
    if (!this.player.isDead && (this.currentCameraY - this.player.gridY) > 5.5) {
      if (!this.wolf.active) {
        this.wolf.active = true;
        this.wolf.worldY = this.player.y + 40;
        this.wolf.x = this.player.x;
      }
      this.triggerWolfCatch();
    }

    // 6. Update Cars & Check Spatial Collision (Optimized: only check cars near player)
    const playerLaneIndex = Math.round(-this.player.y / GRID_SIZE);

    for (let l = 0; l < this.lanes.length; l++) {
      const lane = this.lanes[l];
      if (lane.type === 'ROAD' && lane.cars && lane.carSpeed) {
        const laneWorldY = -lane.index * GRID_SIZE;

        // Move existing cars
        for (let i = lane.cars.length - 1; i >= 0; i--) {
          const car = lane.cars[i];
          car.x += car.speed * delta;

          // Emit subtle exhaust smoke puff (bounded by max particles)
          car.exhaustTimer = (car.exhaustTimer || 0) + delta;
          if (car.exhaustTimer >= 0.22) {
            car.exhaustTimer = 0;
            if (this.particles.length < 40) {
              const isMovingRight = car.speed > 0;
              const rearX = car.x + (isMovingRight ? -car.length / 2 : car.length / 2);
              this.particles.push({
                x: rearX,
                y: laneWorldY + (Math.random() * 4 - 2),
                vx: (isMovingRight ? -12 : 12) + (Math.random() * 6 - 3),
                vy: -(8 + Math.random() * 8),
                life: 0.25,
                maxLife: 0.25,
                color: '#e2e8f0',
                size: 2.5 + Math.random() * 1.5,
                shape: 'smoke',
              });
            }
          }

          // Remove cars that moved far off screen
          if ((car.speed > 0 && car.x > 500) || (car.speed < 0 && car.x < -500)) {
            lane.cars.splice(i, 1);
          } else if (!this.player.isDead) {
            // Spatial sound check: only if vertically near player
            if (Math.abs(this.player.y - laneWorldY) < GRID_SIZE * 1.1) {
              const dx = car.x - this.player.x;
              if (Math.abs(dx) < 30) {
                const pan = Math.max(-1, Math.min(1, (car.x - this.player.x) / 120));
                sounds.playCarPass(pan);
              }
            }
          }
        }

        // Spawn new cars at interval
        lane.spawnTimer = (lane.spawnTimer || 0) + delta;
        if (lane.spawnTimer >= (lane.spawnInterval || 3.0)) {
          lane.spawnTimer = 0;
          const isMovingRight = (lane.carSpeed || 0) > 0;
          const startX = isMovingRight ? -450 : 450;
          const newCar = createCalibratedCar(
            lane.index,
            lane.carSpeed || 100,
            lane.carType || 'SEDAN',
            startX
          );

          if (isSafeSpawn(newCar, this.player.x, this.player.y, lane.index)) {
            lane.cars.push(newCar);
          }
        }

        // Spatial Collision Detection (only inspect lanes within 1 index of player)
        if (!this.player.isDead && Math.abs(lane.index - playerLaneIndex) <= 1) {
          if (Math.abs(this.player.y - laneWorldY) < GRID_SIZE * 0.58) {
            const playerRadius = 11;
            const playerLeft = this.player.x - playerRadius;
            const playerRight = this.player.x + playerRadius;
            const playerTop = this.player.y - playerRadius;
            const playerBottom = this.player.y + playerRadius;

            for (let c = 0; c < lane.cars.length; c++) {
              const car = lane.cars[c];
              // Broadphase X check: ignore cars far to the left or right
              if (Math.abs(car.x - this.player.x) > 60) continue;

              const carHalfLen = car.length / 2 - 3;
              const carHalfWidth = car.width / 2 - 2;
              const carLeft = car.x - carHalfLen;
              const carRight = car.x + carHalfLen;
              const carTop = laneWorldY - carHalfWidth;
              const carBottom = laneWorldY + carHalfWidth;

              if (
                playerRight > carLeft &&
                playerLeft < carRight &&
                playerBottom > carTop &&
                playerTop < carBottom
              ) {
                this.triggerCarCrash(car);
                break;
              }
            }
          }
        }
      }
    }

    // 7. Update Coins Animation
    for (let l = 0; l < this.lanes.length; l++) {
      const lane = this.lanes[l];
      if (lane.coins && lane.coins.length > 0) {
        for (let c = 0; c < lane.coins.length; c++) {
          const coin = lane.coins[c];
          if (coin.collected && coin.collectAnim < 1) {
            coin.collectAnim += delta * 3;
          }
        }
      }
    }

    // 8. In-place Particle Updates & GC reduction (O(N) single-pass without array reallocation)
    let validParticles = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.life -= delta;
      if (p.life > 0) {
        this.particles[validParticles++] = p;
      }
    }
    this.particles.length = validParticles;

    // 9. In-place Floating Text Updates (O(N) single-pass)
    let validTexts = 0;
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ft.y -= delta * 30;
      ft.life -= delta;
      if (ft.life > 0) {
        this.floatingTexts[validTexts++] = ft;
      }
    }
    this.floatingTexts.length = validTexts;
  }

  // Check if player collects a coin (spatial broadphase)
  private checkCoinPickup() {
    if (this.player.isDead) return;

    const playerLaneIndex = Math.round(-this.player.y / GRID_SIZE);

    for (let l = 0; l < this.lanes.length; l++) {
      const lane = this.lanes[l];
      if (Math.abs(lane.index - playerLaneIndex) > 1) continue;
      if (!lane.coins || lane.coins.length === 0) continue;

      const laneWorldY = -lane.index * GRID_SIZE;
      if (Math.abs(this.player.y - laneWorldY) < GRID_SIZE * 0.7) {
        for (let c = 0; c < lane.coins.length; c++) {
          const coin = lane.coins[c];
          if (!coin.collected && Math.abs(coin.gridX - this.player.gridX) <= 1.2) {
            const coinWorldX = coin.gridX * GRID_SIZE;
            const dist = Math.hypot(this.player.x - coinWorldX, this.player.y - laneWorldY);
            if (dist < 26) {
              coin.collected = true;
              coin.collectAnim = 0;
              this.handleCoinScoreUpdate();

              sounds.playCoin();
              this.callbacks.onCoinCollected(this.coinsInRun);

              // Floating coin text (bounded)
              if (this.floatingTexts.length < 5) {
                this.floatingTexts.push({
                  id: `ft_${Date.now()}_${Math.random()}`,
                  text: '+1 COIN! (+5 PTS) ⭐',
                  x: this.player.x,
                  y: this.player.y - 20,
                  life: 1.2,
                  maxLife: 1.2,
                  color: '#facc15',
                  scale: 1.0,
                });
              }

              // Sparkle particles (bounded)
              if (this.particles.length < 40) {
                for (let i = 0; i < 6; i++) {
                  const angle = (i * Math.PI * 2) / 6;
                  this.particles.push({
                    x: this.player.x,
                    y: this.player.y,
                    vx: Math.cos(angle) * (40 + Math.random() * 25),
                    vy: Math.sin(angle) * (40 + Math.random() * 25),
                    life: 0.4,
                    maxLife: 0.4,
                    color: '#fbbf24',
                    size: 4,
                    shape: 'star',
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  private handlePositionScoreUpdate(gridY: number) {
    const res = this.scoreManager.updatePosition(gridY);
    this.score = res.score;
    this.maxDistance = res.maxDistance;
    this.coinsInRun = res.coinsCount;

    // Check if player crossed into a new difficulty tier milestone
    const newTier = getDifficultyForDistance(this.maxDistance);
    if (newTier.name !== this.currentDifficultyTier.name) {
      const prevTier = this.currentDifficultyTier;
      this.currentDifficultyTier = newTier;
      this.callbacks.onDifficultyChange?.(newTier);

      // Celebrate new stage entry
      this.floatingTexts.push({
        id: `tier_${Date.now()}`,
        text: `⚡ STAGE: ${newTier.name.toUpperCase()}! 🚀`,
        x: this.player.x,
        y: this.player.y - 45,
        life: 2.5,
        maxLife: 2.5,
        color: '#38bdf8',
        scale: 1.2,
      });

      // Stage milestone particles
      for (let i = 0; i < 14; i++) {
        const angle = (i * Math.PI * 2) / 14;
        const speed = 60 + Math.random() * 50;
        this.particles.push({
          x: this.player.x,
          y: this.player.y - 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.65,
          maxLife: 0.65,
          color: '#38bdf8',
          size: 5,
          shape: 'star',
        });
      }
    }

    if (res.justBrokeRecord) {
      this.celebrateNewRecord(res.score);
    }

    this.callbacks.onScoreUpdate(this.score, this.coinsInRun, this.maxDistance, res.isNewRecord);
  }

  private handleCoinScoreUpdate() {
    const res = this.scoreManager.addCoin();
    this.score = res.score;
    this.maxDistance = res.maxDistance;
    this.coinsInRun = res.coinsCount;

    if (res.justBrokeRecord) {
      this.celebrateNewRecord(res.score);
    }

    this.callbacks.onScoreUpdate(this.score, this.coinsInRun, this.maxDistance, res.isNewRecord);
  }

  private celebrateNewRecord(newScore: number) {
    sounds.playHighScore();
    this.callbacks.onNewHighScore?.(newScore);

    // Large floating celebration banner
    this.floatingTexts.push({
      id: `new_record_${Date.now()}`,
      text: '🏆 NEW BEST RECORD! 🌟',
      x: this.player.x,
      y: this.player.y - 45,
      life: 2.5,
      maxLife: 2.5,
      color: '#facc15',
      scale: 1.25,
    });

    // Golden celebration fireworks sparkles
    for (let i = 0; i < 18; i++) {
      const angle = (i * Math.PI * 2) / 18;
      const speed = 50 + Math.random() * 60;
      this.particles.push({
        x: this.player.x,
        y: this.player.y - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        maxLife: 0.8,
        color: i % 2 === 0 ? '#fde047' : '#fb923c',
        size: 5,
        shape: 'star',
      });
    }
  }

  // Trigger Car Crash
  private triggerCarCrash(car: Car) {
    this.player.isDead = true;
    this.player.deathReason = 'CAR';
    this.screenShake = 0.55; // Trigger juicy screen shake
    sounds.playCrash();

    // Explosion / cartoon dust and star burst
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6,
        maxLife: 0.6,
        color: Math.random() > 0.5 ? '#fde047' : '#ef4444',
        size: 5 + Math.random() * 4,
        shape: i % 2 === 0 ? 'star' : 'dust',
      });
    }

    this.floatingTexts.push({
      id: `crash_${Date.now()}`,
      text: 'OINK! 💥',
      x: this.player.x,
      y: this.player.y - 30,
      life: 1.5,
      maxLife: 1.5,
      color: '#ef4444',
      scale: 1.2,
    });

    // Delay 0.8s for visual impact before showing Game Over modal
    setTimeout(() => {
      this.triggerGameOver('CAR');
    }, 850);
  }

  // Trigger Wolf Catch
  private triggerWolfCatch() {
    if (this.wolf.caughtPlayer) return;
    this.wolf.caughtPlayer = true;
    this.wolf.catchProgress = 0;
    this.player.isDead = true;
    this.player.deathReason = 'WOLF';

    sounds.playWolfCatch();

    this.floatingTexts.push({
      id: `wolf_catch_${Date.now()}`,
      text: 'CAUGHT! 🐺💨',
      x: this.player.x,
      y: this.player.y - 40,
      life: 1.5,
      maxLife: 1.5,
      color: '#fbbf24',
      scale: 1.2,
    });

    // Poof particles
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * (50 + Math.random() * 50),
        vy: Math.sin(angle) * (50 + Math.random() * 50),
        life: 0.5,
        maxLife: 0.5,
        color: '#cbd5e1',
        size: 6,
        shape: 'dust',
      });
    }
  }

  private triggerGameOver(reason: 'CAR' | 'WOLF') {
    this.isRunning = false;
    this.callbacks.onGameOver(this.score, this.coinsInRun, reason);
  }

  public getIdleWarningRatio(): number {
    if (this.player.isDead) return 0;
    if (this.idleTimer < IDLE_WARNING_TIME) return 0;
    // Normalize ratio between IDLE_WARNING_TIME and WOLF_SPAWN_DELAY
    return Math.min(1.0, (this.idleTimer - IDLE_WARNING_TIME) / (WOLF_SPAWN_DELAY - IDLE_WARNING_TIME));
  }
}
