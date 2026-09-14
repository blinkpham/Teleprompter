import type {
  AcceptQuickAddCommand,
  CueDraft,
  DraftFieldPath,
  ExpectedFieldRevisions,
  LibraryV2,
  QuickAddAcceptance,
  QuickAddCommandEnvelope,
  QuickAddTarget,
} from '../../shared/teleprompter-types';
import { validateCueDraft, validateQuickAddCommand } from '../../shared/teleprompter-validation';
import type { DraftCommandResult } from './commands';
import type { SelectionIssue } from './selection';
import { applyPreset, selectAxis, selectRecipe } from './selection';

export interface QuickAddApplyOptions {
  /** Current authoritative field revisions. Omit only for a pure engine mutation test. */
  readonly currentFieldRevisions?: Readonly<Record<string, number>>;
}

type QuickAddInput = AcceptQuickAddCommand | QuickAddAcceptance | QuickAddCommandEnvelope;

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const pathForAxis = (axisId: string): DraftFieldPath => `axis:${axisId}`;
const pathForRecipe = (recipeId: string): DraftFieldPath => `recipe:${recipeId}`;

const failure = (code: SelectionIssue['code'], message: string, path?: DraftFieldPath): DraftCommandResult => ({
  ok: false,
  issue: { code, message, ...(path ? { path } : {}) },
});

const isEnvelope = (input: QuickAddInput): input is QuickAddCommandEnvelope => 'command' in input;
const acceptanceFor = (input: QuickAddInput): QuickAddAcceptance => isEnvelope(input)
  ? input.command.acceptance
  : 'acceptance' in input ? input.acceptance : input;

const expectedRevisionsFor = (input: QuickAddInput): ExpectedFieldRevisions | undefined => isEnvelope(input) ? input.expectedFieldRevisions : undefined;

const targetFor = (acceptance: QuickAddAcceptance): QuickAddTarget => acceptance.target;

const touchedPathsForTarget = (library: LibraryV2, draft: CueDraft, target: QuickAddTarget): readonly DraftFieldPath[] => {
  if (target.kind === 'reference' || target.kind === 'snippet') return ['what'];
  if (target.kind === 'token') {
    const atom = library.atoms.find((item) => item.id === target.recordId);
    return atom ? ['what', pathForAxis(atom.axisId), 'preset'] : ['what'];
  }
  if (target.kind === 'edit') return library.editRecipes.some((item) => item.id === target.recordId)
    ? ['what', pathForRecipe(target.recordId)]
    : ['what'];
  const preset = library.presets.find((item) => item.id === target.recordId);
  if (!preset) return ['what'];
  const previousPresetAxes = draft.choices
    .filter((choice) => choice.source === 'preset' && choice.presetId === draft.activePresetId)
    .map((choice) => pathForAxis(choice.axisId));
  return unique<DraftFieldPath>([
    'what',
    'preset',
    ...(preset?.scopeAxisIds ?? []).map(pathForAxis),
    ...previousPresetAxes,
  ]);
};

export const touchedPathsForQuickAddCommand = (
  library: LibraryV2,
  draft: CueDraft,
  input: QuickAddInput,
): readonly DraftFieldPath[] => touchedPathsForTarget(library, draft, targetFor(acceptanceFor(input)));

const validateRevisionPreconditions = (
  library: LibraryV2,
  draft: CueDraft,
  input: QuickAddInput,
  options: QuickAddApplyOptions,
): DraftCommandResult | undefined => {
  const expected = expectedRevisionsFor(input);
  if (!expected) return undefined;
  const touchedPaths = touchedPathsForQuickAddCommand(library, draft, input);
  for (const path of touchedPaths) {
    const expectedRevision = expected[path];
    if (expectedRevision === undefined) return failure('REVISION_CONFLICT', `Expected revision for ${path} is required.`, path);
    const currentRevision = options.currentFieldRevisions?.[path];
    if (currentRevision !== undefined && currentRevision !== expectedRevision) {
      return failure('REVISION_CONFLICT', `The ${path} value changed in another window.`, path);
    }
  }
  return undefined;
};

const validateQuery = (draft: CueDraft, acceptance: QuickAddAcceptance): DraftCommandResult | undefined => {
  if (acceptance.expectedWhat !== draft.what) return failure('INVALID_QUERY', 'WHAT changed before this quick add was accepted.', 'what');
  const { start, end } = acceptance.queryRange;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > acceptance.expectedWhat.length || start === end) {
    return failure('INVALID_QUERY', 'The quick-add range is outside the current WHAT text.', 'what');
  }
  if (acceptance.expectedWhat.slice(start, end) !== acceptance.queryText) {
    return failure('INVALID_QUERY', 'The quick-add query no longer matches its exact WHAT range.', 'what');
  }
  return undefined;
};

const literalSnippetFor = (library: LibraryV2, draft: CueDraft, recordId: string): string | undefined => {
  const atom = library.atoms.find((item) => item.id === recordId);
  if (atom) {
    if (atom.status !== 'active' || !atom.applicability.includes(draft.id)) return undefined;
    return atom.expansion;
  }
  const recipe = library.editRecipes.find((item) => item.id === recordId);
  if (!recipe || recipe.status !== 'active' || recipe.segments.some((segment) => !('text' in segment))) return undefined;
  return recipe.segments.map((segment) => 'text' in segment ? segment.text : '').join('');
};

const applyToken = (library: LibraryV2, draft: CueDraft, recordId: string): DraftCommandResult => {
  const atom = library.atoms.find((item) => item.id === recordId);
  if (!atom || atom.status !== 'active') return failure('UNKNOWN_TARGET', `Unknown active token: ${recordId}.`);
  if (!atom.applicability.includes(draft.id)) return failure('INCOMPATIBLE_TARGET', `Token ${recordId} is not available in ${draft.id}.`);
  const axis = library.axes.find((item) => item.id === atom.axisId);
  if (!axis) return failure('UNKNOWN_TARGET', `Token ${recordId} points to an unknown axis.`);
  const current = draft.choices.find((choice) => choice.axisId === atom.axisId);
  const requestedAtomIds = axis.cardinality === 'one'
    ? [atom.id]
    : unique([...(current?.atomIds ?? []), atom.id]);
  return selectAxis(library, draft, atom.axisId, requestedAtomIds, false);
};

const applySemanticTarget = (library: LibraryV2, draft: CueDraft, target: QuickAddTarget): { readonly result: DraftCommandResult; readonly replacement: string } => {
  switch (target.kind) {
    case 'preset': {
      const preset = library.presets.find((item) => item.id === target.recordId);
      if (!preset || preset.status !== 'active') return { result: failure('UNKNOWN_TARGET', `Unknown active preset: ${target.recordId}.`), replacement: '' };
      if (!preset.applicability.includes(draft.id)) return { result: failure('INCOMPATIBLE_TARGET', `Preset ${target.recordId} is not available in ${draft.id}.`), replacement: '' };
      return { result: applyPreset(library, draft, preset.id), replacement: '' };
    }
    case 'token':
      return { result: applyToken(library, draft, target.recordId), replacement: '' };
    case 'edit': {
      const recipe = library.editRecipes.find((item) => item.id === target.recordId);
      if (!recipe || recipe.status !== 'active') return { result: failure('UNKNOWN_TARGET', `Unknown active edit recipe: ${target.recordId}.`), replacement: '' };
      if (draft.id !== 'edit') return { result: failure('INCOMPATIBLE_TARGET', 'Edit recipes are available only in the Edit draft.'), replacement: '' };
      return { result: selectRecipe(library, draft, recipe.id), replacement: '' };
    }
    case 'snippet': {
      const text = literalSnippetFor(library, draft, target.recordId);
      if (text === undefined) return { result: failure('UNKNOWN_TARGET', `Unknown active literal snippet: ${target.recordId}.`), replacement: '' };
      return { result: { ok: true, value: { draft, touchedPaths: [] } }, replacement: text };
    }
    case 'reference': {
      if (!Number.isInteger(target.imageNumber) || target.imageNumber < 1 || target.imageNumber > 20) return { result: failure('INVALID_REFERENCE', 'Reference image number must be between 1 and 20.'), replacement: '' };
      if (draft.id === 'edit' && !draft.references.some((reference) => reference.imageNumber === target.imageNumber)) return { result: failure('INCOMPATIBLE_TARGET', `Image ${target.imageNumber} is not registered in the Edit draft.`), replacement: '' };
      return { result: { ok: true, value: { draft, touchedPaths: [] } }, replacement: `Image ${target.imageNumber}` };
    }
  }
};

const finishMutation = (
  draft: CueDraft,
  result: DraftCommandResult,
  acceptance: QuickAddAcceptance,
  replacement: string,
  touchedPaths: readonly DraftFieldPath[],
): DraftCommandResult => {
  if (!result.ok) return result;
  const { start, end } = acceptance.queryRange;
  const what = `${draft.what.slice(0, start)}${replacement}${draft.what.slice(end)}`;
  return {
    ok: true,
    value: {
      draft: { ...result.value.draft, what, revision: draft.revision + 1 },
      touchedPaths: unique<DraftFieldPath>(touchedPaths),
    },
  };
};

export const applyQuickAddCommand = (
  library: LibraryV2,
  draft: CueDraft,
  input: QuickAddInput,
  options: QuickAddApplyOptions = {},
): DraftCommandResult => {
  if (isEnvelope(input)) {
    const validated = validateQuickAddCommand(input);
    if (!validated.ok) return failure('INVALID_QUERY', validated.errors.map((error) => `${error.path}: ${error.message}`).join(' '));
    if (input.draftId !== draft.id) return failure('INCOMPATIBLE_TARGET', 'The quick-add command belongs to another draft mode.', 'what');
  }
  const acceptance = acceptanceFor(input);
  if (acceptance.expectedContentVersion !== library.contentVersion) return failure('STALE_CONTENT', 'The library changed. Refresh quick-add results before accepting.', 'what');
  const draftValidation = validateCueDraft(draft, library);
  if (!draftValidation.ok) return failure('INVALID_DRAFT', draftValidation.errors.map((error) => `${error.path}: ${error.message}`).join(' '));
  const queryIssue = validateQuery(draft, acceptance);
  if (queryIssue) return queryIssue;
  const revisionIssue = validateRevisionPreconditions(library, draft, input, options);
  if (revisionIssue) return revisionIssue;
  const touchedPaths = touchedPathsForQuickAddCommand(library, draft, input);
  const { result, replacement } = applySemanticTarget(library, draft, targetFor(acceptance));
  return finishMutation(draft, result, acceptance, replacement, touchedPaths);
};

export const applyQuickAddEnvelope = (
  library: LibraryV2,
  draft: CueDraft,
  envelope: QuickAddCommandEnvelope,
  currentFieldRevisions?: Readonly<Record<string, number>>,
): DraftCommandResult => applyQuickAddCommand(library, draft, envelope, { currentFieldRevisions });

export const applyAcceptQuickAdd = applyQuickAddCommand;
