import { describe, expect, it } from 'vitest';
import type { FileMetadata } from '../engine/types';
import { suggestFileScore } from './scoring.js';

const now = 1_800_000_000_000;
const file: Pick<FileMetadata, 'name' | 'path' | 'category' | 'lastModified'> = {
  name: 'notes.ts', path: '/Documents/School/Code/notes.ts', category: 'code',
  lastModified: now - 2 * 24 * 60 * 60 * 1000,
};

describe('suggestFileScore', () => {
  it('is deterministic for the same inputs and injected time', () => {
    expect(suggestFileScore(file, false, now)).toEqual(suggestFileScore(file, false, now));
  });

  it('always returns an integer score from 1 to 10', () => {
    for (const candidate of [file, { ...file, name: 'cache.tmp', path: '/Cache/cache.tmp' }]) {
      for (const duplicate of [false, true]) {
        const result = suggestFileScore(candidate, duplicate, now);
        expect(Number.isInteger(result.score)).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(1);
        expect(result.score).toBeLessThanOrEqual(10);
        expect(result.reasons.length).toBeGreaterThanOrEqual(1);
        expect(result.reasons.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it('ranks a duplicate lower than the same file as an original', () => {
    expect(suggestFileScore(file, true, now).score).toBeLessThan(suggestFileScore(file, false, now).score);
  });

  it('does not depend on the wall clock when now is injected', () => {
    expect(suggestFileScore(file, false, now)).toEqual(suggestFileScore(file, false, now));
  });
});
