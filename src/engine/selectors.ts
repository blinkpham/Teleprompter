import type { CategoryId, Catalog, FamilyId, SearchResults } from '../shared/catalog-types';

export const selectGalleryResults = (
  results: SearchResults,
  catalog: Catalog,
  category: CategoryId | 'all',
  favoritesOnly: boolean,
  favoriteIds: ReadonlySet<string>,
): readonly string[] => {
  const ids = results.techniqueMatches.map((match) => match.id);
  return ids.filter((id) => {
    const technique = catalog.techniqueById[id];
    return Boolean(technique)
      && (category === 'all' || technique?.categoryId === category)
      && (!favoritesOnly || favoriteIds.has(id));
  });
};

export const groupCheatsheetResults = (
  results: SearchResults,
  catalog: Catalog,
  family: FamilyId | 'all',
): readonly { readonly familyId: FamilyId; readonly entryIds: readonly string[]; readonly scores: Readonly<Record<string, number>> }[] => {
  const scores = new Map(results.entryMatches.map((match) => [match.id, match.score]));
  return catalog.families
    .filter((item) => family === 'all' || item.id === family)
    .map((item) => ({
      familyId: item.id,
      entryIds: catalog.entries
        .filter((entry) => entry.familyId === item.id && scores.has(entry.id))
        .sort((left, right) => left.order - right.order)
        .map((entry) => entry.id),
      scores: Object.fromEntries(catalog.entries.filter((entry) => entry.familyId === item.id).map((entry) => [entry.id, scores.get(entry.id) ?? 0])),
    }))
    .filter((group) => group.entryIds.length > 0);
};
