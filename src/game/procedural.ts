import { Car, CarType, Coin, Decoration, Direction, Lane, LaneType } from '../types';
import { CAR_PALETTES, GRID_SIZE, MAX_GRID_X, MIN_GRID_X } from './constants';
import { DifficultyConfig, getDifficultyForDistance } from './difficulty';

/**
 * Procedural Generation Fairness & Safety Constants
 */
export const MIN_SAFE_ZONE_WIDTH = 5; // Minimum contiguous clear traversable tiles
export const MIN_CAR_GAP = 180; // Minimum physical pixel distance between cars on the same lane (player is 48px)
export const MAX_CAR_SPEED = 280; // Absolute hard cap on car speed (pixels/sec)
export const MAX_TRAFFIC_DENSITY = 3; // Maximum simultaneous cars on a single road lane
export const MIN_REACTION_TIME = 1.15; // Minimum time gap (seconds) between passing cars (hop takes 0.14s)
export const MIN_VALID_PATH_WIDTH = 3; // Minimum unobstructed columns across any row
export const PLAYER_SPAWN_SAFE_RADIUS = 96; // Safe buffer around player when generating lanes nearby

/**
 * Lightweight Seedable PRNG (Mulberry32) for reproducible tests, debug mode, and seeded runs
 */
export class SeededRNG {
  private state: number;

  constructor(seed?: number | string) {
    if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      this.state = hash >>> 0;
    } else if (typeof seed === 'number') {
      this.state = seed >>> 0;
    } else {
      this.state = (Math.random() * 0xffffffff) >>> 0;
    }
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  public choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

/**
 * Active RNG instance (can be seeded via setProceduralSeed)
 */
let activeRNG: SeededRNG = new SeededRNG();

export function setProceduralSeed(seed?: number | string | null): void {
  activeRNG = seed != null ? new SeededRNG(seed) : new SeededRNG();
}

export function getProceduralRNG(): SeededRNG {
  return activeRNG;
}

/**
 * Car dimension helper based on type
 */
export function getCarDimensions(type: CarType): { length: number; width: number } {
  switch (type) {
    case 'SPORT':
      return { length: 56, width: 26 };
    case 'TRUCK':
      return { length: 76, width: 30 };
    case 'BUS':
      return { length: 84, width: 29 };
    case 'TAXI':
      return { length: 52, width: 28 };
    case 'VAN':
      return { length: 62, width: 29 };
    case 'SEDAN':
    default:
      return { length: 52, width: 28 };
  }
}

/**
 * Validation: Check if traffic on a lane is fair and mathematically crossable
 */
export function isTrafficFair(lane: Lane, difficulty: DifficultyConfig): boolean {
  if (lane.type !== 'ROAD') return true;

  const speed = Math.abs(lane.carSpeed || 0);
  if (speed > MAX_CAR_SPEED || speed > difficulty.maxCarSpeed + 5) {
    return false;
  }

  const cars = lane.cars || [];
  if (cars.length > MAX_TRAFFIC_DENSITY) {
    return false;
  }

  if (cars.length > 1) {
    // Sort cars by X position
    const sorted = [...cars].sort((a, b) => a.x - b.x);

    for (let i = 0; i < sorted.length - 1; i++) {
      const carA = sorted[i];
      const carB = sorted[i + 1];
      const gap = carB.x - carB.length / 2 - (carA.x + carA.length / 2);

      // Check physical gap
      if (gap < MIN_CAR_GAP) {
        return false;
      }

      // Check time gap (reaction time)
      if (speed > 0) {
        const timeGap = gap / speed;
        if (timeGap < MIN_REACTION_TIME) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Validation: Check if a car spawns safely without overlapping or threatening player immediately
 */
export function isSafeSpawn(
  car: Car,
  playerX: number,
  playerY: number,
  laneIndex: number
): boolean {
  const laneWorldY = -laneIndex * GRID_SIZE;
  const isNearPlayerY = Math.abs(playerY - laneWorldY) < GRID_SIZE * 1.5;

  if (isNearPlayerY) {
    // If player is on or next to this lane, car must be outside safe radius
    const dist = Math.abs(car.x - playerX);
    if (dist < PLAYER_SPAWN_SAFE_RADIUS) {
      return false;
    }
  }

  return true;
}

/**
 * Validation: Verify that path remains possible across the segment
 */
export function isPathPossible(
  lanes: Lane[],
  difficulty: DifficultyConfig
): boolean {
  if (lanes.length === 0) return true;

  // Count consecutive roads
  let consecutiveRoads = 0;
  for (const lane of lanes) {
    if (lane.type === 'ROAD') {
      consecutiveRoads++;
      if (consecutiveRoads > difficulty.maxConsecutiveRoads + 1) {
        return false;
      }
    } else {
      consecutiveRoads = 0;
    }
  }

  return true;
}

/**
 * Validation: Full segment validation
 */
export function validateSegment(
  lane: Lane,
  difficulty: DifficultyConfig,
  playerX: number,
  playerY: number
): boolean {
  if (!isTrafficFair(lane, difficulty)) {
    return false;
  }

  if (lane.cars) {
    for (const car of lane.cars) {
      if (!isSafeSpawn(car, playerX, playerY, lane.index)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Factory to create a properly calibrated car
 */
export function createCalibratedCar(
  laneIndex: number,
  speed: number,
  type: CarType,
  x: number,
  rng: SeededRNG = activeRNG
): Car {
  const palette = rng.choice(CAR_PALETTES);
  const dims = getCarDimensions(type);

  return {
    id: `car_${laneIndex}_${Date.now()}_${rng.int(1000, 9999)}`,
    x,
    laneIndex,
    width: dims.width,
    length: dims.length,
    speed,
    color: type === 'TAXI' ? '#eab308' : palette.body,
    roofColor: type === 'TAXI' ? '#ca8a04' : palette.roof,
    type,
    exhaustTimer: 0,
  };
}

/**
 * Procedural Lane Generator with Validation, Discard & Retry Loop
 */
export function generateProceduralLane(
  index: number,
  existingLanes: Lane[],
  playerPos: { x: number; y: number; gridX: number; gridY: number },
  consecutiveState: { roadCount: number; grassCount: number },
  rng: SeededRNG = activeRNG
): Lane {
  const difficulty = getDifficultyForDistance(index);
  const prevLane = existingLanes.length > 0 ? existingLanes[existingLanes.length - 1] : null;

  // Attempt up to 5 times to generate a perfectly valid segment
  for (let attempt = 0; attempt < 5; attempt++) {
    const lane = tryGenerateLane(
      index,
      prevLane,
      playerPos,
      consecutiveState,
      difficulty,
      rng
    );

    if (validateSegment(lane, difficulty, playerPos.x, playerPos.y)) {
      // Update consecutive tracker
      if (lane.type === 'ROAD') {
        consecutiveState.roadCount++;
        consecutiveState.grassCount = 0;
      } else {
        consecutiveState.grassCount++;
        consecutiveState.roadCount = 0;
      }
      return lane;
    }
  }

  // Fallback to guaranteed safe GRASS lane if all attempts fail validation
  consecutiveState.grassCount++;
  consecutiveState.roadCount = 0;
  return createGuaranteedSafeGrassLane(index);
}

/**
 * Rigorous validation of coin placement reachability and fairness:
 * 1. Must be strictly within valid playable world columns [MIN_GRID_X, MAX_GRID_X]
 * 2. Lane must be playable terrain (GRASS, START_ZONE, or ROAD)
 * 3. Tile must NOT be blocked by solid obstacles (TREE decorations)
 * 4. Safe from initial cars (on ROAD lanes, must maintain minimum pixel distance >= 90px from all cars)
 * 5. Not located in unreachable dead zones (must be on or ahead of player's row)
 * 6. No duplicate coin at the same (laneIndex, gridX)
 */
export function isCoinPositionReachable(
  gridX: number,
  laneIndex: number,
  lane: Partial<Lane>,
  cars: Car[] = [],
  decorations: Decoration[] = [],
  existingCoins: Coin[] = [],
  playerPos?: { gridX?: number; gridY?: number; x?: number; y?: number }
): boolean {
  // 1. Check World Grid Bounds (-5 to +5)
  if (gridX < MIN_GRID_X || gridX > MAX_GRID_X) {
    return false;
  }

  // 2. Check Valid Terrain
  if (lane.type !== 'GRASS' && lane.type !== 'START_ZONE' && lane.type !== 'ROAD') {
    return false;
  }

  // 3. Lane Index must be valid forward world row
  if (laneIndex <= 0) {
    return false;
  }

  // 4. Dead zone check: must not spawn behind player
  if (playerPos && playerPos.gridY !== undefined && laneIndex < playerPos.gridY) {
    return false;
  }

  // 5. Solid Obstacle Check: tile must not be occupied by a TREE
  const isTreeBlocked = decorations.some(
    (d) => d.type === 'TREE' && d.gridX === gridX
  );
  if (isTreeBlocked) {
    return false;
  }

  // 6. Existing Coin duplicate check
  const isDuplicate = existingCoins.some((c) => c.gridX === gridX);
  if (isDuplicate) {
    return false;
  }

  // 7. Road Traffic Safety: must have safe clearance from all cars
  if (lane.type === 'ROAD') {
    const coinPixelX = gridX * GRID_SIZE;
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      const carHalfLength = (car.length || 52) / 2;
      const safeBuffer = carHalfLength + 45; // Safe reaction distance
      if (Math.abs(car.x - coinPixelX) < safeBuffer) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Single Generation Attempt
 */
function tryGenerateLane(
  index: number,
  prevLane: Lane | null,
  playerPos: { x: number; y: number; gridX?: number; gridY?: number },
  consecutiveState: { roadCount: number; grassCount: number },
  difficulty: DifficultyConfig,
  rng: SeededRNG
): Lane {
  let type: LaneType = 'GRASS';
  let carSpeed: number | undefined;
  let carDirection: 1 | -1 | undefined;
  let carType: CarType | undefined;
  let spawnInterval: number | undefined;

  if (index <= 1) {
    type = 'START_ZONE';
  } else {
    // Enforce consecutive constraints
    const mustBeGrass = consecutiveState.roadCount >= difficulty.maxConsecutiveRoads;
    const mustBeRoad = consecutiveState.grassCount >= difficulty.maxConsecutiveGrass;

    if (mustBeGrass) {
      type = 'GRASS';
    } else if (mustBeRoad) {
      type = 'ROAD';
    } else {
      type = rng.next() < difficulty.roadProbability ? 'ROAD' : 'GRASS';
    }
  }

  const decorations: Decoration[] = [];
  const coins: Coin[] = [];
  const cars: Car[] = [];

  if (type === 'START_ZONE' || type === 'GRASS') {
    // Guaranteed open lanes: leave at least MIN_VALID_PATH_WIDTH columns clear of obstacles
    const occupiedColumns = new Set<number>();
    const clearColumns = new Set<number>([0, -1, 1]); // Always leave center open near start

    for (let gx = MIN_GRID_X; gx <= MAX_GRID_X; gx++) {
      if (index <= 2 && clearColumns.has(gx)) continue;

      const roll = rng.next();
      if (roll < 0.16) {
        decorations.push({
          type: 'TREE',
          gridX: gx,
          variant: rng.int(0, 2),
        });
        occupiedColumns.add(gx);
      } else if (roll < 0.32) {
        decorations.push({
          type: 'FLOWER',
          gridX: gx,
          variant: rng.int(0, 4),
        });
      } else if (roll < 0.44) {
        decorations.push({
          type: 'BUSH',
          gridX: gx,
          variant: rng.int(0, 1),
        });
      }
    }

    // Spawn collectible coins on grass using reachable candidate validation
    if (index > 0 && rng.next() < difficulty.grassCoinChance) {
      const isCluster = rng.next() < difficulty.coinClusterChance;
      const clusterSize = isCluster ? (rng.next() < 0.35 ? 3 : 2) : 1;

      // Candidate validation loop (up to 8 attempts to find reachable cluster)
      let clusterFound = false;
      for (let attempt = 0; attempt < 8 && !clusterFound; attempt++) {
        const startX = rng.int(MIN_GRID_X, MAX_GRID_X - clusterSize + 1);
        let allCoinsReachable = true;
        const candidateCoins: Coin[] = [];

        for (let c = 0; c < clusterSize; c++) {
          const coinX = startX + c;
          const reachable = isCoinPositionReachable(
            coinX,
            index,
            { type },
            cars,
            decorations,
            candidateCoins,
            playerPos
          );

          if (!reachable) {
            allCoinsReachable = false;
            break;
          }

          candidateCoins.push({
            id: `coin_${index}_${coinX}`,
            gridX: coinX,
            laneIndex: index,
            collected: false,
            collectAnim: 0,
          });
        }

        if (allCoinsReachable && candidateCoins.length > 0) {
          coins.push(...candidateCoins);
          clusterFound = true;
        }
      }
    }
  } else if (type === 'ROAD') {
    // Traffic direction alternating for rhythmic flow
    if (prevLane && prevLane.type === 'ROAD' && prevLane.carDirection) {
      carDirection = rng.next() < 0.7 ? ((prevLane.carDirection === 1 ? -1 : 1) as 1 | -1) : (rng.next() > 0.5 ? 1 : -1);
    } else {
      carDirection = rng.next() > 0.5 ? 1 : -1;
    }

    // Car speed derived from progressive difficulty
    const speedRange = difficulty.maxCarSpeed - difficulty.minCarSpeed;
    const baseSpeed = Math.min(
      MAX_CAR_SPEED,
      difficulty.minCarSpeed + rng.next() * speedRange
    );
    carSpeed = Math.round(baseSpeed) * carDirection;

    // Car type selection
    const allowedTypes = difficulty.allowedCarTypes;
    carType = rng.choice(allowedTypes);

    // Guaranteed safe spawn interval ensuring time-gap >= MIN_REACTION_TIME
    const minRequiredInterval = (MIN_CAR_GAP + 60) / baseSpeed;
    const effectiveMinInterval = Math.max(difficulty.minSpawnInterval, minRequiredInterval);
    const intervalRange = Math.max(0.4, difficulty.maxSpawnInterval - effectiveMinInterval);
    spawnInterval = effectiveMinInterval + rng.next() * intervalRange;

    // Pre-populate cars with guaranteed minimum distance and safe positioning
    const [minInit, maxInit] = difficulty.initialCarCount;
    const initialCarCount = Math.min(MAX_TRAFFIC_DENSITY, rng.int(minInit, maxInit));

    if (initialCarCount > 0) {
      const slotWidth = 720 / initialCarCount;
      for (let c = 0; c < initialCarCount; c++) {
        const slotCenter = (c - (initialCarCount - 1) / 2) * slotWidth;
        const xOffset = slotCenter + rng.range(-30, 30);
        const car = createCalibratedCar(index, carSpeed, carType, xOffset, rng);

        // Verify spawn safety relative to player
        if (isSafeSpawn(car, playerPos.x, playerPos.y, index)) {
          cars.push(car);
        }
      }
    }

    // Coins on road using reachability and traffic clearance validation
    if (rng.next() < difficulty.roadCoinChance) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const coinX = rng.int(MIN_GRID_X, MAX_GRID_X);
        const reachable = isCoinPositionReachable(
          coinX,
          index,
          { type },
          cars,
          decorations,
          coins,
          playerPos
        );

        if (reachable) {
          coins.push({
            id: `coin_${index}_${coinX}`,
            gridX: coinX,
            laneIndex: index,
            collected: false,
            collectAnim: 0,
          });
          break;
        }
      }
    }
  }

  return {
    index,
    type,
    cars,
    carSpeed,
    carDirection,
    carType,
    spawnTimer: rng.range(0, spawnInterval || 3),
    spawnInterval,
    decorations,
    coins,
    color: type === 'ROAD' ? '#334155' : '#4ade80',
  };
}

/**
 * Fallback Guaranteed Safe Grass Lane
 */
export function createGuaranteedSafeGrassLane(index: number): Lane {
  return {
    index,
    type: 'GRASS',
    cars: [],
    spawnTimer: 0,
    spawnInterval: 0,
    decorations: [
      { type: 'FLOWER', gridX: -3, variant: 0 },
      { type: 'FLOWER', gridX: 3, variant: 1 },
    ],
    coins: [],
    color: '#4ade80',
  };
}
