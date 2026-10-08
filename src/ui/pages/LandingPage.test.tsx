import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from '../../App';
import { useAppStore } from '../../store/useAppStore';

vi.mock('../../workers/solverClient', () => ({ runFullKnapsackAsync: vi.fn() }));
vi.mock('../../engine/storageDb', () => ({ saveAutoSession: vi.fn() }));
afterEach(() => cleanup());

const RoutePath: React.FC = () => <output data-testid="current-path">{useLocation().pathname}</output>;

describe('Landing page', () => {
  it('offers the sample as the primary action and opens it in Play', async () => {
    useAppStore.setState({ files: [], knapsackResult: null, autoRunOptimizer: false, isPlanStale: false });
    const { container } = render(<MemoryRouter initialEntries={['/landing']}><App /><RoutePath /></MemoryRouter>);
    const primary = await screen.findByRole('button', { name: 'Try sample data' }, { timeout: 8000 });
    expect(container.querySelectorAll('.landing-hero button')).toHaveLength(2);
    expect(container.querySelectorAll('.landing-hero .btn-primary')).toHaveLength(1);
    expect(primary.id).toBe('landing-cta-primary');
    expect(screen.queryByText('Skip to app')).toBeNull();
    expect(screen.queryByText(/100k\+|1 ms|0 bytes|Provably optimal/i)).toBeNull();
    fireEvent.click(primary);
    await waitFor(() => expect(screen.getByTestId('current-path').textContent).toBe('/play'));
    expect(useAppStore.getState().files).toHaveLength(12);
  });

  it('has one clear secondary action to open the app', async () => {
    useAppStore.setState({ files: [], knapsackResult: null, autoRunOptimizer: false, isPlanStale: false });
    render(<MemoryRouter initialEntries={['/landing']}><App /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Open app' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy());
  });
});
