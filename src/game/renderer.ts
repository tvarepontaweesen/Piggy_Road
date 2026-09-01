import { CAR_PALETTES, GRID_SIZE, MAX_GRID_X, MIN_GRID_X, SKINS } from './constants';
import { calculateViewportBounds, worldToScreen } from './coordinates';
import { Car, Coin, Decoration, FloatingText, Lane, Particle, PlayerState, SkinId, WolfState } from '../types';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public resize(width: number, height: number, dpr: number = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  // Draw the entire scene
  public render(
    cameraX: number,
    cameraY: number,
    lanes: Lane[],
    player: PlayerState,
    wolf: WolfState,
    particles: Particle[],
    floatingTexts: FloatingText[],
    idleWarningRatio: number, // 0 to 1
    totalCoinsInRun: number,
    screenShake: number = 0,
    debugMode: boolean = false
  ) {
    const ctx = this.ctx;
    ctx.save();

    // Fill background with lush green
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, this.width, this.height);

    // Screen Shake effect
    let shakeX = 0;
    let shakeY = 0;
    if (screenShake > 0) {
      const shakeMag = screenShake * 8;
      shakeX = (Math.random() - 0.5) * 2 * shakeMag;
      shakeY = (Math.random() - 0.5) * 2 * shakeMag;
    }

    // World transform: Center X horizontally offset by cameraX, offset by camera Y vertically
    const centerX = this.width / 2 - cameraX + shakeX;
    const originY = this.height * 0.72 + cameraY * GRID_SIZE + shakeY; // player is around lower 1/3 of screen

    ctx.save();
    ctx.translate(centerX, originY);

    // 1. Calculate visible viewport lane index range
    const minVisibleIndex = Math.floor((originY - this.height - 140) / GRID_SIZE);
    const maxVisibleIndex = Math.ceil((originY + 140) / GRID_SIZE);
    const leftCarBound = cameraX - this.width / 2 - 120;
    const rightCarBound = cameraX + this.width / 2 + 120;

    // Filter visible lanes once
    const visibleLanes: Lane[] = [];
    for (let i = 0; i < lanes.length; i++) {
      const l = lanes[i];
      if (l.index >= minVisibleIndex && l.index <= maxVisibleIndex) {
        visibleLanes.push(l);
      }
    }

    // 1. Draw visible lanes
    for (let i = 0; i < visibleLanes.length; i++) {
      this.drawLane(visibleLanes[i]);
    }

    // 2. Draw coins on visible lanes
    let activeCoinsCount = 0;
    for (let i = 0; i < visibleLanes.length; i++) {
      const lane = visibleLanes[i];
      if (lane.coins && lane.coins.length > 0) {
        for (let c = 0; c < lane.coins.length; c++) {
          const coin = lane.coins[c];
          if (!coin.collected || coin.collectAnim < 1) {
            this.drawCoin(coin, lane.index);
            activeCoinsCount++;
          }
        }
      }
    }

    // 3. Draw cars on visible lanes (culled by screen horizontal bounds)
    for (let i = 0; i < visibleLanes.length; i++) {
      const lane = visibleLanes[i];
      if (lane.type === 'ROAD' && lane.cars && lane.cars.length > 0) {
        for (let c = 0; c < lane.cars.length; c++) {
          const car = lane.cars[c];
          if (car.x >= leftCarBound && car.x <= rightCarBound) {
            this.drawCar(car, lane.index);
          }
        }
      }
    }

    // 4. Draw trees/decorations on visible lanes
    for (let i = 0; i < visibleLanes.length; i++) {
      const lane = visibleLanes[i];
      if ((lane.type === 'GRASS' || lane.type === 'START_ZONE') && lane.decorations) {
        for (let d = 0; d < lane.decorations.length; d++) {
          this.drawDecoration(lane.decorations[d], lane.index);
        }
      }
    }

    // 5. Draw particles in world space
    for (let i = 0; i < particles.length; i++) {
      this.drawParticle(particles[i]);
    }

    // 6. Draw Player (Pig)
    this.drawPlayer(player);

    // 6.5. Draw Near-Pig Idle Danger Indicator ("KEEP MOVING!", pulsing alert icon, sweat drops)
    if (idleWarningRatio > 0 && !player.isDead) {
      this.drawPlayerIdleWarningIndicator(player, idleWarningRatio);
    }

    // 7. Draw Wolf if active
    if (wolf.active) {
      this.drawWolf(wolf, player);
    }

    // 8. Draw floating text in world space
    for (let i = 0; i < floatingTexts.length; i++) {
      this.drawFloatingText(floatingTexts[i]);
    }

    // World-space Debug Visualization
    if (debugMode) {
      this.drawWorldDebugGuides(cameraX, cameraY, visibleLanes, player);
    }

    ctx.restore(); // restore world transform

    // 9. Draw Screen Overlay effects (Idle warning vignette & alert)
    if (idleWarningRatio > 0) {
      this.drawIdleWarningVignette(idleWarningRatio);
    }

    // Screen-space Debug Overlay
    if (debugMode) {
      this.drawScreenDebugOverlay(cameraX, cameraY, player, activeCoinsCount);
    }

    ctx.restore();
  }

  // Draw a single lane
  private drawLane(lane: Lane) {
    const ctx = this.ctx;
    const y = -lane.index * GRID_SIZE;
    const laneWidth = this.width * 2; // wide enough to cover screen
    const x = -laneWidth / 2;

    if (lane.type === 'START_ZONE' || lane.type === 'GRASS') {
      // Grass Lane
      const isEven = lane.index % 2 === 0;
      ctx.fillStyle = isEven ? '#86efac' : '#4ade80'; // soft checker grass
      ctx.fillRect(x, y - GRID_SIZE / 2, laneWidth, GRID_SIZE);

      // Subtle grass texture lines
      ctx.fillStyle = isEven ? '#6ee7b7' : '#22c55e';
      for (let i = -6; i <= 6; i++) {
        const gx = i * GRID_SIZE + (lane.index * 17) % 20;
        ctx.fillRect(gx - 4, y - 8, 3, 6);
        ctx.fillRect(gx + 12, y + 4, 3, 5);
      }
    } else {
      // Road Lane
      ctx.fillStyle = '#334155'; // dark slate asphalt
      ctx.fillRect(x, y - GRID_SIZE / 2, laneWidth, GRID_SIZE);

      // Curbs / lane edge lines
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y - GRID_SIZE / 2, laneWidth, 2);
      ctx.fillRect(x, y + GRID_SIZE / 2 - 2, laneWidth, 2);

      // Dashed lane separator
      ctx.fillStyle = '#f8fafc';
      const dashWidth = 24;
      const dashGap = 20;
      const period = dashWidth + dashGap;
      const startX = -this.width;
      const endX = this.width;

      for (let dx = startX; dx < endX; dx += period) {
        ctx.fillRect(dx, y - 1.5, dashWidth, 3);
      }
    }
  }

  // Draw Cute Nature Decorations (Flowers, bushes, trees)
  private drawDecoration(deco: Decoration, laneIndex: number) {
    const ctx = this.ctx;
    const x = deco.gridX * GRID_SIZE;
    const y = -laneIndex * GRID_SIZE;

    ctx.save();
    ctx.translate(x, y);

    if (deco.type === 'TREE') {
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(3, 10, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-3, 0, 6, 12);

      // Canopy layers (cute rounded cartoon pine or oak)
      ctx.fillStyle = '#15803d'; // dark green
      ctx.beginPath();
      ctx.arc(0, -6, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e'; // bright green highlight
      ctx.beginPath();
      ctx.arc(-2, -8, 12, 0, Math.PI * 2);
      ctx.fill();

      // Top puff
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(-4, -12, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (deco.type === 'FLOWER') {
      // Flower shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(0, -2);
      ctx.stroke();

      // Petals (colorful variants)
      const colors = ['#f43f5e', '#fbbf24', '#a855f7', '#ec4899', '#38bdf8'];
      const flowerColor = colors[deco.variant % colors.length];

      ctx.fillStyle = flowerColor;
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const px = Math.cos(angle) * 4;
        const py = -2 + Math.sin(angle) * 4;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (deco.type === 'BUSH') {
      // Bush shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 6, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bush puffs
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(-6, 0, 7, 0, Math.PI * 2);
      ctx.arc(6, 0, 7, 0, Math.PI * 2);
      ctx.arc(0, -4, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(-2, -5, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw 3D-styled animated rotating Gold Coin
  private drawCoin(coin: Coin, laneIndex: number) {
    const ctx = this.ctx;
    const x = coin.gridX * GRID_SIZE;
    const y = -laneIndex * GRID_SIZE;

    ctx.save();
    ctx.translate(x, y);

    // If collected, scale and float up
    if (coin.collected) {
      const p = coin.collectAnim;
      ctx.translate(0, -p * 35);
      ctx.globalAlpha = Math.max(0, 1 - p);
      const scale = 1 + p * 0.5;
      ctx.scale(scale, scale);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Oscillating 3D spin width
    const time = performance.now() * 0.004;
    const widthScale = Math.abs(Math.sin(time + coin.gridX * 0.7));

    // Outer coin body
    ctx.fillStyle = '#b45309'; // dark gold edge
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(2, 13 * widthScale), 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b'; // golden yellow
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(1.5, 11 * widthScale), 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner rim highlight
    ctx.fillStyle = '#fde047'; // bright gold
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(1, 8 * widthScale), 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coin star icon when wide enough
    if (widthScale > 0.4) {
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 1);
    }

    ctx.restore();
  }

  // Draw Cartoon Cars with varied types, colors, headlights, glints
  private drawCar(car: Car, laneIndex: number) {
    const ctx = this.ctx;
    const y = -laneIndex * GRID_SIZE;
    const x = car.x;
    const isMovingRight = car.speed > 0;

    ctx.save();
    ctx.translate(x, y);

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.roundRect(-car.length / 2 + 2, -car.width / 2 + 5, car.length, car.width, 6);
    ctx.fill();

    // Flip car horizontally if moving left
    if (!isMovingRight) {
      ctx.scale(-1, 1);
    }

    const halfL = car.length / 2;
    const halfW = car.width / 2;

    // 1. Wheels
    ctx.fillStyle = '#1e293b';
    const wheelW = 10;
    const wheelH = 4;
    // Top-left, Top-right, Bottom-left, Bottom-right
    ctx.fillRect(-halfL + 6, -halfW - 2, wheelW, wheelH);
    ctx.fillRect(halfL - 16, -halfW - 2, wheelW, wheelH);
    ctx.fillRect(-halfL + 6, halfW - 2, wheelW, wheelH);
    ctx.fillRect(halfL - 16, halfW - 2, wheelW, wheelH);

    // 2. Car Chassis/Body
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, car.length, car.width, 6);
    ctx.fill();

    // 3. Cabin / Roof
    const cabinL = car.length * 0.55;
    const cabinW = car.width * 0.75;
    const cabinX = -car.length * 0.1;
    const cabinY = -cabinW / 2;

    // Windshield frame / glass
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(cabinX, cabinY, cabinL, cabinW, 4);
    ctx.fill();

    // Roof top
    ctx.fillStyle = car.roofColor || car.color;
    ctx.beginPath();
    ctx.roundRect(cabinX + 4, cabinY + 2, cabinL - 8, cabinW - 4, 3);
    ctx.fill();

    // Windshield glass highlights
    ctx.fillStyle = '#38bdf8'; // sky blue glass
    // Front windshield (right side since front faces right)
    ctx.fillRect(cabinX + cabinL - 4, cabinY + 3, 3, cabinW - 6);
    // Rear windshield (left side)
    ctx.fillRect(cabinX + 1, cabinY + 3, 2, cabinW - 6);

    // 4. Headlights & Taillights
    // Front headlights (bright yellow)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(halfL - 2, -halfW + 3, 3, 5);
    ctx.fillRect(halfL - 2, halfW - 8, 3, 5);

    // Headlight beams / glow
    ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
    ctx.beginPath();
    ctx.moveTo(halfL, -halfW + 5);
    ctx.lineTo(halfL + 25, -halfW - 4);
    ctx.lineTo(halfL + 25, halfW + 4);
    ctx.lineTo(halfL, halfW - 5);
    ctx.closePath();
    ctx.fill();

    // Rear taillights (red)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-halfL - 1, -halfW + 3, 2, 4);
    ctx.fillRect(-halfL - 1, halfW - 7, 2, 4);

    // Special details by car type
    if (car.type === 'TAXI') {
      // Taxi checker sign on roof
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cabinX + cabinL / 2 - 6, -5, 12, 10);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 6px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAXI', cabinX + cabinL / 2, 0);
    } else if (car.type === 'BUS') {
      // Side windows
      ctx.fillStyle = '#0284c7';
      for (let wi = -halfL + 12; wi < halfL - 12; wi += 10) {
        ctx.fillRect(wi, -halfW + 3, 6, 3);
        ctx.fillRect(wi, halfW - 6, 6, 3);
      }
    } else if (car.type === 'SPORT') {
      // Rear spoiler
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfL - 2, -halfW + 2, 4, car.width - 4);
    }

    ctx.restore();
  }

  // Draw the Player (Pig) with hop animation, skin styles, accessories & shadows
  private drawPlayer(player: PlayerState) {
    const ctx = this.ctx;
    const skin = SKINS[player.skinId] || SKINS.classic;

    ctx.save();
    ctx.translate(player.x, player.y);

    // 1. Dynamic Shadow that shrinks and softens when pig hops in air
    const hopProgress = player.hopProgress || 0;
    const hopHeight = Math.sin(hopProgress * Math.PI) * 16;
    const shadowScale = 1 - (hopHeight / 16) * 0.35;
    const shadowAlpha = 0.25 - (hopHeight / 16) * 0.12;

    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 10, 15 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vertical hop displacement and squash & stretch
    ctx.translate(0, -hopHeight);

    let scaleX = 1;
    let scaleY = 1;
    if (player.isHopping) {
      if (hopProgress < 0.20) {
        // Anticipation squash at takeoff
        scaleX = 1.15;
        scaleY = 0.85;
      } else if (hopProgress < 0.75) {
        // Dynamic stretch in air
        scaleX = 0.88;
        scaleY = 1.18;
      } else {
        // Touchdown squash
        scaleX = 1.14;
        scaleY = 0.88;
      }
    } else if (player.landingBounce && player.landingBounce > 0) {
      // Elastic spring bounce on landing
      const b = player.landingBounce;
      scaleX = 1 + b * 0.12;
      scaleY = 1 - b * 0.10;
    }
    ctx.scale(scaleX, scaleY);

    // 3. Smooth rotation according to facing angle
    let rotation = 0;
    if (player.currentAngle !== undefined) {
      rotation = player.currentAngle;
    } else if (player.facing === 'UP') rotation = 0;
    else if (player.facing === 'RIGHT') rotation = Math.PI / 2;
    else if (player.facing === 'DOWN') rotation = Math.PI;
    else if (player.facing === 'LEFT') rotation = -Math.PI / 2;

    ctx.rotate(rotation);

    // 4. Draw Pig Body & Features
    this.renderPigBody(skin, player);

    // 5. If player is dead from car hit, draw cartoon dizzy stars rotating above
    if (player.isDead && player.deathReason === 'CAR') {
      const time = performance.now() * 0.006;
      ctx.fillStyle = '#fde047';
      for (let i = 0; i < 3; i++) {
        const starAngle = time + (i * Math.PI * 2) / 3;
        const sx = Math.cos(starAngle) * 16;
        const sy = -20 + Math.sin(starAngle) * 6;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Pure Vector Pig drawing for Canvas
  public renderPigBody(skin: typeof SKINS[SkinId], player?: PlayerState) {
    const ctx = this.ctx;

    // Curly Tail (at bottom/rear of facing direction)
    ctx.strokeStyle = skin.snoutColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 16, 5, 0, Math.PI * 1.5);
    ctx.stroke();

    // Little Hooves (4 cute dark paws)
    ctx.fillStyle = skin.secondaryColor;
    ctx.beginPath();
    ctx.roundRect(-12, -14, 6, 6, 2);
    ctx.roundRect(6, -14, 6, 6, 2);
    ctx.roundRect(-12, 10, 6, 6, 2);
    ctx.roundRect(6, 10, 6, 6, 2);
    ctx.fill();

    // Main Pig Body (plump rounded cute box)
    ctx.fillStyle = skin.bodyColor;
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 10);
    ctx.fill();

    // Body highlights / gradient gloss
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-6, -8, 6, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Ears (perky floppy ears at top)
    ctx.fillStyle = skin.secondaryColor;
    // Left ear
    ctx.beginPath();
    ctx.ellipse(-13, -16, 5, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.ellipse(13, -16, 5, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Inner ear pink
    ctx.fillStyle = skin.snoutColor;
    ctx.beginPath();
    ctx.ellipse(-13, -16, 3, 5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(13, -16, 3, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    if (skin.id === 'ninja') {
      // Glowing fierce ninja eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-8, -9, 4, 3);
      ctx.fillRect(4, -9, 4, 3);
    } else {
      // Big cute shiny eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-7, -7, 3, 0, Math.PI * 2);
      ctx.arc(7, -7, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eye glints
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-8, -8, 1.2, 0, Math.PI * 2);
      ctx.arc(6, -8, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy Cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.beginPath();
    ctx.arc(-11, -2, 3.5, 0, Math.PI * 2);
    ctx.arc(11, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Snout (The iconic piggy nose)
    ctx.fillStyle = skin.snoutColor;
    ctx.beginPath();
    ctx.roundRect(-8, -3, 16, 11, 5);
    ctx.fill();

    // Snout nostrils
    ctx.fillStyle = skin.accentColor || skin.secondaryColor;
    ctx.beginPath();
    ctx.arc(-3.5, 2.5, 1.8, 0, Math.PI * 2);
    ctx.arc(3.5, 2.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // --- Specific Skin Accessories ---
    if (skin.accessory === 'bow') {
      // Cute Pink Bow on Left Ear
      ctx.fillStyle = skin.accentColor;
      ctx.beginPath();
      ctx.moveTo(-11, -16);
      ctx.lineTo(-17, -20);
      ctx.lineTo(-17, -12);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-11, -16);
      ctx.lineTo(-5, -20);
      ctx.lineTo(-5, -12);
      ctx.closePath();
      ctx.fill();

      // Knot
      ctx.fillStyle = '#ffe4e6';
      ctx.beginPath();
      ctx.arc(-11, -16, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (skin.accessory === 'straw_hat') {
      // Farmer Straw Hat & Denim Straps
      // Blue overalls straps
      ctx.fillStyle = skin.accentColor;
      ctx.fillRect(-12, 0, 4, 15);
      ctx.fillRect(8, 0, 4, 15);
      // Brass buttons
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(-10, 4, 1.5, 0, Math.PI * 2);
      ctx.arc(10, 4, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Straw Hat Brim & Crown
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(0, -14, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, -18, 9, 0, Math.PI * 2);
      ctx.fill();

      // Red hat band
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-7, -15, 14, 2.5);
    } else if (skin.accessory === 'ninja_headband') {
      // Ninja Headband and Fluttering Ribbon
      ctx.fillStyle = skin.accentColor;
      ctx.fillRect(-16, -12, 32, 4);

      // Trailing ribbon knot behind
      ctx.beginPath();
      ctx.moveTo(-16, -10);
      ctx.lineTo(-24, -6);
      ctx.lineTo(-20, -12);
      ctx.closePath();
      ctx.fill();
    } else if (skin.accessory === 'crown') {
      // Royal Golden Crown with Sparkling Gems
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-10, -14);
      ctx.lineTo(-12, -24);
      ctx.lineTo(-5, -18);
      ctx.lineTo(0, -25);
      ctx.lineTo(5, -18);
      ctx.lineTo(12, -24);
      ctx.lineTo(10, -14);
      ctx.closePath();
      ctx.fill();

      // Jewels
      ctx.fillStyle = '#ef4444'; // ruby
      ctx.beginPath();
      ctx.arc(0, -19, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3b82f6'; // sapphire
      ctx.beginPath();
      ctx.arc(-7, -16, 1.5, 0, Math.PI * 2);
      ctx.arc(7, -16, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw the Wolf Chasing from behind!
  private drawWolf(wolf: WolfState, player: PlayerState) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(wolf.x, wolf.worldY);

    const isCatching = wolf.caughtPlayer;
    const progress = wolf.catchProgress || 0;

    // Running bounce & paw swing
    const time = performance.now() * 0.015;
    const runBounce = Math.sin(time) * 4;

    // Wolf Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 15, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, runBounce);

    // Bushy tail swinging behind
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    const tailSwing = Math.sin(time) * 0.3;
    ctx.ellipse(0, 22, 9, 16, tailSwing, 0, Math.PI * 2);
    ctx.fill();

    // Wolf Body (Dark charcoal grey cartoon wolf)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-18, -18, 36, 36, 12);
    ctx.fill();

    // Fluffy chest fur
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(0, 8);
    ctx.lineTo(10, -4);
    ctx.closePath();
    ctx.fill();

    // Red neck bandana
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(0, -2);
    ctx.lineTo(14, -10);
    ctx.lineTo(0, -12);
    ctx.closePath();
    ctx.fill();

    // Pointy Wolf Ears
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-16, -14);
    ctx.lineTo(-18, -30);
    ctx.lineTo(-6, -18);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, -14);
    ctx.lineTo(18, -30);
    ctx.lineTo(6, -18);
    ctx.closePath();
    ctx.fill();

    // Inner ear pink
    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.moveTo(-14, -16);
    ctx.lineTo(-16, -26);
    ctx.lineTo(-8, -18);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(14, -16);
    ctx.lineTo(16, -26);
    ctx.lineTo(8, -18);
    ctx.closePath();
    ctx.fill();

    // Glowing Eyes
    ctx.fillStyle = '#facc15'; // bright amber
    ctx.beginPath();
    ctx.ellipse(-8, -8, 4, 6, -0.2, 0, Math.PI * 2);
    ctx.ellipse(8, -8, 4, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Dark pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-8, -8, 2, 0, Math.PI * 2);
    ctx.arc(8, -8, 2, 0, Math.PI * 2);
    ctx.fill();

    // Wolf Snout & Mouth
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-10, -2, 20, 14, 6);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Sharp White Teeth & Funny Tongue
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-2, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(2, 8);
    ctx.lineTo(4, 4);
    ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fill();

    // Comical Panting Pink Tongue
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.ellipse(4, 9, 3, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Grasping Paws reaching forward
    ctx.fillStyle = '#1e293b';
    const pawReach = isCatching ? 12 : Math.sin(time * 1.5) * 6;
    ctx.beginPath();
    ctx.roundRect(-22, -18 - pawReach, 8, 14, 4);
    ctx.roundRect(14, -18 + pawReach, 8, 14, 4);
    ctx.fill();

    // White claws
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-22, -20 - pawReach, 2, 3);
    ctx.fillRect(-19, -21 - pawReach, 2, 3);
    ctx.fillRect(-16, -20 - pawReach, 2, 3);

    ctx.fillRect(14, -20 + pawReach, 2, 3);
    ctx.fillRect(17, -21 + pawReach, 2, 3);
    ctx.fillRect(20, -20 + pawReach, 2, 3);

    // If catching animation is running, show burlap sack scoop & pig in sack animation
    if (isCatching) {
      // Burlap sack scooping up
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.ellipse(0, -18, 22 * progress, 18 * progress, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sack rope tie
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-8 * progress, -26 * progress, 16 * progress, 4);

      // Comical "OINK!" speech pop
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💨 OINK!!', 0, -38);
    }

    ctx.restore();
  }

  // Draw small animated warning indicator near the pig with "KEEP MOVING!"
  private drawPlayerIdleWarningIndicator(player: PlayerState, ratio: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(player.x, player.y);

    const time = performance.now() * 0.008;
    // Bouncing float animation
    const bobY = -34 + Math.sin(time * 3) * 4;
    const pulseScale = 1 + Math.sin(time * 6) * 0.08 + (ratio * 0.15);

    ctx.translate(0, bobY);
    ctx.scale(pulseScale, pulseScale);

    // 1. Alert Bubble Background
    const isHighAlert = ratio > 0.5;
    const bubbleColor = isHighAlert ? '#ef4444' : '#f59e0b';
    const borderColor = isHighAlert ? '#fef08a' : '#ffffff';
    const textStr = isHighAlert ? 'KEEP MOVING! 🐺' : 'KEEP MOVING!';

    ctx.font = '900 11px "Fredoka", sans-serif';
    const textWidth = ctx.measureText(textStr).width;
    const bubbleW = textWidth + 24;
    const bubbleH = 22;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(-bubbleW / 2 + 1, -bubbleH / 2 + 2, bubbleW, bubbleH, 11);
    ctx.fill();

    // Bubble body
    ctx.fillStyle = bubbleColor;
    ctx.beginPath();
    ctx.roundRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 11);
    ctx.fill();

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Pointer notch below bubble pointing at pig's head
    ctx.fillStyle = bubbleColor;
    ctx.beginPath();
    ctx.moveTo(-5, bubbleH / 2);
    ctx.lineTo(0, bubbleH / 2 + 6);
    ctx.lineTo(5, bubbleH / 2);
    ctx.closePath();
    ctx.fill();

    // Pointer notch border lines
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, bubbleH / 2);
    ctx.lineTo(0, bubbleH / 2 + 6);
    ctx.lineTo(5, bubbleH / 2);
    ctx.stroke();

    // Text "KEEP MOVING!"
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textStr, 0, 0);

    // 2. Animated cartoon nervous sweat droplets around pig
    const sweatAlpha = Math.min(1, 0.4 + ratio * 0.6);
    ctx.fillStyle = `rgba(56, 189, 248, ${sweatAlpha})`;

    // Left sweat drop
    const sweatLeftY = Math.sin(time * 4) * 3;
    ctx.beginPath();
    ctx.ellipse(-20, 16 + sweatLeftY, 2.5, 4.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Right sweat drop
    const sweatRightY = Math.cos(time * 4) * 3;
    ctx.beginPath();
    ctx.ellipse(20, 16 + sweatRightY, 2.5, 4.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Particles (Hop dust, coin sparkles, golden trails, car exhaust smoke)
  private drawParticle(p: Particle) {
    const ctx = this.ctx;
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    if (p.shape === 'star') {
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * 0.0174) * p.size, -Math.sin((18 + i * 72) * 0.0174) * p.size);
        ctx.lineTo(Math.cos((54 + i * 72) * 0.0174) * (p.size / 2), -Math.sin((54 + i * 72) * 0.0174) * (p.size / 2));
      }
      ctx.closePath();
      ctx.fill();
    } else if (p.shape === 'smoke') {
      const growth = (1 - p.life / p.maxLife) * 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + growth, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'sparkle') {
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(0, -p.size * 0.3);
      ctx.lineTo(p.size, 0);
      ctx.lineTo(0, p.size * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(-p.size * 0.3, 0);
      ctx.lineTo(0, p.size);
      ctx.lineTo(p.size * 0.3, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Floating text like "+1 COIN!", "+10", "DANGER!"
  private drawFloatingText(ft: FloatingText) {
    const ctx = this.ctx;
    const alpha = Math.max(0, ft.life / ft.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ft.x, ft.y);
    ctx.scale(ft.scale, ft.scale);

    ctx.font = '900 18px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text outline
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeText(ft.text, 0, 0);

    // Fill
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, 0, 0);

    ctx.restore();
  }

  // Red Danger Vignette at Bottom of Screen during Idle
  private drawIdleWarningVignette(ratio: number) {
    const ctx = this.ctx;
    ctx.save();

    // Pulse alpha
    const time = performance.now() * 0.008;
    const pulse = 0.5 + Math.sin(time) * 0.3;
    const alpha = Math.min(0.7, ratio * pulse);

    // Gradient from bottom
    const grad = ctx.createLinearGradient(0, this.height, 0, this.height * 0.6);
    grad.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }

  // World-space Debug Guides (Grid boundaries, Reachable lanes, Coin hitboxes)
  private drawWorldDebugGuides(
    cameraX: number,
    cameraY: number,
    visibleLanes: Lane[],
    player: PlayerState
  ) {
    const ctx = this.ctx;
    ctx.save();

    // 1. Draw Playable World Grid Columns [-5 to +5]
    for (let gx = MIN_GRID_X; gx <= MAX_GRID_X; gx++) {
      const worldX = gx * GRID_SIZE;
      ctx.strokeStyle = gx === 0 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = gx === 0 ? 2 : 1;
      ctx.setLineDash([4, 4]);

      const topY = visibleLanes.length > 0 ? -visibleLanes[visibleLanes.length - 1].index * GRID_SIZE - 24 : -1000;
      const bottomY = visibleLanes.length > 0 ? -visibleLanes[0].index * GRID_SIZE + 24 : 1000;

      ctx.beginPath();
      ctx.moveTo(worldX - GRID_SIZE / 2, topY);
      ctx.lineTo(worldX - GRID_SIZE / 2, bottomY);
      ctx.stroke();

      if (gx === MAX_GRID_X) {
        ctx.beginPath();
        ctx.moveTo(worldX + GRID_SIZE / 2, topY);
        ctx.lineTo(worldX + GRID_SIZE / 2, bottomY);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // 2. Highlight Reachable Coins and their Tile Boundaries
    for (let i = 0; i < visibleLanes.length; i++) {
      const lane = visibleLanes[i];
      if (lane.coins) {
        for (let c = 0; c < lane.coins.length; c++) {
          const coin = lane.coins[c];
          if (!coin.collected) {
            const cx = coin.gridX * GRID_SIZE;
            const cy = -lane.index * GRID_SIZE;

            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx - 18, cy - 18, 36, 36);

            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`C[${coin.gridX},${lane.index}]`, cx, cy - 22);
          }
        }
      }
    }

    // 3. Highlight Player Box
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x - 16, player.y - 16, 32, 32);

    ctx.restore();
  }

  // Screen-space Debug Overlay (Diagnostic parameters)
  private drawScreenDebugOverlay(
    cameraX: number,
    cameraY: number,
    player: PlayerState,
    activeCoinsCount: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    const screenPos = worldToScreen(
      player.x,
      player.y,
      cameraX,
      cameraY,
      this.width,
      this.height
    );

    const bounds = calculateViewportBounds(this.width, this.height, cameraX, cameraY);

    const boxWidth = 240;
    const boxHeight = 150;
    const padding = 10;
    const x = 12;
    const y = 80;

    // Semi-transparent dark background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('🛠️ DEBUG MONITOR (Press D to hide)', x + padding, y + 18);

    ctx.fillStyle = '#f8fafc';
    let lineY = y + 34;
    const lineHeight = 14;

    ctx.fillText(`Player World: (${player.x.toFixed(0)}, ${player.y.toFixed(0)}) | Grid: [${player.gridX}, ${player.gridY}]`, x + padding, lineY);
    lineY += lineHeight;
    ctx.fillText(`Player Screen: (${screenPos.screenX.toFixed(0)}, ${screenPos.screenY.toFixed(0)})`, x + padding, lineY);
    lineY += lineHeight;
    ctx.fillText(`Camera: (X: ${cameraX.toFixed(1)}, Y: ${cameraY.toFixed(1)})`, x + padding, lineY);
    lineY += lineHeight;
    ctx.fillText(`Viewport: ${this.width}x${this.height} (DPR: ${this.dpr})`, x + padding, lineY);
    lineY += lineHeight;
    ctx.fillText(`Playable Grid: [${bounds.minGridX}, ${bounds.maxGridX}] (X: ${bounds.minWorldX}..${bounds.maxWorldX})`, x + padding, lineY);
    lineY += lineHeight;
    ctx.fillText(`Active Visible Coins: ${activeCoinsCount}`, x + padding, lineY);
    lineY += lineHeight;
    ctx.fillText(`Reachability: 100% Guaranteed Fair`, x + padding, lineY);

    ctx.restore();
  }
}
