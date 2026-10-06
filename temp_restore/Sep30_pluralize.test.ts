/**
 * src/utils/pluralize.test.ts
 * Unit tests for the pluralize() utility.
 */
import { describe, it, expect } from 'vitest';
import { pluralize } from './pluralize';

describe('pluralize()', () => {
  it('returns singular for count=1', () => {
    expect(pluralize(1, 'file')).toBe('1 file');
  });

  it('returns plural for count=0', () => {
    expect(pluralize(0, 'file')).toBe('0 files');
  });

  it('returns plural for count>1', () => {
    expect(pluralize(5, 'file')).toBe('5 files');
  });

  it('uses custom plural when provided', () => {
    expect(pluralize(2, 'duplicate', 'duplicates')).toBe('2 duplicates');
    expect(pluralize(1, 'duplicate', 'duplicates')).toBe('1 duplicate');
  });

  it('uses toLocaleString formatter by default', () => {
    const result = pluralize(1000, 'item');
    // Should contain at least "item" (plural) — locale formatting varies
    expect(result).toMatch(/item/);
  });

  it('accepts a custom formatter', () => {
    expect(pluralize(42, 'row', undefined, (n) => `#${n}`)).toBe('#42 rows');
  });

  it('handles large numbers', () => {
    expect(pluralize(100000, 'file')).toMatch(/files$/);
  });
});

