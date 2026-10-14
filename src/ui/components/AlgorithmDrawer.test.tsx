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
    const nextFileCell = screen.getByRole('cell', { name: 'Row 2, capacity 0 B, not computed' });
    expect(firstCell.textContent).toBe('0');
    expect(laterCell.textContent).toBe('');
    expect(nextFileCell.textContent).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(screen.getByRole('cell', { name: 'Row 1, capacity 1 GB, score 0' }).textContent).toBe('0');
    expect(screen.getByRole('cell', { name: 'Row 2, capacity 0 B, not computed' }).textContent).toBe('');
  });

  it('fills displayed columns between playback checkpoints as each row advances', () => {
    useAppStore.setState({
      files: [{ id: 'large', name: 'Large file', path: '/large', size: 2_000, priority: 8, isPinned: false, isExcluded: false, modifiedAt: 0, mimeType: 'application/octet-stream' }],
      quotaBytes: 1_200,
      quotaUnitOption: 'B',
      knapsackResult: { unitBytes: 1, keptIds: [], totalValue: 0, totalSizeKept: 0, cellsComputed: 1201, executionTimeMs: 0 },
    } as never);
    render(<AlgorithmDrawer open onClose={() => undefined} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Walkthrough dataset' }), { target: { value: 'your' } });

    const betweenCheckpoints = screen.getByRole('cell', { name: 'Row 1, capacity 50 B, not computed' });
    expect(betweenCheckpoints.textContent).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(screen.getByRole('cell', { name: 'Row 1, capacity 50 B, score 0' }).textContent).toBe('0');
  });
});
