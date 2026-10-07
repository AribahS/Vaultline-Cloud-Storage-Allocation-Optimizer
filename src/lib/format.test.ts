import { describe, it, expect } from 'vitest';
import { formatSize, pluralize } from './format';

describe('formatSize', () => {
  it('formats bytes correctly', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(1024)).toBe('1 KB');
    expect(formatSize(1024 * 1024)).toBe('1 MB');
    expect(formatSize(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatSize(1024 * 1024 * 1024 * 1.5)).toBe('1.50 GB');
    expect(formatSize(1024 * 1024 * 1024 * 1.559)).toBe('1.56 GB');
  });
});

describe('pluralize', () => {
  it('pluralizes correctly', () => {
    expect(pluralize(1, 'file')).toBe('1 file');
    expect(pluralize(2, 'file')).toBe('2 files');
    expect(pluralize(0, 'file')).toBe('0 files');
  });
});
