import type {
  AcceptQuickAddCommand,
  CueCommand,
  CueDraft,
  Domain,
  DraftFieldPath,
  Field,
  LibraryV2,
  ReferenceRole,
} from '../../shared/teleprompter-types';
import {
  applyPreset,
  clearAxis,
  createDraft,
  resetToPreset,
  selectRecipe,
  selectAxis as selectAxisMutation,
  toggleAtom,
} from './selection';
import type { SelectionIssue } from './selection';
import { validateCueDraft } from '../../shared/teleprompter-validation';
import { applyQuickAddCommand, touchedPathsForQuickAddCommand } from './quick-add';

export interface DraftMutation {
  readonly draft: CueDraft;
  readonly touchedPaths: readonly DraftFieldPath[];
}

export type DraftCommandResult =
  | { readonly ok: true; readonly value: DraftMutation }
  | { readonly ok: false; readonly issue: SelectionIssue };

const issue = (code: SelectionIssue['code'], message: string): DraftCommandResult => ({ ok: false, issue: { code, message } });
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const validDraft = (library: LibraryV2, draft: CueDraft): DraftCommandResult | undefined => {
  const result = validateCueDraft(draft, library);
  return result.ok ? undefined : issue('INVALID_DRAFT', result.errors.map((error) => `${error.path}: ${error.message}`).join(' '));
};
const bump = (draft: CueDraft, changes: Partial<CueDraft>): CueDraft => ({ ...draft, ...changes, revision: draft.revision + 1 });
const recipePath = (recipeId: string): DraftFieldPath => `recipe:${recipeId}`;
const customPath = (field: Field): DraftFieldPath => `custom:${field}`;

export type EngineCueCommand = CueCommand | AcceptQuickAddCommand;

export const touchedPathsForCommand = (library: LibraryV2, draft: CueDraft, command: EngineCueCommand): readonly DraftFieldPath[] => {
  if (command.type === 'accept-quick-add') return touchedPathsForQuickAddCommand(library, draft, command);
  switch (command.type) {
    case 'set-what': return ['what'];
    case 'set-custom-text': return [customPath(command.field)];
    case 'set-axis': case 'clear-axis': case 'toggle-atom': return [`axis:${command.axisId}`];
    case 'apply-preset': case 'reset-to-preset': {
      const preset = library.presets.find((item) => item.id === command.presetId);
      return unique<DraftFieldPath>(['preset', ...(preset?.scopeAxisIds ?? []).map((axisIdValue): DraftFieldPath => `axis:${axisIdValue}`), ...draft.choices.filter((choice) => choice.source === 'preset' && choice.presetId === draft.activePresetId).map((choice): DraftFieldPath => `axis:${choice.axisId}`)]);
    }
    case 'select-recipe': case 'remove-recipe': case 'set-recipe-slot': return [recipePath(command.recipeId)];
    case 'set-reference-roles': return ['references'];
    case 'set-manual-unlocks': return ['manualUnlocks'];
    case 'choose-format': return ['format'];
    case 'reset-draft': case 'undo-draft': return ['draft'];
  }
};

const allRecipeDomains = (library: LibraryV2, draft: CueDraft): Set<Domain> => {
  const domains = new Set<Domain>();
  for (const choice of draft.edits) {
    const recipe = library.editRecipes.find((item) => item.id === choice.recipeId);
    recipe?.requiredPreservedDomains.forEach((domain) => domains.add(domain));
  }
  return domains;
};

const validateReferences = (references: readonly ReferenceRole[]): SelectionIssue | undefined => {
  if (new Set(references.map((reference) => reference.imageNumber)).size !== references.length) return { code: 'INVALID_REFERENCE', message: 'Reference image numbers must be unique.' };
  if (references.filter((reference) => reference.role === 'base').length > 1) return { code: 'INVALID_REFERENCE', message: 'Only one reference can be the base.' };
  const roleCounts = new Map<string, number>();
  for (const reference of references) roleCounts.set(reference.role, (roleCounts.get(reference.role) ?? 0) + 1);
  for (const [role, count] of roleCounts) {
    if (count <= 1 || role === 'base' || role === 'custom') continue;
    const duplicates = references.filter((reference) => reference.role === role);
    if (duplicates.some((reference) => !/target|region|object|subject/i.test(reference.note))) return { code: 'INVALID_REFERENCE', message: `Multiple ${role} references need a target, region, object, or subject qualifier.` };
  }
  return undefined;
};

export const applyDraftCommand = (library: LibraryV2, draft: CueDraft, command: EngineCueCommand, history: readonly CueDraft[] = []): DraftCommandResult => {
  if (command.type !== 'reset-draft' && command.type !== 'undo-draft') {
    const invalid = validDraft(library, draft);
    if (invalid) return invalid;
  }
  if (command.type === 'accept-quick-add') return applyQuickAddCommand(library, draft, command);
  switch (command.type) {
    case 'set-what':
      return { ok: true, value: { draft: bump(draft, { what: command.text }), touchedPaths: ['what'] } };
    case 'set-custom-text': {
      const customText = { ...draft.customText };
      if (command.text.trim().length === 0) delete customText[command.field];
      else customText[command.field] = command.text;
      return { ok: true, value: { draft: bump(draft, { customText, activePresetId: undefined }), touchedPaths: [customPath(command.field), 'preset'] } };
    }
    case 'set-axis': return selectAxisMutation(library, draft, command.axisId, command.atomIds, command.pinnedBlank ?? false);
    case 'clear-axis': return clearAxis(library, draft, command.axisId, command.pinBlank);
    case 'toggle-atom': return toggleAtom(library, draft, command.axisId, command.atomId);
    case 'apply-preset': return applyPreset(library, draft, command.presetId);
    case 'reset-to-preset': return resetToPreset(library, draft, command.presetId);
    case 'select-recipe': return selectRecipe(library, draft, command.recipeId);
    case 'remove-recipe': {
      if (draft.id !== 'edit') return issue('WRONG_MODE', 'Edit recipes are available only in the Edit draft.');
      if (!draft.edits.some((choice) => choice.recipeId === command.recipeId)) return { ok: true, value: { draft, touchedPaths: [] } };
      return { ok: true, value: { draft: bump(draft, { edits: draft.edits.filter((choice) => choice.recipeId !== command.recipeId) }), touchedPaths: [recipePath(command.recipeId)] } };
    }
    case 'set-recipe-slot': {
      if (draft.id !== 'edit') return issue('WRONG_MODE', 'Edit recipes are available only in the Edit draft.');
      const recipe = library.editRecipes.find((item) => item.id === command.recipeId);
      const choice = draft.edits.find((item) => item.recipeId === command.recipeId);
      if (!recipe || !choice) return issue('UNKNOWN_RECIPE', `Select the edit recipe before setting its slot: ${command.recipeId}.`);
      if (!recipe.slotKeys.includes(command.slot)) return issue('UNKNOWN_RECIPE', `Unknown slot ${command.slot} on ${recipe.label}.`);
      const edits = draft.edits.map((item) => item.recipeId === command.recipeId ? { ...item, slots: { ...item.slots, [command.slot]: command.value } } : item);
      return { ok: true, value: { draft: bump(draft, { edits }), touchedPaths: [recipePath(command.recipeId)] } };
    }
    case 'set-reference-roles': {
      if (draft.id !== 'edit') return issue('WRONG_MODE', 'Reference roles are available only in the Edit draft.');
      const referenceIssue = validateReferences(command.references);
      if (referenceIssue) return { ok: false, issue: referenceIssue };
      return { ok: true, value: { draft: bump(draft, { references: [...command.references] }), touchedPaths: ['references'] } };
    }
    case 'set-manual-unlocks': {
      if (draft.id !== 'edit') return issue('WRONG_MODE', 'Manual unlocks are available only in the Edit draft.');
      const required = allRecipeDomains(library, draft);
      const conflicts = command.domains.filter((domain) => required.has(domain));
      if (conflicts.length > 0) return issue('RECIPE_CONFLICT', `Manual unlock conflicts with a selected preservation lock: ${conflicts.join(', ')}.`);
      return { ok: true, value: { draft: bump(draft, { manualUnlocks: unique(command.domains) }), touchedPaths: ['manualUnlocks'] } };
    }
    case 'choose-format': return { ok: true, value: { draft: bump(draft, { outputFormat: command.format }), touchedPaths: ['format'] } };
    case 'reset-draft': return { ok: true, value: { draft: createDraft(library, draft.id, draft.revision + 1, false), touchedPaths: ['draft'] } };
    case 'undo-draft': {
      const previous = history.at(-1);
      if (!previous) return issue('HISTORY_UNAVAILABLE', 'Undo is available after the first accepted draft change.');
      return { ok: true, value: { draft: { ...previous, revision: draft.revision + 1 }, touchedPaths: ['draft'] } };
    }
  }
};
