import { Skin, SkinId } from '../types';

export const GRID_SIZE = 48; // Base pixel size of one world grid tile
export const GRID_COLUMNS = 11; // 11 tiles across (-5 to +5 from center 0)
export const MIN_GRID_X = -5;
export const MAX_GRID_X = 5;

// Idle danger mechanic timing & tuning constants (fully configurable)
export const IDLE_WARNING_TIME = 2.0; // Seconds of non-movement before animated warning indicator & text appears
export const AUTO_SCROLL_TIME = 3.0; // Seconds of inactivity before camera slowly starts moving forward
export const WOLF_SPAWN_DELAY = 4.8; // Seconds of inactivity before wolf spawns from behind
export const WOLF_CATCH_TIME = 1.6; // Duration of cartoon catch & carry away animation before Game Over
export const WOLF_CHASE_SPEED = 180; // Speed of wolf running toward pig in pixels per second
export const AUTO_SCROLL_SPEED = 45; // Camera push speed in pixels per second during idle auto-scroll

// Scoring bonuses
export const SCORE_PER_ROW = 1;
export const BONUS_PER_COIN = 5;

// Skins configuration
export const SKINS: Record<SkinId, Skin> = {
  classic: {
    id: 'classic',
    name: 'Classic Pig',
    price: 0,
    description: 'The brave, pink original road-crossing piggy.',
    bodyColor: '#fb7185', // rose-400
    secondaryColor: '#f43f5e', // rose-500
    snoutColor: '#fda4af', // rose-300
    accentColor: '#881337',
    accessory: 'none',
  },
  pink: {
    id: 'pink',
    name: 'Pink Pig',
    price: 100,
    description: 'Ultra sweet pastel piggy with a cute crimson hair bow.',
    bodyColor: '#f472b6', // pink-400
    secondaryColor: '#db2777', // pink-600
    snoutColor: '#fbcfe8', // pink-200
    accentColor: '#e11d48',
    accessory: 'bow',
  },
  farmer: {
    id: 'farmer',
    name: 'Farmer Pig',
    price: 250,
    description: 'Hardworking country piggy with straw hat and blue overalls.',
    bodyColor: '#fca5a5', // red-300
    secondaryColor: '#ef4444',
    snoutColor: '#fecaca',
    accentColor: '#1d4ed8', // denim blue
    accessory: 'straw_hat',
  },
  ninja: {
    id: 'ninja',
    name: 'Ninja Pig',
    price: 500,
    description: 'Swift stealth shadow pig with black mask & trailing red headband.',
    bodyColor: '#334155', // slate-700
    secondaryColor: '#0f172a', // slate-900
    snoutColor: '#64748b',
    accentColor: '#ef4444', // red ribbon
    accessory: 'ninja_headband',
  },
  golden: {
    id: 'golden',
    name: 'Golden Pig',
    price: 1000,
    description: 'Majestic glittering pure gold piggy with a royal diamond crown.',
    bodyColor: '#fbbf24', // amber-400
    secondaryColor: '#d97706', // amber-600
    snoutColor: '#fde68a', // amber-200
    accentColor: '#6366f1', // royal purple/indigo jewel
    accessory: 'crown',
    hasSparkles: true,
  },
};

export const CAR_PALETTES = [
  { body: '#ef4444', roof: '#b91c1c' }, // Red Sedan
  { body: '#3b82f6', roof: '#1d4ed8' }, // Blue Sedan
  { body: '#10b981', roof: '#047857' }, // Green Compact
  { body: '#eab308', roof: '#ca8a04' }, // Yellow Taxi
  { body: '#8b5cf6', roof: '#6d28d9' }, // Purple Racer
  { body: '#f97316', roof: '#c2410c' }, // Orange Van
  { body: '#06b6d4', roof: '#0e7490' }, // Cyan Cruiser
  { body: '#ec4899', roof: '#be185d' }, // Magenta Roadster
];
