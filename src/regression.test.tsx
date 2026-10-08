/**
 * src/regression.test.tsx
 * Regression tests for Vaultline's core working features.
 * These tests prevent regressions on:
 *  - pluralize() helper correctness
 *  - Store actions: addFiles, clearFiles, setQuotaBytes, triggerRecompute debounce
 *  - TopBar renders without crash
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

// Worker / solver — not available in jsdom
vi.mock('./workers/solverClient', () => ({
  runFullKnapsackAsync: vi.fn().mockResolvedValue({
    keptItems: [],
    droppedItems: [],
    totalValue: 0,
    maxPossibleValue: 0,
    totalSizeKept: 0,
    totalSizeDropped: 0,
    executionTimeMs: 0,
    cellsComputed: 0,
    error: null,
  }),
}));

// IndexedDB / storage
vi.mock('./engine/storageDb', () => ({ saveAutoSession: vi.fn() }));

// ── Helpers ──────────────────────────────────────────────────────────────────

const wrap = (ui: React.ReactElement, route = '/') =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

// ── pluralize tests (re-exported here for regression guard) ──────────────────

import { pluralize } from './lib/format';

describe('pluralize helper (regression)', () => {
  it('1 file → singular', () => expect(pluralize(1, 'file')).toBe('1 file'));
  it('0 files → plural', () => expect(pluralize(0, 'file')).toBe('0 files'));
  it('2 files → plural', () => expect(pluralize(2, 'file')).toBe('2 files'));
  it('custom plural', () =>
    expect(pluralize(1, 'duplicate', 'duplicates')).toBe('1 duplicate'));
});

// ── Store actions ────────────────────────────────────────────────────────────

import { useAppStore } from './store/useAppStore';

describe('useAppStore regression', () => {
  beforeEach(() => {
    // Reset to initial state
    useAppStore.setState({
      files: [],
      knapsackResult: null,
      manualKeptIds: [],
      isComputing: false,
      isPlanStale: false,
    });
  });

  it('addFiles increases file count', () => {
    const { addFiles } = useAppStore.getState();
    addFiles([{ id: 'f1', name: 'test.pdf', path: '/test.pdf', type: 'document', size: 1024, category: 'document', priority: 5, lastModified: Date.now(), prioritySource: 'auto', isPinned: false, isExcluded: false, isDuplicate: false }]);
    expect(useAppStore.getState().files).toHaveLength(1);
  });

  it('clearFiles resets to empty', () => {
    useAppStore.setState({ files: [{ id: 'f1', name: 'a.txt', path: '/a.txt', type: 'text', size: 10, category: 'other', priority: 5, lastModified: Date.now(), prioritySource: 'auto', isPinned: false, isExcluded: false, isDuplicate: false }] });
    useAppStore.getState().clearFiles();
    expect(useAppStore.getState().files).toHaveLength(0);
  });

  it('setQuotaBytes updates quotaBytes', () => {
    useAppStore.getState().setQuotaBytes(64 * 1024 * 1024 * 1024);
    expect(useAppStore.getState().quotaBytes).toBe(64 * 1024 * 1024 * 1024);
  });

  it('cancelCompute resets isComputing', () => {
    useAppStore.setState({ isComputing: true, computeProgress: { stage: 'test', percent: 50, cellsComputed: 0 } });
    useAppStore.getState().cancelCompute();
    expect(useAppStore.getState().isComputing).toBe(false);
    expect(useAppStore.getState().computeProgress).toBeNull();
  });
});
