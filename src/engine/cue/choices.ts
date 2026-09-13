import type {
  Atom,
  Bundle,
  EditRecipe,
  Field,
  LibraryChoiceView,
  LibraryV2,
  LibraryView,
  Mode,
  Preset,
} from '../../shared/teleprompter-types';

export interface ChoiceQuery {
  readonly mode?: Mode;
  readonly field?: Field;
  readonly axisId?: string;
  readonly query?: string;
}

export interface LibrarySearchMatch extends LibraryChoiceView {
  readonly score: number;
}

const normalize = (value: string): string => value.normalize('NFKC').toLocaleLowerCase().trim().replace(/\s+/g, ' ');
const recordField = (library: LibraryV2, record: Atom | Bundle | Preset | EditRecipe): Field | undefined => {
  if (record.kind === 'atom') return library.axes.find((axis) => axis.id === record.axisId)?.field;
  if (record.kind === 'bundle') {
    const first = record.atomIds[0];
    const atom = library.atoms.find((item) => item.id === first);
    return atom ? library.axes.find((axis) => axis.id === atom.axisId)?.field : undefined;
  }
  return undefined;
};

const recordAxisId = (library: LibraryV2, record: Atom | Bundle | Preset | EditRecipe): string | undefined => {
  if (record.kind === 'atom') return record.axisId;
  if (record.kind === 'bundle') return library.atoms.find((atom) => atom.id === record.atomIds[0])?.axisId;
  return undefined;
};

const toChoice = (library: LibraryV2, record: Atom | Bundle | Preset | EditRecipe): LibraryChoiceView => ({
  id: record.id,
  kind: record.kind,
  label: record.label,
  shorthand: record.shorthand,
  summary: record.summary,
  ...(recordField(library, record) ? { field: recordField(library, record) } : {}),
  ...(recordAxisId(library, record) ? { axisId: recordAxisId(library, record) } : {}),
  order: record.order,
  status: record.status,
  aliases: record.aliases,
  cautionIds: record.cautionIds,
  ...(record.previewAssetId ? { previewAssetId: record.previewAssetId } : {}),
});

const allRecords = (library: LibraryV2): readonly (Atom | Bundle | Preset | EditRecipe)[] => [
  ...library.atoms,
  ...library.bundles,
  ...library.presets,
  ...library.editRecipes,
];

export const listChoices = (library: LibraryV2, query: ChoiceQuery = {}): readonly LibraryChoiceView[] => {
  const axisField = query.field;
  const axisOrder = new Map(library.axes.map((axis) => [axis.id, axis.order]));
  return allRecords(library)
    .filter((record) => record.status === 'active')
    .filter((record) => {
      if (!query.mode) return true;
      if (record.kind === 'atom' || record.kind === 'preset') return record.applicability.includes(query.mode);
      if (record.kind === 'edit-recipe') return query.mode === 'edit';
      const atomModes = record.atomIds.map((id) => library.atoms.find((atom) => atom.id === id)?.applicability ?? []).flat();
      return atomModes.includes(query.mode);
    })
    .map((record) => toChoice(library, record))
    .filter((choice) => axisField === undefined || choice.field === axisField)
    .filter((choice) => query.axisId === undefined || choice.axisId === query.axisId)
    .sort((left, right) => (axisOrder.get(left.axisId ?? '') ?? Number.MAX_SAFE_INTEGER) - (axisOrder.get(right.axisId ?? '') ?? Number.MAX_SAFE_INTEGER) || left.order - right.order || left.id.localeCompare(right.id));
};

const scoreChoice = (choice: LibraryChoiceView, rawQuery: string): number => {
  const query = normalize(rawQuery);
  if (!query) return 0;
  const exactValues = [choice.shorthand, ...choice.aliases].map(normalize);
  const title = normalize(choice.label);
  const body = normalize(`${choice.summary} ${choice.field ?? ''} ${choice.axisId ?? ''}`);
  const terms = query.split(' ');
  if (!terms.every((term) => exactValues.some((value) => value.includes(term)) || title.includes(term) || body.includes(term))) return 0;
  if (exactValues.includes(query)) return 1000;
  if (title === query) return 800;
  if (title.includes(query)) return 600;
  if (exactValues.some((value) => value.includes(query))) return 500;
  return terms.reduce((score, term) => score + (title.includes(term) ? 30 : body.includes(term) ? 10 : 0), 0);
};

export const searchLibrary = (library: LibraryV2, rawQuery: string, query: Omit<ChoiceQuery, 'query'> = {}): readonly LibrarySearchMatch[] => listChoices(library, query).map((choice) => ({ ...choice, score: scoreChoice(choice, rawQuery) })).filter((choice) => choice.score > 0).sort((left, right) => right.score - left.score || left.order - right.order || left.id.localeCompare(right.id));

export const projectLibrary = (library: LibraryV2): LibraryView => ({
  schemaVersion: 2,
  contentVersion: library.contentVersion,
  taxa: library.taxa,
  axes: library.axes,
  choices: listChoices(library),
  presets: library.presets,
  editRecipes: library.editRecipes,
  sources: library.sources,
  cautions: library.cautions,
});
