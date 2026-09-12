import type { Catalog, SearchIndex, SearchMatch, SearchResults } from '../shared/catalog-types';

const normalize = (value: string): string => value.trim().toLocaleLowerCase();
const compact = (value: string): string => normalize(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export const buildSearchIndex = (catalog: Catalog): SearchIndex => ({
  catalog,
  techniques: Object.fromEntries(catalog.techniques.map((technique) => [
    technique.id,
    compact([
      technique.title,
      technique.summary,
      technique.prompt,
      technique.shorthandTemplate,
      ...technique.tags,
      ...technique.searchTerms,
    ].join(' ')),
  ])),
  entries: Object.fromEntries(catalog.entries.map((entry) => {
    const family = catalog.familyById[entry.familyId];
    const text = entry.kind === 'preset'
      ? [entry.token, entry.meaning, entry.example, family?.label, ...entry.searchTerms].filter(Boolean).join(' ')
      : [entry.token, ...entry.aliases, entry.meaning, entry.direction, entry.example, family?.label, ...entry.searchTerms].filter(Boolean).join(' ');
    return [entry.id, compact(text)];
  })),
});

const scoreText = (text: string, query: string): number => {
  const terms = compact(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;
  const score = terms.reduce((total, term) => {
    if (text === term) return total + 100;
    if (text.split(' ').includes(term)) return total + 40;
    if (text.startsWith(term)) return total + 25;
    if (text.includes(term)) return total + 10;
    return total;
  }, 0);
  return score === terms.length * 10 ? 0 : score;
};

const rank = (records: Readonly<Record<string, string>>, query: string): SearchMatch[] => Object.entries(records)
  .map(([id, text]) => ({ id, score: scoreText(text, query) }))
  .filter((match) => match.score > 0)
  .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));

export const searchCatalog = (index: SearchIndex, rawQuery: string): SearchResults => {
  const query = normalize(rawQuery).slice(0, 200);
  const isEmptyQuery = compact(query).length === 0;
  const techniqueMatches = isEmptyQuery
    ? index.catalog.techniques.map((technique) => ({ id: technique.id, score: 0 }))
    : rank(index.techniques, query);
  const entryMatches = isEmptyQuery
    ? index.catalog.entries.map((entry) => ({ id: entry.id, score: 0 }))
    : rank(index.entries, query);
  return {
    query,
    isEmptyQuery,
    techniqueMatches,
    entryMatches,
    techniqueCount: techniqueMatches.length,
    entryCount: entryMatches.length,
  };
};
