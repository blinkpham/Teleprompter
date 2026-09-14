import type { CueDraft, ReferenceBinding, ReferenceRole } from '../../../shared/teleprompter';

export interface ReferenceSlotView {
  readonly imageNumber: number;
  readonly role?: ReferenceRole;
  readonly binding?: ReferenceBinding;
  readonly mentioned: boolean;
}

const IMAGE_MENTION = /\bImage\s+([1-9]|1[0-9]|20)\b/gi;

export const mentionedImageNumbers = (value: string): readonly number[] => {
  const numbers = new Set<number>();
  for (const match of value.matchAll(IMAGE_MENTION)) {
    const number = Number(match[1]);
    if (Number.isInteger(number)) numbers.add(number);
  }
  return [...numbers].sort((left, right) => left - right);
};

export const referenceSlots = (draft: CueDraft, bindings: readonly ReferenceBinding[] = []): readonly ReferenceSlotView[] => {
  const roles = new Map(draft.references.map((reference) => [reference.imageNumber, reference]));
  const local = new Map(bindings.map((binding) => [binding.imageNumber, binding]));
  const mentioned = new Set(mentionedImageNumbers(draft.what));
  const numbers = new Set([...roles.keys(), ...local.keys(), ...mentioned]);
  return [...numbers].sort((left, right) => left - right).map((imageNumber) => ({
    imageNumber,
    ...(roles.get(imageNumber) ? { role: roles.get(imageNumber) } : {}),
    ...(local.get(imageNumber) ? { binding: local.get(imageNumber) } : {}),
    mentioned: mentioned.has(imageNumber),
  }));
};

export const nextReferenceNumber = (slots: readonly ReferenceSlotView[]): number => {
  const used = new Set(slots.map((slot) => slot.imageNumber));
  for (let number = 1; number <= 20; number += 1) if (!used.has(number)) return number;
  return 20;
};
