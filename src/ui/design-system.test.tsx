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
  it('has exactly Files, Play, Results, and the Algorithm button', () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    renderAt('/files');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect([...nav.querySelectorAll('a')].map(link => link.textContent)).toEqual(['Files', 'Play', 'Results']);
    expect(nav.querySelectorAll('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Algorithm' })).toBeTruthy();
    expect(screen.queryByText('Dashboard')).toBeNull();
    expect(screen.queryByText('Optimizer')).toBeNull();
  });

  it('routes old optimizer, reports and plan paths to Results, and tools through home', async () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    const plan = renderAt('/plan');
    await waitFor(() => expect(screen.getByTestId('pathname').textContent).toBe('/results'));
    expect(screen.getByRole('heading', { name: 'Results' })).toBeTruthy();
    plan.unmount();

    const optimizer = renderAt('/optimizer');
    await waitFor(() => expect(screen.getByTestId('pathname').textContent).toBe('/results'));
    expect(screen.getByRole('heading', { name: 'Results' })).toBeTruthy();
    optimizer.unmount();

    const reports = renderAt('/reports');
    await waitFor(() => expect(screen.getByTestId('pathname').textContent).toBe('/results'));
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

  it('renders one title on Files, Play and Results', async () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    for (const [path, title] of [['/files', 'Files'], ['/play', 'Play'], ['/results', 'Results']]) {
      const view = renderAt(path);
      expect(await screen.findAllByRole('heading', { name: title, level: 1 })).toHaveLength(1);
      view.unmount();
    }
  });

  it('contains no user-visible word "plan" or "plans" across routes and the open drawer', async () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    for (const path of ['/files', '/play', '/results']) {
      const view = renderAt(path);
      // Scan all elements for aria-label, title, or textContent matching /\bplans?\b/i
      const checkNode = (node: Element) => {
        const ariaLabel = node.getAttribute('aria-label') || '';
        const title = node.getAttribute('title') || '';
        const text = node.childNodes.length === 1 && node.childNodes[0].nodeType === 3 ? node.textContent || '' : '';
        expect(ariaLabel).not.toMatch(/\bplans?\b/i);
        expect(title).not.toMatch(/\bplans?\b/i);
        if (text) {
          expect(text).not.toMatch(/\bplans?\b/i);
        }
      };
      view.container.querySelectorAll('*').forEach(checkNode);
      view.unmount();
    }

    const drawerHost = renderAt('/files');
    fireEvent.click(screen.getByRole('button', { name: 'Algorithm' }));
    const drawer = await screen.findByRole('dialog', { name: 'How it works' });
    drawer.querySelectorAll('*').forEach((node) => {
      const ariaLabel = node.getAttribute('aria-label') || '';
      const title = node.getAttribute('title') || '';
      const text = node.childNodes.length === 1 && node.childNodes[0].nodeType === 3 ? node.textContent || '' : '';
      expect(ariaLabel).not.toMatch(/\bplans?\b/i);
      expect(title).not.toMatch(/\bplans?\b/i);
      if (text) {
        expect(text).not.toMatch(/\bplans?\b/i);
      }
    });
    drawerHost.unmount();
  });

  it('keeps Watch it think, Comparison and Cost in the Algorithm drawer for now', async () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    renderAt('/files');
    fireEvent.click(screen.getByRole('button', { name: 'Algorithm' }));
    const drawer = await screen.findByRole('dialog', { name: 'How it works' });
    expect([...drawer.querySelectorAll('[role="tab"]')].map(tab => tab.textContent)).toEqual(['Watch it think', 'Comparison', 'Cost']);
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
