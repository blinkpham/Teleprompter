import { describe, expect, it } from 'vitest';
import { catalog } from '../content/catalog';
import { buildSearchIndex, searchCatalog } from './index';

describe('seed search engine', () => {
  it('finds a source alias and the related technique', () => {
    const results = searchCatalog(buildSearchIndex(catalog), 'hq:');
    expect(results.entryMatches.map((match) => match.id)).toContain('route-hq');
    expect(results.techniqueCount).toBe(0);
  });

  it('treats punctuation-only input as an empty query', () => {
    const results = searchCatalog(buildSearchIndex(catalog), '---');
    expect(results.isEmptyQuery).toBe(true);
    expect(results.entryCount).toBe(catalog.entries.length);
  });
});
