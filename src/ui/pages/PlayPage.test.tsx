import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { STUDENT_LAPTOP_DATASET } from '../../data/sampleDatasets';
import { runFullKnapsackAsync } from '../../workers/solverClient';
import { useAppStore } from '../../store/useAppStore';
import { PlayPage } from './PlayPage';

vi.mock('../../workers/solverClient', () => ({ runFullKnapsackAsync: vi.fn() }));

afterEach(cleanup);
const renderPlay = () => render(<MemoryRouter><PlayPage /></MemoryRouter>);

beforeEach(() => {
  useAppStore.getState().cancelCompute();
  useAppStore.setState({ files: STUDENT_LAPTOP_DATASET.map(file => ({ ...file })), quotaBytes: 15 * 1024 ** 3, knapsackResult: null, isPlanStale: false });
  vi.mocked(runFullKnapsackAsync).mockClear();
});

afterEach(() => {
  cleanup();
  useAppStore.getState().cancelCompute();
});

describe('Play screen', () => {
  it('keeps the capacity control, displayed capacity, and placement counts in sync', () => {
    renderPlay();
    const slider = screen.getByRole('slider', { name: 'Storage capacity' }) as HTMLInputElement;
    expect(slider.value).toBe(String(15 * 1024 ** 3));
    expect(screen.getByTestId('capacity-value').textContent).toBe('15 GB');
    const before = Number(screen.getByTestId('kept-count').textContent);
    fireEvent.change(slider, { target: { value: String(10 * 1024 ** 3) } });
    expect(slider.value).toBe(String(10 * 1024 ** 3));
    expect(screen.getByTestId('capacity-value').textContent).toBe('10 GB');
    expect(Number(screen.getByTestId('kept-count').textContent)).toBeLessThanOrEqual(before);
    expect(Number(screen.getByTestId('kept-count').textContent) + Number(screen.getByTestId('moved-count').textContent)).toBe(12);
    expect(document.querySelectorAll('.play-page .btn-primary')).toHaveLength(1);
  });

  it('reveals the three challenge scores for the classic example', () => {
    renderPlay();
    fireEvent.change(screen.getByRole('combobox', { name: 'Play data source' }), { target: { value: 'classic' } });
    fireEvent.click(screen.getByRole('button', { name: 'Challenge' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reveal answers' }));
    expect(screen.getByTestId('challenge-results')).toBeTruthy();
    expect(screen.getByTestId('your-score').textContent).toBe('0');
    expect(screen.getByTestId('greedy-score').textContent).toBe('10');
    expect(screen.getByTestId('optimal-score').textContent).toBe('16');
    expect(document.querySelectorAll('.play-page .btn-primary')).toHaveLength(1);
  });

  it('blocks an overflowing file click and explains the remaining capacity', () => {
    renderPlay();
    fireEvent.click(screen.getByRole('button', { name: 'Challenge' }));
    fireEvent.click(screen.getByRole('button', { name: /Ubuntu_24_04_LTS\.iso/ }));
    fireEvent.click(screen.getByRole('button', { name: /Campus_Festival_Photos/ }));
    expect(screen.getByRole('alert').textContent).toContain('only');
  });

  it('uses the current user files and reflects edited importance without choosing a sample', () => {
    renderPlay();
    expect((screen.getByRole('combobox', { name: 'Play data source' }) as HTMLSelectElement).value).toBe('your');
    expect(screen.getByText('12 files · 15.34 GB total')).toBeTruthy();
    const tile = () => screen.getByTitle('Spotify_Offline_Cache.dat');
    const before = tile().className;
    act(() => useAppStore.getState().updatePriority(STUDENT_LAPTOP_DATASET.find(file => file.name === 'Spotify_Offline_Cache.dat')!.id, 10));
    expect(tile().className).not.toBe(before);
  });

  it('uses the tight example and an Add files hint when the scan is empty', () => {
    expect(useAppStore.getInitialState().files).toHaveLength(0);
    useAppStore.setState({ files: [], quotaBytes: 15 * 1024 ** 3 });
    renderPlay();
    expect((screen.getByRole('combobox', { name: 'Play data source' }) as HTMLSelectElement).value).toBe('tight');
    expect(screen.getByText(/Add your files to explore your own data/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Add files/ })).toBeTruthy();
  });

  it('switches to newly added user files unless the user already chose an example', () => {
    useAppStore.setState({ files: [], quotaBytes: 15 * 1024 ** 3 });
    const view = renderPlay();
    act(() => useAppStore.getState().setFiles(STUDENT_LAPTOP_DATASET.slice(0, 2)));
    expect((screen.getByRole('combobox', { name: 'Play data source' }) as HTMLSelectElement).value).toBe('your');
    view.unmount();
    useAppStore.setState({ files: [], quotaBytes: 15 * 1024 ** 3 });
    renderPlay();
    fireEvent.change(screen.getByRole('combobox', { name: 'Play data source' }), { target: { value: 'classic' } });
    act(() => useAppStore.getState().setFiles(STUDENT_LAPTOP_DATASET.slice(0, 2)));
    expect((screen.getByRole('combobox', { name: 'Play data source' }) as HTMLSelectElement).value).toBe('classic');
  });

  it('sets the slider maximum to total user file size and does not call the solver when dragged', () => {
    renderPlay();
    const slider = screen.getByRole('slider', { name: 'Storage capacity' }) as HTMLInputElement;
    expect(Number(slider.max)).toBeCloseTo(STUDENT_LAPTOP_DATASET.reduce((sum, file) => sum + file.size, 0), 0);
    fireEvent.change(slider, { target: { value: String(Number(slider.max) * .4) } });
    expect(runFullKnapsackAsync).not.toHaveBeenCalled();
  });

  it('shows a friendly all-fit message for small real files against the current target', () => {
    const smallFiles = STUDENT_LAPTOP_DATASET.slice(0, 1).map(file => ({ ...file, size: 1.4 * 1024 ** 2 }));
    useAppStore.setState({ files: smallFiles, quotaBytes: 15 * 1024 ** 3 });
    renderPlay();
    expect(screen.getByTestId('all-fit-message').textContent).toContain('All your files fit in 15 GB.');
  });

  it('respects Always keep and Never keep on the real-file plan', () => {
    const [pinned, excluded, regular] = STUDENT_LAPTOP_DATASET.slice(0, 3).map(file => ({ ...file, size: 10 * 1024 ** 3, priority: 5 }));
    useAppStore.setState({ files: [{ ...pinned, isPinned: true }, { ...excluded, isExcluded: true }, regular], quotaBytes: 15 * 1024 ** 3 });
    renderPlay();
    expect(screen.getByTitle(pinned.name).className).toContain('kept');
    expect(screen.getByTitle(excluded.name).className).toContain('moved');
  });

  it('uses at most fourteen deterministic user files in Challenge and shows the names and selection reason', () => {
    const many = Array.from({ length: 20 }, (_, index) => ({ ...STUDENT_LAPTOP_DATASET[index % STUDENT_LAPTOP_DATASET.length], id: `challenge-${index}`, name: `File_${index}`, size: (index + 1) * 1024, priority: index % 10 + 1 }));
    useAppStore.setState({ files: many, quotaBytes: 15 * 1024 ** 3 });
    renderPlay();
    fireEvent.click(screen.getByRole('button', { name: 'Challenge' }));
    expect(screen.getByText(/Challenge set: 14 files chosen by highest importance, with size breaking ties\./)).toBeTruthy();
    expect(document.querySelectorAll('.challenge-files .play-file')).toHaveLength(14);
    expect(screen.getByRole('button', { name: /File_19/ })).toBeTruthy();
  });
});
