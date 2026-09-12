import { describe, expect, it } from 'vitest';
import { catalog } from '../content/catalog';
import { validateCatalog } from './index';

describe('seed catalog', () => {
  it('has no broken cross-references', () => {
    expect(catalog.techniques).toHaveLength(15);
    expect(catalog.entries).toHaveLength(104);
    expect(validateCatalog(catalog)).toEqual([]);
  });
});
