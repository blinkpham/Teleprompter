import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES, mergePreferences, validatePreferences } from './preferences';

describe('preference validation', () => {
  const validIds = new Set(['surgical-edit']);

  it('fills invalid fields independently and deduplicates favorites', () => {
    const result = validatePreferences({
      favoriteTechniqueIds: ['surgical-edit', 'surgical-edit', 'missing'],
      themePreference: 'unknown',
      lastMode: 'cheatsheet',
      window: { width: 1000 },
    }, validIds);
    expect(result.favoriteTechniqueIds).toEqual(['surgical-edit']);
    expect(result.themePreference).toBe('system');
    expect(result.lastMode).toBe('cheatsheet');
    expect(result.window.height).toBe(DEFAULT_PREFERENCES.window.height);
  });

  it('keeps independent changes when merged sequentially', () => {
    const withFavorite = mergePreferences(DEFAULT_PREFERENCES, { favoriteTechniqueIds: ['surgical-edit'] });
    const withTheme = mergePreferences(withFavorite, { themePreference: 'dark' });
    expect(withTheme.favoriteTechniqueIds).toEqual(['surgical-edit']);
    expect(withTheme.themePreference).toBe('dark');
  });
});
