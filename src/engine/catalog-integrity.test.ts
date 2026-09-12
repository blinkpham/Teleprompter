import { describe, expect, it } from 'vitest';
import { catalog } from '../content/catalog';
import { validateCatalog } from './index';

describe('seed catalog', () => {
  it('has no broken cross-references', () => {
    expect(validateCatalog(catalog)).toEqual([]);
  });
});
