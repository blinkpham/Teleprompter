import type {
  Catalog,
  CheatsheetEntry,
  SearchFields,
  SearchIndex,
  SearchMatch,
  SearchResults,
  Technique,
} from '../shared/catalog-types';

const normalize = (value: string): string => value.normalize('NFKC').toLocaleLowerCase().trim().replace(/\s+/g, ' ');
const exact = (value: string): string => normalize(value).replace(/\s*:\s*/g, ':');
const loose = (value: string): string => normalize(value).replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
const termsFor = (value: string): readonly string[] => [...new Set(loose(value).split(' ').filter(Boolean))];

const techniqueFields = (technique: Technique, catalog: Catalog): SearchFields => {
  const category = catalog.categories.find((item) => item.id === technique.categoryId);
  const exactTokens = [technique.shorthandTemplate];
  const label = [category?.label ?? '', ...technique.tags, ...technique.searchTerms].join(' ');
  return {
    exactTokens: exactTokens.map(exact),
    looseTokens: exactTokens.map(loose),
    title: loose(technique.title),
    label: loose(label),
    summary: loose(technique.summary),
    body: loose([technique.prompt, technique.example ?? '', ...technique.cautionIds].join(' ')),
    order: technique.order,
  };
};

const entryFields = (entry: CheatsheetEntry, catalog: Catalog): SearchFields => {
  const family = catalog.familyById[entry.familyId];
  const componentEntries = entry.kind === 'preset'
    ? entry.componentEntryIds.map((id) => catalog.entryById[id]).filter((item): item is Exclude<CheatsheetEntry, { kind: 'preset' }> => Boolean(item && item.kind !== 'preset'))
    : [];
  const componentTokens = componentEntries.flatMap((item) => [item.token, ...item.aliases]);
  const componentMeanings = componentEntries.map((item) => item.meaning);
  const aliases = entry.kind === 'preset' ? [] : entry.aliases;
  const exactTokens = [entry.token, ...aliases, ...componentTokens];
  const title = entry.kind === 'preset' ? entry.meaning : entry.token;
  const summary = entry.kind === 'preset' ? [entry.meaning, ...componentMeanings].join(' ') : entry.meaning;
  const body = entry.kind === 'preset'
    ? [...componentEntries.map((item) => item.direction), entry.example ?? '', ...entry.cautionIds, ...catalog.resolutionExamples.filter((example) => example.renderEntryId === entry.id).map((example) => `${example.aspectRatioLabel} ${example.pixelsText} ${example.note ?? ''}`)].join(' ')
    : [entry.direction, entry.example ?? '', ...entry.cautionIds, ...catalog.resolutionExamples.filter((example) => example.renderEntryId === entry.id).map((example) => `${example.aspectRatioLabel} ${example.pixelsText} ${example.note ?? ''}`)].join(' ');
  return {
    exactTokens: exactTokens.map(exact),
    looseTokens: exactTokens.map(loose),
    title: loose(title),
    label: loose([family?.label ?? '', ...(family?.label === 'Camera' ? ['lens'] : []), ...(family?.label === 'Angles' ? ['angle'] : []), ...(family?.label === 'Composition' ? ['composition'] : []), ...(family?.label === 'Lighting' ? ['light'] : []), ...(family?.label === 'Depth & focus' ? ['depth of field'] : []), ...entry.searchTerms].join(' ')),
    summary: loose(summary),
    body: loose(body),
    order: entry.order,
  };
};

export const buildSearchIndex = (catalog: Catalog): SearchIndex => ({
  catalog,
  techniques: Object.fromEntries(catalog.techniques.map((technique) => [technique.id, techniqueFields(technique, catalog)])),
  entries: Object.fromEntries(catalog.entries.map((entry) => [entry.id, entryFields(entry, catalog)])),
});

const fieldScore = (fields: SearchFields, term: string): number => {
  if (fields.looseTokens.some((value) => value.includes(term))) return 80;
  if (fields.title.includes(term)) return 60;
  if (fields.label.includes(term)) return 40;
  if (fields.summary.includes(term)) return 20;
  if (fields.body.includes(term)) return 5;
  return 0;
};

const score = (fields: SearchFields, rawQuery: string): number => {
  const normalizedQuery = exact(rawQuery);
  const looseQuery = loose(rawQuery);
  const terms = termsFor(rawQuery);
  if (!terms.length) return 0;
  if (!terms.every((term) => fieldScore(fields, term) > 0)) return 0;
  let total = 0;
  if (fields.exactTokens.includes(normalizedQuery)) total += 1000;
  else if (fields.title === looseQuery) total += 700;
  else if (fields.title.includes(looseQuery)) total += 450;
  else if (fields.looseTokens.some((value) => value.includes(looseQuery))) total += 350;
  total += terms.reduce((sum, term) => sum + fieldScore(fields, term), 0);
  return total;
};

const matches = (records: Readonly<Record<string, SearchFields>>, rawQuery: string): SearchMatch[] => Object.entries(records)
  .map(([id, fields]) => ({ id, score: score(fields, rawQuery), order: fields.order }))
  .filter((match) => match.score > 0)
  .sort((left, right) => right.score - left.score || left.order - right.order || left.id.localeCompare(right.id))
  .map(({ id, score: itemScore }) => ({ id, score: itemScore }));

export const searchCatalog = (index: SearchIndex, rawQuery: string): SearchResults => {
  const query = rawQuery.slice(0, 200);
  const isEmptyQuery = termsFor(query).length === 0;
  const techniqueMatches = isEmptyQuery
    ? index.catalog.techniques.map((technique) => ({ id: technique.id, score: 0 }))
    : matches(index.techniques, query);
  const entryMatches = isEmptyQuery
    ? index.catalog.entries.map((entry) => ({ id: entry.id, score: 0 }))
    : matches(index.entries, query);
  return {
    query,
    isEmptyQuery,
    techniqueMatches,
    entryMatches,
    techniqueCount: techniqueMatches.length,
    entryCount: entryMatches.length,
  };
};
