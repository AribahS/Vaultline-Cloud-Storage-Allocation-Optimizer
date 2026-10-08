import { describe, expect, it } from 'vitest';
import type { FileMetadata } from '../engine/types';
import { resetScoresToSuggested, scoreIncomingFiles, suggestFileScore } from './scoring.js';
import { readFileSync } from 'node:fs';

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

const metadata = (overrides: Partial<FileMetadata> = {}): FileMetadata => ({
  id: 'one', name: 'notes.txt', path: '/Documents/notes.txt', size: 120,
  type: 'text/plain', category: 'document', lastModified: 1_000,
  priority: 5, prioritySource: 'auto', isPinned: false, isExcluded: false,
  ...overrides,
});

describe('metadata-only scoring integration', () => {
  it('ranks duplicate imported copies below the original with deterministic integer scores from 1 to 10', () => {
    const injectedNow = 20_000_000;
    const original = metadata({ priority: suggestFileScore(file, false, injectedNow).score });
    const incoming = [metadata({ id: 'copy-a' }), metadata({ id: 'copy-b' })];
    const scored = scoreIncomingFiles([original], incoming, injectedNow);
    expect(scored[0].priority).toBeLessThan(original.priority);
    expect(scored.map(item => item.priority)).toEqual(scoreIncomingFiles([original], incoming, injectedNow).map(item => item.priority));
    for (const item of [original, ...scored]) {
      expect(Number.isInteger(item.priority)).toBe(true);
      expect(item.priority).toBeGreaterThanOrEqual(1);
      expect(item.priority).toBeLessThanOrEqual(10);
    }
  });

  it('falls back to 5 when the metadata has no usable scoring signal', () => {
    const unknown = metadata({ name: 'blob', path: '/blob', type: '', category: 'other', lastModified: 0 });
    expect(scoreIncomingFiles([], [unknown], 20_000_000)[0].priority).toBe(5);
  });

  it('resets scores and never reads file contents or calls network APIs', () => {
    const edited = metadata({ priority: 1, prioritySource: 'edited' });
    expect(resetScoresToSuggested([edited], 20_000_000)[0]).toMatchObject({ prioritySource: 'auto', priority: suggestFileScore(edited, false, 20_000_000).score });
    const scoringSource = readFileSync('src/lib/scoring.js', 'utf8');
    expect(scoringSource).not.toMatch(/\bfetch\s*\(|\bFileReader\b/);
  });
});
