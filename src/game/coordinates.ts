import { GRID_SIZE, MAX_GRID_X, MIN_GRID_X } from './constants';

export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 32;
export const PLAYER_HALF_WIDTH = 16;
export const PLAYER_HALF_HEIGHT = 16;
export const PLAYER_EDGE_MARGIN = 12; // Safe pixel margin from screen edge so the pig is 100% visible

export interface ScreenPoint {
  screenX: number;
  screenY: number;
}

export interface WorldPoint {
  worldX: number;
  worldY: number;
}

export interface ViewportBounds {
  minScreenX: number;
  maxScreenX: number;
  minScreenY: number;
  maxScreenY: number;
  minWorldX: number;
  maxWorldX: number;
  minGridX: number;
  maxGridX: number;
  maxCameraOffsetX: number;
}

/**
 * Converts World Coordinates to Screen Coordinates on the Canvas.
 * World coordinate origin (0, 0) is centered horizontally on screen minus cameraX,
 * and positioned vertically at height * 0.72 + (cameraY * GRID_SIZE).
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number,
  shakeX: number = 0,
  shakeY: number = 0
): ScreenPoint {
  const centerX = viewportWidth / 2 - cameraX + shakeX;
  const originY = viewportHeight * 0.72 + cameraY * GRID_SIZE + shakeY;
  return {
    screenX: centerX + worldX,
    screenY: originY + worldY,
  };
}

/**
 * Converts Screen Pixel Coordinates back into World Coordinates.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number,
  shakeX: number = 0,
  shakeY: number = 0
): WorldPoint {
  const centerX = viewportWidth / 2 - cameraX + shakeX;
  const originY = viewportHeight * 0.72 + cameraY * GRID_SIZE + shakeY;
  return {
    worldX: screenX - centerX,
    worldY: screenY - originY,
  };
}

/**
 * Calculates responsive horizontal and vertical safe boundaries
 * based on current viewport dimensions and camera position.
 * Playable area is consistently MIN_GRID_X (-5) to MAX_GRID_X (+5) across all screen sizes.
 */
export function calculateViewportBounds(
  viewportWidth: number,
  viewportHeight: number,
  cameraX: number = 0,
  cameraY: number = 0,
  minAbsoluteGridX: number = MIN_GRID_X,
  maxAbsoluteGridX: number = MAX_GRID_X
): ViewportBounds {
  // 1. Safe Screen Margins
  const minScreenX = PLAYER_HALF_WIDTH + PLAYER_EDGE_MARGIN;
  const maxScreenX = Math.max(minScreenX + 1, viewportWidth - (PLAYER_HALF_WIDTH + PLAYER_EDGE_MARGIN));

  // Top screen margin (leaves room for HUD: Score & Best)
  const minScreenY = PLAYER_HALF_HEIGHT + PLAYER_EDGE_MARGIN + 36;
  // Bottom screen margin (leaves room for Touch D-pad / safe area)
  const maxScreenY = Math.max(minScreenY + 1, viewportHeight - (PLAYER_HALF_HEIGHT + PLAYER_EDGE_MARGIN + 24));

  // 2. Maximum camera X offset when viewport is narrower than playable world width
  const worldHalfWidth = (maxAbsoluteGridX * GRID_SIZE) + PLAYER_HALF_WIDTH + PLAYER_EDGE_MARGIN;
  const maxCameraOffsetX = Math.max(0, worldHalfWidth - viewportWidth / 2);

  // 3. Playable World Coordinates
  const minWorldX = minAbsoluteGridX * GRID_SIZE;
  const maxWorldX = maxAbsoluteGridX * GRID_SIZE;

  return {
    minScreenX,
    maxScreenX,
    minScreenY,
    maxScreenY,
    minWorldX,
    maxWorldX,
    minGridX: minAbsoluteGridX,
    maxGridX: maxAbsoluteGridX,
    maxCameraOffsetX,
  };
}

/**
 * Validates if a grid coordinate is within the playable world boundaries.
 */
export function isWithinPlayableBounds(gridX: number, gridY: number): boolean {
  return gridX >= MIN_GRID_X && gridX <= MAX_GRID_X && gridY >= 0;
}

