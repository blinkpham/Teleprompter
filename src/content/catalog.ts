import type {
  Catalog,
  Category,
  Caution,
  CheatsheetEntry,
  Family,
  ResolutionExample,
  ShorthandEntry,
  Technique,
} from '../shared/catalog-types';

const sourceFile = 'image-director/assets/quick-snippets.md';

export const categories: readonly Category[] = [
  { id: 'local-edits', label: 'Local edits', order: 1 },
  { id: 'reference-transfers', label: 'Reference transfers', order: 2 },
  { id: 'camera-framing', label: 'Camera & framing', order: 3 },
  { id: 'finish-quality', label: 'Finish & quality', order: 4 },
  { id: 'motion', label: 'Motion', order: 5 },
];

export const families: readonly Family[] = [
  { id: 'routes', label: 'Edit routes', order: 1, introCautionIds: ['preservation'] },
  { id: 'render', label: 'Render & resolution', order: 2, introCautionIds: ['render-size'] },
  { id: 'camera', label: 'Camera', order: 3, introCautionIds: ['camera-cues'] },
  { id: 'angles', label: 'Angles', order: 4, introCautionIds: ['camera-cues'] },
  { id: 'composition', label: 'Composition', order: 5, introCautionIds: ['preservation'] },
  { id: 'lighting', label: 'Lighting', order: 6, introCautionIds: [] },
  { id: 'looks', label: 'Looks', order: 7, introCautionIds: [] },
  { id: 'depth-focus', label: 'Depth & focus', order: 8, introCautionIds: ['camera-cues'] },
  { id: 'presets', label: 'Combined presets', order: 9, introCautionIds: ['reference-roles'] },
  { id: 'reference-patterns', label: 'Reference patterns', order: 10, introCautionIds: ['reference-roles'] },
];

export const cautions: readonly Caution[] = [
  { id: 'preservation', text: 'Preserve the base image and change only the named subject or region.' },
  { id: 'reference-roles', text: 'Give each reference one role and transfer only that role unless the source says otherwise.' },
  { id: 'camera-cues', text: 'Treat camera and focal-length terms as visual cues, not guaranteed physical measurements.' },
  { id: 'render-size', text: 'Exact pixels apply only when the active backend exposes explicit size controls.' },
  { id: 'restoration', text: 'Restoration should clean the same image without redesigning, restyling, or recomposing it.' },
];

export const resolutionExamples: readonly ResolutionExample[] = [];

export const techniques: readonly Technique[] = [
  {
    id: 'surgical-edit',
    title: 'Surgical edit',
    categoryId: 'local-edits',
    summary: 'Correct one exact detail while preserving the whole image around it.',
    prompt: 'Change only [thing]. Preserve the subject identity, pose, camera, framing, lens feel, perspective, lighting, colors, scene layout, and all unaffected objects. Keep the edit local and reconstruct surrounding pixels naturally. Do not redesign or reinterpret anything else.',
    shorthandTemplate: 'fix: [exact thing]. Lock everything else.',
    shorthandEntryIds: ['route-fix'],
    tags: ['local edit', 'preservation', 'repair'],
    searchTerms: ['surgical', 'correction', 'exact detail', 'fix'],
    cautionIds: ['preservation'],
    previewId: 'surgical-edit',
    order: 1,
    sources: [{ file: sourceFile, heading: '## 1. Surgical edit' }],
  },
];

export const entries: readonly CheatsheetEntry[] = [
  {
    id: 'route-fix',
    kind: 'token',
    familyId: 'routes',
    token: 'fix:',
    aliases: [],
    meaning: 'Make one precise local correction.',
    direction: 'Change only the named thing and preserve the subject, camera, framing, lighting, scene layout, and unaffected objects.',
    searchTerms: ['surgical edit', 'local repair', 'correction'],
    cautionIds: ['preservation'],
    order: 1,
    sources: [{ file: sourceFile, heading: '## Minimal-input vocabulary' }],
  },
  {
    id: 'route-hq',
    kind: 'token',
    familyId: 'render',
    token: 'hq',
    aliases: ['hq:'],
    meaning: 'Request a quality-restoration pass.',
    direction: 'Clean the same image without redesigning, restyling, recomposing, changing content, or inventing detail.',
    searchTerms: ['high quality', 'restoration', 'anti-degradation'],
    cautionIds: ['preservation', 'restoration', 'render-size'],
    order: 1,
    sources: [{ file: sourceFile, heading: '## 13. HIGH-QUALITY RESTORATION / ANTI-DEGRADATION' }],
  },
  {
    id: 'camera-wide35',
    kind: 'token',
    familyId: 'camera',
    token: 'cam:wide35',
    aliases: [],
    meaning: 'Use a versatile environmental advertising feel.',
    direction: 'Use a 35mm-class visual cue with energetic but natural perspective for advertising or social imagery.',
    searchTerms: ['35mm', 'environmental portrait', 'advertising'],
    cautionIds: ['camera-cues'],
    order: 1,
    sources: [{ file: sourceFile, heading: '## Camera / focal-length presets' }],
  },
];

export const shorthandEntries = entries.filter((entry): entry is ShorthandEntry => entry.kind !== 'preset');

const byId = <T extends { readonly id: string }>(items: readonly T[]): Readonly<Record<string, T>> =>
  Object.fromEntries(items.map((item) => [item.id, item])) as Readonly<Record<string, T>>;

export const catalog: Catalog = {
  categories,
  families,
  cautions,
  resolutionExamples,
  techniques,
  entries,
  techniqueIds: techniques.map((technique) => technique.id),
  techniqueById: byId(techniques),
  entryById: byId(entries),
  familyById: byId(families),
};

export const techniqueIds = catalog.techniqueIds;
