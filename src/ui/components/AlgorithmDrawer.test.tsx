import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { useAppStore } from '../../store/useAppStore';

vi.mock('../../workers/solverClient', () => ({ runFullKnapsackAsync: vi.fn().mockResolvedValue({ keptItems: [], droppedItems: [], totalValue: 0, maxPossibleValue: 0, totalSizeKept: 0, totalSizeDropped: 0, executionTimeMs: 0, cellsComputed: 0, error: null }) }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const renderApp = (path = '/') => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe('Algorithm drawer', () => {
  it('opens from the top bar on Dashboard and Files, closes with Escape, and restores focus', () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    const dashboard = renderApp('/');
    const trigger = screen.getByRole('button', { name: 'Algorithm' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'How the plan is built' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close algorithm drawer' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    dashboard.unmount();

    renderApp('/files');
    fireEvent.click(screen.getByRole('button', { name: 'Algorithm' }));
    expect(screen.getByRole('dialog', { name: 'How the plan is built' })).toBeTruthy();
    for (const label of ['Watch it think', 'Variations', 'Comparison', 'Complexity', 'Correctness']) {
      expect(screen.getByRole('tab', { name: label })).toBeTruthy();
    }
  });

  it('traps focus inside and supports forward/back stepping and final-answer scrubbing', () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    renderApp('/');
    fireEvent.click(screen.getByRole('button', { name: 'Algorithm' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('.algorithm-drawer-content')).toBeTruthy();
    const slider = screen.getByRole('slider', { name: 'Walkthrough progress' }) as HTMLInputElement;
    expect(screen.getByTestId('walk-step-index').textContent).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(screen.getByTestId('walk-step-index').textContent).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Step back' }));
    expect(screen.getByTestId('walk-step-index').textContent).toBe('0');
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'));
    focusable.at(-1)?.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close algorithm drawer' }));
    fireEvent.change(slider, { target: { value: slider.max } });
    expect(screen.getByTestId('traceback-status').textContent).toMatch(/Traceback complete/);
    expect(screen.getByTestId('keep-tray').textContent).toContain('A');
    expect(document.querySelector('.empty-dashed-grid')).toBeNull();
  });

  it('jumps to the answer when reduced motion is enabled', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    renderApp('/');
    fireEvent.click(screen.getByRole('button', { name: 'Algorithm' }));
    expect(await screen.findByTestId('traceback-status')).toBeTruthy();
    expect(screen.getByTestId('keep-tray').textContent).toContain('A');
  });

  it('redirects the former page route to Dashboard', () => {
    useAppStore.setState({ files: [], knapsackResult: null, isPlanStale: false, isComputing: false });
    renderApp('/algorithm');
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Algorithm Analysis' })).toBeNull();
  });
});
