import { describe, it, expect } from 'vitest';
import { formatSize, pluralize } from './format';

const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

describe('formatSize', () => {
  it('returns 0 B for 0', () => expect(formatSize(0)).toBe('0 B'));
  it('formats exact KB', () => expect(formatSize(1024)).toBe('1 KB'));
  it('formats exact MB', () => expect(formatSize(MB)).toBe('1 MB'));
  it('formats fractional MB to 1 decimal', () => expect(formatSize(1.5 * MB)).toBe('1.5 MB'));
  it('formats exact GB', () => expect(formatSize(GB)).toBe('1 GB'));
  it('formats fractional GB to 2 decimals', () => expect(formatSize(1.5 * GB)).toBe('1.50 GB'));
  it('formats 4.80 GB correctly', () => expect(formatSize(4.8 * GB)).toBe('4.80 GB'));
  it('formats 15 GB without decimals', () => expect(formatSize(15 * GB)).toBe('15 GB'));
  it('never shows huge MB values for GB-sized files', () => {
    // 15.34 GB should NOT produce "15703.45 MB"
    const result = formatSize(15.34 * GB);
    expect(result).toMatch(/GB$/);
    expect(result).not.toMatch(/MB$/);
  });
  it('formats 8.4 MB correctly', () => expect(formatSize(8.4 * MB)).toBe('8.4 MB'));
  it('formats 18.2 MB correctly', () => expect(formatSize(18.2 * MB)).toBe('18.2 MB'));
  it('rounds MB to 1 decimal, not 2', () => {
    const result = formatSize(1.559 * GB);
    expect(result).toBe('1.56 GB');
  });
});

describe('pluralize', () => {
  it('singular', () => expect(pluralize(1, 'file')).toBe('1 file'));
  it('plural', () => expect(pluralize(2, 'file')).toBe('2 files'));
  it('zero plural', () => expect(pluralize(0, 'file')).toBe('0 files'));
});

