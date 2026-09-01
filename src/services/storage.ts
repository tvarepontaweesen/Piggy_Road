import { SaveData, SkinId } from '../types';

export const CURRENT_SAVE_VERSION = 1;

export const PRIMARY_STORAGE_KEY = 'piggy_road_savedata';

export const LEGACY_STORAGE_KEYS = {
  TOTAL_COINS: 'piggy_road_total_coins',
  HIGH_SCORE: 'piggy_road_high_score',
  UNLOCKED_SKINS: 'piggy_road_unlocked_skins',
  SELECTED_SKIN: 'piggy_road_selected_skin',
  SOUND_ENABLED: 'piggy_road_sound_enabled',
  MUSIC_ENABLED: 'piggy_road_music_enabled',
} as const;

export const VALID_SKIN_IDS: readonly SkinId[] = ['classic', 'pink', 'farmer', 'ninja', 'golden'];

export const DEFAULT_SAVE_DATA: Readonly<SaveData> = {
  saveVersion: CURRENT_SAVE_VERSION,
  totalCoins: 0,
  unlockedSkins: ['classic'],
  equippedSkin: 'classic',
  bestScore: 0,
  soundEnabled: true,
  musicEnabled: true,
};

// Internal in-memory cache to guarantee zero-overhead synchronous reads and in-memory fallback
let memoryCache: SaveData | null = null;

/**
 * Check if the browser's localStorage is currently available and accessible
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const testKey = '__piggy_road_test_storage__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for SkinId
 */
export function isValidSkinId(id: unknown): id is SkinId {
  return typeof id === 'string' && VALID_SKIN_IDS.includes(id as SkinId);
}

/**
 * Safe number sanitizer for coins and scores (finite, integer, non-negative)
 */
function sanitizeNonNegativeInt(val: unknown, fallback: number = 0): number {
  if (typeof val === 'number') {
    if (Number.isFinite(val)) {
      return Math.max(0, Math.floor(val));
    }
    return fallback;
  }
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return fallback;
}

/**
 * Safe boolean sanitizer
 */
function sanitizeBoolean(val: unknown, fallback: boolean = true): boolean {
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'false') return false;
    if (val.toLowerCase() === 'true') return true;
  }
  return fallback;
}

/**
 * Validates and sanitizes raw input into a strictly compliant SaveData object.
 * Guaranteed never to throw, never return invalid skin IDs, never return negative numbers,
 * and always ensures 'classic' is unlocked and equipped skin is owned.
 */
export function validateAndSanitizeSaveData(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SAVE_DATA };
  }

  const obj = raw as Record<string, unknown>;

  // 1. Version validation
  const version = sanitizeNonNegativeInt(obj.saveVersion ?? obj.version, CURRENT_SAVE_VERSION);

  // 2. Coins validation (non-negative, finite)
  const totalCoins = sanitizeNonNegativeInt(obj.totalCoins ?? obj.coins, 0);

  // 3. Best score validation (finite non-negative number)
  const bestScore = sanitizeNonNegativeInt(obj.bestScore ?? obj.highScore, 0);

  // 4. Unlocked skins validation
  let unlockedSkins: SkinId[] = ['classic'];
  const rawUnlocked = obj.unlockedSkins;
  if (Array.isArray(rawUnlocked)) {
    const validFiltered = rawUnlocked.filter(isValidSkinId);
    unlockedSkins = Array.from(new Set<SkinId>(['classic', ...validFiltered]));
  }

  // 5. Equipped skin validation (must be valid AND owned in unlockedSkins)
  let equippedSkin: SkinId = 'classic';
  const rawEquipped = obj.equippedSkin ?? obj.selectedSkin;
  if (isValidSkinId(rawEquipped) && unlockedSkins.includes(rawEquipped)) {
    equippedSkin = rawEquipped;
  }

  // 6. Audio settings validation
  const soundEnabled = sanitizeBoolean(obj.soundEnabled, true);
  const musicEnabled = sanitizeBoolean(obj.musicEnabled, true);

  return {
    saveVersion: version,
    totalCoins,
    unlockedSkins,
    equippedSkin,
    bestScore,
    soundEnabled,
    musicEnabled,
  };
}

/**
 * Migration registry for handling schema changes over versions without data loss
 */
function migrateSaveData(data: SaveData): SaveData {
  let migrated = { ...data };

  // Example migration pipeline:
  // if (migrated.saveVersion === 0) { ... migrated.saveVersion = 1; }
  // Future versions can be chained here:
  // if (migrated.saveVersion === 1) { ... migrated.saveVersion = 2; }

  migrated.saveVersion = CURRENT_SAVE_VERSION;
  return migrated;
}

/**
 * Reads legacy fragmented localStorage keys if existing, and merges them into a clean SaveData
 */
function readLegacyStorage(): SaveData | null {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) {
    return null;
  }

  try {
    const legacyCoins = window.localStorage.getItem(LEGACY_STORAGE_KEYS.TOTAL_COINS);
    const legacyScore = window.localStorage.getItem(LEGACY_STORAGE_KEYS.HIGH_SCORE);
    const legacySkins = window.localStorage.getItem(LEGACY_STORAGE_KEYS.UNLOCKED_SKINS);
    const legacySelected = window.localStorage.getItem(LEGACY_STORAGE_KEYS.SELECTED_SKIN);
    const legacySound = window.localStorage.getItem(LEGACY_STORAGE_KEYS.SOUND_ENABLED);
    const legacyMusic = window.localStorage.getItem(LEGACY_STORAGE_KEYS.MUSIC_ENABLED);

    // If none of the legacy keys exist, there's no legacy data to migrate
    if (
      legacyCoins === null &&
      legacyScore === null &&
      legacySkins === null &&
      legacySelected === null &&
      legacySound === null &&
      legacyMusic === null
    ) {
      return null;
    }

    let parsedSkins: unknown = undefined;
    if (legacySkins) {
      try {
        parsedSkins = JSON.parse(legacySkins);
      } catch {
        parsedSkins = undefined;
      }
    }

    return validateAndSanitizeSaveData({
      saveVersion: CURRENT_SAVE_VERSION,
      totalCoins: legacyCoins !== null ? parseInt(legacyCoins, 10) : 0,
      bestScore: legacyScore !== null ? parseInt(legacyScore, 10) : 0,
      unlockedSkins: parsedSkins,
      equippedSkin: legacySelected,
      soundEnabled: legacySound !== null ? legacySound !== 'false' : true,
      musicEnabled: legacyMusic !== null ? legacyMusic !== 'false' : true,
    });
  } catch {
    return null;
  }
}

/**
 * Loads and returns the full sanitized game save data.
 * Tries primary key first, falls back to legacy migration, then default values.
 */
export function loadSaveData(): SaveData {
  if (memoryCache) {
    return { ...memoryCache };
  }

  if (isLocalStorageAvailable()) {
    try {
      const rawJson = window.localStorage.getItem(PRIMARY_STORAGE_KEY);
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        const validated = validateAndSanitizeSaveData(parsed);
        const migrated = migrateSaveData(validated);
        memoryCache = migrated;
        return { ...migrated };
      }

      // If unified key doesn't exist, check for legacy keys to migrate
      const legacyData = readLegacyStorage();
      if (legacyData) {
        memoryCache = legacyData;
        persistSaveData(legacyData);
        return { ...legacyData };
      }
    } catch {
      // In case of JSON parse error or disk error, safely fallback
    }
  }

  // Fallback to fresh defaults
  memoryCache = { ...DEFAULT_SAVE_DATA };
  return { ...DEFAULT_SAVE_DATA };
}

/**
 * Internal helper to safely write the full SaveData to localStorage with error handling
 */
function persistSaveData(data: SaveData): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  try {
    const serialized = JSON.stringify(data);
    window.localStorage.setItem(PRIMARY_STORAGE_KEY, serialized);
    return true;
  } catch {
    // Gracefully ignore QuotaExceeded or security errors
    return false;
  }
}

/**
 * Updates save data partially or fully and persists to disk
 */
export function saveGameData(partial: Partial<SaveData>): SaveData {
  const current = loadSaveData();
  const merged: SaveData = {
    ...current,
    ...partial,
  };

  const validated = validateAndSanitizeSaveData(merged);
  memoryCache = validated;
  persistSaveData(validated);
  return { ...validated };
}

/**
 * Reset all save data to default factory settings
 */
export function resetSaveDataToDefault(): SaveData {
  const defaults = { ...DEFAULT_SAVE_DATA };
  memoryCache = defaults;
  persistSaveData(defaults);
  return { ...defaults };
}

// ----------------------------------------------------------------------
// Granular Getters & Setters for React Component Compatibility
// ----------------------------------------------------------------------

export function getStoredTotalCoins(): number {
  return loadSaveData().totalCoins;
}

export function setStoredTotalCoins(coins: number): void {
  saveGameData({ totalCoins: coins });
}

export function getStoredHighScore(): number {
  return loadSaveData().bestScore;
}

export function setStoredHighScore(score: number): void {
  saveGameData({ bestScore: score });
}

export function getStoredUnlockedSkins(): SkinId[] {
  return [...loadSaveData().unlockedSkins];
}

export function setStoredUnlockedSkins(skins: SkinId[]): void {
  saveGameData({ unlockedSkins: skins });
}

export function getStoredSelectedSkin(): SkinId {
  return loadSaveData().equippedSkin;
}

export function setStoredSelectedSkin(skinId: SkinId): void {
  saveGameData({ equippedSkin: skinId });
}

export function getStoredSoundEnabled(): boolean {
  return loadSaveData().soundEnabled;
}

export function setStoredSoundEnabled(enabled: boolean): void {
  saveGameData({ soundEnabled: enabled });
}

export function getStoredMusicEnabled(): boolean {
  return loadSaveData().musicEnabled;
}

export function setStoredMusicEnabled(enabled: boolean): void {
  saveGameData({ musicEnabled: enabled });
}
