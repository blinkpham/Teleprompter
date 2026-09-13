import type { PersistenceStatus, ShortcutState } from '../shared/teleprompter-types';

export interface MainWindowBounds {
  readonly width: number;
  readonly height: number;
  readonly x?: number;
  readonly y?: number;
  readonly isMaximized: boolean;
}

export interface PreferencesDocument {
  readonly schemaVersion: 2;
  readonly favoriteRecordIds: readonly string[];
  readonly shortcut: ShortcutState;
  /** The last accelerator that successfully registered on this profile. */
  readonly lastWorkingAccelerator?: string;
  readonly window: MainWindowBounds;
}

export interface PreferencesLoadResult {
  readonly preferences: PreferencesDocument;
  readonly status: PersistenceStatus;
  readonly disposition: 'default' | 'loaded' | 'migrated' | 'recovered' | 'future';
}

export const PREFERENCES_SCHEMA_VERSION = 2 as const;
export const DEFAULT_ACCELERATOR = 'CommandOrControl+Shift+Space';
export const DEFAULT_WINDOW: MainWindowBounds = {
  width: 1180,
  height: 820,
  isMaximized: false,
};

export const DEFAULT_PREFERENCES: PreferencesDocument = {
  schemaVersion: PREFERENCES_SCHEMA_VERSION,
  favoriteRecordIds: [],
  shortcut: { accelerator: DEFAULT_ACCELERATOR, registered: false },
  window: DEFAULT_WINDOW,
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isPositiveNumber = (value: unknown): value is number => isFiniteNumber(value) && value > 0;
const isShortcutState = (value: unknown): value is ShortcutState => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.accelerator === 'string'
    && candidate.accelerator.trim().length > 0
    && typeof candidate.registered === 'boolean'
    && (candidate.error === undefined || typeof candidate.error === 'string');
};

export const sanitizeWindowBounds = (value: unknown): MainWindowBounds => {
  if (!value || typeof value !== 'object') return DEFAULT_WINDOW;
  const candidate = value as Record<string, unknown>;
  const width = isPositiveNumber(candidate.width) ? Math.round(candidate.width) : DEFAULT_WINDOW.width;
  const height = isPositiveNumber(candidate.height) ? Math.round(candidate.height) : DEFAULT_WINDOW.height;
  const x = isFiniteNumber(candidate.x) ? Math.round(candidate.x) : undefined;
  const y = isFiniteNumber(candidate.y) ? Math.round(candidate.y) : undefined;
  const isMaximized = typeof candidate.isMaximized === 'boolean' ? candidate.isMaximized : false;
  return {
    width,
    height,
    ...(x === undefined ? {} : { x }),
    ...(y === undefined ? {} : { y }),
    isMaximized,
  };
};

const sanitizeFavoriteIds = (value: unknown): readonly string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))];
};

const sanitizeShortcut = (value: unknown): ShortcutState => {
  if (!isShortcutState(value)) return DEFAULT_PREFERENCES.shortcut;
  return {
    accelerator: value.accelerator.trim(),
    registered: value.registered,
    ...(value.error === undefined ? {} : { error: value.error }),
  };
};

/** Validate a schema-2 value without silently preserving unknown versions. */
export const validatePreferences = (input: unknown): PreferencesDocument | null => {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as Record<string, unknown>;
  if (candidate.schemaVersion !== PREFERENCES_SCHEMA_VERSION) return null;
  if (!Array.isArray(candidate.favoriteRecordIds) || !isShortcutState(candidate.shortcut)) return null;
  if (!candidate.window || typeof candidate.window !== 'object') return null;
  const lastWorkingAccelerator = candidate.lastWorkingAccelerator;
  if (lastWorkingAccelerator !== undefined && (typeof lastWorkingAccelerator !== 'string' || lastWorkingAccelerator.trim().length === 0)) return null;
  return {
    schemaVersion: PREFERENCES_SCHEMA_VERSION,
    favoriteRecordIds: sanitizeFavoriteIds(candidate.favoriteRecordIds),
    shortcut: sanitizeShortcut(candidate.shortcut),
    ...(lastWorkingAccelerator === undefined ? {} : { lastWorkingAccelerator: lastWorkingAccelerator.trim() }),
    window: sanitizeWindowBounds(candidate.window),
  };
};

const migrateV1 = (input: Record<string, unknown>): PreferencesDocument => {
  const oldFavorites = Array.isArray(input.favoriteTechniqueIds)
    ? input.favoriteTechniqueIds
    : input.favoriteRecordIds;
  return {
    ...DEFAULT_PREFERENCES,
    favoriteRecordIds: sanitizeFavoriteIds(oldFavorites),
    window: sanitizeWindowBounds(input.window),
  };
};

/** Pure schema classification used by the filesystem loader and tests. */
export const parsePreferences = (input: unknown): PreferencesLoadResult => {
  if (!input || typeof input !== 'object') {
    return { preferences: DEFAULT_PREFERENCES, status: 'recovery', disposition: 'recovered' };
  }
  const candidate = input as Record<string, unknown>;
  if (candidate.schemaVersion === PREFERENCES_SCHEMA_VERSION) {
    const preferences = validatePreferences(candidate);
    return preferences
      ? { preferences, status: 'disk', disposition: 'loaded' }
      : { preferences: DEFAULT_PREFERENCES, status: 'recovery', disposition: 'recovered' };
  }
  if (candidate.schemaVersion === 1) {
    return { preferences: migrateV1(candidate), status: 'disk', disposition: 'migrated' };
  }
  if (typeof candidate.schemaVersion === 'number' && candidate.schemaVersion > PREFERENCES_SCHEMA_VERSION) {
    return { preferences: DEFAULT_PREFERENCES, status: 'recovery', disposition: 'future' };
  }
  return { preferences: DEFAULT_PREFERENCES, status: 'recovery', disposition: 'recovered' };
};

export const mergePreferences = (
  current: PreferencesDocument,
  patch: Partial<Omit<PreferencesDocument, 'schemaVersion'>>,
): PreferencesDocument => ({
  ...current,
  ...patch,
  schemaVersion: PREFERENCES_SCHEMA_VERSION,
  favoriteRecordIds: patch.favoriteRecordIds ?? current.favoriteRecordIds,
  shortcut: patch.shortcut ?? current.shortcut,
  window: patch.window ? { ...current.window, ...patch.window } : current.window,
});

export const withShortcutResult = (
  current: PreferencesDocument,
  shortcut: ShortcutState,
): PreferencesDocument => mergePreferences(current, {
  shortcut,
  ...(shortcut.registered ? { lastWorkingAccelerator: shortcut.accelerator } : {}),
});
