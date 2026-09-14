import { describe, expect, it } from 'vitest';
import { CREATE_OUTPUT_DEFAULT_TEXT, newDraftDefaults } from './teleprompter-types';
import type { CueDraft, DraftCommandEnvelope, LibraryV2 } from './teleprompter-types';
import {
  validateCopyCompiledDraftRequest,
  validateCueDraft,
  validateDraftCommand,
  validateQuickAddCommand,
  validateReferenceBindingEnvelope,
  validateSurfaceLayoutRequest,
  validateLibrary,
} from './teleprompter-validation';

const library: LibraryV2 = {
  schemaVersion: 2,
  contentVersion: '2026-09-13.1',
  taxa: [
    { id: 'taxon.units.camera', tree: 'units', label: 'Camera', definition: 'Camera directions', inclusion: 'Camera directions', exclusion: 'Other fields', order: 0 },
    { id: 'taxon.presets.editorial', tree: 'presets', label: 'Editorial', definition: 'Editorial recipes', inclusion: 'Editorial recipes', exclusion: 'Other presets', order: 0 },
    { id: 'taxon.edits.camera-lock', tree: 'edits', label: 'Camera lock', definition: 'Camera preservation', inclusion: 'Camera preservation', exclusion: 'Other edits', order: 0 },
  ],
  axes: [
    { id: 'axis.camera.focal', field: 'cam', label: 'Lens', cardinality: 'one', domain: 'camera', order: 0 },
  ],
  atoms: [{
    kind: 'atom', id: 'atom.camera.natural50', label: 'Natural 50', shorthand: 'cam:natural50', aliases: ['50'], summary: 'Natural perspective', primaryTaxonId: 'taxon.units.camera', facets: {}, sourceIds: ['source.local'], cautionIds: ['caution.camera'], order: 0, status: 'active', axisId: 'axis.camera.focal', expansion: '50mm natural perspective', excludes: [], requires: [], applicability: ['create', 'edit'],
  }],
  bundles: [{
    kind: 'bundle', id: 'bundle.camera.natural50', label: 'Natural 50 setup', shorthand: 'cam:natural50', aliases: [], summary: 'Natural camera setup', primaryTaxonId: 'taxon.units.camera', facets: {}, sourceIds: ['source.local'], cautionIds: [], order: 0, status: 'active', atomIds: ['atom.camera.natural50'],
  }],
  presets: [{
    kind: 'preset', id: 'preset.editorial', label: 'Editorial', shorthand: 'preset:editorial', aliases: [], summary: 'Editorial camera', primaryTaxonId: 'taxon.presets.editorial', facets: {}, sourceIds: ['source.local'], cautionIds: [], order: 0, status: 'active', atomIds: ['atom.camera.natural50'], scopeAxisIds: ['axis.camera.focal'], applicability: ['create', 'edit'],
  }],
  editRecipes: [{
    kind: 'edit-recipe', id: 'recipe.camera-lock', label: 'Camera lock', shorthand: 'edit:camera-lock', aliases: [], summary: 'Preserve camera', primaryTaxonId: 'taxon.edits.camera-lock', facets: {}, sourceIds: ['source.local'], cautionIds: [], order: 0, status: 'active', operation: 'Lock camera', affectedDomains: [], requiredPreservedDomains: ['camera'], slotKeys: [], segments: [{ text: 'Preserve the camera.' }], allowedFields: [], excludesRecipeIds: [],
  }],
  sources: [{ id: 'source.local', kind: 'local', title: 'Local fixture', locator: 'test fixture', basis: 'user-source', evidenceNote: 'Test data only.', reuse: 'user-provided' }],
  cautions: [{ id: 'caution.camera', text: 'Camera choices describe a request, not a guaranteed model capability.' }],
  legacyMap: [{ oldId: 'legacy.natural50', oldToken: '50', disposition: 'alias', targetIds: ['atom.camera.natural50'], reason: 'Alias retained.' }],
};

const draft: CueDraft = {
  schemaVersion: 1,
  id: 'create',
  revision: 0,
  libraryVersion: library.contentVersion,
  what: '',
  choices: [],
  customText: {},
  edits: [],
  references: [],
  manualUnlocks: [],
  outputFormat: 'expanded',
};

describe('Teleprompter shared runtime contracts', () => {
  it('accepts a complete LibraryV2 and a draft against that library', () => {
    expect(validateLibrary(library)).toEqual({ ok: true, value: library });
    expect(validateCueDraft(draft, library)).toEqual({ ok: true, value: draft });
  });

  it('rejects a broken cross-record reference with an actionable path', () => {
    const broken = structuredClone(library) as LibraryV2 & { atoms: Array<LibraryV2['atoms'][number]> };
    broken.atoms[0] = { ...broken.atoms[0]!, axisId: 'axis.camera.missing' };
    const result = validateLibrary(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((error) => error.path.includes('axisId') && error.message.includes('does not exist'))).toBe(true);
  });

  it('accepts semantic commands and rejects unknown operations or revision paths', () => {
    const command: DraftCommandEnvelope = {
      commandId: 'command-1',
      clientId: 'client-1',
      draftId: 'create',
      expectedFieldRevisions: { what: 0 },
      command: { type: 'set-what', text: 'A cyclist crossing a wet street' },
    };
    expect(validateDraftCommand(command)).toEqual({ ok: true, value: command });
    expect(validateDraftCommand({ ...command, expectedFieldRevisions: { 'unknown:field': 0 } }).ok).toBe(false);
    expect(validateDraftCommand({ ...command, command: { type: 'send-arbitrary-ipc' } }).ok).toBe(false);
  });

  it('validates copy requests before they reach the native bridge', () => {
    expect(validateCopyCompiledDraftRequest({ draftId: 'edit', expectedRevision: 2, format: 'shorthand' }).ok).toBe(true);
    expect(validateCopyCompiledDraftRequest({ draftId: 'create', expectedRevision: -1, format: 'expanded' }).ok).toBe(false);
  });

  it('keeps the new Create output policy literal and mode-scoped', () => {
    expect(CREATE_OUTPUT_DEFAULT_TEXT).toBe('4:5 aspect ratio; 2K resolution target');
    expect(newDraftDefaults('create')).toEqual({ mode: 'create', customText: { output: CREATE_OUTPUT_DEFAULT_TEXT } });
    expect(newDraftDefaults('edit')).toEqual({ mode: 'edit', customText: {} });
  });

  it('validates measured layout requests without accepting arbitrary coordinates or dimensions', () => {
    expect(validateSurfaceLayoutRequest({
      surfaceSessionId: 'session-1',
      layoutId: 3,
      preferredWidth: 540,
      intrinsicHeight: 208,
      accessory: 'preview',
      transition: 'expand',
    }).ok).toBe(true);
    expect(validateSurfaceLayoutRequest({
      surfaceSessionId: 'session-1',
      layoutId: 3,
      preferredWidth: Number.POSITIVE_INFINITY,
      intrinsicHeight: 208,
      accessory: 'preview',
      transition: 'expand',
    }).ok).toBe(false);
  });

  it('validates atomic quick-add and opaque reference-binding envelopes', () => {
    expect(validateQuickAddCommand({
      commandId: 'quick-1',
      clientId: 'client-1',
      draftId: 'create',
      expectedFieldRevisions: { what: 0, preset: 0 },
      command: {
        type: 'accept-quick-add',
        acceptance: {
          target: { kind: 'preset', recordId: 'preset.editorial' },
          queryRange: { start: 12, end: 21 },
          queryText: '/preset',
          expectedWhat: 'A portrait /preset',
          expectedContentVersion: library.contentVersion,
        },
      },
    }).ok).toBe(true);
    expect(validateQuickAddCommand({
      commandId: 'quick-1',
      clientId: 'client-1',
      draftId: 'create',
      expectedFieldRevisions: { what: 0 },
      command: {
        type: 'accept-quick-add',
        acceptance: {
          target: { kind: 'snippet', recordId: 'snippet.unknown' },
          queryRange: { start: 8, end: 2 },
          queryText: '/snippet',
          expectedWhat: 'A portrait',
          expectedContentVersion: library.contentVersion,
        },
      },
    }).ok).toBe(false);
    expect(validateReferenceBindingEnvelope({
      draftId: 'create',
      expectedVersion: 0,
      operation: 'upsert',
      binding: { bindingId: 'binding-1', draftId: 'create', imageNumber: 2, label: 'Black bottle', thumbnailHandle: 'thumb-2' },
    }).ok).toBe(true);
    expect(validateReferenceBindingEnvelope({
      draftId: 'create',
      expectedVersion: 0,
      operation: 'upsert',
      binding: { bindingId: 'binding-1', draftId: 'create', imageNumber: 2, label: 'Black bottle', thumbnailHandle: '/tmp/bottle.png' },
    }).ok).toBe(false);
  });
});
