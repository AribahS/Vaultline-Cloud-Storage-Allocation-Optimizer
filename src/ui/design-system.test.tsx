import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { useAppStore } from '../store/useAppStore';

vi.mock('../workers/solverClient', () => ({ runFullKnapsackAsync: vi.fn().mockResolvedValue({ keptItems: [], droppedItems: [], totalValue: 0, maxPossibleValue: 0, totalSizeKept: 0, totalSizeDropped: 0, executionTimeMs: 0, cellsComputed: 0, error: null }) }));
vi.mock('../engine/storageDb', () => ({ saveAutoSession: vi.fn() }));
afterEach(() => cleanup());

const Path = () => <output data-testid="pathname">{useLocation().pathname}</output>;
const renderAt = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /><Path /></MemoryRouter>);

describe('simplified navigation', () => {
  it('has exactly Files, Play, Plan, and the Algorithm button', () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    renderAt('/files');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect([...nav.querySelectorAll('a')].map(link => link.textContent)).toEqual(['Files', 'Play', 'Plan']);
    expect(nav.querySelectorAll('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Algorithm' })).toBeTruthy();
    expect(screen.queryByText('Dashboard')).toBeNull();
    expect(screen.queryByText('Optimizer')).toBeNull();
  });

  it('routes old optimizer and reports paths to Plan, and tools through home', async () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    const optimizer = renderAt('/optimizer');
    await waitFor(() => expect(screen.getByTestId('pathname').textContent).toBe('/plan'));
    expect(screen.getByRole('heading', { name: 'Plan' })).toBeTruthy();
    optimizer.unmount();

    const reports = renderAt('/reports');
    await waitFor(() => expect(screen.getByTestId('pathname').textContent).toBe('/plan'));
    reports.unmount();

    renderAt('/tools');
    await waitFor(() => expect(screen.getByTestId('pathname').textContent).toBe('/files'));
    expect(screen.getByRole('heading', { name: 'Files', level: 1 })).toBeTruthy();
  });

  it('sends the old Dashboard path and root to Files', async () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    for (const path of ['/', '/dashboard']) {
      const view = renderAt(path);
      await waitFor(() => expect(screen.getByTestId('pathname').textContent).toBe('/files'));
      expect(screen.getByRole('heading', { name: 'Files', level: 1 })).toBeTruthy();
      view.unmount();
    }
  });

  it('renders one title on Files, Play and Plan', async () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    for (const [path, title] of [['/files', 'Files'], ['/play', 'Play'], ['/plan', 'Plan']]) {
      const view = renderAt(path);
      expect(await screen.findAllByRole('heading', { name: title, level: 1 })).toHaveLength(1);
      view.unmount();
    }
  });

  it('keeps only Watch it think and Cost in the Algorithm drawer', async () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    renderAt('/files');
    fireEvent.click(screen.getByRole('button', { name: 'Algorithm' }));
    const drawer = await screen.findByRole('dialog', { name: 'How the plan is built' });
    expect([...drawer.querySelectorAll('[role="tab"]')].map(tab => tab.textContent)).toEqual(['Watch it think', 'Cost']);
    fireEvent.click(screen.getByRole('tab', { name: 'Cost' }));
    expect(screen.getByText(/O\(n × W\)/)).toBeTruthy();
    expect(screen.getByText(/checked against brute force in the project test suite/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /run.*tests/i })).toBeNull();
  });

  it('keeps engine and scale options inside Settings > Advanced', () => {
    renderAt('/files');
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByText('Advanced'));
    expect(screen.getByLabelText('Size scale')).toBeTruthy();
    expect(screen.getByLabelText('File grouping')).toBeTruthy();
    expect(screen.queryByRole('switch', { name: 'Auto-run optimizer' })).toBeNull();
  });
});
