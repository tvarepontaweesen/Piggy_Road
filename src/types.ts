export type GameState = 'MENU' | 'HOW_TO_PLAY' | 'PLAYING' | 'PAUSED' | 'SHOP' | 'GAME_OVER';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type SkinId = 'classic' | 'pink' | 'farmer' | 'ninja' | 'golden';

export interface Skin {
  id: SkinId;
  name: string;
  price: number;
  description: string;
  bodyColor: string;
  secondaryColor: string;
  snoutColor: string;
  accentColor: string;
  accessory: 'none' | 'bow' | 'straw_hat' | 'ninja_headband' | 'crown';
  hasSparkles?: boolean;
}

export type LaneType = 'GRASS' | 'ROAD' | 'START_ZONE';

export type CarType = 'SEDAN' | 'SPORT' | 'TRUCK' | 'BUS' | 'TAXI' | 'VAN';

export interface Car {
  id: string;
  x: number; // in world X coordinates
  laneIndex: number;
  width: number;
  length: number;
  speed: number; // positive = moving right, negative = moving left
  color: string;
  roofColor: string;
  type: CarType;
  exhaustTimer?: number;
}

export interface Coin {
  id: string;
  gridX: number;
  laneIndex: number;
  collected: boolean;
  collectAnim: number; // 0 to 1
}

export interface Decoration {
  type: 'TREE' | 'BUSH' | 'FLOWER' | 'ROCK';
  gridX: number;
  variant: number;
}

export interface Lane {
  index: number;
  type: LaneType;
  cars: Car[];
  carSpeed?: number;
  carDirection?: 1 | -1;
  carType?: CarType;
  spawnTimer?: number;
  spawnInterval?: number;
  decorations: Decoration[];
  coins: Coin[];
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape?: 'circle' | 'star' | 'dust' | 'coin' | 'smoke' | 'sparkle';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  scale: number;
}

export interface PlayerState {
  gridX: number;
  gridY: number; // lane index
  targetGridX: number;
  targetGridY: number;
  x: number;
  y: number;
  facing: Direction;
  currentAngle: number; // smooth interpolated facing angle in radians
  targetAngle: number;
  isHopping: boolean;
  hopProgress: number; // 0 to 1
  hopHeight: number;
  landingBounce: number; // landing spring decay
  isDead: boolean;
  deathReason?: 'CAR' | 'WOLF';
  skinId: SkinId;
}

export interface WolfState {
  active: boolean;
  worldY: number; // Lane/Y position in world coords
  x: number;
  speed: number;
  caughtPlayer: boolean;
  catchProgress: number; // 0 to 1 for grab animation
}

export interface GameStats {
  score: number;
  maxDistance: number;
  coinsCollectedInRun: number;
  totalCoins: number;
  highScore: number;
  unlockedSkins: SkinId[];
  selectedSkin: SkinId;
  soundEnabled: boolean;
}

export interface SaveData {
  saveVersion: number;
  totalCoins: number;
  unlockedSkins: SkinId[];
  equippedSkin: SkinId;
  bestScore: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}
