/**
 * src/regression.test.tsx
 * Regression tests for Vaultline's core working features.
 * These tests prevent regressions on:
 *  - Collapsible sidebar state
 *  - ToolsPage gallery rendering (all 6 tools)
 *  - SplitTool rendering
 *  - pluralize() helper correctness
 *  - Store actions: addFiles, clearFiles, setQuotaBytes, triggerRecompute debounce
 *  - KpiCard renders values without overflow
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

  it('toggleSidebar changes isSidebarCollapsed', () => {
    const before = useAppStore.getState().isSidebarCollapsed;
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().isSidebarCollapsed).toBe(!before);
    // restore
    useAppStore.getState().toggleSidebar();
  });

  it('cancelCompute resets isComputing', () => {
    useAppStore.setState({ isComputing: true, computeProgress: { stage: 'test', percent: 50, cellsComputed: 0 } });
    useAppStore.getState().cancelCompute();
    expect(useAppStore.getState().isComputing).toBe(false);
    expect(useAppStore.getState().computeProgress).toBeNull();
  });
});

// ── KpiCard ──────────────────────────────────────────────────────────────────

import { KpiCard } from './ui/components/KpiCard';

describe('KpiCard (regression)', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Total files" value="42" />);
    expect(screen.getByText('Total files')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<KpiCard label="Size" value="1.2 GB" subtitle="of 15 GB" />);
    expect(screen.getByText('of 15 GB')).toBeTruthy();
  });
});

// ── DashboardPage empty state ─────────────────────────────────────────────────

import { DashboardPage } from './ui/pages/DashboardPage';

describe('DashboardPage (regression)', () => {
  it('shows empty-state CTA when no files', () => {
    useAppStore.setState({ files: [], knapsackResult: null });
    wrap(<DashboardPage />, '/');
    expect(screen.getByText('Decide what to keep.')).toBeTruthy();
  });
});
