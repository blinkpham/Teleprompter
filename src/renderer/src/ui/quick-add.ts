import type { QuickAddRecordKind, QuickAddTrigger } from '../../../shared/teleprompter';

export type QuickAddCategory = QuickAddRecordKind | 'reference' | null;

export interface QuickAddTriggerMatch {
  readonly trigger: QuickAddTrigger;
  readonly category: QuickAddCategory;
  readonly query: string;
  readonly start: number;
  readonly end: number;
}

const CATEGORIES: readonly QuickAddRecordKind[] = ['preset', 'token', 'edit', 'snippet'];
const WORD_BOUNDARY = /[\s([{"',;:]/;
const isBoundary = (value: string, index: number): boolean => index <= 0 || WORD_BOUNDARY.test(value[index - 1] ?? '');

const slashCategory = (body: string): { category: QuickAddCategory; query: string; valid: boolean } => {
  if (body.length === 0) return { category: null, query: '', valid: true };
  const separator = body.search(/[:\s]/);
  const head = separator < 0 ? body : body.slice(0, separator);
  const exact = CATEGORIES.find((category) => category === head);
  if (exact) return { category: exact, query: body.slice(head.length).replace(/^[:\s]+/, ''), valid: true };
  if (separator < 0 && CATEGORIES.some((category) => category.startsWith(head))) return { category: null, query: head, valid: true };
  return { category: null, query: body, valid: false };
};

/** Finds only a locally typed trigger immediately before the caret. */
export function findQuickAddTrigger(
  value: string,
  caret: number,
  selectionEnd = caret,
  composing = false,
): QuickAddTriggerMatch | undefined {
  if (composing || caret !== selectionEnd || caret < 0 || caret > value.length) return undefined;
  const lineStart = value.lastIndexOf('\n', Math.max(0, caret - 1)) + 1;
  for (let triggerIndex = caret - 1; triggerIndex >= lineStart; triggerIndex -= 1) {
    const trigger = value[triggerIndex];
    if (trigger !== '/' && trigger !== '@') continue;
    if (!isBoundary(value, triggerIndex)) continue;
    const body = value.slice(triggerIndex + 1, caret);
    if (body.includes('\n')) continue;
    if (trigger === '@') {
      if (body.includes('/') || body.includes(':')) continue;
      return { trigger: 'mention', category: 'reference', query: body, start: triggerIndex, end: caret };
    }
    const parsed = slashCategory(body);
    if (parsed.valid) return { trigger: 'slash', category: parsed.category, query: parsed.query, start: triggerIndex, end: caret };
  }
  return undefined;
}
