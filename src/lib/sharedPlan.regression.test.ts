import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('../workers/solverClient', () => ({ runFullKnapsackAsync: vi.fn() }));
vi.mock('../engine/storageDb', () => ({ saveAutoSession: vi.fn() }));
import { useAppStore } from '../store/useAppStore';
import { solveFullKnapsack } from '../engine/knapsack';
import { normaliseItemSize, normaliseQuota, resolveUnitBytes } from '../engine/normalizer';
import { BYTE_UNITS } from '../engine/normalizer';
import { buildTeachingWalkthrough, buildYourPlanDataset } from './walkthrough';
import { runFullKnapsackAsync } from '../workers/solverClient';
import { includeProfitableZeroWeightItems } from './solverResult';
import { choosePlayScale } from './playKnapsack';
import { capacityToBytes } from './capacity';
import type { FileMetadata } from '../engine/types';

const KB = BYTE_UNITS.KB;
const makeFiles = (sizes: number[]): FileMetadata[] => sizes.map((size, index) => ({
  id: `f${index}`, name: `file-${index}`, path: `/file-${index}`, size: size * KB,
  type: 'bin', category: 'other', priority: 6 + (index % 5), prioritySource: 'edited' as const,
  isPinned: false, isExcluded: false, lastModified: 0,
}));

describe('shared capacity and exact plan regressions', () => {
  it('converts decimal and integer capacities consistently in binary bytes', () => {
    expect(capacityToBytes(200.49, 'KB')).toBe(205302);
    expect(capacityToBytes(200, 'KB')).toBe(204800);
    expect(capacityToBytes(1, 'MB')).toBe(1048576);
    expect(capacityToBytes(0.5, 'GB')).toBe(536870912);
    const scale = choosePlayScale(347 * KB, 11);
    expect(normaliseQuota(200.49 * KB, scale.unitBytes)).toBeGreaterThan(0);
  });

  it('matches exact brute force for deterministic random instances up to twelve files', () => {
    let seed = 78233;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let sample = 0; sample < 25; sample++) {
      const items = Array.from({ length: 1 + Math.floor(random() * 12) }, (_, index) => {
        const size = Math.floor(random() * 20);
        return { id: `${sample}-${index}`, name: `item-${index}`, originalSize: size, normalizedSize: size, value: Math.floor(random() * 11) };
      });
      const capacity = Math.floor(random() * 45);
      const result = includeProfitableZeroWeightItems(items, solveFullKnapsack(items, { quotaUnits: capacity, quotaBytes: capacity, unitBytes: 1 }));
      let best = 0;
      for (let mask = 0; mask < 2 ** items.length; mask++) {
        const chosen = items.filter((_, index) => mask & (1 << index));
        if (chosen.reduce((sum, item) => sum + item.normalizedSize, 0) > capacity) continue;
        const value = chosen.reduce((sum, item) => sum + item.value, 0);
        if (value > best) best = value;
      }
      expect(result.totalValue).toBe(best);
      expect(result.keptItems.reduce((sum, item) => sum + item.value, 0)).toBe(best);
      expect(result.keptItems.reduce((sum, item) => sum + item.normalizedSize, 0)).toBeLessThanOrEqual(capacity);
    }
  });

  it('uses a nonzero exact capacity for 200 KB and returns the brute-force optimum', async () => {
    const files = makeFiles([23, 38, 22, 21, 12, 40, 66, 18, 16, 35, 30]);
    const quotaBytes = 200 * KB;
    vi.mocked(runFullKnapsackAsync).mockImplementation(async (items, options) => solveFullKnapsack(items, options));
    act(() => useAppStore.setState({ files, quotaBytes, quotaUnitOption: 'auto', knapsackResult: null, isComputing: false, isPlanStale: false }));
    vi.useFakeTimers();
    await act(async () => { await useAppStore.getState().triggerRecompute(); await vi.advanceTimersByTimeAsync(1200); });
    vi.useRealTimers();
    const result = useAppStore.getState().knapsackResult;
    expect(result).not.toBeNull();
    expect(result!.quotaBytes).toBe(quotaBytes);
    expect(result!.keptItems.reduce((sum, file) => sum + file.originalSize, 0)).toBeLessThanOrEqual(quotaBytes);
    const candidates = files.map(file => ({ id: file.id, name: file.name, originalSize: file.size, normalizedSize: file.size, value: file.priority }));
    const oracle = solveFullKnapsack(candidates, { quotaUnits: quotaBytes, quotaBytes, unitBytes: 1 });
    expect(result!.totalValue).toBe(oracle.totalValue);
    expect(result!.keptItems.map(file => file.id).sort()).toEqual(oracle.keptItems.map(file => file.id).sort());
    const teaching = buildYourPlanDataset(files, quotaBytes, result!.unitBytes);
    const walk = buildTeachingWalkthrough(teaching.items, teaching.capacity);
    expect(walk.result.totalValue).toBe(result!.totalValue);
    expect(walk.result.keptItemIds.slice().sort()).toEqual(result!.keptItems.map(file => file.id).sort());
  });

  it('handles zero, all-fit, oversized, duplicate-size, and zero-size items', () => {
    const items = [
      { id: 'zero', name: 'zero', originalSize: 0, normalizedSize: 0, value: 2 },
      { id: 'a', name: 'a', originalSize: 10, normalizedSize: 10, value: 6 },
      { id: 'b', name: 'b', originalSize: 10, normalizedSize: 10, value: 7 },
      { id: 'large', name: 'large', originalSize: 30, normalizedSize: 30, value: 10 },
    ];
    const zero = includeProfitableZeroWeightItems(items, solveFullKnapsack(items, { quotaUnits: 0, quotaBytes: 0, unitBytes: 1 }));
    expect(zero.keptItems.map(item => item.id)).toContain('zero');
    const all = solveFullKnapsack(items, { quotaUnits: 50, quotaBytes: 50, unitBytes: 1 });
    expect(all.keptItems).toHaveLength(items.length);
    const constrained = solveFullKnapsack(items, { quotaUnits: 10, quotaBytes: 10, unitBytes: 1 });
    expect(constrained.keptItems.map(item => item.id)).toContain('b');
    expect(constrained.keptItems.map(item => item.id)).not.toContain('large');
  });

  it('rounds teaching item weights up, capacity down, and never offers an impossible take', () => {
    const unit = 10 * KB;
    const weight = normaliseItemSize(23 * KB, unit);
    const capacity = normaliseQuota(25 * KB, unit);
    expect(weight).toBe(3);
    expect(capacity).toBe(2);
    const item = { id: 'x', name: '23 KB file', originalSize: 23 * KB, normalizedSize: weight, value: 8 };
    const walk = buildTeachingWalkthrough([item], capacity);
    expect(walk.result.table[1]).toEqual([0, 0, 0]);
    expect(walk.result.totalValue).toBe(0);
    expect(walk.steps.filter(step => step.phase === 'fill').every(step => step.phase !== 'fill' || step.take === null || step.column - weight >= 0)).toBe(true);
    for (let i = 1; i < walk.result.table.length; i++) {
      for (let w = 0; w < walk.result.table[i].length; w++) {
        const expected = weight > w
          ? walk.result.table[i - 1][w]
          : Math.max(walk.result.table[i - 1][w], item.value + walk.result.table[i - 1][w - weight]);
        expect(walk.result.table[i][w]).toBe(expected);
      }
    }
    const exact = solveFullKnapsack([item], { quotaUnits: capacity, quotaBytes: 25 * KB, unitBytes: unit });
    expect(walk.result.table.at(-1)?.at(-1)).toBe(exact.totalValue);
  });
});
