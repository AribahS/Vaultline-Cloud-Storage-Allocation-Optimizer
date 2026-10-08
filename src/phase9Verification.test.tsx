import React from 'react';
import axe from 'axe-core';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BYTE_UNITS } from './engine/normalizer';
import { solveFullKnapsack } from './engine/knapsack';
import { STUDENT_LAPTOP_DATASET } from './data/sampleDatasets';
import { buildCapacityTable, planForCapacity } from './lib/playKnapsack';
import { suggestFileScore } from './lib/scoring.js';
import { formatSize, pluralize } from './lib/format';
import { useAppStore } from './store/useAppStore';
import { clearStaleSession } from './lib/clearSession';
import { normaliseItemSize, normaliseQuota, resolveUnitBytes } from './engine/normalizer';
import { DashboardPage } from './ui/pages/DashboardPage';
import { FilesPage } from './ui/pages/FilesPage';
import { LandingPage } from './ui/pages/LandingPage';
import { OptimizerPage } from './ui/pages/OptimizerPage';
import { PlayPage } from './ui/pages/PlayPage';
import { ReportsPage } from './ui/pages/ReportsPage';
import { AlgorithmDrawer } from './ui/components/AlgorithmDrawer';

vi.mock('./engine/storageDb', () => ({ saveAutoSession: vi.fn() }));
vi.mock('./workers/solverClient', () => ({ runFullKnapsackAsync: vi.fn().mockResolvedValue({
  keptItems: [], droppedItems: [], totalValue: 0, maxPossibleValue: 0, totalSizeKept: 0,
  totalSizeDropped: 0, executionTimeMs: 0, cellsComputed: 0, error: null,
}) }));
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => ({
    getTotalSize: () => count * estimateSize(),
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, key: index, start: index * estimateSize(), size: estimateSize(), end: (index + 1) * estimateSize() })),
  }),
}));

const GB = BYTE_UNITS.GB;

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Phase 9 solver and formatting regression', () => {
  it('keeps the bundled student sample optimum stable at 15 GB', () => {
    const unitBytes = resolveUnitBytes(15 * GB, 'auto');
    const quotaUnits = normaliseQuota(15 * GB, unitBytes);
    const items = STUDENT_LAPTOP_DATASET.map(file => ({
      id: file.id, name: file.name, originalSize: file.size,
      normalizedSize: normaliseItemSize(file.size, unitBytes), value: file.priority,
      isPinned: file.isPinned, isExcluded: file.isExcluded,
    }));
    const result = solveFullKnapsack(items, { quotaUnits, quotaBytes: 15 * GB, unitBytes });
    expect(result.error).toBeUndefined();
    expect(result.keptItems).toHaveLength(11);
    expect(result.totalValue).toBe(75);
    expect(result.maxPossibleValue).toBe(77);
    expect(result.totalSizeKept).toBeCloseTo(11.94 * GB, -6);
    expect(result.droppedItems.map(file => file.name)).toContain('Spotify_Offline_Cache.dat');
  });

  it('matches a fresh dynamic-programming solve across capacities and never exceeds capacity', () => {
    const items = STUDENT_LAPTOP_DATASET.map(file => ({
      id: file.id, name: file.name, size: file.size, weight: Math.ceil(file.size / GB),
      importance: file.priority,
    }));
    const table = buildCapacityTable(items, 15);
    for (const capacity of [0, 3, 7, 11, 15]) {
      const cached = planForCapacity(table, capacity);
      const fresh = planForCapacity(buildCapacityTable(items, capacity), capacity);
      expect(cached.keptIds).toEqual(fresh.keptIds);
      expect(cached.totalImportance).toBe(fresh.totalImportance);
      expect(cached.totalSize).toBeLessThanOrEqual(capacity * GB);
    }
  });

  it('importance is non-decreasing as the capacity grows', () => {
    const items = STUDENT_LAPTOP_DATASET.map(file => ({
      id: file.id, name: file.name, size: file.size, weight: Math.ceil(file.size / GB), importance: file.priority,
    }));
    const table = buildCapacityTable(items, 15);
    let previous = 0;
    for (let capacity = 0; capacity <= 15; capacity++) {
      const score = planForCapacity(table, capacity).totalImportance;
      expect(score).toBeGreaterThanOrEqual(previous);
      previous = score;
    }
  });

  it('keeps scoring deterministic, bounded and metadata-only', async () => {
    const file = { id: 'a', name: 'notes.pdf', path: '/Documents/notes.pdf', size: 3, category: 'document' as const, lastModified: 1 };
    const now = 2;
    const first = suggestFileScore(file, false, now);
    expect(suggestFileScore(file, false, now)).toEqual(first);
    expect(Number.isInteger(first.score)).toBe(true);
    expect(first.score).toBeGreaterThanOrEqual(1);
    expect(first.score).toBeLessThanOrEqual(10);
    const source = await import('node:fs');
    const scoringSource = source.readFileSync('src/lib/scoring.js', 'utf8');
    expect(scoringSource).not.toMatch(/\bfetch\s*\(|\bFileReader\b/);
  });

  it('keeps formatSize and pluralize stable', () => {
    expect(formatSize(15.34 * GB)).toBe('15.34 GB');
    expect(pluralize(1, 'file')).toBe('1 file');
    expect(pluralize(2, 'file')).toBe('2 files');
  });

  it('starts with the bundled sample count and clears stale persisted session data', async () => {
    expect(useAppStore.getState().files).toHaveLength(12);
    const remove = vi.fn();
    const close = vi.fn();
    const db = {
      objectStoreNames: { contains: () => true },
      transaction: () => ({ objectStore: () => ({ delete: remove }) }),
      close,
    };
    const request: { onsuccess?: (event: { target: { result: typeof db } }) => void } = {};
    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => { setTimeout(() => request.onsuccess?.({ target: { result: db } }), 0); return request; }),
    });
    clearStaleSession();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(remove).toHaveBeenCalledWith('latest');
    expect(close).toHaveBeenCalledOnce();
  });
});

describe('Phase 9 accessibility smoke checks', () => {
  const runAxe = async (ui: React.ReactElement) => {
    const { container } = render(<MemoryRouter><>{ui}</></MemoryRouter>);
    const result = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
  };

  it('checks Dashboard', async () => { await runAxe(<DashboardPage />); });
  it('checks Files', async () => { await runAxe(<FilesPage />); }, 15000);
  it('checks Optimizer', async () => { await runAxe(<OptimizerPage />); }, 15000);
  it('checks Plan', async () => { await runAxe(<ReportsPage />); }, 15000);
  it('checks Play', async () => { await runAxe(<PlayPage />); }, 15000);
  it('checks Landing', async () => { await runAxe(<LandingPage onEnter={() => undefined} />); }, 15000);
  it('checks the open Algorithm drawer', async () => { await runAxe(<AlgorithmDrawer open onClose={() => undefined} />); }, 15000);
});
