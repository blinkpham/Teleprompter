import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ACCELERATOR,
  DEFAULT_PREFERENCES,
  mergePreferences,
  parsePreferences,
  validatePreferences,
} from './preferences';

describe('schema-2 preferences', () => {
  it('loads a valid document and deduplicates favorite record IDs', () => {
    const result = validatePreferences({
      schemaVersion: 2,
      favoriteRecordIds: ['preset.editorial', 'preset.editorial'],
      shortcut: { accelerator: DEFAULT_ACCELERATOR, registered: true },
      window: { width: 1000, height: 700, x: -120, y: 40, isMaximized: false },
    });
    expect(result?.favoriteRecordIds).toEqual(['preset.editorial']);
    expect(result?.window.x).toBe(-120);
  });

  it('migrates v1 favorites and bounds while dropping launch theme and mode', () => {
    const result = parsePreferences({
      schemaVersion: 1,
      favoriteTechniqueIds: ['surgical-edit', 'surgical-edit'],
      themePreference: 'light',
      lastMode: 'cheatsheet',
      window: { width: 900, height: 640, x: 12, y: 22 },
    });
    expect(result.disposition).toBe('migrated');
    expect(result.status).toBe('disk');
    expect(result.preferences.favoriteRecordIds).toEqual(['surgical-edit']);
    expect(result.preferences.window.width).toBe(900);
    expect('themePreference' in result.preferences).toBe(false);
    expect(result.preferences.shortcut.accelerator).toBe(DEFAULT_ACCELERATOR);
  });

  it('leaves future schema values for the caller to preserve and reports recovery', () => {
    const result = parsePreferences({ schemaVersion: 9, favoriteRecordIds: ['new.record'] });
    expect(result.disposition).toBe('future');
    expect(result.status).toBe('recovery');
    expect(result.preferences).toEqual(DEFAULT_PREFERENCES);
  });

  it('keeps independent patches independent', () => {
    const favorite = mergePreferences(DEFAULT_PREFERENCES, { favoriteRecordIds: ['atom.camera'] });
    const bounds = mergePreferences(favorite, { window: { ...favorite.window, width: 920 } });
    expect(bounds.favoriteRecordIds).toEqual(['atom.camera']);
    expect(bounds.window.width).toBe(920);
  });
});
