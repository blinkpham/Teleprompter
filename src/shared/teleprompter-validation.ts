import type {
  Atom,
  Axis,
  AxisChoice,
  BridgeError,
  CueCommand,
  CueDraft,
  Domain,
  DraftCommandEnvelope,
  EditRecipe,
  Field,
  LibraryV2,
  Mode,
  Preset,
  ReferenceBindingEnvelope,
  ReferenceBindingsRequest,
  QuickAddCommandEnvelope,
  SurfaceLayoutRequest,
  ReferenceRole,
  Source,
  Taxon,
} from './teleprompter-types';

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ValidationIssue[] };

const FIELDS: readonly Field[] = ['cam', 'angle', 'comp', 'light', 'look', 'mood', 'important', 'avoid', 'output'];
const MODES: readonly Mode[] = ['create', 'edit'];
const DOMAINS: readonly Domain[] = ['identity', 'pose', 'wardrobe', 'camera', 'composition', 'background', 'lighting', 'style', 'color', 'detail', 'output'];
const ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const CONTENT_VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}\.\d+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SURFACE_SESSION_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const OPAQUE_HANDLE_PATTERN = /^[A-Za-z0-9._:-]{1,512}$/;
const SURFACE_LAYOUT_MAX_DIMENSION = 2000;
const TEXT_RANGE_MAX = 10000;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNonEmptyString = (value: unknown): value is string => isString(value) && value.trim().length > 0;
const isInteger = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value);
const isNonNegativeInteger = (value: unknown): value is number => isInteger(value) && value >= 0;
const isStringArray = (value: unknown): value is readonly string[] => Array.isArray(value) && value.every(isString);
const isId = (value: unknown): value is string => isString(value) && ID_PATTERN.test(value);
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => Object.keys(value).every((key) => keys.includes(key));
const unique = (values: readonly string[]): boolean => new Set(values).size === values.length;
const includes = <T extends string>(values: readonly T[], value: unknown): value is T => values.includes(value as T);

const issue = (path: string, message: string): ValidationIssue => ({ path, message });
const ok = <T>(value: T): ValidationResult<T> => ({ ok: true, value });
const fail = <T>(path: string, message: string): ValidationResult<T> => ({ ok: false, errors: [issue(path, message)] });

const validateStringArray = (value: unknown, path: string, nonEmpty = false): readonly ValidationIssue[] => {
  if (!Array.isArray(value) || !value.every(isString)) return [issue(path, 'Expected an array of strings.')];
  if (nonEmpty && value.length === 0) return [issue(path, 'Expected at least one value.')];
  return [];
};

const validateIdArray = (value: unknown, path: string, nonEmpty = false): readonly ValidationIssue[] => {
  const errors = validateStringArray(value, path, nonEmpty);
  if (errors.length > 0) return errors;
  const ids = value as readonly string[];
  return [
    ...(ids.every(isId) ? [] : [issue(path, 'Every ID must be lowercase and namespaced.')]),
    ...(unique(ids) ? [] : [issue(path, 'IDs must be unique.')]),
  ];
};

const validateTaxon = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a taxon object.')];
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(value, ['id', 'tree', 'parentId', 'label', 'definition', 'inclusion', 'exclusion', 'order'])) errors.push(issue(path, 'Unknown taxon property.'));
  if (!isId(value.id)) errors.push(issue(`${path}.id`, 'Taxon ID is invalid.'));
  if (!includes(['units', 'presets', 'edits'], value.tree)) errors.push(issue(`${path}.tree`, 'Taxon tree is invalid.'));
  if (value.parentId !== undefined && !isId(value.parentId)) errors.push(issue(`${path}.parentId`, 'Parent taxon ID is invalid.'));
  for (const key of ['label', 'definition', 'inclusion', 'exclusion']) if (!isString(value[key])) errors.push(issue(`${path}.${key}`, 'Expected text.'));
  if (!isInteger(value.order)) errors.push(issue(`${path}.order`, 'Order must be an integer.'));
  return errors;
};

const validateAxis = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected an axis object.')];
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(value, ['id', 'field', 'label', 'cardinality', 'domain', 'order'])) errors.push(issue(path, 'Unknown axis property.'));
  if (!isId(value.id)) errors.push(issue(`${path}.id`, 'Axis ID is invalid.'));
  if (!includes(FIELDS, value.field)) errors.push(issue(`${path}.field`, 'Axis field is invalid.'));
  if (!isString(value.label)) errors.push(issue(`${path}.label`, 'Axis label must be text.'));
  if (!includes(['one', 'many'], value.cardinality)) errors.push(issue(`${path}.cardinality`, 'Axis cardinality is invalid.'));
  if (!includes(DOMAINS, value.domain)) errors.push(issue(`${path}.domain`, 'Axis domain is invalid.'));
  if (!isInteger(value.order)) errors.push(issue(`${path}.order`, 'Order must be an integer.'));
  return errors;
};

const validateCommonRecord = (value: Record<string, unknown>, path: string): ValidationIssue[] => {
  const errors: ValidationIssue[] = [];
  for (const key of ['id', 'label', 'shorthand', 'summary', 'primaryTaxonId']) {
    const valid = key === 'id' || key === 'primaryTaxonId' ? isId(value[key]) : isString(value[key]);
    if (!valid) errors.push(issue(`${path}.${key}`, key === 'id' || key === 'primaryTaxonId' ? 'Expected a valid ID.' : 'Expected text.'));
  }
  if (!Array.isArray(value.aliases) || !value.aliases.every(isString) || !unique(value.aliases as string[])) errors.push(issue(`${path}.aliases`, 'Aliases must be a unique string array.'));
  if (!isRecord(value.facets) || Object.values(value.facets).some((facet) => !isStringArray(facet) || !unique(facet))) errors.push(issue(`${path}.facets`, 'Facets must map to unique string arrays.'));
  errors.push(...validateIdArray(value.sourceIds, `${path}.sourceIds`));
  errors.push(...validateIdArray(value.cautionIds, `${path}.cautionIds`));
  if (!isInteger(value.order)) errors.push(issue(`${path}.order`, 'Order must be an integer.'));
  if (!includes(['active', 'deprecated'], value.status)) errors.push(issue(`${path}.status`, 'Record status is invalid.'));
  if (value.replacedBy !== undefined && !isId(value.replacedBy)) errors.push(issue(`${path}.replacedBy`, 'Replacement ID is invalid.'));
  if (value.previewAssetId !== undefined && !isId(value.previewAssetId)) errors.push(issue(`${path}.previewAssetId`, 'Preview asset ID is invalid.'));
  return errors;
};

const validateAtom = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected an atom object.')];
  const errors = validateCommonRecord(value, path);
  if (!hasOnlyKeys(value, ['kind', 'id', 'label', 'shorthand', 'aliases', 'summary', 'primaryTaxonId', 'facets', 'sourceIds', 'cautionIds', 'order', 'status', 'replacedBy', 'previewAssetId', 'axisId', 'expansion', 'excludes', 'requires', 'applicability'])) errors.push(issue(path, 'Unknown atom property.'));
  if (value.kind !== 'atom') errors.push(issue(`${path}.kind`, 'Record kind must be atom.'));
  if (!isId(value.axisId)) errors.push(issue(`${path}.axisId`, 'Axis ID is invalid.'));
  if (!isString(value.expansion) || value.expansion.trim().length === 0 || /;\s*$/.test(value.expansion)) errors.push(issue(`${path}.expansion`, 'Expansion must be a non-empty direction without a terminal semicolon.'));
  errors.push(...validateIdArray(value.excludes, `${path}.excludes`));
  errors.push(...validateIdArray(value.requires, `${path}.requires`));
  if (!Array.isArray(value.applicability) || value.applicability.length === 0 || !value.applicability.every((mode) => includes(MODES, mode)) || !unique(value.applicability as string[])) errors.push(issue(`${path}.applicability`, 'Applicability must contain unique create/edit modes.'));
  return errors;
};

const validateBundle = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a bundle object.')];
  const errors = validateCommonRecord(value, path);
  if (!hasOnlyKeys(value, ['kind', 'id', 'label', 'shorthand', 'aliases', 'summary', 'primaryTaxonId', 'facets', 'sourceIds', 'cautionIds', 'order', 'status', 'replacedBy', 'previewAssetId', 'atomIds'])) errors.push(issue(path, 'Unknown bundle property.'));
  if (value.kind !== 'bundle') errors.push(issue(`${path}.kind`, 'Record kind must be bundle.'));
  errors.push(...validateIdArray(value.atomIds, `${path}.atomIds`, true));
  return errors;
};

const validatePreset = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a preset object.')];
  const errors = validateCommonRecord(value, path);
  if (!hasOnlyKeys(value, ['kind', 'id', 'label', 'shorthand', 'aliases', 'summary', 'primaryTaxonId', 'facets', 'sourceIds', 'cautionIds', 'order', 'status', 'replacedBy', 'previewAssetId', 'atomIds', 'scopeAxisIds', 'applicability'])) errors.push(issue(path, 'Unknown preset property.'));
  if (value.kind !== 'preset') errors.push(issue(`${path}.kind`, 'Record kind must be preset.'));
  errors.push(...validateIdArray(value.atomIds, `${path}.atomIds`, true));
  errors.push(...validateIdArray(value.scopeAxisIds, `${path}.scopeAxisIds`, true));
  if (!Array.isArray(value.applicability) || value.applicability.length === 0 || !value.applicability.every((mode) => includes(MODES, mode)) || !unique(value.applicability as string[])) errors.push(issue(`${path}.applicability`, 'Applicability must contain unique create/edit modes.'));
  return errors;
};

const validateEditRecipe = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected an edit recipe object.')];
  const errors = validateCommonRecord(value, path);
  if (!hasOnlyKeys(value, ['kind', 'id', 'label', 'shorthand', 'aliases', 'summary', 'primaryTaxonId', 'facets', 'sourceIds', 'cautionIds', 'order', 'status', 'replacedBy', 'previewAssetId', 'operation', 'affectedDomains', 'requiredPreservedDomains', 'slotKeys', 'segments', 'allowedFields', 'excludesRecipeIds'])) errors.push(issue(path, 'Unknown edit recipe property.'));
  if (value.kind !== 'edit-recipe') errors.push(issue(`${path}.kind`, 'Record kind must be edit-recipe.'));
  if (!isNonEmptyString(value.operation)) errors.push(issue(`${path}.operation`, 'Operation must be non-empty text.'));
  for (const key of ['affectedDomains', 'requiredPreservedDomains']) {
    if (!Array.isArray(value[key]) || !value[key].every((domain) => includes(DOMAINS, domain)) || !unique(value[key] as string[])) errors.push(issue(`${path}.${key}`, 'Domains must be unique known values.'));
  }
  errors.push(...validateStringArray(value.slotKeys, `${path}.slotKeys`));
  if (Array.isArray(value.slotKeys) && !unique(value.slotKeys as string[])) errors.push(issue(`${path}.slotKeys`, 'Slot keys must be unique.'));
  if (!Array.isArray(value.segments) || value.segments.some((segment) => {
    if (!isRecord(segment) || !hasOnlyKeys(segment, 'text' in segment ? ['text'] : ['slot', 'placeholder'])) return true;
    if ('text' in segment) return !isString(segment.text);
    return !isNonEmptyString(segment.slot) || !isString(segment.placeholder);
  })) errors.push(issue(`${path}.segments`, 'Segments must be text or slot objects.'));
  if (!Array.isArray(value.allowedFields) || !value.allowedFields.every((field) => includes(FIELDS, field)) || !unique(value.allowedFields as string[])) errors.push(issue(`${path}.allowedFields`, 'Allowed fields must be unique known fields.'));
  errors.push(...validateIdArray(value.excludesRecipeIds, `${path}.excludesRecipeIds`));
  return errors;
};

const validateSource = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a source object.')];
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(value, ['id', 'kind', 'title', 'locator', 'author', 'accessedOn', 'basis', 'evidenceNote', 'reuse'])) errors.push(issue(path, 'Unknown source property.'));
  if (!isId(value.id)) errors.push(issue(`${path}.id`, 'Source ID is invalid.'));
  if (!includes(['local', 'web', 'user', 'curator'], value.kind)) errors.push(issue(`${path}.kind`, 'Source kind is invalid.'));
  for (const key of ['title', 'locator', 'evidenceNote']) if (!isString(value[key])) errors.push(issue(`${path}.${key}`, 'Expected text.'));
  if (value.author !== undefined && !isString(value.author)) errors.push(issue(`${path}.author`, 'Author must be text.'));
  if (value.accessedOn !== undefined && (!isString(value.accessedOn) || !DATE_PATTERN.test(value.accessedOn))) errors.push(issue(`${path}.accessedOn`, 'Access date must use YYYY-MM-DD.'));
  if (!includes(['source-description', 'source-prompt', 'user-source', 'curator-composition'], value.basis)) errors.push(issue(`${path}.basis`, 'Source basis is invalid.'));
  if (!includes(['paraphrase-only', 'permission-recorded', 'user-provided', 'original'], value.reuse)) errors.push(issue(`${path}.reuse`, 'Reuse status is invalid.'));
  return errors;
};

const validateReferenceRole = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a reference role object.')];
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(value, ['imageNumber', 'role', 'note'])) errors.push(issue(path, 'Unknown reference role property.'));
  if (!isInteger(value.imageNumber) || value.imageNumber < 1 || value.imageNumber > 20) errors.push(issue(`${path}.imageNumber`, 'Image number must be between 1 and 20.'));
  if (!includes(['base', 'identity', 'pose', 'product', 'style', 'palette', 'lighting', 'background', 'geometry', 'custom'], value.role)) errors.push(issue(`${path}.role`, 'Reference role is invalid.'));
  if (!isString(value.note)) errors.push(issue(`${path}.note`, 'Reference note must be text.'));
  return errors;
};

const validateTextRange = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a text range object.')];
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(value, ['start', 'end'])) errors.push(issue(path, 'Unknown text range property.'));
  if (!isInteger(value.start) || value.start < 0 || value.start > TEXT_RANGE_MAX) errors.push(issue(`${path}.start`, 'Range start must be a bounded non-negative integer.'));
  if (!isInteger(value.end) || value.end < 0 || value.end > TEXT_RANGE_MAX) errors.push(issue(`${path}.end`, 'Range end must be a bounded non-negative integer.'));
  if (isInteger(value.start) && isInteger(value.end) && value.end < value.start) errors.push(issue(path, 'Range end must not precede range start.'));
  return errors;
};

const validateQuickAddTarget = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a quick-add target object.')];
  const errors: ValidationIssue[] = [];
  if (value.kind === 'reference') {
    if (!hasOnlyKeys(value, ['kind', 'imageNumber'])) errors.push(issue(path, 'Unknown reference quick-add target property.'));
    if (!isInteger(value.imageNumber) || value.imageNumber < 1 || value.imageNumber > 20) errors.push(issue(`${path}.imageNumber`, 'Image number must be between 1 and 20.'));
    return errors;
  }
  if (!includes(['preset', 'token', 'edit', 'snippet'], value.kind)) {
    errors.push(issue(`${path}.kind`, 'Quick-add target kind is invalid.'));
  }
  if (!hasOnlyKeys(value, ['kind', 'recordId'])) errors.push(issue(path, 'Unknown quick-add target property.'));
  if (!isId(value.recordId)) errors.push(issue(`${path}.recordId`, 'Quick-add record ID is invalid.'));
  return errors;
};

const validateQuickAddAcceptance = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a quick-add acceptance object.')];
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(value, ['target', 'queryRange', 'queryText', 'expectedWhat', 'expectedContentVersion'])) errors.push(issue(path, 'Unknown quick-add acceptance property.'));
  errors.push(...validateQuickAddTarget(value.target, `${path}.target`));
  errors.push(...validateTextRange(value.queryRange, `${path}.queryRange`));
  if (!isString(value.queryText) || value.queryText.length > 120) errors.push(issue(`${path}.queryText`, 'Quick-add query must be text of at most 120 characters.'));
  if (!isString(value.expectedWhat) || value.expectedWhat.length > TEXT_RANGE_MAX) errors.push(issue(`${path}.expectedWhat`, 'Expected WHAT must be bounded text.'));
  if (!isString(value.expectedContentVersion) || !CONTENT_VERSION_PATTERN.test(value.expectedContentVersion)) errors.push(issue(`${path}.expectedContentVersion`, 'Content version is invalid.'));
  return errors;
};

const validateReferenceBinding = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a reference binding object.')];
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(value, ['bindingId', 'draftId', 'imageNumber', 'label', 'thumbnailHandle'])) errors.push(issue(path, 'Unknown reference binding property.'));
  if (!isNonEmptyString(value.bindingId) || value.bindingId.length > 128) errors.push(issue(`${path}.bindingId`, 'Binding ID must be bounded non-empty text.'));
  if (!includes(MODES, value.draftId)) errors.push(issue(`${path}.draftId`, 'Binding draft ID is invalid.'));
  if (!isInteger(value.imageNumber) || value.imageNumber < 1 || value.imageNumber > 20) errors.push(issue(`${path}.imageNumber`, 'Image number must be between 1 and 20.'));
  if (!isNonEmptyString(value.label) || value.label.length > 200) errors.push(issue(`${path}.label`, 'Binding label must be bounded non-empty text.'));
  if (value.thumbnailHandle !== undefined && (!isString(value.thumbnailHandle) || !OPAQUE_HANDLE_PATTERN.test(value.thumbnailHandle))) errors.push(issue(`${path}.thumbnailHandle`, 'Thumbnail handle must be an opaque handle, not a path.'));
  return errors;
};

const validateAxisChoice = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected an axis choice object.')];
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(value, ['axisId', 'atomIds', 'source', 'presetId', 'pinnedBlank'])) errors.push(issue(path, 'Unknown axis choice property.'));
  if (!isId(value.axisId)) errors.push(issue(`${path}.axisId`, 'Axis ID is invalid.'));
  errors.push(...validateIdArray(value.atomIds, `${path}.atomIds`));
  if (!includes(['manual', 'preset'], value.source)) errors.push(issue(`${path}.source`, 'Axis choice source is invalid.'));
  if (value.presetId !== undefined && !isId(value.presetId)) errors.push(issue(`${path}.presetId`, 'Preset ID is invalid.'));
  if (typeof value.pinnedBlank !== 'boolean') errors.push(issue(`${path}.pinnedBlank`, 'Pinned blank must be boolean.'));
  return errors;
};

const validateRecipeChoice = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a recipe choice object.')];
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(value, ['recipeId', 'slots'])) errors.push(issue(path, 'Unknown recipe choice property.'));
  if (!isId(value.recipeId)) errors.push(issue(`${path}.recipeId`, 'Recipe ID is invalid.'));
  if (!isRecord(value.slots) || Object.values(value.slots).some((slot) => !isString(slot))) errors.push(issue(`${path}.slots`, 'Slots must map to text.'));
  return errors;
};

const validateDraftShape = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value)) return [issue(path, 'Expected a CueDraft object.')];
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(value, ['schemaVersion', 'id', 'revision', 'libraryVersion', 'what', 'choices', 'customText', 'activePresetId', 'edits', 'references', 'manualUnlocks', 'outputFormat'])) errors.push(issue(path, 'Unknown draft property.'));
  if (value.schemaVersion !== 1) errors.push(issue(`${path}.schemaVersion`, 'Draft schemaVersion must be 1.'));
  if (!includes(MODES, value.id)) errors.push(issue(`${path}.id`, 'Draft mode is invalid.'));
  if (!isNonNegativeInteger(value.revision)) errors.push(issue(`${path}.revision`, 'Revision must be a non-negative integer.'));
  if (!isString(value.libraryVersion)) errors.push(issue(`${path}.libraryVersion`, 'Library version must be text.'));
  if (!isString(value.what)) errors.push(issue(`${path}.what`, 'WHAT must be text.'));
  if (!Array.isArray(value.choices)) errors.push(issue(`${path}.choices`, 'Choices must be an array.'));
  else {
    errors.push(...value.choices.flatMap((choice, index) => validateAxisChoice(choice, `${path}.choices[${index}]`)));
    const axisIds = value.choices.filter(isRecord).map((choice) => choice.axisId).filter(isString);
    if (!unique(axisIds)) errors.push(issue(`${path}.choices`, 'Only one choice per axis is allowed.'));
  }
  if (!isRecord(value.customText) || Object.entries(value.customText).some(([field, text]) => !includes(FIELDS, field) || !isString(text))) errors.push(issue(`${path}.customText`, 'Custom text must use known fields and text values.'));
  if (value.activePresetId !== undefined && !isId(value.activePresetId)) errors.push(issue(`${path}.activePresetId`, 'Active preset ID is invalid.'));
  if (!Array.isArray(value.edits)) errors.push(issue(`${path}.edits`, 'Edits must be an array.'));
  else errors.push(...value.edits.flatMap((choice, index) => validateRecipeChoice(choice, `${path}.edits[${index}]`)));
  if (!Array.isArray(value.references)) errors.push(issue(`${path}.references`, 'References must be an array.'));
  else {
    errors.push(...value.references.flatMap((reference, index) => validateReferenceRole(reference, `${path}.references[${index}]`)));
    const imageNumbers = value.references.filter(isRecord).map((reference) => reference.imageNumber).filter(isInteger);
    if (!unique(imageNumbers.map(String))) errors.push(issue(`${path}.references`, 'Image numbers must be unique.'));
    const baseCount = value.references.filter(isRecord).filter((reference) => reference.role === 'base').length;
    if (baseCount > 1) errors.push(issue(`${path}.references`, 'At most one base reference is allowed.'));
  }
  if (!Array.isArray(value.manualUnlocks) || !value.manualUnlocks.every((domain) => includes(DOMAINS, domain)) || !unique(value.manualUnlocks as string[])) errors.push(issue(`${path}.manualUnlocks`, 'Manual unlocks must be unique known domains.'));
  if (!includes(['expanded', 'shorthand'], value.outputFormat)) errors.push(issue(`${path}.outputFormat`, 'Output format is invalid.'));
  if (value.id === 'create') {
    if (Array.isArray(value.edits) && value.edits.length > 0) errors.push(issue(`${path}.edits`, 'Create drafts cannot contain edit recipes.'));
    if (Array.isArray(value.references) && value.references.length > 0) errors.push(issue(`${path}.references`, 'Create drafts cannot contain reference roles.'));
    if (Array.isArray(value.manualUnlocks) && value.manualUnlocks.length > 0) errors.push(issue(`${path}.manualUnlocks`, 'Create drafts cannot contain manual unlocks.'));
  }
  return errors;
};

const validateDraftAgainstLibrary = (draft: CueDraft, library: LibraryV2, path: string): readonly ValidationIssue[] => {
  const errors: ValidationIssue[] = [];
  const axes = new Map(library.axes.map((axis) => [axis.id, axis]));
  const atoms = new Map(library.atoms.map((atom) => [atom.id, atom]));
  const presets = new Map(library.presets.map((preset) => [preset.id, preset]));
  const recipes = new Map(library.editRecipes.map((recipe) => [recipe.id, recipe]));
  if (draft.libraryVersion !== library.contentVersion) errors.push(issue(`${path}.libraryVersion`, 'Draft library version does not match the loaded library.'));
  if (draft.activePresetId !== undefined) {
    const preset = presets.get(draft.activePresetId);
    if (!preset) errors.push(issue(`${path}.activePresetId`, 'Active preset does not exist.'));
    else if (!preset.applicability.includes(draft.id)) errors.push(issue(`${path}.activePresetId`, 'Preset is not valid for this mode.'));
  }
  draft.choices.forEach((choice, index) => {
    const axis = axes.get(choice.axisId);
    if (!axis) {
      errors.push(issue(`${path}.choices[${index}].axisId`, 'Axis does not exist.'));
      return;
    }
    if (axis.cardinality === 'one' && choice.atomIds.length > 1) errors.push(issue(`${path}.choices[${index}].atomIds`, 'Single-valued axes accept one atom.'));
    choice.atomIds.forEach((atomId) => {
      const atom = atoms.get(atomId);
      if (!atom) errors.push(issue(`${path}.choices[${index}].atomIds`, `Atom ${atomId} does not exist.`));
      else {
        if (atom.axisId !== axis.id) errors.push(issue(`${path}.choices[${index}].atomIds`, `Atom ${atomId} belongs to another axis.`));
        if (!atom.applicability.includes(draft.id)) errors.push(issue(`${path}.choices[${index}].atomIds`, `Atom ${atomId} is not valid for ${draft.id}.`));
      }
    });
    if (choice.source === 'preset' && choice.presetId !== undefined) {
      const preset = presets.get(choice.presetId);
      if (!preset) errors.push(issue(`${path}.choices[${index}].presetId`, 'Choice preset does not exist.'));
      else if (!preset.scopeAxisIds.includes(axis.id)) errors.push(issue(`${path}.choices[${index}].presetId`, 'Preset does not own this axis.'));
    }
  });
  draft.edits.forEach((choice, index) => {
    const recipe = recipes.get(choice.recipeId);
    if (!recipe) errors.push(issue(`${path}.edits[${index}].recipeId`, 'Edit recipe does not exist.'));
    else Object.keys(choice.slots).forEach((slot) => {
      if (!recipe.slotKeys.includes(slot)) errors.push(issue(`${path}.edits[${index}].slots.${slot}`, 'Slot is not defined by the recipe.'));
    });
  });
  return errors;
};

export function validateLibrary(input: unknown): ValidationResult<LibraryV2> {
  if (!isRecord(input)) return fail('library', 'Expected a LibraryV2 object.');
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(input, ['schemaVersion', 'contentVersion', 'taxa', 'axes', 'atoms', 'bundles', 'presets', 'editRecipes', 'sources', 'cautions', 'legacyMap'])) errors.push(issue('library', 'Unknown LibraryV2 property.'));
  if (input.schemaVersion !== 2) errors.push(issue('library.schemaVersion', 'Library schemaVersion must be 2.'));
  if (!isString(input.contentVersion) || !CONTENT_VERSION_PATTERN.test(input.contentVersion)) errors.push(issue('library.contentVersion', 'Content version must use YYYY-MM-DD.N.'));
  const arrays = ['taxa', 'axes', 'atoms', 'bundles', 'presets', 'editRecipes', 'sources', 'cautions', 'legacyMap'] as const;
  arrays.forEach((key) => { if (!Array.isArray(input[key])) errors.push(issue(`library.${key}`, 'Expected an array.')); });
  if (Array.isArray(input.taxa)) errors.push(...input.taxa.flatMap((value, index) => validateTaxon(value, `library.taxa[${index}]`)));
  if (Array.isArray(input.axes)) errors.push(...input.axes.flatMap((value, index) => validateAxis(value, `library.axes[${index}]`)));
  if (Array.isArray(input.atoms)) errors.push(...input.atoms.flatMap((value, index) => validateAtom(value, `library.atoms[${index}]`)));
  if (Array.isArray(input.bundles)) errors.push(...input.bundles.flatMap((value, index) => validateBundle(value, `library.bundles[${index}]`)));
  if (Array.isArray(input.presets)) errors.push(...input.presets.flatMap((value, index) => validatePreset(value, `library.presets[${index}]`)));
  if (Array.isArray(input.editRecipes)) errors.push(...input.editRecipes.flatMap((value, index) => validateEditRecipe(value, `library.editRecipes[${index}]`)));
  if (Array.isArray(input.sources)) errors.push(...input.sources.flatMap((value, index) => validateSource(value, `library.sources[${index}]`)));
  if (Array.isArray(input.cautions)) errors.push(...input.cautions.flatMap((value, index) => {
    if (!isRecord(value) || !hasOnlyKeys(value, ['id', 'text'])) return [issue(`library.cautions[${index}]`, 'Caution must contain only id and text.')];
    return [...(!isId(value.id) ? [issue(`library.cautions[${index}].id`, 'Caution ID is invalid.')] : []), ...(!isString(value.text) ? [issue(`library.cautions[${index}].text`, 'Caution text must be text.')] : [])];
  }));
  if (Array.isArray(input.legacyMap)) errors.push(...input.legacyMap.flatMap((value, index) => {
    const path = `library.legacyMap[${index}]`;
    if (!isRecord(value) || !hasOnlyKeys(value, ['oldId', 'oldToken', 'disposition', 'targetIds', 'reason'])) return [issue(path, 'Legacy map entry is invalid.')];
    return [
      ...(!isString(value.oldId) ? [issue(`${path}.oldId`, 'Legacy ID must be text.')] : []),
      ...(!isString(value.oldToken) ? [issue(`${path}.oldToken`, 'Legacy token must be text.')] : []),
      ...(!includes(['retained', 'alias', 'split', 'deprecated', 'reference-only'], value.disposition) ? [issue(`${path}.disposition`, 'Legacy disposition is invalid.')] : []),
      ...validateIdArray(value.targetIds, `${path}.targetIds`),
      ...(!isString(value.reason) ? [issue(`${path}.reason`, 'Legacy reason must be text.')] : []),
    ];
  }));
  const ids = [
    ...(Array.isArray(input.taxa) ? input.taxa : []),
    ...(Array.isArray(input.axes) ? input.axes : []),
    ...(Array.isArray(input.atoms) ? input.atoms : []),
    ...(Array.isArray(input.bundles) ? input.bundles : []),
    ...(Array.isArray(input.presets) ? input.presets : []),
    ...(Array.isArray(input.editRecipes) ? input.editRecipes : []),
    ...(Array.isArray(input.cautions) ? input.cautions : []),
  ].filter(isRecord).map((record) => record.id).filter(isString);
  if (!unique(ids)) errors.push(issue('library', 'IDs must be unique across library records.'));
  const idSet = new Set(ids);
  const sourceIds = (Array.isArray(input.sources) ? input.sources : []).filter(isRecord).map((source) => source.id).filter(isString);
  if (!unique(sourceIds)) errors.push(issue('library.sources', 'Source IDs must be unique.'));
  const sourceSet = new Set(sourceIds);
  const cautions = (Array.isArray(input.cautions) ? input.cautions : []).filter(isRecord).map((caution) => caution.id).filter(isString);
  const cautionSet = new Set(cautions);
  const axisMap = new Map((Array.isArray(input.axes) ? input.axes : []).filter(isRecord).map((axis) => [axis.id, axis]));
  const atomIds = new Set((Array.isArray(input.atoms) ? input.atoms : []).filter(isRecord).map((atom) => atom.id).filter(isString));
  const recipeIds = new Set((Array.isArray(input.editRecipes) ? input.editRecipes : []).filter(isRecord).map((recipe) => recipe.id).filter(isString));
  const taxonMap = new Map((Array.isArray(input.taxa) ? input.taxa : []).filter(isRecord).map((taxon) => [taxon.id, taxon]));
  (Array.isArray(input.taxa) ? input.taxa : []).filter(isRecord).forEach((taxon, index) => {
    if (taxon.parentId !== undefined && !taxonMap.has(taxon.parentId)) errors.push(issue(`library.taxa[${index}].parentId`, 'Parent taxon does not exist.'));
    if (taxon.parentId !== undefined && isString(taxon.parentId)) {
      const parent = taxonMap.get(taxon.parentId);
      if (parent && parent.tree !== taxon.tree) errors.push(issue(`library.taxa[${index}].parentId`, 'Parent taxon must stay within the same taxonomy tree.'));
    }
  });
  const children = new Set((Array.isArray(input.taxa) ? input.taxa : []).filter(isRecord).map((taxon) => taxon.parentId).filter(isString));
  (Array.isArray(input.taxa) ? input.taxa : []).filter(isRecord).forEach((taxon, index) => {
    if (!isString(taxon.id)) return;
    const seen = new Set<string>();
    let current: Record<string, unknown> | undefined = taxon;
    while (current?.parentId !== undefined && isString(current.parentId)) {
      if (seen.has(current.parentId)) { errors.push(issue(`library.taxa[${index}]`, 'Taxonomy contains a cycle.')); break; }
      seen.add(current.parentId);
      current = taxonMap.get(current.parentId);
    }
  });
  const records = [
    ...(Array.isArray(input.atoms) ? input.atoms : []),
    ...(Array.isArray(input.bundles) ? input.bundles : []),
    ...(Array.isArray(input.presets) ? input.presets : []),
    ...(Array.isArray(input.editRecipes) ? input.editRecipes : []),
  ].filter(isRecord);
  records.forEach((record, index) => {
    if (isString(record.primaryTaxonId)) {
      const taxon = taxonMap.get(record.primaryTaxonId);
      if (!taxon) errors.push(issue(`library.records[${index}].primaryTaxonId`, 'Primary taxon does not exist.'));
      else if (children.has(record.primaryTaxonId)) errors.push(issue(`library.records[${index}].primaryTaxonId`, 'Primary taxon must be a leaf.'));
      else if (record.kind === 'atom' || record.kind === 'bundle') {
        if (taxon.tree !== 'units') errors.push(issue(`library.records[${index}].primaryTaxonId`, 'Atom and bundle records belong in the units taxonomy.'));
      } else if (record.kind === 'preset') {
        if (taxon.tree !== 'presets') errors.push(issue(`library.records[${index}].primaryTaxonId`, 'Preset records belong in the presets taxonomy.'));
      } else if (record.kind === 'edit-recipe' && taxon.tree !== 'edits') errors.push(issue(`library.records[${index}].primaryTaxonId`, 'Edit recipes belong in the edits taxonomy.'));
    }
    if (isStringArray(record.sourceIds)) record.sourceIds.forEach((sourceId) => { if (!sourceSet.has(sourceId)) errors.push(issue(`library.records[${index}].sourceIds`, `Source ${sourceId} does not exist.`)); });
    if (isStringArray(record.cautionIds)) record.cautionIds.forEach((cautionId) => { if (!cautionSet.has(cautionId)) errors.push(issue(`library.records[${index}].cautionIds`, `Caution ${cautionId} does not exist.`)); });
  });
  const atoms = (Array.isArray(input.atoms) ? input.atoms : []).filter(isRecord);
  atoms.forEach((atom, index) => {
    if (isString(atom.axisId) && !axisMap.has(atom.axisId)) errors.push(issue(`library.atoms[${index}].axisId`, 'Atom axis does not exist.'));
    for (const key of ['excludes', 'requires']) if (isStringArray(atom[key])) atom[key].forEach((atomId) => { if (!atomIds.has(atomId)) errors.push(issue(`library.atoms[${index}].${key}`, `Atom ${atomId} does not exist.`)); });
    const requires = isStringArray(atom.requires) ? atom.requires : undefined;
    const excludes = isStringArray(atom.excludes) ? atom.excludes : undefined;
    if (isString(atom.id) && requires && excludes) {
      if (requires.some((requiredId) => excludes.includes(requiredId))) errors.push(issue(`library.atoms[${index}]`, 'An atom cannot require an excluded atom.'));
      if (requires.includes(atom.id)) errors.push(issue(`library.atoms[${index}].requires`, 'An atom cannot require itself.'));
    }
  });
  atoms.forEach((atom, index) => {
    if (!isString(atom.id) || !isStringArray(atom.excludes)) return;
    const atomId = atom.id;
    atom.excludes.forEach((otherId) => {
      const other = atoms.find((candidate) => candidate.id === otherId);
      if (other && isStringArray(other.excludes)) {
        const otherExcludes = other.excludes;
        if (!otherExcludes.includes(atomId)) errors.push(issue(`library.atoms[${index}].excludes`, `Exclusion with ${otherId} must be symmetric.`));
      }
    });
  });
  if (Array.isArray(input.bundles)) input.bundles.filter(isRecord).forEach((bundle, index) => {
    if (!isStringArray(bundle.atomIds)) return;
    const fields = bundle.atomIds.map((atomId) => atoms.find((atom) => atom.id === atomId)).filter(isRecord).map((atom) => axisMap.get(atom.axisId)).filter(isRecord).map((axis) => axis.field);
    if (fields.length !== bundle.atomIds.length || new Set(fields).size > 1) errors.push(issue(`library.bundles[${index}].atomIds`, 'Bundle atoms must exist in one template field.'));
  });
  if (Array.isArray(input.presets)) input.presets.filter(isRecord).forEach((preset, index) => {
    if (!isStringArray(preset.atomIds) || !isStringArray(preset.scopeAxisIds)) return;
    const represented = preset.atomIds.map((atomId) => atoms.find((atom) => atom.id === atomId)).filter(isRecord).map((atom) => atom.axisId).filter(isString);
    const representedAxes = [...new Set(represented)].sort();
    const scopeAxes = [...new Set(preset.scopeAxisIds)].sort();
    if (representedAxes.join('|') !== scopeAxes.join('|')) errors.push(issue(`library.presets[${index}].scopeAxisIds`, 'Preset scope must exactly match the axes represented by its atoms.'));
  });
  if (Array.isArray(input.editRecipes)) input.editRecipes.filter(isRecord).forEach((recipe, index) => {
    if (isStringArray(recipe.excludesRecipeIds)) recipe.excludesRecipeIds.forEach((recipeId) => { if (!recipeIds.has(recipeId)) errors.push(issue(`library.editRecipes[${index}].excludesRecipeIds`, `Recipe ${recipeId} does not exist.`)); });
    const slotKeys = isStringArray(recipe.slotKeys) ? recipe.slotKeys : undefined;
    if (Array.isArray(recipe.segments) && slotKeys) recipe.segments.forEach((segment) => { if (isRecord(segment) && 'slot' in segment && isString(segment.slot) && !slotKeys.includes(segment.slot)) errors.push(issue(`library.editRecipes[${index}].segments`, `Slot ${segment.slot} is not declared.`)); });
  });
  if (Array.isArray(input.legacyMap)) input.legacyMap.filter(isRecord).forEach((entry, index) => { if (isStringArray(entry.targetIds)) entry.targetIds.forEach((targetId) => { if (!idSet.has(targetId)) errors.push(issue(`library.legacyMap[${index}].targetIds`, `Target ${targetId} does not exist.`)); }); });
  return errors.length === 0 ? ok(input as unknown as LibraryV2) : { ok: false, errors };
}

export function validateCueDraft(input: unknown, library?: LibraryV2): ValidationResult<CueDraft> {
  const errors = [...validateDraftShape(input, 'draft')];
  if (errors.length === 0 && library) errors.push(...validateDraftAgainstLibrary(input as CueDraft, library, 'draft'));
  return errors.length === 0 ? ok(input as CueDraft) : { ok: false, errors };
}

const validateCommand = (value: unknown, path: string): readonly ValidationIssue[] => {
  if (!isRecord(value) || !isString(value.type)) return [issue(path, 'Expected a semantic command.')];
  const errors: ValidationIssue[] = [];
  const command = value as Record<string, unknown>;
  const requireKeys = (keys: readonly string[]): void => { if (!hasOnlyKeys(command, keys)) errors.push(issue(path, 'Unknown command property.')); };
  switch (command.type) {
    case 'set-what': requireKeys(['type', 'text']); if (!isString(command.text)) errors.push(issue(`${path}.text`, 'WHAT must be text.')); break;
    case 'set-custom-text': requireKeys(['type', 'field', 'text']); if (!includes(FIELDS, command.field)) errors.push(issue(`${path}.field`, 'Field is invalid.')); if (!isString(command.text)) errors.push(issue(`${path}.text`, 'Custom text must be text.')); break;
    case 'set-axis': requireKeys(['type', 'axisId', 'atomIds', 'pinnedBlank']); if (!isId(command.axisId)) errors.push(issue(`${path}.axisId`, 'Axis ID is invalid.')); errors.push(...validateIdArray(command.atomIds, `${path}.atomIds`)); if (command.pinnedBlank !== undefined && typeof command.pinnedBlank !== 'boolean') errors.push(issue(`${path}.pinnedBlank`, 'Pinned blank must be boolean.')); break;
    case 'clear-axis': requireKeys(['type', 'axisId', 'pinBlank']); if (!isId(command.axisId)) errors.push(issue(`${path}.axisId`, 'Axis ID is invalid.')); if (typeof command.pinBlank !== 'boolean') errors.push(issue(`${path}.pinBlank`, 'pinBlank must be boolean.')); break;
    case 'toggle-atom': requireKeys(['type', 'axisId', 'atomId']); if (!isId(command.axisId)) errors.push(issue(`${path}.axisId`, 'Axis ID is invalid.')); if (!isId(command.atomId)) errors.push(issue(`${path}.atomId`, 'Atom ID is invalid.')); break;
    case 'apply-preset': case 'reset-to-preset': requireKeys(['type', 'presetId']); if (!isId(command.presetId)) errors.push(issue(`${path}.presetId`, 'Preset ID is invalid.')); break;
    case 'select-recipe': case 'remove-recipe': requireKeys(['type', 'recipeId']); if (!isId(command.recipeId)) errors.push(issue(`${path}.recipeId`, 'Recipe ID is invalid.')); break;
    case 'set-recipe-slot': requireKeys(['type', 'recipeId', 'slot', 'value']); if (!isId(command.recipeId)) errors.push(issue(`${path}.recipeId`, 'Recipe ID is invalid.')); if (!isNonEmptyString(command.slot)) errors.push(issue(`${path}.slot`, 'Slot must be non-empty text.')); if (!isString(command.value)) errors.push(issue(`${path}.value`, 'Slot value must be text.')); break;
    case 'set-reference-roles': requireKeys(['type', 'references']); if (!Array.isArray(command.references)) errors.push(issue(`${path}.references`, 'References must be an array.')); else errors.push(...command.references.flatMap((reference, index) => validateReferenceRole(reference, `${path}.references[${index}]`))); break;
    case 'set-manual-unlocks': requireKeys(['type', 'domains']); if (!Array.isArray(command.domains) || !command.domains.every((domain) => includes(DOMAINS, domain)) || !unique(command.domains as string[])) errors.push(issue(`${path}.domains`, 'Domains must be unique known values.')); break;
    case 'choose-format': requireKeys(['type', 'format']); if (!includes(['expanded', 'shorthand'], command.format)) errors.push(issue(`${path}.format`, 'Format is invalid.')); break;
    case 'reset-draft': case 'undo-draft': requireKeys(['type']); break;
    default: errors.push(issue(`${path}.type`, 'Unknown command operation.'));
  }
  return errors;
};

export function validateDraftCommand(input: unknown): ValidationResult<DraftCommandEnvelope> {
  if (!isRecord(input)) return fail('command', 'Expected a command envelope.');
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(input, ['commandId', 'clientId', 'draftId', 'expectedFieldRevisions', 'command'])) errors.push(issue('command', 'Unknown command envelope property.'));
  if (!isNonEmptyString(input.commandId)) errors.push(issue('command.commandId', 'Command ID must be non-empty text.'));
  if (!isNonEmptyString(input.clientId)) errors.push(issue('command.clientId', 'Client ID must be non-empty text.'));
  if (!includes(MODES, input.draftId)) errors.push(issue('command.draftId', 'Draft ID is invalid.'));
  if (!isRecord(input.expectedFieldRevisions)) errors.push(issue('command.expectedFieldRevisions', 'Expected field revisions must be an object.'));
  else Object.entries(input.expectedFieldRevisions).forEach(([path, revision]) => {
    if (!isDraftFieldPath(path)) errors.push(issue(`command.expectedFieldRevisions.${path}`, 'Field revision path is invalid.'));
    if (!isNonNegativeInteger(revision)) errors.push(issue(`command.expectedFieldRevisions.${path}`, 'Revision must be a non-negative integer.'));
  });
  errors.push(...validateCommand(input.command, 'command.command'));
  return errors.length === 0 ? ok(input as unknown as DraftCommandEnvelope) : { ok: false, errors };
}

/** Validates the future compound command without widening the current engine command union. */
export function validateQuickAddCommand(input: unknown): ValidationResult<QuickAddCommandEnvelope> {
  if (!isRecord(input)) return fail('quickAddCommand', 'Expected a quick-add command envelope.');
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(input, ['commandId', 'clientId', 'draftId', 'expectedFieldRevisions', 'command'])) errors.push(issue('quickAddCommand', 'Unknown command envelope property.'));
  if (!isNonEmptyString(input.commandId)) errors.push(issue('quickAddCommand.commandId', 'Command ID must be non-empty text.'));
  if (!isNonEmptyString(input.clientId)) errors.push(issue('quickAddCommand.clientId', 'Client ID must be non-empty text.'));
  if (!includes(MODES, input.draftId)) errors.push(issue('quickAddCommand.draftId', 'Draft ID is invalid.'));
  if (!isRecord(input.expectedFieldRevisions)) errors.push(issue('quickAddCommand.expectedFieldRevisions', 'Expected field revisions must be an object.'));
  else {
    Object.entries(input.expectedFieldRevisions).forEach(([path, revision]) => {
      if (!isDraftFieldPath(path)) errors.push(issue(`quickAddCommand.expectedFieldRevisions.${path}`, 'Field revision path is invalid.'));
      if (!isNonNegativeInteger(revision)) errors.push(issue(`quickAddCommand.expectedFieldRevisions.${path}`, 'Revision must be a non-negative integer.'));
    });
    if (!('what' in input.expectedFieldRevisions)) errors.push(issue('quickAddCommand.expectedFieldRevisions.what', 'WHAT revision is required for quick add.'));
  }
  if (!isRecord(input.command)) errors.push(issue('quickAddCommand.command', 'Expected the accept-quick-add command.'));
  else {
    if (!hasOnlyKeys(input.command, ['type', 'acceptance'])) errors.push(issue('quickAddCommand.command', 'Unknown quick-add command property.'));
    if (input.command.type !== 'accept-quick-add') errors.push(issue('quickAddCommand.command.type', 'Command must be accept-quick-add.'));
    errors.push(...validateQuickAddAcceptance(input.command.acceptance, 'quickAddCommand.command.acceptance'));
  }
  return errors.length === 0 ? ok(input as unknown as QuickAddCommandEnvelope) : { ok: false, errors };
}

const isDraftFieldPath = (path: string): path is `axis:${string}` | `custom:${Field}` | `recipe:${string}` | 'draft' | 'what' | 'references' | 'manualUnlocks' | 'preset' | 'format' => path === 'draft' || path === 'what' || path === 'references' || path === 'manualUnlocks' || path === 'preset' || path === 'format' || /^axis:[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(path) || /^custom:(cam|angle|comp|light|look|mood|important|avoid|output)$/.test(path) || /^recipe:[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(path);

export function validateCopyCompiledDraftRequest(input: unknown): ValidationResult<{ readonly draftId: Mode; readonly expectedRevision: number; readonly format: 'expanded' | 'shorthand' }> {
  if (!isRecord(input)) return fail('copy', 'Expected a copy request.');
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(input, ['draftId', 'expectedRevision', 'format'])) errors.push(issue('copy', 'Unknown copy request property.'));
  if (!includes(MODES, input.draftId)) errors.push(issue('copy.draftId', 'Draft ID is invalid.'));
  if (!isNonNegativeInteger(input.expectedRevision)) errors.push(issue('copy.expectedRevision', 'Expected revision must be a non-negative integer.'));
  if (!includes(['expanded', 'shorthand'], input.format)) errors.push(issue('copy.format', 'Copy format is invalid.'));
  return errors.length === 0 ? ok(input as { readonly draftId: Mode; readonly expectedRevision: number; readonly format: 'expanded' | 'shorthand' }) : { ok: false, errors };
}

export function validateLibraryCopyTextRequest(input: unknown): ValidationResult<{ readonly recordId: string; readonly format: 'expanded' | 'shorthand' | 'original'; readonly expectedContentVersion: string }> {
  if (!isRecord(input)) return fail('libraryCopy', 'Expected a library copy request.');
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(input, ['recordId', 'format', 'expectedContentVersion'])) errors.push(issue('libraryCopy', 'Unknown library copy request property.'));
  if (!isId(input.recordId)) errors.push(issue('libraryCopy.recordId', 'Record ID is invalid.'));
  if (!includes(['expanded', 'shorthand', 'original'], input.format)) errors.push(issue('libraryCopy.format', 'Record copy format is invalid.'));
  if (!isString(input.expectedContentVersion) || !CONTENT_VERSION_PATTERN.test(input.expectedContentVersion)) errors.push(issue('libraryCopy.expectedContentVersion', 'Content version is invalid.'));
  return errors.length === 0 ? ok(input as { readonly recordId: string; readonly format: 'expanded' | 'shorthand' | 'original'; readonly expectedContentVersion: string }) : { ok: false, errors };
}

export const validateGetCompiledDraftRequest = validateCopyCompiledDraftRequest;
export const validateLibraryTextRequest = validateLibraryCopyTextRequest;

export function validateSurfaceLayoutRequest(input: unknown): ValidationResult<SurfaceLayoutRequest> {
  if (!isRecord(input)) return fail('layout', 'Expected a surface layout request.');
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(input, ['surfaceSessionId', 'layoutId', 'preferredWidth', 'intrinsicHeight', 'accessory', 'transition'])) errors.push(issue('layout', 'Unknown surface layout property.'));
  if (!isString(input.surfaceSessionId) || !SURFACE_SESSION_PATTERN.test(input.surfaceSessionId)) errors.push(issue('layout.surfaceSessionId', 'Surface session ID is invalid.'));
  if (!isNonNegativeInteger(input.layoutId)) errors.push(issue('layout.layoutId', 'Layout ID must be a non-negative integer.'));
  if (typeof input.preferredWidth !== 'number' || !Number.isFinite(input.preferredWidth) || input.preferredWidth <= 0 || input.preferredWidth > SURFACE_LAYOUT_MAX_DIMENSION) errors.push(issue('layout.preferredWidth', 'Preferred width must be finite and bounded.'));
  if (typeof input.intrinsicHeight !== 'number' || !Number.isFinite(input.intrinsicHeight) || input.intrinsicHeight <= 0 || input.intrinsicHeight > SURFACE_LAYOUT_MAX_DIMENSION) errors.push(issue('layout.intrinsicHeight', 'Intrinsic height must be finite and bounded.'));
  if (!includes(['none', 'parameters', 'suggestions', 'references', 'preview'], input.accessory)) errors.push(issue('layout.accessory', 'Surface accessory is invalid.'));
  if (!includes(['immediate', 'expand', 'collapse'], input.transition)) errors.push(issue('layout.transition', 'Surface layout transition is invalid.'));
  return errors.length === 0 ? ok(input as unknown as SurfaceLayoutRequest) : { ok: false, errors };
}

export function validateReferenceBindingsRequest(input: unknown): ValidationResult<ReferenceBindingsRequest> {
  if (!isRecord(input)) return fail('referenceBindings', 'Expected a reference bindings request.');
  const errors: ValidationIssue[] = [];
  if (!hasOnlyKeys(input, ['draftId', 'expectedDraftRevision'])) errors.push(issue('referenceBindings', 'Unknown reference bindings property.'));
  if (!includes(MODES, input.draftId)) errors.push(issue('referenceBindings.draftId', 'Draft ID is invalid.'));
  if (!isNonNegativeInteger(input.expectedDraftRevision)) errors.push(issue('referenceBindings.expectedDraftRevision', 'Expected draft revision must be a non-negative integer.'));
  return errors.length === 0 ? ok(input as unknown as ReferenceBindingsRequest) : { ok: false, errors };
}

export function validateReferenceBindingEnvelope(input: unknown): ValidationResult<ReferenceBindingEnvelope> {
  if (!isRecord(input)) return fail('referenceBinding', 'Expected a reference binding envelope.');
  const errors: ValidationIssue[] = [];
  if (input.operation === 'upsert') {
    if (!hasOnlyKeys(input, ['draftId', 'expectedVersion', 'operation', 'binding'])) errors.push(issue('referenceBinding', 'Unknown upsert binding property.'));
    errors.push(...validateReferenceBinding(input.binding, 'referenceBinding.binding'));
    if (isRecord(input.binding) && input.binding.draftId !== input.draftId) errors.push(issue('referenceBinding.binding.draftId', 'Binding draft ID must match the envelope.'));
  } else if (input.operation === 'remove') {
    if (!hasOnlyKeys(input, ['draftId', 'expectedVersion', 'operation', 'bindingId', 'imageNumber'])) errors.push(issue('referenceBinding', 'Unknown remove binding property.'));
    if (!isNonEmptyString(input.bindingId) || input.bindingId.length > 128) errors.push(issue('referenceBinding.bindingId', 'Binding ID must be bounded non-empty text.'));
    if (!isInteger(input.imageNumber) || input.imageNumber < 1 || input.imageNumber > 20) errors.push(issue('referenceBinding.imageNumber', 'Image number must be between 1 and 20.'));
  } else {
    errors.push(issue('referenceBinding.operation', 'Binding operation is invalid.'));
  }
  if (!includes(MODES, input.draftId)) errors.push(issue('referenceBinding.draftId', 'Draft ID is invalid.'));
  if (!isNonNegativeInteger(input.expectedVersion)) errors.push(issue('referenceBinding.expectedVersion', 'Expected binding version must be a non-negative integer.'));
  return errors.length === 0 ? ok(input as ReferenceBindingEnvelope) : { ok: false, errors };
}

export function validationErrorToBridgeError(errors: readonly ValidationIssue[]): BridgeError {
  return { code: 'INVALID_INPUT', message: errors.map((error) => `${error.path}: ${error.message}`).join(' ') };
}

export type { Atom, Axis, AxisChoice, CueCommand, CueDraft, EditRecipe, Preset, ReferenceRole, Source, Taxon };
