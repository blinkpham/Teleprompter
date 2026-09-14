import { describe, expect, it } from 'vitest';
import { legacyLibrary } from '../../content';
import type { CueDraft, QuickAddCommandEnvelope } from '../../shared/teleprompter-types';
import { applyDraftCommand, touchedPathsForCommand } from './commands';
import {
  applyQuickAddCommand,
  applyQuickAddEnvelope,
  touchedPathsForQuickAddCommand,
} from './quick-add';

const createDraft = (what: string): CueDraft => ({
  schemaVersion: 1,
  id: 'create',
  revision: 0,
  libraryVersion: legacyLibrary.contentVersion,
  what,
  choices: [],
  customText: {},
  edits: [],
  references: [],
  manualUnlocks: [],
  outputFormat: 'expanded',
});

const editDraft = (what: string): CueDraft => ({ ...createDraft(what), id: 'edit' });

describe('atomic quick add', () => {
  it('replaces the exact preset query and applies the existing preset semantics once', () => {
    const draft = createDraft('A portrait /preset');
    const result = applyQuickAddCommand(legacyLibrary, draft, {
      type: 'accept-quick-add',
      acceptance: {
        target: { kind: 'preset', recordId: 'preset.directed-studio.commercial' },
        queryRange: { start: 11, end: 18 },
        queryText: '/preset',
        expectedWhat: draft.what,
        expectedContentVersion: legacyLibrary.contentVersion,
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.draft.what).toBe('A portrait ');
    expect(result.value.draft.revision).toBe(1);
    expect(result.value.draft.activePresetId).toBe('preset.directed-studio.commercial');
    expect(result.value.touchedPaths[0]).toBe('what');
    expect(result.value.touchedPaths).toContain('preset');
    expect(result.value.touchedPaths).toContain('axis:axis.camera.focal');
  });

  it('routes a token through axis selection and does not toggle an already-selected token off', () => {
    const draft = createDraft('Natural /token');
    const acceptance = {
      type: 'accept-quick-add' as const,
      acceptance: {
        target: { kind: 'token' as const, recordId: 'atom.camera.focal.natural50' },
        queryRange: { start: 8, end: 14 },
        queryText: '/token',
        expectedWhat: draft.what,
        expectedContentVersion: legacyLibrary.contentVersion,
      },
    };
    const first = applyQuickAddCommand(legacyLibrary, draft, acceptance);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.draft.choices).toEqual([expect.objectContaining({ axisId: 'axis.camera.focal', atomIds: ['atom.camera.focal.natural50'] })]);

    const repeatedDraft = { ...first.value.draft, what: 'Natural /token', revision: 0 };
    const repeated = applyQuickAddCommand(legacyLibrary, repeatedDraft, { ...acceptance, acceptance: { ...acceptance.acceptance, expectedWhat: repeatedDraft.what } });
    expect(repeated.ok).toBe(true);
    if (repeated.ok) expect(repeated.value.draft.choices[0]?.atomIds).toEqual(['atom.camera.focal.natural50']);
  });

  it('adds an Edit recipe only in the Edit draft', () => {
    const draft = editDraft('Fix /edit');
    const result = applyDraftCommand(legacyLibrary, draft, {
      type: 'accept-quick-add',
      acceptance: {
        target: { kind: 'edit', recordId: 'edit.local.surgical-correction' },
        queryRange: { start: 4, end: 9 },
        queryText: '/edit',
        expectedWhat: draft.what,
        expectedContentVersion: legacyLibrary.contentVersion,
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.draft.what).toBe('Fix ');
      expect(result.value.draft.edits.map((choice) => choice.recipeId)).toEqual(['edit.local.surgical-correction']);
      expect(result.value.draft.revision).toBe(1);
      expect(result.value.touchedPaths).toEqual(['what', 'recipe:edit.local.surgical-correction']);
    }

    const createResult = applyQuickAddCommand(legacyLibrary, createDraft('Fix /edit'), {
      type: 'accept-quick-add',
      acceptance: {
        target: { kind: 'edit', recordId: 'edit.local.surgical-correction' },
        queryRange: { start: 4, end: 9 },
        queryText: '/edit',
        expectedWhat: 'Fix /edit',
        expectedContentVersion: legacyLibrary.contentVersion,
      },
    });
    expect(createResult.ok).toBe(false);
    if (!createResult.ok) expect(createResult.issue.code).toBe('INCOMPATIBLE_TARGET');
  });

  it('inserts approved literal snippets and numbered references without hidden semantic changes', () => {
    const snippetDraft = createDraft('Add /snippet now');
    const snippet = applyQuickAddCommand(legacyLibrary, snippetDraft, {
      type: 'accept-quick-add',
      acceptance: {
        target: { kind: 'snippet', recordId: 'atom.camera.focal.natural50' },
        queryRange: { start: 4, end: 12 },
        queryText: '/snippet',
        expectedWhat: snippetDraft.what,
        expectedContentVersion: legacyLibrary.contentVersion,
      },
    });
    expect(snippet.ok).toBe(true);
    if (snippet.ok) {
      expect(snippet.value.draft.what).toBe(`Add ${legacyLibrary.atoms.find((atom) => atom.id === 'atom.camera.focal.natural50')?.expansion} now`);
      expect(snippet.value.draft.choices).toEqual([]);
      expect(snippet.value.touchedPaths).toEqual(['what']);
    }

    const referenceDraft = createDraft('Use @here');
    const reference = applyQuickAddCommand(legacyLibrary, referenceDraft, {
      type: 'accept-quick-add',
      acceptance: {
        target: { kind: 'reference', imageNumber: 2 },
        queryRange: { start: 4, end: 9 },
        queryText: '@here',
        expectedWhat: referenceDraft.what,
        expectedContentVersion: legacyLibrary.contentVersion,
      },
    });
    expect(reference.ok).toBe(true);
    if (reference.ok) expect(reference.value.draft.what).toBe('Use Image 2');
  });

  it('rejects stale content, repeated acceptance, exact-range drift, and revision conflicts atomically', () => {
    const draft = createDraft('A /preset /preset');
    const acceptance = {
      type: 'accept-quick-add' as const,
      acceptance: {
        target: { kind: 'preset' as const, recordId: 'preset.directed-studio.commercial' },
        queryRange: { start: 2, end: 9 },
        queryText: '/preset',
        expectedWhat: draft.what,
        expectedContentVersion: legacyLibrary.contentVersion,
      },
    };
    const first = applyQuickAddCommand(legacyLibrary, draft, acceptance);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = applyQuickAddCommand(legacyLibrary, first.value.draft, acceptance);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.issue.code).toBe('INVALID_QUERY');

    const stale = applyQuickAddCommand(legacyLibrary, draft, { ...acceptance, acceptance: { ...acceptance.acceptance, expectedContentVersion: '2026-09-13.1' } });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.issue.code).toBe('STALE_CONTENT');

    const rangeDrift = applyQuickAddCommand(legacyLibrary, draft, { ...acceptance, acceptance: { ...acceptance.acceptance, queryRange: { start: 3, end: 10 } } });
    expect(rangeDrift.ok).toBe(false);
    if (!rangeDrift.ok) expect(rangeDrift.issue.code).toBe('INVALID_QUERY');

    const envelope: QuickAddCommandEnvelope = {
      commandId: 'quick-1',
      clientId: 'client-1',
      draftId: 'create',
      expectedFieldRevisions: { what: 0, preset: 0, 'axis:axis.camera.focal': 0 },
      command: acceptance,
    };
    const conflict = applyQuickAddEnvelope(legacyLibrary, draft, envelope, { what: 1, preset: 0, 'axis:axis.camera.focal': 0 });
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.issue.code).toBe('REVISION_CONFLICT');
      expect(conflict.issue.path).toBe('what');
    }

    const wrongMode = applyQuickAddEnvelope(legacyLibrary, draft, { ...envelope, draftId: 'edit' }, { what: 0, preset: 0, 'axis:axis.camera.focal': 0 });
    expect(wrongMode.ok).toBe(false);
    if (!wrongMode.ok) expect(wrongMode.issue.code).toBe('INCOMPATIBLE_TARGET');
  });

  it('reports the same deterministic touched paths through the normal engine seam', () => {
    const draft = createDraft('/preset');
    const command = {
      type: 'accept-quick-add' as const,
      acceptance: {
        target: { kind: 'preset' as const, recordId: 'preset.directed-studio.commercial' },
        queryRange: { start: 0, end: 7 },
        queryText: '/preset',
        expectedWhat: draft.what,
        expectedContentVersion: legacyLibrary.contentVersion,
      },
    };
    expect(touchedPathsForQuickAddCommand(legacyLibrary, draft, command)).toEqual(touchedPathsForCommand(legacyLibrary, draft, command));
  });
});
