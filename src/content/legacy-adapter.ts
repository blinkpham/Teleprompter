import type { Catalog, CheatsheetEntry, ShorthandEntry, SourceRef, Technique } from '../shared/catalog-types';
import { catalog as defaultCatalog } from './catalog';
import { validateLibrary } from '../shared/teleprompter-validation';
import type {
  Atom,
  Axis,
  Bundle,
  CommonRecord,
  Domain,
  EditRecipe,
  Field,
  LegacyMapEntry,
  LibraryV2,
  Mode,
  Preset as V2Preset,
  Source,
  Taxon,
} from '../shared/teleprompter-types';

/**
 * The legacy catalog is intentionally kept as the source of truth for the
 * first Teleprompter content slice. This module only gives those records a
 * V2 shape; it does not rewrite or delete the original text.
 */

export interface LegacyOriginal {
  readonly key: string;
  readonly oldId: string;
  readonly kind: 'entry' | 'technique';
  readonly token: string;
  readonly meaning?: string;
  readonly direction?: string;
  readonly prompt?: string;
  readonly shorthandTemplate?: string;
  readonly sources: readonly SourceRef[];
  readonly original: CheatsheetEntry | Technique;
}

export interface LegacyMappingSummary {
  readonly mapped: number;
  readonly referenceOnly: number;
  readonly split: number;
  readonly techniqueMapped: number;
}

const CONTENT_VERSION = '2026-09-13.2';
const BASELINE_DOMAINS: readonly Domain[] = [
  'identity', 'pose', 'wardrobe', 'camera', 'composition', 'background',
  'lighting', 'style', 'color', 'detail',
];

const source = (id: string, title: string, locator: string, basis: Source['basis'], evidenceNote: string, reuse: Source['reuse']): Source => ({
  id,
  kind: id.startsWith('source.user') ? 'user' : 'local',
  title,
  locator,
  basis,
  evidenceNote,
  reuse,
});

export const adapterSources: readonly Source[] = [
  source('source.local.skill', 'Image Director source skill', 'image-director/SKILL.md', 'source-description', 'The legacy catalog is authored from this preserved local skill and its headings.', 'paraphrase-only'),
  source('source.local.snippets', 'Quick Image Prompt Snippets', 'image-director/assets/quick-snippets.md', 'source-prompt', 'The legacy route and gallery directions retain their original snippet provenance.', 'paraphrase-only'),
  source('source.local.strategy', 'Prompting Strategy Reference', 'image-director/references/prompting-strategy.md', 'source-description', 'The local reference records role-limited references, geometry-sensitive prompting, and preservation boundaries.', 'paraphrase-only'),
  source('source.user.teleprompter', 'Teleprompter contract additions', '03 Docs/Teleprompter Plan/02-Cue-and-Library-Contracts.md', 'user-source', 'Mood, constraint, aspect-ratio, and one-kilopixel target records are requested product additions, not external research claims.', 'user-provided'),
];

export const adapterCautions = [
  { id: 'preservation', text: 'Prompting can request preservation, but it cannot guarantee identical pixels. Use a local mask or composite the edited area when unchanged pixels must stay exact.' },
  { id: 'reference-roles', text: 'Use the first image as the base unless you specify otherwise. Give each reference one role and transfer only that role. Existing reference constraints take priority over preset defaults.' },
  { id: 'camera-cues', text: 'Focal-length names describe a visual look. They do not guarantee a physically simulated lens or camera.' },
  { id: 'render-size', text: 'Exact dimensions depend on the image backend. If it does not expose pixel controls, 2k and 4k are quality targets. Check the returned image before claiming its size.' },
  { id: 'restoration', text: "Restore the same image's quality. Keep identity, content, framing, geometry, and lighting; do not redesign or invent detail." },
] as const;

const axis = (id: string, field: Field, label: string, cardinality: Axis['cardinality'], domain: Domain, order: number): Axis => ({ id: `axis.${id}`, field, label, cardinality, domain, order });

export const adapterAxes: readonly Axis[] = [
  axis('camera.focal', 'cam', 'Focal cue', 'one', 'camera', 1),
  axis('camera.distance', 'cam', 'Subject distance', 'one', 'camera', 2),
  axis('camera.depth', 'cam', 'Depth of field', 'one', 'camera', 3),
  axis('camera.focus', 'cam', 'Focus target', 'one', 'camera', 4),
  axis('angle.elevation', 'angle', 'Elevation', 'one', 'camera', 1),
  axis('angle.azimuth', 'angle', 'Azimuth', 'one', 'camera', 2),
  axis('angle.roll', 'angle', 'Horizon roll', 'one', 'camera', 3),
  axis('composition.hierarchy', 'comp', 'Subject hierarchy', 'one', 'composition', 1),
  axis('composition.placement', 'comp', 'Placement and balance', 'one', 'composition', 2),
  axis('composition.crop', 'comp', 'Crop and framing', 'one', 'composition', 3),
  axis('composition.depth', 'comp', 'Depth staging', 'many', 'composition', 4),
  axis('light.key', 'light', 'Key source', 'one', 'lighting', 1),
  axis('light.contrast', 'light', 'Contrast shape', 'one', 'lighting', 2),
  axis('light.time', 'light', 'Time and ambient', 'one', 'lighting', 3),
  axis('light.fill', 'light', 'Fill', 'many', 'lighting', 4),
  axis('light.accent', 'light', 'Accent source', 'many', 'lighting', 5),
  axis('look.base', 'look', 'Base finish', 'one', 'style', 1),
  axis('look.palette', 'look', 'Palette', 'one', 'color', 2),
  axis('look.texture', 'look', 'Texture', 'one', 'detail', 3),
  axis('look.retouched', 'look', 'Retouch level', 'one', 'detail', 4),
  axis('look.treatment', 'look', 'Treatment', 'many', 'style', 5),
  axis('mood.tone', 'mood', 'Tone', 'many', 'style', 1),
  axis('constraint.keep', 'important', 'Keep constraint', 'many', 'detail', 1),
  axis('constraint.avoid', 'avoid', 'Avoid constraint', 'many', 'detail', 1),
  axis('output.ratio', 'output', 'Aspect ratio', 'one', 'output', 1),
  axis('output.resolution', 'output', 'Resolution target', 'one', 'output', 2),
];

const axisById = new Map(adapterAxes.map((item) => [item.id, item]));
const axisId = (id: string): string => `axis.${id}`;

const taxa: readonly Taxon[] = [
  { id: 'taxon.units.optics', tree: 'units', label: 'Optics', definition: 'Viewpoint, perspective, focus, and camera cues.', inclusion: 'Camera, angle, depth, and focus directions.', exclusion: 'Composition and illumination belong under Stage.', order: 1 },
  { id: 'taxon.units.optics.camera', tree: 'units', parentId: 'taxon.units.optics', label: 'Camera', definition: 'Camera cues and subject-distance choices.', inclusion: 'Focal, distance, depth, and focus axes.', exclusion: 'Presets and mood are not camera atoms.', order: 1 },
  { id: 'taxon.units.optics.angle', tree: 'units', parentId: 'taxon.units.optics', label: 'Angle', definition: 'Camera elevation, azimuth, and horizon roll.', inclusion: 'Elevation, azimuth, and roll directions.', exclusion: 'Foreground layering belongs to composition.', order: 2 },
  { id: 'taxon.units.stage', tree: 'units', label: 'Stage', definition: 'Arrangement and illumination of the scene.', inclusion: 'Composition and lighting directions.', exclusion: 'Camera and finish have separate roots.', order: 2 },
  { id: 'taxon.units.stage.composition', tree: 'units', parentId: 'taxon.units.stage', label: 'Composition', definition: 'How subjects, objects, and space are arranged.', inclusion: 'Hierarchy, placement, crop, and depth staging.', exclusion: 'Lighting and finish are separate.', order: 1 },
  { id: 'taxon.units.stage.lighting', tree: 'units', parentId: 'taxon.units.stage', label: 'Lighting', definition: 'Direction, softness, contrast, time, fill, and accents.', inclusion: 'Illumination directions and sources.', exclusion: 'Palette and retouch belong to Finish.', order: 2 },
  { id: 'taxon.units.finish', tree: 'units', label: 'Finish', definition: 'Surface treatment, palette, and emotional temperature.', inclusion: 'Look and mood fields.', exclusion: 'Physical illumination remains under Stage.', order: 3 },
  { id: 'taxon.units.finish.look', tree: 'units', parentId: 'taxon.units.finish', label: 'Look', definition: 'Genre or treatment visible in the final image.', inclusion: 'Finish, palette, texture, and retouch directions.', exclusion: 'Look labels do not replace camera or light choices.', order: 1 },
  { id: 'taxon.units.finish.mood', tree: 'units', parentId: 'taxon.units.finish', label: 'Mood', definition: 'Emotional temperature or atmosphere.', inclusion: 'Visible tone directions.', exclusion: 'Premium alone is not an atom.', order: 2 },
  { id: 'taxon.units.constraints', tree: 'units', label: 'Constraints', definition: 'User-authored keep and avoid directions.', inclusion: 'IMPORTANT and AVOID choices.', exclusion: 'Named edit operations belong in Edits.', order: 4 },
  { id: 'taxon.units.output', tree: 'units', label: 'Output', definition: 'Delivery and format requests.', inclusion: 'Aspect ratio and resolution cues.', exclusion: 'Output does not prove backend support.', order: 5 },
  { id: 'taxon.presets.legacy', tree: 'presets', label: 'Legacy presets', definition: 'Source-backed multi-axis recipes retained during migration.', inclusion: 'The ten original combined presets.', exclusion: 'No opaque prompt paragraph is stored.', order: 1 },
  { id: 'taxon.edits.legacy', tree: 'edits', label: 'Legacy edit recipes', definition: 'Source-backed operations with explicit preservation domains.', inclusion: 'Routes and reference/markup patterns.', exclusion: 'Unstructured free text is not an operation.', order: 1 },
];

const unitTaxonForAxis = (id: string): string => {
  if (id.startsWith('axis.camera.')) return 'taxon.units.optics.camera';
  if (id.startsWith('axis.angle.')) return 'taxon.units.optics.angle';
  if (id.startsWith('axis.composition.')) return 'taxon.units.stage.composition';
  if (id.startsWith('axis.light.')) return 'taxon.units.stage.lighting';
  if (id.startsWith('axis.look.')) return 'taxon.units.finish.look';
  if (id.startsWith('axis.mood.')) return 'taxon.units.finish.mood';
  if (id.startsWith('axis.constraint.')) return 'taxon.units.constraints';
  return 'taxon.units.output';
};

const sourceIdsFor = (sources: readonly SourceRef[]): readonly string[] => {
  const ids = new Set<string>();
  for (const item of sources) {
    ids.add(item.file.includes('quick-snippets') ? 'source.local.snippets' : item.file.includes('prompting-strategy') ? 'source.local.strategy' : 'source.local.skill');
  }
  return [...ids];
};

const safeRecordId = (value: string): string => value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

const axisForEntry = (entry: ShorthandEntry): string => {
  if (entry.familyId === 'render') return axisId('output.resolution');
  if (entry.familyId === 'camera') {
    if (entry.id.startsWith('camera-closewide')) return axisId('camera.focal');
    return axisId('camera.focal');
  }
  if (entry.familyId === 'depth-focus') return entry.id.startsWith('dof-') ? axisId('camera.depth') : axisId('camera.focus');
  if (entry.familyId === 'angles') {
    if (['angle-eye', 'angle-lowhero', 'angle-high', 'angle-topdown', 'angle-worm'].includes(entry.id)) return axisId('angle.elevation');
    if (entry.id === 'angle-dutch') return axisId('angle.roll');
    return axisId('angle.azimuth');
  }
  if (entry.familyId === 'composition') {
    if (['composition-hero', 'composition-producthero', 'composition-widekey'].includes(entry.id)) return axisId('composition.hierarchy');
    if (['composition-fashion', 'composition-tight'].includes(entry.id)) return axisId('composition.crop');
    if (['composition-foreground', 'composition-layered'].includes(entry.id)) return axisId('composition.depth');
    return axisId('composition.placement');
  }
  if (entry.familyId === 'lighting') {
    if (['lighting-split'].includes(entry.id)) return axisId('light.contrast');
    if (['lighting-window', 'lighting-daybounce', 'lighting-overcast', 'lighting-golden'].includes(entry.id)) return axisId('light.time');
    if (['lighting-rim', 'lighting-neon'].includes(entry.id)) return axisId('light.accent');
    return axisId('light.key');
  }
  if (entry.familyId === 'looks') return entry.id === 'look-cleanblue' ? axisId('look.palette') : axisId('look.base');
  return axisId('output.resolution');
};

const knownAtomIds: Readonly<Record<string, string>> = {
  'camera-wide35': 'atom.camera.focal.wide35',
  'camera-natural50': 'atom.camera.focal.natural50',
  'camera-portrait85': 'atom.camera.focal.portrait85',
  'angle-3q': 'atom.angle.azimuth.three-quarter',
  'composition-hero': 'atom.composition.hierarchy.hero',
  'lighting-highkey': 'atom.light.key.high-soft',
  'dof-medium': 'atom.camera.depth.medium',
  'look-commercial': 'atom.look.base.commercial',
  'look-cleanblue': 'atom.look.palette.clean-blue',
};

/** The lead-approved curator seed. All other legacy rows remain recovery-only. */
export const ACCEPTED_SEED_ATOM_IDS = [
  'atom.camera.focal.wide35',
  'atom.camera.focal.natural50',
  'atom.camera.focal.portrait85',
  'atom.angle.azimuth.three-quarter',
  'atom.composition.hierarchy.hero',
  'atom.light.key.high-soft',
  'atom.camera.depth.medium',
  'atom.look.base.commercial',
  'atom.look.palette.clean-blue',
] as const;

export const ACCEPTED_SEED_PRESET_IDS = ['preset.directed-studio.commercial'] as const;
export const ACCEPTED_SEED_RECIPE_IDS = [
  'edit.local.surgical-correction',
  'edit.background.object-removal',
  'edit.reference.tone-transfer',
  'edit.quality.restoration',
] as const;

const legacyAtomId = (entry: ShorthandEntry): string => knownAtomIds[entry.id] ?? `atom.legacy.${safeRecordId(entry.id)}`;

type LegacyDescribedRecord = Pick<ShorthandEntry, 'token' | 'meaning' | 'searchTerms' | 'cautionIds' | 'order' | 'sources'> & { readonly familyId: string; readonly aliases?: readonly string[] };

const common = (entry: LegacyDescribedRecord, primaryTaxonId: string): Omit<CommonRecord, 'id' | 'kind'> => ({
  label: entry.token,
  shorthand: entry.token,
  aliases: entry.aliases ?? [],
  summary: entry.meaning,
  primaryTaxonId,
  facets: { family: [entry.familyId], sourceTerms: entry.searchTerms },
  sourceIds: sourceIdsFor(entry.sources),
  cautionIds: entry.cautionIds,
  order: entry.order,
  status: 'active',
});

const atomFromEntry = (entry: ShorthandEntry, overrideAxis?: string, overrideId?: string, overrideExpansion?: string): Atom => {
  const selectedAxis = overrideAxis ?? axisForEntry(entry);
  return {
    kind: 'atom',
    id: overrideId ?? legacyAtomId(entry),
    ...common(entry, unitTaxonForAxis(selectedAxis)),
    axisId: selectedAxis,
    expansion: (overrideExpansion ?? entry.direction).trim().replace(/;\s*$/, ''),
    excludes: [],
    requires: [],
    applicability: ['create', 'edit'],
  };
};

const syntheticAtom = (id: string, axis: string, label: string, shorthand: string, expansion: string, order: number, summary: string, cautionIds: readonly string[] = []): Atom => ({
  kind: 'atom',
  id,
  label,
  shorthand,
  aliases: [],
  summary,
  primaryTaxonId: unitTaxonForAxis(axis),
  facets: { sourceTerms: [label] },
  sourceIds: ['source.user.teleprompter'],
  cautionIds,
  order,
  status: 'active',
  axisId: axis,
  expansion,
  excludes: [],
  requires: [],
  applicability: ['create', 'edit'],
});

const recipeIdForLegacy: Readonly<Record<string, string>> = {
  'route-fix': 'edit.local.surgical-correction',
  'route-remove': 'edit.background.object-removal',
  'route-swap': 'edit.reference.element-swap',
  'route-pose': 'edit.reference.pose-transfer',
  'route-face': 'edit.reference.identity-transfer',
  'route-product': 'edit.reference.product-transfer',
  'route-style': 'edit.reference.style-transfer',
  'route-tone': 'edit.reference.tone-transfer',
  'route-perspective': 'edit.geometry.perspective',
  'route-camera-lock': 'edit.geometry.camera-lock',
  'route-reframe': 'edit.geometry.reframe',
  'route-clean': 'edit.background.simplify',
  'route-motion': 'edit.detail.controlled-motion',
  'route-hq': 'edit.quality.restoration',
  'route-lock': 'edit.constraint.lock',
  'pattern-reference-roles': 'edit.reference.multi-composite',
  'pattern-marked-area': 'edit.geometry.markup',
};

const techniqueRecipeId: Readonly<Record<string, string>> = {
  'surgical-edit': 'edit.local.surgical-correction',
  'remove-one-thing': 'edit.background.object-removal',
  'multi-reference-composite': 'edit.reference.multi-composite',
  'style-tone-transfer': 'edit.reference.tone-transfer',
  'face-identity-transfer': 'edit.reference.identity-transfer',
  'pose-transfer': 'edit.reference.pose-transfer',
  'perspective-correction': 'edit.geometry.perspective',
  'camera-lock': 'edit.geometry.camera-lock',
  'reframe': 'edit.geometry.reframe',
  'clean-environment': 'edit.background.simplify',
  'product-fidelity': 'edit.reference.product-transfer',
  'controlled-motion': 'edit.detail.controlled-motion',
  'quality-restoration': 'edit.quality.restoration',
  'markup-directed-edit': 'edit.geometry.markup',
};

const recipeDomains: Readonly<Record<string, readonly Domain[]>> = {
  'route-fix': ['detail'],
  'route-remove': ['background'],
  'route-swap': ['identity'],
  'route-pose': ['pose'],
  'route-face': ['identity'],
  'route-product': ['identity'],
  'route-style': ['style', 'color', 'lighting'],
  'route-tone': ['style', 'color', 'lighting'],
  'route-perspective': ['composition'],
  'route-camera-lock': [],
  'route-reframe': ['composition'],
  'route-clean': ['background'],
  'route-motion': ['detail'],
  'route-hq': ['detail'],
  'route-lock': [],
  'pattern-reference-roles': ['identity', 'pose'],
  'pattern-marked-area': ['composition'],
};

const parseSegments = (direction: string): { segments: ({ text: string } | { slot: string; placeholder: string })[]; slotKeys: string[] } => {
  const segments: ({ text: string } | { slot: string; placeholder: string })[] = [];
  const slotKeys: string[] = [];
  let cursor = 0;
  const pattern = /\[([^\]]+)\]/g;
  for (const match of direction.matchAll(pattern)) {
    const start = match.index ?? 0;
    const placeholder = match[1]?.trim() ?? 'value';
    if (start > cursor) segments.push({ text: direction.slice(cursor, start) });
    const slot = `slot.${safeRecordId(placeholder) || 'value'}`;
    slotKeys.push(slot);
    segments.push({ slot, placeholder });
    cursor = start + match[0].length;
  }
  if (cursor < direction.length) segments.push({ text: direction.slice(cursor) });
  if (segments.length === 0) segments.push({ text: direction });
  return { segments, slotKeys: [...new Set(slotKeys)] };
};

const preservedDomains = (affected: readonly Domain[]): readonly Domain[] => BASELINE_DOMAINS.filter((domain) => !affected.includes(domain));

const recipeFromEntry = (entry: ShorthandEntry): EditRecipe => {
  const parsed = parseSegments(entry.direction);
  const affected = recipeDomains[entry.id] ?? [];
  const excludesRecipeIds = entry.id === 'route-camera-lock'
    ? ['edit.geometry.reframe']
    : entry.id === 'route-lock'
      ? ['edit.geometry.camera-lock']
      : [];
  return {
    kind: 'edit-recipe',
    id: recipeIdForLegacy[entry.id] ?? `edit.legacy.${safeRecordId(entry.id)}`,
    ...common(entry, 'taxon.edits.legacy'),
    operation: entry.meaning,
    affectedDomains: affected,
    requiredPreservedDomains: entry.id === 'route-camera-lock' ? ['camera'] : entry.id === 'route-lock' ? BASELINE_DOMAINS : preservedDomains(affected),
    slotKeys: parsed.slotKeys,
    segments: parsed.segments,
    allowedFields: ['cam', 'angle', 'comp', 'light', 'look', 'mood', 'important', 'avoid', 'output'],
    excludesRecipeIds,
  };
};

const makeLegacyMap = (entry: CheatsheetEntry, targetIds: readonly string[], disposition: LegacyMapEntry['disposition'], reason: string): LegacyMapEntry => ({
  oldId: entry.id,
  oldToken: entry.token,
  disposition,
  targetIds,
  reason,
});

const makeTechniqueMap = (technique: Technique, targetIds: readonly string[], disposition: LegacyMapEntry['disposition'], reason: string): LegacyMapEntry => ({
  oldId: `technique-${technique.id}`,
  oldToken: technique.shorthandTemplate,
  disposition,
  targetIds,
  reason,
});

const originalFromEntry = (entry: CheatsheetEntry, index: number): LegacyOriginal => ({
  key: `entry:${index}:${entry.id}`,
  oldId: entry.id,
  kind: 'entry',
  token: entry.token,
  meaning: entry.meaning,
  direction: entry.kind === 'preset' ? undefined : entry.direction,
  sources: entry.sources,
  original: entry,
});

const originalFromTechnique = (technique: Technique): LegacyOriginal => ({
  key: `technique:${technique.id}`,
  oldId: technique.id,
  kind: 'technique',
  token: technique.shorthandTemplate,
  prompt: technique.prompt,
  shorthandTemplate: technique.shorthandTemplate,
  meaning: technique.summary,
  sources: technique.sources,
  original: technique,
});

export const legacyOriginalsFor = (catalog: Catalog): readonly LegacyOriginal[] => [
  ...catalog.entries.map(originalFromEntry),
  ...catalog.techniques.map(originalFromTechnique),
];

export const legacyMappingSummaryFor = (library: LibraryV2): LegacyMappingSummary => {
  const mapped = library.legacyMap.filter((item) => item.oldId.startsWith('technique-') === false && item.disposition !== 'reference-only').length;
  const referenceOnly = library.legacyMap.filter((item) => item.disposition === 'reference-only').length;
  const split = library.legacyMap.filter((item) => item.disposition === 'split').length;
  const techniqueMapped = library.legacyMap.filter((item) => item.oldId.startsWith('technique-') && item.targetIds.length > 0).length;
  return { mapped, referenceOnly, split, techniqueMapped };
};

export const adaptLegacyCatalog = (legacyCatalog: Catalog = defaultCatalog): LibraryV2 => {
  const atoms: Atom[] = [];
  const bundles: Bundle[] = [];
  const presets: V2Preset[] = [];
  const editRecipes: EditRecipe[] = [];
  const legacyMap: LegacyMapEntry[] = [];
  const entryTargetIds = new Map<string, readonly string[]>();
  const seenEntryIds = new Set<string>();

  for (const entry of legacyCatalog.entries) {
    if (seenEntryIds.has(entry.id)) {
      const targetIds = entryTargetIds.get(entry.id) ?? [];
      legacyMap.push(makeLegacyMap(entry, targetIds, 'alias', 'The legacy source contains a duplicate row with the same ID; preserve both source rows while exposing one canonical V2 record.'));
      continue;
    }
    seenEntryIds.add(entry.id);
    if (entry.kind === 'preset') continue;
    if (entry.familyId === 'routes' || entry.familyId === 'reference-patterns') {
      const recipe = recipeFromEntry(entry);
      editRecipes.push(recipe);
      entryTargetIds.set(entry.id, [recipe.id]);
      legacyMap.push(makeLegacyMap(entry, [recipe.id], 'retained', 'Mapped to a slot-based edit recipe with explicit affected and preserved domains.'));
      continue;
    }
    if (entry.id === 'camera-closewide24' || entry.id === 'camera-closewide35') {
      const focalId = entry.id.endsWith('24') ? 'camera-wide24' : 'camera-wide35';
      const focalEntry = legacyCatalog.entries.find((candidate): candidate is ShorthandEntry => candidate.kind !== 'preset' && candidate.id === focalId);
      const focalAtomId = focalEntry ? legacyAtomId(focalEntry) : `atom.legacy.${safeRecordId(focalId)}`;
      if (focalEntry && !atoms.some((atom) => atom.id === focalAtomId)) atoms.push(atomFromEntry(focalEntry));
      const distanceId = 'atom.camera.distance.close';
      if (!atoms.some((atom) => atom.id === distanceId)) atoms.push(syntheticAtom(distanceId, axisId('camera.distance'), 'Close subject distance', 'cam:distance-close', 'Use a physically close subject-to-camera distance with dimensional foreground scale.', 1, 'A close subject distance that changes the visible scale relationship.', ['camera-cues']));
      const bundleId = `bundle.camera.${entry.id.replace('camera-', '')}`;
      bundles.push({
        kind: 'bundle',
        id: bundleId,
        ...common(entry, 'taxon.units.optics.camera'),
        atomIds: [focalAtomId, distanceId],
      });
      entryTargetIds.set(entry.id, [bundleId]);
      legacyMap.push(makeLegacyMap(entry, [bundleId], 'split', 'The source combines a focal cue and a close-distance cue, so V2 exposes an atomic bundle without discarding the original wording.'));
      continue;
    }
    const atom = entry.id === 'render-draft' || entry.id === 'render-final' || entry.id === 'render-2k' || entry.id === 'render-4k' || entry.id === 'render-web-hq'
      ? atomFromEntry({ ...entry, direction: entry.token, meaning: entry.meaning }, axisId('output.resolution'), undefined, entry.token)
      : atomFromEntry(entry);
    atoms.push(atom);
    entryTargetIds.set(entry.id, [atom.id]);
    legacyMap.push(makeLegacyMap(entry, [atom.id], 'retained', `Mapped to ${axisById.get(atom.axisId)?.label ?? atom.axisId}; source text and caution remain available through the legacy copy view.`));
  }

  const addSynthetic = (item: Atom): void => { if (!atoms.some((atom) => atom.id === item.id)) atoms.push(item); };
  addSynthetic(syntheticAtom('atom.mood.tone.calm', axisId('mood.tone'), 'Calm tone', 'mood:calm', 'Use a calm, measured visual tone.', 1, 'A restrained, calm emotional temperature.'));
  addSynthetic(syntheticAtom('atom.mood.tone.energetic', axisId('mood.tone'), 'Energetic tone', 'mood:energetic', 'Use an energetic, immediate visual tone.', 2, 'An active, high-energy emotional temperature.'));
  addSynthetic(syntheticAtom('atom.mood.tone.restrained', axisId('mood.tone'), 'Restrained tone', 'mood:restrained', 'Use a restrained, quiet visual tone.', 3, 'A quiet emotional temperature with controlled emphasis.'));
  addSynthetic(syntheticAtom('atom.constraint.keep.identity', axisId('constraint.keep'), 'Preserve identity', 'keep:identity', 'Preserve subject identity and recognizable features.', 1, 'Keep the subject identity stable.'));
  addSynthetic(syntheticAtom('atom.constraint.keep.camera', axisId('constraint.keep'), 'Preserve camera', 'keep:camera', 'Preserve the current camera, framing, and lens feel.', 2, 'Keep camera and framing stable.'));
  addSynthetic(syntheticAtom('atom.constraint.keep.background', axisId('constraint.keep'), 'Preserve background', 'keep:background', 'Preserve the existing background and architecture.', 3, 'Keep the current background stable.'));
  addSynthetic(syntheticAtom('atom.constraint.avoid.clutter', axisId('constraint.avoid'), 'Avoid clutter', 'avoid:clutter', 'Avoid visual clutter and unnecessary objects.', 1, 'Do not add clutter.'));
  addSynthetic(syntheticAtom('atom.constraint.avoid.text', axisId('constraint.avoid'), 'Avoid invented text', 'avoid:text', 'Avoid invented text, logos, or labels.', 2, 'Do not add invented text or branding.'));
  for (const [ratio, order] of [['1:1', 1], ['4:5', 2], ['16:9', 3], ['21:9', 4]] as const) addSynthetic(syntheticAtom(`atom.output.ratio.${ratio.replace(':', '-')}`, axisId('output.ratio'), ratio, `ratio:${ratio.replace(':', '-')}`, ratio, order, `A requested ${ratio} aspect ratio.`, ['render-size']));
  addSynthetic(syntheticAtom('atom.output.resolution.1k', axisId('output.resolution'), '1k', '1k', '1k', 0, 'A 1k-class quality target.', ['render-size']));

  const singleAxisAtoms = new Map<string, Atom[]>();
  for (const atom of atoms) {
    const current = singleAxisAtoms.get(atom.axisId) ?? [];
    current.push(atom);
    singleAxisAtoms.set(atom.axisId, current);
  }
  const finalizedAtoms = atoms.map((atom) => {
    const selectedAxis = axisById.get(atom.axisId);
    if (!selectedAxis || selectedAxis.cardinality !== 'one') return atom;
    return { ...atom, excludes: (singleAxisAtoms.get(atom.axisId) ?? []).filter((other) => other.id !== atom.id).map((other) => other.id) };
  });

  for (const entry of legacyCatalog.entries) {
    if (entry.kind !== 'preset') continue;
    const componentIds = entry.componentEntryIds.flatMap((componentId) => {
      const target = entryTargetIds.get(componentId) ?? [];
      return target.flatMap((id) => {
        const atom = finalizedAtoms.find((candidate) => candidate.id === id);
        if (atom) return [atom.id];
        const bundle = bundles.find((candidate) => candidate.id === id);
        return bundle?.atomIds ?? [];
      });
    });
    const uniqueAtomIds = [...new Set(componentIds)];
    const scopeAxisIds = [...new Set(uniqueAtomIds.map((id) => finalizedAtoms.find((atom) => atom.id === id)?.axisId).filter((id): id is string => Boolean(id)))];
    const preset: V2Preset = {
      kind: 'preset',
      id: entry.id === 'preset-commercial'
        ? 'preset.directed-studio.commercial'
        : entry.id.startsWith('preset-') ? `preset.${safeRecordId(entry.id.slice('preset-'.length))}` : `preset.${safeRecordId(entry.id)}`,
      ...common(entry, 'taxon.presets.legacy'),
      atomIds: uniqueAtomIds,
      scopeAxisIds,
      applicability: ['create', 'edit'],
    };
    presets.push(preset);
    entryTargetIds.set(entry.id, [preset.id]);
    legacyMap.push(makeLegacyMap(entry, [preset.id], 'retained', 'Expanded into ordered atom IDs so the preset remains inspectable and editable.'));
  }

  for (const technique of legacyCatalog.techniques) {
    const target = techniqueRecipeId[technique.id];
    if (target) legacyMap.push(makeTechniqueMap(technique, [target], 'retained', 'Mapped to the equivalent V2 edit recipe while preserving the original technique prompt separately.'));
    else legacyMap.push(makeTechniqueMap(technique, [], 'reference-only', 'No faithful V2 operation was accepted for this technique; keep its original prompt selectable in legacy detail.'));
  }

  const acceptedAtomIdSet = new Set<string>(ACCEPTED_SEED_ATOM_IDS);
  const acceptedAtoms = finalizedAtoms
    .filter((atom) => acceptedAtomIdSet.has(atom.id))
    .map((atom) => ({ ...atom, excludes: atom.excludes.filter((id) => acceptedAtomIdSet.has(id)) }));
  const acceptedPresets = presets.filter((preset) => (ACCEPTED_SEED_PRESET_IDS as readonly string[]).includes(preset.id));
  const acceptedRecipes = editRecipes.filter((recipe) => (ACCEPTED_SEED_RECIPE_IDS as readonly string[]).includes(recipe.id));
  const acceptedTargetIds = new Set<string>([
    ...ACCEPTED_SEED_ATOM_IDS,
    ...ACCEPTED_SEED_PRESET_IDS,
    ...ACCEPTED_SEED_RECIPE_IDS,
  ]);
  const runtimeLegacyMap = legacyMap.map((item) => item.targetIds.some((targetId) => acceptedTargetIds.has(targetId))
    ? item
    : {
      ...item,
      disposition: 'reference-only' as const,
      targetIds: [],
      reason: `${item.reason} This row remains reference-only until a later curation batch is accepted.`,
    });

  const library: LibraryV2 = {
    schemaVersion: 2,
    contentVersion: CONTENT_VERSION,
    taxa,
    axes: adapterAxes,
    atoms: acceptedAtoms,
    bundles: [],
    presets: acceptedPresets,
    editRecipes: acceptedRecipes,
    sources: adapterSources,
    cautions: adapterCautions,
    legacyMap: runtimeLegacyMap,
  };
  const validation = validateLibrary(library);
  if (!validation.ok) throw new Error(`Legacy V2 adapter produced an invalid library: ${validation.errors.map((error) => `${error.path}: ${error.message}`).join('; ')}`);
  return library;
};

export const legacyOriginalFor = (catalog: Catalog, oldId: string, kind?: LegacyOriginal['kind']): readonly LegacyOriginal[] => legacyOriginalsFor(catalog).filter((item) => item.oldId === oldId && (kind === undefined || item.kind === kind));
