import type {
  Atom,
  Axis,
  AxisChoice,
  CueDraft,
  DraftFieldPath,
  Id,
  LibraryV2,
  Mode,
  Preset,
} from '../../shared/teleprompter-types';
import { newDraftDefaults } from '../../shared/teleprompter-types';
import { validateCueDraft } from '../../shared/teleprompter-validation';

export type SelectionErrorCode = 'UNKNOWN_AXIS' | 'UNKNOWN_ATOM' | 'WRONG_AXIS' | 'WRONG_MODE' | 'CARDINALITY' | 'EXCLUSION' | 'REQUIRES' | 'INVALID_DRAFT' | 'UNKNOWN_PRESET' | 'UNKNOWN_RECIPE' | 'RECIPE_CONFLICT' | 'INVALID_REFERENCE' | 'HISTORY_UNAVAILABLE' | 'STALE_CONTENT' | 'INVALID_QUERY' | 'UNKNOWN_TARGET' | 'INCOMPATIBLE_TARGET' | 'REVISION_CONFLICT';

export interface SelectionIssue {
  readonly code: SelectionErrorCode;
  readonly path?: DraftFieldPath;
  readonly axisId?: Id;
  readonly atomId?: Id;
  readonly conflictingAtomIds?: readonly Id[];
  readonly requiredAtomIds?: readonly Id[];
  readonly message: string;
}

export type SelectionResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issue: SelectionIssue };

export interface ResolvedSelection {
  readonly axis: Axis;
  readonly atoms: readonly Atom[];
  readonly atomIds: readonly Id[];
}

export interface PresetApplication {
  readonly draft: CueDraft;
  readonly touchedPaths: readonly DraftFieldPath[];
  readonly appliedAxisIds: readonly Id[];
  readonly skippedAxisIds: readonly Id[];
}

export interface SelectionMutation {
  readonly draft: CueDraft;
  readonly touchedPaths: readonly DraftFieldPath[];
}

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const axisPath = (axisId: Id): DraftFieldPath => `axis:${axisId}`;
const atomMap = (library: LibraryV2): ReadonlyMap<Id, Atom> => new Map(library.atoms.map((atom) => [atom.id, atom]));
const axisMap = (library: LibraryV2): ReadonlyMap<Id, Axis> => new Map(library.axes.map((axis) => [axis.id, axis]));

export const createDraft = (library: LibraryV2, mode: Mode, revision = 0, newDocument = true): CueDraft => ({
  schemaVersion: 1,
  id: mode,
  revision,
  libraryVersion: library.contentVersion,
  what: '',
  choices: [],
  customText: newDocument ? newDraftDefaults(mode).customText : {},
  edits: [],
  references: [],
  manualUnlocks: [],
  outputFormat: 'expanded',
});

const invalidDraft = (draft: CueDraft, library: LibraryV2): SelectionResult<SelectionMutation> => {
  const result = validateCueDraft(draft, library);
  return result.ok
    ? { ok: true, value: { draft, touchedPaths: [] } }
    : { ok: false, issue: { code: 'INVALID_DRAFT', message: result.errors.map((error) => `${error.path}: ${error.message}`).join(' ') } };
};

export const selectedAtomIds = (draft: CueDraft): readonly Id[] => unique(draft.choices.flatMap((choice) => choice.atomIds));

export const resolveSelection = (
  library: LibraryV2,
  selectedAxisId: Id,
  requestedAtomIds: readonly Id[],
  currentAtomIds: readonly Id[] = [],
  mode: Mode = 'create',
): SelectionResult<ResolvedSelection> => {
  const axis = axisMap(library).get(selectedAxisId);
  if (!axis) return { ok: false, issue: { code: 'UNKNOWN_AXIS', axisId: selectedAxisId, message: `Unknown axis: ${selectedAxisId}.` } };
  const atomsById = atomMap(library);
  const atomIds = unique(requestedAtomIds);
  const atoms: Atom[] = [];
  for (const atomId of atomIds) {
    const atom = atomsById.get(atomId);
    if (!atom) return { ok: false, issue: { code: 'UNKNOWN_ATOM', axisId: selectedAxisId, atomId, message: `Unknown atom: ${atomId}.` } };
    if (atom.axisId !== selectedAxisId) return { ok: false, issue: { code: 'WRONG_AXIS', axisId: selectedAxisId, atomId, message: `${atom.label} belongs to ${atom.axisId}, not ${selectedAxisId}.` } };
    if (!atom.applicability.includes(mode)) return { ok: false, issue: { code: 'WRONG_MODE', axisId: selectedAxisId, atomId, message: `${atom.label} is not available in ${mode}.` } };
    atoms.push(atom);
  }
  if (axis.cardinality === 'one' && atoms.length > 1) return { ok: false, issue: { code: 'CARDINALITY', axisId: selectedAxisId, conflictingAtomIds: atomIds, message: `${axis.label} accepts one choice.` } };
  const allExplicit = new Set([...currentAtomIds, ...atomIds]);
  for (const atom of atoms) {
    const missing = atom.requires.filter((requiredId) => !allExplicit.has(requiredId));
    if (missing.length > 0) return { ok: false, issue: { code: 'REQUIRES', axisId: selectedAxisId, atomId: atom.id, requiredAtomIds: missing, message: `${atom.label} requires an explicit choice: ${missing.join(', ')}.` } };
    const conflicts = atom.excludes.filter((otherId) => allExplicit.has(otherId) && !atomIds.includes(otherId));
    if (conflicts.length > 0) return { ok: false, issue: { code: 'EXCLUSION', axisId: selectedAxisId, atomId: atom.id, conflictingAtomIds: conflicts, message: `${atom.label} conflicts with ${conflicts.join(', ')}.` } };
  }
  return { ok: true, value: { axis, atoms, atomIds } };
};

const choiceFor = (draft: CueDraft, axisIdValue: Id): AxisChoice | undefined => draft.choices.find((choice) => choice.axisId === axisIdValue);

const replaceChoice = (draft: CueDraft, choice: AxisChoice): CueDraft => ({
  ...draft,
  choices: [...draft.choices.filter((item) => item.axisId !== choice.axisId), choice],
});

const removeChoices = (draft: CueDraft, axisIds: ReadonlySet<Id>): CueDraft => ({
  ...draft,
  choices: draft.choices.filter((choice) => !axisIds.has(choice.axisId)),
});

const nextRevision = (draft: CueDraft, changes: Partial<CueDraft>): CueDraft => ({ ...draft, ...changes, revision: draft.revision + 1 });

const presetAtomsByAxis = (library: LibraryV2, preset: Preset): SelectionResult<ReadonlyMap<Id, readonly Id[]>> => {
  const atoms = atomMap(library);
  const byAxis = new Map<Id, Id[]>();
  for (const atomId of preset.atomIds) {
    const atom = atoms.get(atomId);
    if (!atom) return { ok: false, issue: { code: 'UNKNOWN_ATOM', atomId, message: `Preset ${preset.label} references unknown atom ${atomId}.` } };
    if (!atom.applicability.some((mode) => preset.applicability.includes(mode))) return { ok: false, issue: { code: 'WRONG_MODE', atomId, message: `Preset ${preset.label} contains an atom that cannot be used in its modes.` } };
    const list = byAxis.get(atom.axisId) ?? [];
    list.push(atom.id);
    byAxis.set(atom.axisId, list);
  }
  return { ok: true, value: byAxis };
};

const applyPresetInternal = (library: LibraryV2, draft: CueDraft, preset: Preset, resetManual: boolean): SelectionResult<PresetApplication> => {
  if (!preset.applicability.includes(draft.id)) return { ok: false, issue: { code: 'WRONG_MODE', message: `${preset.label} is not available in ${draft.id}.` } };
  const grouped = presetAtomsByAxis(library, preset);
  if (!grouped.ok) return grouped;
  const previousPresetAxes = new Set(draft.choices.filter((choice) => choice.source === 'preset' && choice.presetId === draft.activePresetId).map((choice) => choice.axisId));
  let working = draft;
  if (previousPresetAxes.size > 0) working = removeChoices(working, previousPresetAxes);
  const appliedAxisIds: Id[] = [];
  const skippedAxisIds: Id[] = [];
  for (const axisIdValue of preset.scopeAxisIds) {
    const atomIds = grouped.value.get(axisIdValue) ?? [];
    const current = choiceFor(working, axisIdValue);
    if (!resetManual && current && (current.source === 'manual' || current.pinnedBlank)) {
      skippedAxisIds.push(axisIdValue);
      continue;
    }
    const selection = resolveSelection(library, axisIdValue, atomIds, selectedAtomIds(working), draft.id);
    if (!selection.ok) return selection;
    working = replaceChoice(working, { axisId: axisIdValue, atomIds, source: 'preset', presetId: preset.id, pinnedBlank: false });
    appliedAxisIds.push(axisIdValue);
  }
  const touchedPaths = unique<DraftFieldPath>(['preset', ...appliedAxisIds.map(axisPath), ...skippedAxisIds.map(axisPath), ...[...previousPresetAxes].map(axisPath)]);
  return { ok: true, value: { draft: nextRevision(working, { activePresetId: preset.id }), touchedPaths, appliedAxisIds, skippedAxisIds } };
};

export const applyPreset = (library: LibraryV2, draft: CueDraft, presetId: Id): SelectionResult<PresetApplication> => {
  const valid = invalidDraft(draft, library);
  if (!valid.ok) return valid;
  const preset = library.presets.find((item) => item.id === presetId);
  if (!preset) return { ok: false, issue: { code: 'UNKNOWN_PRESET', message: `Unknown preset: ${presetId}.` } };
  return applyPresetInternal(library, draft, preset, false);
};

export const resetToPreset = (library: LibraryV2, draft: CueDraft, presetId: Id): SelectionResult<PresetApplication> => {
  const valid = invalidDraft(draft, library);
  if (!valid.ok) return valid;
  const preset = library.presets.find((item) => item.id === presetId);
  if (!preset) return { ok: false, issue: { code: 'UNKNOWN_PRESET', message: `Unknown preset: ${presetId}.` } };
  const axes = new Set(preset.scopeAxisIds);
  const cleared = removeChoices(draft, axes);
  return applyPresetInternal(library, cleared, preset, true);
};

export const selectAxis = (library: LibraryV2, draft: CueDraft, axisIdValue: Id, atomIds: readonly Id[], pinnedBlank = false): SelectionResult<SelectionMutation> => {
  const valid = invalidDraft(draft, library);
  if (!valid.ok) return valid;
  const existing = selectedAtomIds(draft).filter((id) => !choiceFor(draft, axisIdValue)?.atomIds.includes(id));
  const selection = resolveSelection(library, axisIdValue, atomIds, existing, draft.id);
  if (!selection.ok) return selection;
  const next = nextRevision(replaceChoice(draft, { axisId: axisIdValue, atomIds: selection.value.atomIds, source: 'manual', pinnedBlank }), { activePresetId: undefined });
  return { ok: true, value: { draft: next, touchedPaths: [axisPath(axisIdValue), 'preset'] } };
};

export const clearAxis = (library: LibraryV2, draft: CueDraft, axisIdValue: Id, pinBlank: boolean): SelectionResult<SelectionMutation> => {
  const valid = invalidDraft(draft, library);
  if (!valid.ok) return valid;
  const axis = axisMap(library).get(axisIdValue);
  if (!axis) return { ok: false, issue: { code: 'UNKNOWN_AXIS', axisId: axisIdValue, message: `Unknown axis: ${axisIdValue}.` } };
  const next = pinBlank ? nextRevision(replaceChoice(draft, { axisId: axis.id, atomIds: [], source: 'manual', pinnedBlank: true }), { activePresetId: undefined }) : nextRevision({ ...draft, choices: draft.choices.filter((choice) => choice.axisId !== axis.id) }, { activePresetId: undefined });
  return { ok: true, value: { draft: next, touchedPaths: [axisPath(axisIdValue), 'preset'] } };
};

export const toggleAtom = (library: LibraryV2, draft: CueDraft, axisIdValue: Id, atomId: Id): SelectionResult<SelectionMutation> => {
  const axis = axisMap(library).get(axisIdValue);
  if (!axis) return { ok: false, issue: { code: 'UNKNOWN_AXIS', axisId: axisIdValue, message: `Unknown axis: ${axisIdValue}.` } };
  const current = choiceFor(draft, axisIdValue);
  const currentIds = current?.atomIds ?? [];
  if (currentIds.includes(atomId)) return selectAxis(library, draft, axisIdValue, currentIds.filter((id) => id !== atomId), false);
  const nextIds = axis.cardinality === 'one' ? [atomId] : [...currentIds, atomId];
  return selectAxis(library, draft, axisIdValue, nextIds, false);
};

export const selectRecipe = (library: LibraryV2, draft: CueDraft, recipeId: Id): SelectionResult<SelectionMutation> => {
  const valid = invalidDraft(draft, library);
  if (!valid.ok) return valid;
  if (draft.id !== 'edit') return { ok: false, issue: { code: 'WRONG_MODE', message: 'Edit recipes are available only in the Edit draft.' } };
  const recipe = library.editRecipes.find((item) => item.id === recipeId);
  if (!recipe) return { ok: false, issue: { code: 'UNKNOWN_RECIPE', message: `Unknown recipe: ${recipeId}.` } };
  const existing = draft.edits.map((choice) => choice.recipeId);
  if (existing.includes(recipe.id)) return { ok: true, value: { draft, touchedPaths: [] } };
  if (recipe.excludesRecipeIds.some((id) => existing.includes(id)) || draft.edits.some((choice) => library.editRecipes.find((item) => item.id === choice.recipeId)?.excludesRecipeIds.includes(recipe.id))) {
    return { ok: false, issue: { code: 'RECIPE_CONFLICT', message: `${recipe.label} conflicts with a selected edit recipe.` } };
  }
  const edits = [...draft.edits, {
    recipeId: recipe.id,
    slots: Object.fromEntries(recipe.slotKeys.map((slot) => [slot, ''])),
  }];
  return { ok: true, value: { draft: nextRevision(draft, { edits }), touchedPaths: [`recipe:${recipe.id}`] } };
};
