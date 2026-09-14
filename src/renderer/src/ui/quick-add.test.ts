import { describe, expect, it } from 'vitest';
import { findQuickAddTrigger } from './quick-add';

describe('quick-add trigger matching', () => {
  it('recognizes category and colon queries at a word boundary', () => {
    const value = 'A scene /preset: commercial';
    expect(findQuickAddTrigger(value, value.length)).toMatchObject({
      trigger: 'slash', category: 'preset', query: 'commercial', start: 8, end: value.length,
    });
  });

  it('recognizes numbered reference mentions without opening for email or paths', () => {
    expect(findQuickAddTrigger('Use @2', 6)).toMatchObject({ trigger: 'mention', category: 'reference', query: '2' });
    expect(findQuickAddTrigger('mail me@example.com', 19)).toBeUndefined();
    expect(findQuickAddTrigger('folder/name', 11)).toBeUndefined();
  });

  it('keeps unknown slash prose, pasted text, and IME composition ordinary', () => {
    expect(findQuickAddTrigger('Write /hello', 12)).toBeUndefined();
    expect(findQuickAddTrigger('/preset', 7, 7, true)).toBeUndefined();
  });
});
