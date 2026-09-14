import { describe, expect, it } from 'vitest';
import { catalog } from '../../content/catalog';
import { legacyLibrary, legacyMappingSummaryFor, legacyOriginalsFor } from '../../content';
import { validateLibrary } from '../../shared/teleprompter-validation';
import { applyDraftCommand } from './commands';
import { compileCreate, compileEdit } from './compile';
import { createDraft, applyPreset, selectAxis } from './selection';
import { listChoices, searchLibrary } from './choices';

describe('Teleprompter Cue engine', () => {
  it('imports the accepted seed and preserves the full legacy recovery map', () => {
    const validation = validateLibrary(legacyLibrary);
    expect(validation.ok).toBe(true);
    expect(legacyLibrary.atoms).toHaveLength(9);
    expect(legacyLibrary.presets).toHaveLength(1);
    expect(legacyLibrary.editRecipes).toHaveLength(4);
    expect(legacyLibrary.bundles).toHaveLength(0);
    expect(legacyLibrary.legacyMap).toHaveLength(119);
    expect(legacyLibrary.legacyMap.filter((item) => item.disposition === 'reference-only')).toHaveLength(101);
    expect(legacyOriginalsFor(catalog)).toHaveLength(119);
    expect(legacyMappingSummaryFor(legacyLibrary)).toMatchObject({ mapped: 14, referenceOnly: 101, techniqueMapped: 4 });
  });

  it('compiles a new Create template with the product-authored output default', () => {
    const draft = createDraft(legacyLibrary, 'create');
    expect(compileCreate(legacyLibrary, draft)).toMatchObject({
      text: 'WHAT:\n[subject + action + scene]\n\nCAM:\n[camera / lens / depth / focus]\n\nANGLE:\n[camera angle]\n\nCOMP:\n[composition]\n\nLIGHT:\n[lighting]\n\nLOOK:\n[look]\n\nMOOD:\n[mood]\n\nIMPORTANT:\n[important details]\n\nAVOID:\n[things to avoid]\n\nOUTPUT:\n4:5 aspect ratio; 2K resolution target\n',
      errors: [],
      placeholders: [],
    });
  });

  it('keeps the output default scoped to new Create and reset', () => {
    const create = createDraft(legacyLibrary, 'create');
    const edit = createDraft(legacyLibrary, 'edit');
    expect(create.customText.output).toBe('4:5 aspect ratio; 2K resolution target');
    expect(edit.customText.output).toBeUndefined();
    const changed = applyDraftCommand(legacyLibrary, create, { type: 'set-custom-text', field: 'output', text: '16:9 custom' });
    expect(changed.ok).toBe(true);
    if (!changed.ok) return;
    const reset = applyDraftCommand(legacyLibrary, changed.value.draft, { type: 'reset-draft' });
    expect(reset.ok).toBe(true);
    if (reset.ok) expect(reset.value.draft.customText.output).toBe('4:5 aspect ratio; 2K resolution target');
  });

  it('unfolds a preset, lets a manual axis override win, and stays deterministic', () => {
    const first = applyPreset(legacyLibrary, createDraft(legacyLibrary, 'create'), 'preset.directed-studio.commercial');
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const overridden = selectAxis(legacyLibrary, first.value.draft, 'axis.camera.focal', ['atom.camera.focal.natural50']);
    expect(overridden.ok).toBe(true);
    if (!overridden.ok) return;
    const compiled = compileCreate(legacyLibrary, overridden.value.draft);
    expect(compiled.errors).toEqual([]);
    expect(compiled.text).toContain('Use a balanced perspective cue for polished commercial/editorial realism.');
    expect(compiled.text).not.toContain('Use a classic advertising/social environmental portrait cue with energetic, natural, versatile perspective.');

    const orderedOne = selectAxis(legacyLibrary, createDraft(legacyLibrary, 'create'), 'axis.camera.depth', ['atom.camera.depth.medium']);
    expect(orderedOne.ok).toBe(true);
    if (!orderedOne.ok) return;
    const orderedOneDone = selectAxis(legacyLibrary, orderedOne.value.draft, 'axis.camera.focal', ['atom.camera.focal.natural50']);
    expect(orderedOneDone.ok).toBe(true);
    if (!orderedOneDone.ok) return;
    const orderedTwo = selectAxis(legacyLibrary, createDraft(legacyLibrary, 'create'), 'axis.camera.focal', ['atom.camera.focal.natural50']);
    expect(orderedTwo.ok).toBe(true);
    if (!orderedTwo.ok) return;
    const orderedTwoDone = selectAxis(legacyLibrary, orderedTwo.value.draft, 'axis.camera.depth', ['atom.camera.depth.medium']);
    expect(orderedTwoDone.ok).toBe(true);
    if (!orderedTwoDone.ok) return;
    expect(compileCreate(legacyLibrary, orderedOneDone.value.draft).text).toBe(compileCreate(legacyLibrary, orderedTwoDone.value.draft).text);
  });

  it('keeps edit changes separate from preserved domains and exposes empty slots', () => {
    let draft = createDraft(legacyLibrary, 'edit');
    const recipe = applyDraftCommand(legacyLibrary, draft, { type: 'select-recipe', recipeId: 'edit.local.surgical-correction' });
    expect(recipe.ok).toBe(true);
    if (!recipe.ok) return;
    draft = recipe.value.draft;
    const compiled = compileEdit(legacyLibrary, draft);
    expect(compiled.errors).toEqual([]);
    expect(compiled.text).toContain('Change only [requested element].');
    expect(compiled.text).toContain('identity, pose, wardrobe, camera, composition, background, lighting, style, color. Preserve unaffected objects and regions.');
    expect(compiled.placeholders).toContainEqual({ key: 'edit.local.surgical-correction.slot.requested-element', label: 'requested element' });
  });

  it('projects namespaced choices and applies immutable commands with touched paths', () => {
    const cameraChoices = listChoices(legacyLibrary, { field: 'cam', mode: 'create' });
    expect(cameraChoices.map((choice) => choice.id)).toEqual([
      'atom.camera.focal.wide35',
      'atom.camera.focal.natural50',
      'atom.camera.focal.portrait85',
      'atom.camera.depth.medium',
    ]);
    expect(searchLibrary(legacyLibrary, 'cam:50', { field: 'cam' }).map((choice) => choice.id)).toContain('atom.camera.focal.natural50');

    const draft = createDraft(legacyLibrary, 'create');
    const result = applyDraftCommand(legacyLibrary, draft, { type: 'set-axis', axisId: 'axis.camera.focal', atomIds: ['atom.camera.focal.natural50'] });
    expect(result.ok).toBe(true);
    expect(draft.choices).toEqual([]);
    if (result.ok) {
      expect(result.value.touchedPaths).toEqual(['axis:axis.camera.focal', 'preset']);
      expect(result.value.draft.choices[0]?.atomIds).toEqual(['atom.camera.focal.natural50']);
    }
  });
});
