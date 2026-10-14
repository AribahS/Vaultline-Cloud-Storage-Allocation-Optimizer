import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../../store/useAppStore';
import { AlgorithmDrawer } from './AlgorithmDrawer';

afterEach(cleanup);

describe('Algorithm drawer playback', () => {
  it('reveals DP cells as the walkthrough advances instead of showing the completed table', () => {
    useAppStore.setState({ files: [], quotaBytes: 0, knapsackResult: null });
    render(<AlgorithmDrawer open onClose={() => undefined} />);

    const firstCell = screen.getByRole('cell', { name: 'Row 1, capacity 0 B, score 0' });
    const laterCell = screen.getByRole('cell', { name: 'Row 1, capacity 1 GB, not computed' });
    expect(firstCell.textContent).toBe('0');
    expect(laterCell.textContent).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(screen.getByRole('cell', { name: 'Row 1, capacity 1 GB, score 0' }).textContent).toBe('0');
  });
});
