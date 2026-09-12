import type { Catalog, Category, Caution, Family, ResolutionExample } from '../shared/catalog-types';
import { techniques } from './techniques';
import { entries } from './shorthand';

export { techniques } from './techniques';
export {
  angleEntries,
  cameraEntries,
  compositionEntries,
  depthFocusEntries,
  entries,
  lightingEntries,
  lookEntries,
  patternEntries,
  presetEntries,
  renderEntries,
  routeEntries,
  shorthandEntries,
} from './shorthand';

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
  { id: 'reference-patterns', label: 'Reference & markup patterns', order: 10, introCautionIds: ['reference-roles'] },
];

export const cautions: readonly Caution[] = [
  { id: 'preservation', text: 'Prompting can request preservation, but it cannot guarantee identical pixels. Use a local mask or composite the edited area when unchanged pixels must stay exact.' },
  { id: 'reference-roles', text: 'Use the first image as the base unless you specify otherwise. Give each reference one role and transfer only that role. Existing reference constraints take priority over preset defaults.' },
  { id: 'camera-cues', text: 'Focal-length names describe a visual look. They do not guarantee a physically simulated lens or camera.' },
  { id: 'render-size', text: 'Exact dimensions depend on the image backend. If it does not expose pixel controls, 2k and 4k are quality targets. Check the returned image before claiming its size.' },
  { id: 'restoration', text: "Restore the same image's quality. Keep identity, content, framing, geometry, and lighting; do not redesign or invent detail." },
];

export const resolutionExamples: readonly ResolutionExample[] = [
  { renderEntryId: 'render-2k', aspectRatioLabel: '1:1', pixelsText: '2048x2048' },
  { renderEntryId: 'render-2k', aspectRatioLabel: '16:9', pixelsText: '2048x1152' },
  { renderEntryId: 'render-2k', aspectRatioLabel: '9:16', pixelsText: '1152x2048' },
  { renderEntryId: 'render-2k', aspectRatioLabel: '4:5', pixelsText: '1632x2048' },
  { renderEntryId: 'render-2k', aspectRatioLabel: '5:4', pixelsText: '2048x1632' },
  { renderEntryId: 'render-2k', aspectRatioLabel: '3:2', pixelsText: '2048x1360', note: 'or nearest supported multiple-of-16 size' },
  { renderEntryId: 'render-2k', aspectRatioLabel: '2:3', pixelsText: '1360x2048', note: 'or nearest supported multiple-of-16 size' },
  { renderEntryId: 'render-4k', aspectRatioLabel: '16:9', pixelsText: '3840x2160' },
  { renderEntryId: 'render-4k', aspectRatioLabel: '9:16', pixelsText: '2160x3840' },
];

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
