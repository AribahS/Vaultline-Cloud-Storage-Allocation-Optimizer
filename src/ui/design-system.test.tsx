import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { DashboardPage } from './pages/DashboardPage';
import { FilesPage } from './pages/FilesPage';
import { OptimizerPage } from './pages/OptimizerPage';
import ReportsPage from './pages/ReportsPage';
import { useAppStore } from '../store/useAppStore';
import { STUDENT_LAPTOP_DATASET } from '../data/sampleDatasets';

vi.mock('../workers/solverClient', () => ({ runFullKnapsackAsync: vi.fn().mockResolvedValue({ keptItems: [], droppedItems: [], totalValue: 0, maxPossibleValue: 0, totalSizeKept: 0, totalSizeDropped: 0, executionTimeMs: 0, cellsComputed: 0, error: null }) }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const withRouter = (node: React.ReactNode) => <MemoryRouter>{node}</MemoryRouter>;
const primaryCount = () => document.querySelectorAll('button.btn-primary').length;

describe('Phase 3 layout and navigation', () => {
  it('renders exactly one filled primary action on Dashboard, Files, Optimizer, and Reports', () => {
    useAppStore.setState({ files: STUDENT_LAPTOP_DATASET, knapsackResult: null, isPlanStale: false, isComputing: false });
    render(withRouter(<DashboardPage />));
    expect(primaryCount()).toBe(1);
    cleanup();

    render(withRouter(<FilesPage />));
    expect(primaryCount()).toBe(1);
    cleanup();

    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    render(withRouter(<OptimizerPage />));
    expect(primaryCount()).toBe(1);
    cleanup();

    render(withRouter(<ReportsPage />));
    expect(primaryCount()).toBe(1);
  });

  it('removes the dark-mode toggle and redirects /tools to Dashboard', () => {
    render(<MemoryRouter initialEntries={['/tools']}><App /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.queryByText(/dark mode/i)).toBeNull();
    expect('toggleTheme' in useAppStore.getState()).toBe(false);
    expect(screen.queryByRole('link', { name: /tools/i })).toBeNull();
    expect(screen.queryByRole('heading', { name: /extra tools/i })).toBeNull();
  });

  it('uses responsive single-column layout classes and contains file tables in a scroll region', () => {
    render(withRouter(<DashboardPage />));
    expect(document.querySelector('.dashboard-kpis')).toBeTruthy();
    cleanup();
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    render(withRouter(<FilesPage />));
    expect(document.querySelector('.files-table-scroll, .table-scroll')).toBeTruthy();
  });
});
