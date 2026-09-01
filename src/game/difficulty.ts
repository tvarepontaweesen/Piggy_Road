// Configurable Progressive Difficulty Tiers for Piggy Road
// Tiers based on player distance: 0-20, 20-50, 50-100, 100-200, 200+

import { CarType } from '../types';

export interface DifficultyConfig {
  minDistance: number;
  maxDistance: number;
  name: string;
  // Road vs Grass distribution (higher roadProbability = fewer consecutive safe grass rows)
  roadProbability: number;
  maxConsecutiveRoads: number;
  minConsecutiveGrass: number;
  maxConsecutiveGrass: number;
  // Car Speed range (pixels per second)
  minCarSpeed: number;
  maxCarSpeed: number;
  // Car Spawn Intervals (seconds between cars on a lane - smaller = more cars, but guaranteed crossing gaps)
  minSpawnInterval: number;
  maxSpawnInterval: number;
  // Allowed Car Types & Sizes in this tier
  allowedCarTypes: CarType[];
  initialCarCount: [number, number]; // [min, max] cars pre-populated per lane
  // Coin Spawn Chance
  grassCoinChance: number;
  roadCoinChance: number;
  // Multi-coin cluster chance on safe grass zones
  coinClusterChance: number;
  // Idle danger timing acceleration (multiplier for wolf/idle urgency)
  idleDangerSpeedMultiplier: number;
}

export const DIFFICULTY_TIERS: DifficultyConfig[] = [
  // Stage 1: Distance 0 - 20 (Early Tutorial / Warm-up)
  {
    minDistance: 0,
    maxDistance: 20,
    name: 'Peaceful Suburbs',
    roadProbability: 0.45,
    maxConsecutiveRoads: 2,
    minConsecutiveGrass: 2,
    maxConsecutiveGrass: 3,
    minCarSpeed: 75,
    maxCarSpeed: 110,
    minSpawnInterval: 3.2,
    maxSpawnInterval: 4.8,
    allowedCarTypes: ['SEDAN', 'TAXI'],
    initialCarCount: [1, 1],
    grassCoinChance: 0.35,
    roadCoinChance: 0.15,
    coinClusterChance: 0.25,
    idleDangerSpeedMultiplier: 1.0,
  },
  // Stage 2: Distance 20 - 50 (Early-Mid Expansion)
  {
    minDistance: 20,
    maxDistance: 50,
    name: 'Town Traffic',
    roadProbability: 0.58,
    maxConsecutiveRoads: 3,
    minConsecutiveGrass: 1,
    maxConsecutiveGrass: 2,
    minCarSpeed: 95,
    maxCarSpeed: 145,
    minSpawnInterval: 2.5,
    maxSpawnInterval: 3.8,
    allowedCarTypes: ['SEDAN', 'TAXI', 'VAN', 'SPORT'],
    initialCarCount: [1, 2],
    grassCoinChance: 0.4,
    roadCoinChance: 0.25,
    coinClusterChance: 0.35,
    idleDangerSpeedMultiplier: 1.05,
  },
  // Stage 3: Distance 50 - 100 (Mid Game Highway)
  {
    minDistance: 50,
    maxDistance: 100,
    name: 'Busy Boulevard',
    roadProbability: 0.68,
    maxConsecutiveRoads: 4,
    minConsecutiveGrass: 1,
    maxConsecutiveGrass: 2,
    minCarSpeed: 125,
    maxCarSpeed: 190,
    minSpawnInterval: 2.0,
    maxSpawnInterval: 3.2,
    allowedCarTypes: ['SEDAN', 'TAXI', 'VAN', 'SPORT', 'TRUCK'],
    initialCarCount: [1, 2],
    grassCoinChance: 0.45,
    roadCoinChance: 0.3,
    coinClusterChance: 0.45,
    idleDangerSpeedMultiplier: 1.15,
  },
  // Stage 4: Distance 100 - 200 (Late Game Expressway)
  {
    minDistance: 100,
    maxDistance: 200,
    name: 'Rush Hour Expressway',
    roadProbability: 0.75,
    maxConsecutiveRoads: 4,
    minConsecutiveGrass: 1,
    maxConsecutiveGrass: 1,
    minCarSpeed: 150,
    maxCarSpeed: 220,
    minSpawnInterval: 1.8,
    maxSpawnInterval: 2.8,
    allowedCarTypes: ['SEDAN', 'SPORT', 'TRUCK', 'BUS', 'TAXI', 'VAN'],
    initialCarCount: [2, 2],
    grassCoinChance: 0.5,
    roadCoinChance: 0.35,
    coinClusterChance: 0.55,
    idleDangerSpeedMultiplier: 1.25,
  },
  // Stage 5: Distance 200+ (Endless Master Frenzy)
  {
    minDistance: 200,
    maxDistance: Infinity,
    name: 'Super Pig Speedway',
    roadProbability: 0.80,
    maxConsecutiveRoads: 5,
    minConsecutiveGrass: 1,
    maxConsecutiveGrass: 1,
    minCarSpeed: 175,
    maxCarSpeed: 250,
    minSpawnInterval: 1.6,
    maxSpawnInterval: 2.4,
    allowedCarTypes: ['SEDAN', 'SPORT', 'TRUCK', 'BUS', 'TAXI', 'VAN'],
    initialCarCount: [2, 3],
    grassCoinChance: 0.6,
    roadCoinChance: 0.4,
    coinClusterChance: 0.7,
    idleDangerSpeedMultiplier: 1.35,
  },
];

/**
 * Returns the active DifficultyConfig based on the current lane index or player distance.
 */
export function getDifficultyForDistance(distance: number): DifficultyConfig {
  const normalizedDistance = Math.max(0, distance);
  for (const tier of DIFFICULTY_TIERS) {
    if (normalizedDistance >= tier.minDistance && normalizedDistance < tier.maxDistance) {
      return tier;
    }
  }
  return DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1];
}
