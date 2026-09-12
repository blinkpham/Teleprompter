import type { Mode, ThemePreference } from '../shared/catalog-types';
import type { Preferences, WindowBounds } from '../shared/desktop-types';

export interface PreferencesDocument extends Preferences {
  readonly schemaVersion: 1;
  readonly window: WindowBounds;
}

export const DEFAULT_WINDOW: WindowBounds = { width: 1280, height: 900 };
export const DEFAULT_PREFERENCES: PreferencesDocument = {
  schemaVersion: 1,
  favoriteTechniqueIds: [],
  themePreference: 'system',
  lastMode: 'gallery',
  window: DEFAULT_WINDOW,
};

const isMode = (value: unknown): value is Mode => value === 'gallery' || value === 'cheatsheet';
const isTheme = (value: unknown): value is ThemePreference => value === 'system' || value === 'light' || value === 'dark';
const finitePositive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

const safeWindow = (value: unknown): WindowBounds => {
  if (!value || typeof value !== 'object') return DEFAULT_WINDOW;
  const candidate = value as Record<string, unknown>;
  const width = finitePositive(candidate.width) ? Math.round(candidate.width) : DEFAULT_WINDOW.width;
  const height = finitePositive(candidate.height) ? Math.round(candidate.height) : DEFAULT_WINDOW.height;
  const x = typeof candidate.x === 'number' && Number.isFinite(candidate.x) ? Math.round(candidate.x) : undefined;
  const y = typeof candidate.y === 'number' && Number.isFinite(candidate.y) ? Math.round(candidate.y) : undefined;
  const isMaximized = typeof candidate.isMaximized === 'boolean' ? candidate.isMaximized : false;
  return { width, height, ...(x === undefined ? {} : { x }), ...(y === undefined ? {} : { y }), isMaximized };
};

export const validatePreferences = (input: unknown, validTechniqueIds: ReadonlySet<string>): PreferencesDocument => {
  if (!input || typeof input !== 'object') return DEFAULT_PREFERENCES;
  const candidate = input as Record<string, unknown>;
  const favorites = Array.isArray(candidate.favoriteTechniqueIds)
    ? [...new Set(candidate.favoriteTechniqueIds.filter((id): id is string => typeof id === 'string' && validTechniqueIds.has(id)))]
    : [];
  return {
    schemaVersion: 1,
    favoriteTechniqueIds: favorites,
    themePreference: isTheme(candidate.themePreference) ? candidate.themePreference : DEFAULT_PREFERENCES.themePreference,
    lastMode: isMode(candidate.lastMode) ? candidate.lastMode : DEFAULT_PREFERENCES.lastMode,
    window: safeWindow(candidate.window),
  };
};

export const mergePreferences = (current: PreferencesDocument, patch: Partial<PreferencesDocument>): PreferencesDocument => ({
  ...current,
  ...patch,
  favoriteTechniqueIds: patch.favoriteTechniqueIds ?? current.favoriteTechniqueIds,
  themePreference: patch.themePreference ?? current.themePreference,
  lastMode: patch.lastMode ?? current.lastMode,
  window: patch.window ? { ...current.window, ...patch.window } : current.window,
});
