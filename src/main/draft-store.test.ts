import { describe, expect, it } from 'vitest';
import type { CueCommand, CueDraft, LibraryV2 } from '../shared/teleprompter-types';
import {
  createDraftStoreDocument,
  DraftStore,
  parseDraftStore,
  serializeDraftStore,
} from './draft-store';

const library: LibraryV2 = {
  schemaVersion: 2,
  contentVersion: '2026-09-13.1',
  taxa: [],
  axes: [],
  atoms: [],
  bundles: [],
  presets: [],
  editRecipes: [],
  sources: [],
  cautions: [],
  legacyMap: [],
};

const apply = (draft: CueDraft, command: CueCommand) => ({
  ok: true as const,
  draft: command.type === 'set-what' ? { ...draft, what: command.text } : draft,
  touchedPaths: command.type === 'set-what' ? ['what' as const] : [],
});

const command = (clientId: string, commandId: string, text: string, expected = 0) => ({
  commandId,
  clientId,
  draftId: 'create' as const,
  expectedFieldRevisions: { what: expected },
  command: { type: 'set-what' as const, text },
});

describe('draft store', () => {
  it('serializes and restores both drafts without changing the schema', () => {
    const document = createDraftStoreDocument(library);
    const restored = parseDraftStore(JSON.parse(serializeDraftStore(document)), library);
    expect(restored.status).toBe('loaded');
    expect(restored.document.drafts.create.id).toBe('create');
    expect(restored.document.drafts.edit.id).toBe('edit');
    expect(restored.document.libraryVersion).toBe(library.contentVersion);
  });

  it('accepts ordered edits and rejects a stale same-field write', () => {
    const store = new DraftStore(library, { applyDraftCommand: apply });
    const first = store.apply(command('client-a', 'one', 'first'), { accelerator: 'x', registered: true }, 'disk');
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.snapshot.drafts.create.what).toBe('first');
    expect(first.value.snapshot.sequence).toBe(1);

    const stale = store.apply(command('client-b', 'two', 'stale'), { accelerator: 'x', registered: true }, 'disk');
    expect(stale.ok).toBe(false);
    if (stale.ok) return;
    expect(stale.error.code).toBe('CONFLICT');
    expect(stale.snapshot?.drafts.create.what).toBe('first');
    expect(stale.error.conflicts?.[0]?.path).toBe('what');
  });

  it('returns the cached acknowledgement for a duplicate command ID', () => {
    const store = new DraftStore(library, { applyDraftCommand: apply });
    const first = store.apply(command('client-a', 'same', 'first'), { accelerator: 'x', registered: true }, 'disk');
    const duplicate = store.apply(command('client-a', 'same', 'different'), { accelerator: 'x', registered: true }, 'disk');
    expect(duplicate).toEqual(first);
  });

  it('preserves the previous draft for one-step undo', () => {
    const store = new DraftStore(library, { applyDraftCommand: apply });
    store.apply(command('client-a', 'one', 'first'), { accelerator: 'x', registered: true }, 'disk');
    const undone = store.apply({
      commandId: 'undo',
      clientId: 'client-a',
      draftId: 'create',
      expectedFieldRevisions: { draft: 0 },
      command: { type: 'undo-draft' },
    }, { accelerator: 'x', registered: true }, 'disk');
    expect(undone.ok).toBe(true);
    if (undone.ok) expect(undone.value.snapshot.drafts.create.what).toBe('');
  });
});
