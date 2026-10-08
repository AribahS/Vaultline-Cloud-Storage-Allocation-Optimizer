import { describe, expect, it } from 'vitest';
import { generateReportSummary } from './reportSummary';
import type { KnapsackResult } from '../engine/types';

const result = {
  quotaBytes: 15 * 1024 ** 3,
  totalSizeKept: 11.94 * 1024 ** 3,
  totalSizeDropped: 3.4 * 1024 ** 3,
  totalValue: 75,
  maxPossibleValue: 77,
  keptItems: [{ id: 'kept', name: 'Report.pdf', originalSize: 8.4 * 1024 ** 2, value: 10 }],
  droppedItems: [{ id: 'move', name: 'Cache.dat', originalSize: 3.4 * 1024 ** 3, value: 2 }],
} as KnapsackResult;

describe('generateReportSummary', () => {
  it('formats file sizes and uses singular nouns for one moved file', () => {
    const summary = generateReportSummary(result, new Date('2026-10-08T00:00:00Z'));
    expect(summary).toContain('Offloaded Space: 3.40 GB (1 file to move)');
    expect(summary).toContain('Files Kept:      1 file');
    expect(summary).toContain('Report.pdf (8.4 MB');
    expect(summary).not.toContain('1 files');
  });
});
