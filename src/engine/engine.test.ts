import { describe, expect, it } from 'vitest';
import { catalog } from '../content/catalog';
import { buildSearchIndex, searchCatalog } from './index';

describe('seed search engine', () => {
  it('finds a source alias and the related technique', () => {
    const results = searchCatalog(buildSearchIndex(catalog), 'hq:');
    expect(results.entryMatches.map((match) => match.id)).toContain('route-hq');
    expect(results.techniqueMatches.map((match) => match.id)).toContain('quality-restoration');
  });

  it('matches aliases and canonical tokens without duplicate rows', () => {
    const index = buildSearchIndex(catalog);
    const aliasResults = searchCatalog(index, 'cam:50');
    const canonicalResults = searchCatalog(index, 'cam:natural50');
    expect(aliasResults.entryMatches.map((match) => match.id)).toContain('camera-natural50');
    expect(aliasResults.entryMatches.filter((match) => match.id === 'camera-natural50')).toHaveLength(1);
    expect(canonicalResults.entryMatches.map((match) => match.id)).toContain('camera-natural50');
  });

  it('requires every query term to match', () => {
    const index = buildSearchIndex(catalog);
    const results = searchCatalog(index, 'highkey commercial');
    expect(results.entryMatches.map((match) => match.id)).toContain('preset-commercial');
    expect(searchCatalog(index, 'nonsense-token').entryCount).toBe(0);
  });

  it('treats punctuation-only input as an empty query', () => {
    const results = searchCatalog(buildSearchIndex(catalog), '---');
    expect(results.isEmptyQuery).toBe(true);
    expect(results.entryCount).toBe(catalog.entries.length);
  });
});
