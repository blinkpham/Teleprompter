import type {
  Atom,
  CompileError,
  CompilePlaceholder,
  CompileResult,
  CueDraft,
  Domain,
  EditRecipe,
  Field,
  LibraryV2,
  ReferenceRole,
} from '../../shared/teleprompter-types';
import { validateCueDraft } from '../../shared/teleprompter-validation';

const CREATE_FIELDS: readonly Field[] = ['cam', 'angle', 'comp', 'light', 'look', 'mood', 'important', 'avoid', 'output'];
const BASELINE_DOMAINS: readonly Domain[] = ['identity', 'pose', 'wardrobe', 'camera', 'composition', 'background', 'lighting', 'style', 'color', 'detail'];
const FIELD_LABELS: Readonly<Record<Field, string>> = {
  cam: 'CAM', angle: 'ANGLE', comp: 'COMP', light: 'LIGHT', look: 'LOOK', mood: 'MOOD', important: 'IMPORTANT', avoid: 'AVOID', output: 'OUTPUT',
};
const CREATE_PLACEHOLDERS: Readonly<Record<Field, string>> = {
  cam: '[camera / lens / depth / focus]',
  angle: '[camera angle]',
  comp: '[composition]',
  light: '[lighting]',
  look: '[look]',
  mood: '[mood]',
  important: '[important details]',
  avoid: '[things to avoid]',
  output: '[aspect ratio] [resolution]',
};

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const atomById = (library: LibraryV2): ReadonlyMap<string, Atom> => new Map(library.atoms.map((atom) => [atom.id, atom]));
const axisById = (library: LibraryV2): ReadonlyMap<string, LibraryV2['axes'][number]> => new Map(library.axes.map((axis) => [axis.id, axis]));

const validationErrors = (library: LibraryV2, draft: CueDraft): CompileError[] => {
  const result = validateCueDraft(draft, library);
  return result.ok ? [] : result.errors.map((error) => ({ code: 'INVALID_DRAFT', message: `${error.path}: ${error.message}` }));
};

interface AtomProjection {
  readonly atoms: readonly Atom[];
  readonly errors: readonly CompileError[];
  readonly cautions: readonly string[];
}

const projectAtoms = (library: LibraryV2, draft: CueDraft): AtomProjection => {
  const atoms = atomById(library);
  const axes = axisById(library);
  const errors: CompileError[] = [];
  const selected: Atom[] = [];
  const cautions: string[] = [];
  for (const choice of draft.choices) {
    const axis = axes.get(choice.axisId);
    if (!axis) {
      errors.push({ code: 'UNKNOWN_AXIS', recordId: choice.axisId, message: `Unknown axis ${choice.axisId}.` });
      continue;
    }
    for (const atomId of choice.atomIds) {
      const atom = atoms.get(atomId);
      if (!atom) {
        errors.push({ code: 'UNKNOWN_ATOM', field: axis.field, recordId: atomId, message: `Unknown selected atom ${atomId}.` });
      } else if (atom.axisId !== choice.axisId) {
        errors.push({ code: 'WRONG_AXIS', field: axis.field, recordId: atomId, message: `${atom.label} does not belong to ${choice.axisId}.` });
      } else {
        selected.push(atom);
        cautions.push(...atom.cautionIds);
      }
    }
  }
  const sorted = [...new Map(selected.map((atom) => [atom.id, atom])).values()].sort((left, right) => {
    const leftAxis = axes.get(left.axisId);
    const rightAxis = axes.get(right.axisId);
    return (leftAxis?.order ?? 0) - (rightAxis?.order ?? 0) || left.order - right.order || left.id.localeCompare(right.id);
  });
  return { atoms: sorted, errors, cautions: unique(cautions) };
};

const trimCustom = (draft: CueDraft, field: Field): string => (draft.customText[field] ?? '').trim();
const atomText = (atoms: readonly Atom[], field: Field, format: CueDraft['outputFormat'], library: LibraryV2): string => {
  const axes = axisById(library);
  return atoms.filter((atom) => axes.get(atom.axisId)?.field === field).map((atom) => format === 'shorthand' ? atom.shorthand : atom.expansion).join('; ');
};

const fieldText = (library: LibraryV2, draft: CueDraft, field: Field, projection: AtomProjection): string => {
  const parts = [atomText(projection.atoms, field, draft.outputFormat, library), trimCustom(draft, field)].filter((part) => part.length > 0);
  if (field === 'output' && draft.outputFormat === 'expanded') {
    const outputAtoms = projection.atoms.filter((atom) => axisById(library).get(atom.axisId)?.field === 'output');
    if (outputAtoms.length > 0) return outputAtoms.map((atom) => atom.expansion).join(' ') + (trimCustom(draft, field) ? ` ${trimCustom(draft, field)}` : '');
  }
  return parts.join('; ');
};

const createText = (library: LibraryV2, draft: CueDraft, projection: AtomProjection): string => {
  const sections = [`WHAT:\n${draft.what.trim() || '[subject + action + scene]'}`];
  for (const field of CREATE_FIELDS) sections.push(`${FIELD_LABELS[field]}:\n${fieldText(library, draft, field, projection) || CREATE_PLACEHOLDERS[field]}`);
  return `${sections.join('\n\n')}\n`;
};

const placeholder = (key: string, label: string): CompilePlaceholder => ({ key, label });

const renderRecipe = (recipe: EditRecipe, choice: CueDraft['edits'][number], placeholders: CompilePlaceholder[]): string => recipe.segments.map((segment) => {
  if ('text' in segment) return segment.text;
  const value = choice.slots[segment.slot]?.trim();
  if (value) return value;
  placeholders.push(placeholder(`${recipe.id}.${segment.slot}`, segment.placeholder));
  return `[${segment.placeholder}]`;
}).join('').trim();

const referenceText = (references: readonly ReferenceRole[], placeholders: CompilePlaceholder[]): string => {
  if (references.length === 0) return '[reference roles, if needed]';
  return [...references].sort((left, right) => left.imageNumber - right.imageNumber).map((reference) => {
    const note = reference.note.trim();
    if (note) return `Image ${reference.imageNumber} — ${reference.role}: ${note}`;
    placeholders.push(placeholder(`reference.${reference.imageNumber}`, `${reference.role} description`));
    return `Image ${reference.imageNumber} — ${reference.role}: [${reference.role} description]`;
  }).join('; ');
};

const domainsForField = (library: LibraryV2, draft: CueDraft, field: Field, projection: AtomProjection): readonly Domain[] => {
  if (field === 'important' || field === 'avoid') return [];
  if (field === 'output') {
    const axes = axisById(library);
    return projection.atoms.some((atom) => axes.get(atom.axisId)?.id === 'axis.output.ratio') ? ['composition'] : [];
  }
  const axes = axisById(library);
  const domains = projection.atoms.filter((atom) => axes.get(atom.axisId)?.field === field).map((atom) => axes.get(atom.axisId)?.domain).filter((domain): domain is Domain => Boolean(domain));
  const custom = trimCustom(draft, field);
  if (custom.length > 0) {
    const fallback: Readonly<Record<Field, Domain | undefined>> = { cam: 'camera', angle: 'camera', comp: 'composition', light: 'lighting', look: 'style', mood: 'style', important: undefined, avoid: undefined, output: undefined };
    if (fallback[field]) domains.push(fallback[field]);
  }
  return unique(domains);
};

const keepText = (unlocked: ReadonlySet<Domain>, structured: boolean): string => {
  if (!structured) return '[what to preserve]';
  const remaining = BASELINE_DOMAINS.filter((domain) => !unlocked.has(domain));
  return remaining.length > 0 ? `${remaining.join(', ')}. Preserve unaffected objects and regions.` : 'Preserve unaffected objects and regions.';
};

const editText = (library: LibraryV2, draft: CueDraft, projection: AtomProjection): { result: CompileResult; text: string } => {
  const errors: CompileError[] = [];
  const placeholders: CompilePlaceholder[] = [];
  const cautions = [...projection.cautions];
  const selectedRecipes = draft.edits.map((choice) => ({ choice, recipe: library.editRecipes.find((item) => item.id === choice.recipeId) })).sort((left, right) => (left.recipe?.order ?? 0) - (right.recipe?.order ?? 0) || left.choice.recipeId.localeCompare(right.choice.recipeId));
  for (const item of selectedRecipes) if (!item.recipe) errors.push({ code: 'UNKNOWN_RECIPE', recordId: item.choice.recipeId, message: `Unknown edit recipe ${item.choice.recipeId}.` });
  const validRecipes = selectedRecipes.filter((item): item is { choice: CueDraft['edits'][number]; recipe: EditRecipe } => Boolean(item.recipe));
  for (const { recipe } of validRecipes) cautions.push(...recipe.cautionIds);
  const unlocked = new Set<Domain>(draft.manualUnlocks);
  for (const { recipe } of validRecipes) recipe.affectedDomains.forEach((domain) => unlocked.add(domain));
  for (const field of CREATE_FIELDS) domainsForField(library, draft, field, projection).forEach((domain) => unlocked.add(domain));
  for (const { recipe } of validRecipes) {
    const conflict = recipe.requiredPreservedDomains.filter((domain) => unlocked.has(domain));
    if (conflict.length > 0) errors.push({ code: 'LOCK_CONFLICT', recordId: recipe.id, message: `${recipe.label} requires preserving ${conflict.join(', ')}, but the draft also unlocks it.` });
  }
  const hasStructuredChange = validRecipes.length > 0 || CREATE_FIELDS.some((field) => fieldText(library, draft, field, projection).length > 0) || draft.manualUnlocks.length > 0;
  const changes: string[] = [];
  validRecipes.forEach(({ recipe, choice }, index) => changes.push(`${index + 1}. ${renderRecipe(recipe, choice, placeholders)}`));
  if (draft.what.trim()) changes.push(`Additional change: ${draft.what.trim()}`);
  for (const field of CREATE_FIELDS) {
    const text = fieldText(library, draft, field, projection);
    if (text) changes.push(`${FIELD_LABELS[field]}:\n${text}`);
  }
  if (changes.length === 0) changes.push('[describe the changes]');
  const base = draft.references.find((reference) => reference.role === 'base')?.imageNumber ?? 1;
  const references = referenceText(draft.references, placeholders);
  const text = [
    `BASE:\nUse image ${base} as the base.`,
    `REFERENCES:\n${references}`,
    `CHANGES:\n${changes.join('\n')}`,
    `KEEP:\n${keepText(unlocked, hasStructuredChange)}`,
    `IMPORTANT:\n${fieldText(library, draft, 'important', projection) || '[important details]'}`,
    `AVOID:\n${fieldText(library, draft, 'avoid', projection) || '[things to avoid]'}`,
    `OUTPUT:\n${fieldText(library, draft, 'output', projection) || '[aspect ratio] [resolution]'}`,
  ].join('\n\n') + '\n';
  return {
    text,
    result: {
      text,
      revision: draft.revision,
      placeholders,
      cautions: unique(cautions),
      errors: [...validationErrors(library, draft), ...errors],
      atomsUsed: projection.atoms.map((atom) => atom.id),
      unlockedDomains: [...unlocked],
    },
  };
};

export const compileCreate = (library: LibraryV2, draft: CueDraft): CompileResult => {
  const projection = projectAtoms(library, draft);
  const text = createText(library, draft, projection);
  return {
    text,
    revision: draft.revision,
    placeholders: [],
    cautions: projection.cautions,
    errors: [...validationErrors(library, draft), ...projection.errors],
    atomsUsed: projection.atoms.map((atom) => atom.id),
    unlockedDomains: [],
  };
};

export const compileEdit = (library: LibraryV2, draft: CueDraft): CompileResult => {
  const projection = projectAtoms(library, draft);
  return editText(library, draft, projection).result;
};

