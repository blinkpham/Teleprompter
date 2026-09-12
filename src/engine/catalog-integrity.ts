import type { Catalog } from '../shared/catalog-types';

export const validateCatalog = (catalog: Catalog): readonly string[] => {
  const errors: string[] = [];
  const techniqueIds = new Set<string>();
  for (const technique of catalog.techniques) {
    if (techniqueIds.has(technique.id)) errors.push(`Duplicate technique ID: ${technique.id}`);
    techniqueIds.add(technique.id);
    if (!catalog.categories.some((category) => category.id === technique.categoryId)) errors.push(`Unknown category on ${technique.id}: ${technique.categoryId}`);
    if (technique.previewId !== technique.id) errors.push(`Preview ID does not match technique ID: ${technique.id}`);
    for (const entryId of technique.shorthandEntryIds) {
      if (!catalog.entryById[entryId]) errors.push(`Unknown shorthand entry on ${technique.id}: ${entryId}`);
    }
  }
  const entryIds = new Set<string>();
  for (const entry of catalog.entries) {
    if (entryIds.has(entry.id)) errors.push(`Duplicate entry ID: ${entry.id}`);
    entryIds.add(entry.id);
    if (!catalog.familyById[entry.familyId]) errors.push(`Unknown family on ${entry.id}: ${entry.familyId}`);
    if (entry.kind === 'preset') {
      for (const componentId of entry.componentEntryIds) {
        const component = catalog.entryById[componentId];
        if (!component || component.kind === 'preset') errors.push(`Invalid preset component on ${entry.id}: ${componentId}`);
      }
    }
  }
  return errors;
};
