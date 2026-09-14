import { describe, expect, it } from 'vitest';
import type { CueDraft, ReferenceBinding } from '../../../shared/teleprompter';
import { mentionedImageNumbers, nextReferenceNumber, referenceSlots, thumbnailIsBound } from './reference-manager';

const draft = (what: string, references: CueDraft['references'] = []): CueDraft => ({
  schemaVersion: 1,
  id: 'edit',
  revision: 3,
  libraryVersion: '2026-09-13.0',
  what,
  choices: [],
  customText: {},
  edits: [],
  references,
  manualUnlocks: [],
  outputFormat: 'expanded',
});

const binding = (imageNumber: number, label = `Image ${imageNumber}`): ReferenceBinding => ({
  bindingId: `binding-${imageNumber}`,
  draftId: 'edit',
  imageNumber,
  label,
  thumbnailHandle: `thumb-${imageNumber}`,
});

describe('reference manager projections', () => {
  it('extracts unique bounded Image N mentions without renumbering them', () => {
    expect(mentionedImageNumbers('Image 2 and Image 2; Image 10, Image 21, Image 0')).toEqual([2, 10]);
  });

  it('unions roles, local bindings, and prose mentions in stable number order', () => {
    const slots = referenceSlots(draft('Use Image 7', [{ imageNumber: 2, role: 'identity', note: 'face' }]), [binding(7, 'Hero')]);
    expect(slots.map((slot) => slot.imageNumber)).toEqual([2, 7]);
    expect(slots[0]).toMatchObject({ role: { role: 'identity' }, mentioned: false });
    expect(slots[1]).toMatchObject({ binding: { label: 'Hero' }, mentioned: true });
  });

  it('returns the first free number and keeps the bounded fallback at 20', () => {
    expect(nextReferenceNumber([{ imageNumber: 1, mentioned: false }, { imageNumber: 3, mentioned: false }])).toBe(2);
    expect(nextReferenceNumber(Array.from({ length: 20 }, (_, index) => ({ imageNumber: index + 1, mentioned: false })))).toBe(20);
  });

  it('distinguishes a saved thumbnail from an unbound slot', () => {
    expect(thumbnailIsBound(binding(1))).toBe(true);
    expect(thumbnailIsBound({ ...binding(2), thumbnailHandle: undefined })).toBe(false);
  });
});
