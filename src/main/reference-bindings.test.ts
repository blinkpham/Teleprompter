import { describe, expect, it } from 'vitest';
import type { ReferenceBindingEnvelope } from '../shared/teleprompter-types';
import { ReferenceBindingStore, createReferenceBindingsDocument, parseReferenceBindings } from './reference-bindings';

const binding = (bindingId: string, imageNumber: number, label = `Image ${imageNumber}`): ReferenceBindingEnvelope => ({
  draftId: 'create',
  expectedVersion: 0,
  operation: 'upsert',
  binding: { bindingId, draftId: 'create', imageNumber, label, thumbnailHandle: `thumb-${imageNumber}` },
});

describe('local reference bindings', () => {
  it('starts empty, upserts by stable image slot, and increments the version', () => {
    const store = new ReferenceBindingStore();
    expect(store.list('create', 0, 0)).toEqual({ ok: true, snapshot: { draftId: 'create', version: 0, bindings: [] } });
    const added = store.apply(binding('binding-1', 2));
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.snapshot.version).toBe(1);
    expect(added.snapshot.bindings[0]?.thumbnailHandle).toBe('thumb-2');

    const rebound = store.apply({ ...binding('binding-2', 2, 'Black bottle'), expectedVersion: 1 });
    expect(rebound.ok).toBe(true);
    if (rebound.ok) expect(rebound.snapshot.bindings).toEqual([{ bindingId: 'binding-2', draftId: 'create', imageNumber: 2, label: 'Black bottle', thumbnailHandle: 'thumb-2' }]);
  });

  it('rejects stale versions and removes only the addressed binding', () => {
    const store = new ReferenceBindingStore();
    store.apply(binding('binding-1', 1));
    const stale = store.apply(binding('binding-2', 2));
    expect(stale).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });

    const removed = store.apply({ draftId: 'create', expectedVersion: 1, operation: 'remove', bindingId: 'binding-1', imageNumber: 1 });
    expect(removed).toMatchObject({ ok: true, snapshot: { version: 2, bindings: [] } });
  });

  it('keeps draft revision checks separate from binding version checks', () => {
    const store = new ReferenceBindingStore(createReferenceBindingsDocument());
    expect(store.list('edit', 2, 3)).toMatchObject({ ok: false, error: { code: 'STALE_DRAFT' } });
  });

  it('recovers invalid persisted handles without treating them as filesystem paths', () => {
    const parsed = parseReferenceBindings({
      schemaVersion: 1,
      drafts: {
        create: { version: 1, bindings: [{ bindingId: 'binding-1', draftId: 'create', imageNumber: 1, label: 'Bottle', thumbnailHandle: '/tmp/bottle.png' }] },
        edit: { version: 0, bindings: [] },
      },
    });
    expect(parsed.status).toBe('recovered');
    expect(parsed.document.drafts.create.bindings).toEqual([]);
  });
});
