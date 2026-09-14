import { describe, expect, it } from 'vitest';
import { findQuickAddTrigger } from './quick-add';

describe('quick-add trigger detection', () => {
  it('recognizes categories and mentions at the caret', () => {
    expect(findQuickAddTrigger('Use /token natural', 18)).toMatchObject({ trigger: 'slash', category: 'token', query: 'natural', start: 4, end: 18 });
    expect(findQuickAddTrigger('Use @2', 6)).toMatchObject({ trigger: 'mention', category: 'reference', query: '2', start: 4, end: 6 });
    expect(findQuickAddTrigger('/pre', 4)).toMatchObject({ trigger: 'slash', category: null, query: 'pre' });
  });

  it('does not open on email addresses, paths, punctuation-boundary failures, or composition', () => {
    expect(findQuickAddTrigger('mail@example.com', 16)).toBeUndefined();
    expect(findQuickAddTrigger('path /tmp/file', 14)).toBeUndefined();
    expect(findQuickAddTrigger('word/token', 10)).toBeUndefined();
    expect(findQuickAddTrigger('Use @one/two', 12)).toBeUndefined();
    expect(findQuickAddTrigger('Use /token', 10, 10, true)).toBeUndefined();
  });
});
