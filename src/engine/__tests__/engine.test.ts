import { describe, it, expect } from 'vitest';
import {
  solveFullKnapsack,
  solveTeachingKnapsack,
  solveGreedy,
  solveBruteForce,
  normaliseItemSize,
  normaliseQuota,
  resolveUnitBytes,
  BYTE_UNITS,
  GREEDY_COUNTEREXAMPLE_DATASET,
  KnapsackItem,
  runSelfTest,
} from '../index';

describe('Vaultline 0/1 Knapsack Engine', () => {
  it('DP vs Brute Force across 500 randomized test cases', () => {
    // Run 500 random small cases
    const selfTest = runSelfTest(500);
    expect(selfTest.failedCases).toBe(0);
    expect(selfTest.passedCases).toBe(500);
    expect(selfTest.counterExampleFound).toBeUndefined();
  });

  it('Traceback equals optimum exactly', () => {
    const items: KnapsackItem[] = [
      { id: '1', name: 'File1', originalSize: 3, normalizedSize: 3, value: 5 },
      { id: '2', name: 'File2', originalSize: 4, normalizedSize: 4, value: 6 },
      { id: '3', name: 'File3', originalSize: 5, normalizedSize: 5, value: 10 },
      { id: '4', name: 'File4', originalSize: 2, normalizedSize: 2, value: 3 },
    ];
    const quota = 8;
    const dp = solveFullKnapsack(items, {
      quotaUnits: quota,
      quotaBytes: quota * 1024,
      unitBytes: 1024,
    });
    const bf = solveBruteForce(items, quota);

    expect(dp.totalValue).toBe(bf.bestValue);
    const sumKept = dp.keptItems.reduce((acc, it) => acc + it.value, 0);
    expect(sumKept).toBe(dp.totalValue);
    const sizeKept = dp.keptItems.reduce((acc, it) => acc + it.normalizedSize, 0);
    expect(sizeKept).toBeLessThanOrEqual(quota);
  });

  it('Rounding UP never exceeds the real quota', () => {
    const unitBytes = 10 * BYTE_UNITS.MB;
    const realQuotaBytes = 55 * BYTE_UNITS.MB;
    const quotaUnits = normaliseQuota(realQuotaBytes, unitBytes); // floor(55 / 10) = 5 units = 50 MB

    // Files: 12MB, 18MB, 21MB
    // Rounded UP to 10MB units:
    // 12MB -> 2 units (20MB)
    // 18MB -> 2 units (20MB)
    // 21MB -> 3 units (30MB)
    const items: KnapsackItem[] = [
      {
        id: 'f1',
        name: 'Doc',
        originalSize: 12 * BYTE_UNITS.MB,
        normalizedSize: normaliseItemSize(12 * BYTE_UNITS.MB, unitBytes),
        value: 10,
      },
      {
        id: 'f2',
        name: 'Photo',
        originalSize: 18 * BYTE_UNITS.MB,
        normalizedSize: normaliseItemSize(18 * BYTE_UNITS.MB, unitBytes),
        value: 12,
      },
      {
        id: 'f3',
        name: 'Video',
        originalSize: 21 * BYTE_UNITS.MB,
        normalizedSize: normaliseItemSize(21 * BYTE_UNITS.MB, unitBytes),
        value: 15,
      },
    ];

    expect(items[0].normalizedSize).toBe(2);
    expect(items[1].normalizedSize).toBe(2);
    expect(items[2].normalizedSize).toBe(3);

    const dp = solveFullKnapsack(items, {
      quotaUnits,
      quotaBytes: realQuotaBytes,
      unitBytes,
    });

    // Real sum of kept items in bytes must NOT exceed real quota bytes
    const realBytesKept = dp.keptItems.reduce((acc, it) => acc + it.originalSize, 0);
    expect(realBytesKept).toBeLessThanOrEqual(realQuotaBytes);
    expect(dp.normalizedSizeKept).toBeLessThanOrEqual(quotaUnits);
  });

  it('Pinned and Excluded items logic behaves properly', () => {
    const items: KnapsackItem[] = [
      { id: 'p1', name: 'Pinned Essential', originalSize: 3, normalizedSize: 3, value: 5, isPinned: true },
      { id: 'x1', name: 'Excluded Garbage', originalSize: 1, normalizedSize: 1, value: 99, isExcluded: true },
      { id: 'r1', name: 'Regular A', originalSize: 4, normalizedSize: 4, value: 10 },
      { id: 'r2', name: 'Regular B', originalSize: 2, normalizedSize: 2, value: 4 },
    ];

    const quota = 7;
    const res = solveFullKnapsack(items, {
      quotaUnits: quota,
      quotaBytes: quota * 1024,
      unitBytes: 1024,
    });

    // Pinned item MUST be kept
    expect(res.keptItems.some((i) => i.id === 'p1')).toBe(true);
    // Excluded item MUST NOT be kept
    expect(res.keptItems.some((i) => i.id === 'x1')).toBe(false);
    expect(res.droppedItems.some((i) => i.id === 'x1')).toBe(false); // filtered out completely
    // Remaining quota is 7 - 3 = 4, so regular A (size 4, value 10) fits
    expect(res.keptItems.some((i) => i.id === 'r1')).toBe(true);
    expect(res.totalValue).toBe(5 + 10);
  });

  it('Pinned items exceeding quota produce clear error', () => {
    const items: KnapsackItem[] = [
      { id: 'p1', name: 'Huge Pinned', originalSize: 10, normalizedSize: 10, value: 10, isPinned: true },
    ];
    const res = solveFullKnapsack(items, {
      quotaUnits: 5,
      quotaBytes: 5 * 1024,
      unitBytes: 1024,
    });
    expect(res.error).toBeDefined();
    expect(res.error).toContain('Pinned files');
    expect(res.error).toContain('exceed');
  });

  it('Greedy counterexample yields exactly 30 vs 48 for DP', () => {
    const { quota, items } = GREEDY_COUNTEREXAMPLE_DATASET;
    const greedy = solveGreedy(items, {
      quotaUnits: quota,
      quotaBytes: quota * 1024 * 1024 * 1024,
      unitBytes: 1024 * 1024 * 1024,
    });

    const dp = solveFullKnapsack(items, {
      quotaUnits: quota,
      quotaBytes: quota * 1024 * 1024 * 1024,
      unitBytes: 1024 * 1024 * 1024,
    });

    expect(greedy.totalValue).toBe(30);
    expect(greedy.keptItems.length).toBe(1);
    expect(greedy.keptItems[0].name).toBe('System_VM_Snapshot.raw');

    expect(dp.totalValue).toBe(48);
    expect(dp.keptItems.length).toBe(2);
    expect(dp.keptItems.map((i) => i.name).sort()).toEqual([
      'Client_Project_Assets.tar',
      'Financial_Records_2025.sql',
    ]);
  });

  it('Teaching engine records steps, explanations, and matches full solver', () => {
    const { quota, items } = GREEDY_COUNTEREXAMPLE_DATASET;
    const teaching = solveTeachingKnapsack(items, quota);

    expect(teaching.totalValue).toBe(48);
    expect(teaching.steps.length).toBeGreaterThan(0);
    expect(teaching.keptItemIds.length).toBe(2);

    // Verify cell steps have plain-English explanation and recurrence formula
    const cellStep = teaching.steps.find((s) => s.type === 'cell');
    expect(cellStep).toBeDefined();
    expect(cellStep?.explanation).toBeTruthy();
    expect(cellStep?.recurrenceFormula).toContain('dp[');

    // Verify traceback step exists
    const tbStep = teaching.steps.find((s) => s.type === 'traceback');
    expect(tbStep).toBeDefined();
    expect(tbStep?.reason).toBeTruthy();
  });
});
