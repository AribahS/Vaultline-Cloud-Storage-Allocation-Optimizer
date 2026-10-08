import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { FilesPage } from './pages/FilesPage';
import { PlayPage } from './pages/PlayPage';
import { ReportsPage } from './pages/ReportsPage';
import { useAppStore } from '../store/useAppStore';
import { STUDENT_LAPTOP_DATASET } from '../data/sampleDatasets';

vi.mock('../workers/solverClient', () => ({ runFullKnapsackAsync: vi.fn() }));
vi.mock('../engine/storageDb', () => ({ saveAutoSession: vi.fn() }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('responsive layout structure', () => {
  it('uses one-column page structures, inner table scrolling and a scrollable mobile top bar', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.responsive-page\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%/s);
    expect(css).toMatch(/\.responsive-scroll\s*\{[^}]*overflow-x:\s*auto/s);
    expect(css).toMatch(/\.responsive-stack\s*\{\s*grid-template-columns:\s*minmax\(0,1fr\)!important/s);
    expect(css).toMatch(/\.vaultline-nav\s*\{[^}]*overflow-x:\s*auto/s);
    expect(css).toMatch(/\.vaultline-shell\s*\{[^}]*overflow-x:\s*hidden/s);
    expect(css).toMatch(/\.generic-drawer-panel\s*\{[^}]*max-width:\s*100vw/s);
    expect(css).toMatch(/\.algorithm-drawer\s*\{[^}]*width:\s*100vw/s);
    expect(css).not.toMatch(/\.responsive-page\s*\{[^}]*width:\s*\d+px/s);
  });

  it('renders Files, Play and Plan with responsive wrappers', () => {
    useAppStore.setState({ files: STUDENT_LAPTOP_DATASET, knapsackResult: null, isPlanStale: false, autoRunOptimizer: false });
    const files = render(<MemoryRouter><FilesPage /></MemoryRouter>);
    expect(files.container.querySelector('.files-page.responsive-page')).toBeTruthy();
    expect(files.container.querySelector('.table-scroll.responsive-scroll')).toBeTruthy();
    files.unmount();

    const play = render(<MemoryRouter><PlayPage /></MemoryRouter>);
    expect(play.container.querySelector('.play-page.responsive-page')).toBeTruthy();
    play.unmount();

    const plan = render(<ReportsPage />);
    expect(plan.container.querySelector('.plan-page.responsive-page')).toBeTruthy();
  });
});
