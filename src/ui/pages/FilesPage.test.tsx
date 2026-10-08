import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilesPage } from './FilesPage';
import { DashboardPage } from './DashboardPage';
import { FilesTable } from '../components/FilesTable';
import { useAppStore } from '../../store/useAppStore';
import type { FileMetadata, KnapsackItem } from '../../engine/types';
import { solveFullKnapsack } from '../../engine/knapsack';

const { runFullKnapsackAsync } = vi.hoisted(() => ({ runFullKnapsackAsync: vi.fn() }));
vi.mock('../../workers/solverClient', () => ({ runFullKnapsackAsync }));
vi.mock('../../engine/storageDb', () => ({ saveAutoSession: vi.fn() }));
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => ({
    getTotalSize: () => count * estimateSize(),
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({
      index, key: index, start: index * estimateSize(), size: estimateSize(), end: (index + 1) * estimateSize(),
    })),
  }),
}));

const GB = 1024 ** 3;

function file(overrides: Partial<FileMetadata> = {}): FileMetadata {
  return {
    id: 'file-a', name: 'alpha.txt', path: '/Documents/alpha.txt', size: 1024,
    type: 'txt', category: 'document', priority: 5, lastModified: new Date(2026, 9, 8).getTime(),
    prioritySource: 'auto', isPinned: false, isExcluded: false,
    ...overrides,
  };
}

function resetStore() {
  act(() => {
    useAppStore.getState().clearFiles();
    useAppStore.setState({
      files: [], knapsackResult: null, isComputing: false, isPlanStale: false,
      autoRunOptimizer: true, quotaBytes: 15 * GB, quotaUnitOption: 'auto',
      folderMode: false, searchQuery: '',
    });
  });
}

async function finishPlan() {
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
}

beforeEach(() => {
  vi.useFakeTimers();
  runFullKnapsackAsync.mockClear();
  runFullKnapsackAsync.mockImplementation((items, options) => Promise.resolve(solveFullKnapsack(items, options)));
  resetStore();
});

afterEach(() => {
  cleanup();
  resetStore();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Files page Step D behavior', () => {
  it('replaces with 12 sample rows, including when loaded twice', () => {
    render(<FilesPage />);
    const openSampleMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Sample data' }));
    openSampleMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Student laptop (12 files)' }));
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(13);
    openSampleMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Student laptop (12 files)' }));
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(13);
    expect(useAppStore.getState().files).toHaveLength(12);
  }, 15000);

  it('recomputes after Spotify importance changes and updates Dashboard KPIs and moved file', async () => {
    act(() => useAppStore.getState().loadPreset('student'));
    await finishPlan();
    const initial = useAppStore.getState().knapsackResult!;
    expect(initial.keptItems).toHaveLength(11);
    expect(initial.totalValue).toBe(75);
    expect(initial.maxPossibleValue).toBe(77);
    const spotify = useAppStore.getState().files.find((item) => item.name === 'Spotify_Offline_Cache.dat')!;
    expect(initial.droppedItems.map((item) => item.id)).toContain(spotify.id);
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    expect(screen.getByText('97%')).toBeTruthy();
    act(() => useAppStore.getState().updatePriority(spotify.id, 10));
    await finishPlan();
    const changed = useAppStore.getState().knapsackResult!;
    expect(useAppStore.getState().files.find((item) => item.id === spotify.id)?.priority).toBe(10);
    expect(runFullKnapsackAsync).toHaveBeenCalledTimes(2);
    expect(runFullKnapsackAsync.mock.calls[1][0].find((item: KnapsackItem) => item.name === 'Spotify_Offline_Cache.dat')?.value).toBe(10);
    expect(changed.droppedItems.map((item) => item.id)).not.toContain(spotify.id);
    expect(changed.droppedItems.map((item) => item.name)).toContain('WebDev_Node_Modules_Backup.tar.gz');
    expect(screen.getByText('96%')).toBeTruthy();
    expect(screen.getByText('82 of 85')).toBeTruthy();
  });

  it('Always keep on Spotify moves another file and updates Dashboard KPIs', async () => {
    act(() => useAppStore.getState().loadPreset('student'));
    await finishPlan();
    const spotify = useAppStore.getState().files.find((item) => item.name === 'Spotify_Offline_Cache.dat')!;
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    expect(screen.getByText('97%')).toBeTruthy();
    act(() => useAppStore.getState().setFilePlacement(spotify.id, 'always_keep'));
    await finishPlan();
    const result = useAppStore.getState().knapsackResult!;
    expect(useAppStore.getState().files.find((item) => item.id === spotify.id)?.isPinned).toBe(true);
    expect(runFullKnapsackAsync).toHaveBeenCalledTimes(2);
    expect(runFullKnapsackAsync.mock.calls[1][0].find((item: KnapsackItem) => item.name === 'Spotify_Offline_Cache.dat')?.isPinned).toBe(true);
    expect(result.droppedItems.map((item) => item.name)).toContain('WebDev_Node_Modules_Backup.tar.gz');
    expect(screen.getByText('96%')).toBeTruthy();
    expect(screen.getByText('74 of 77')).toBeTruthy();
    render(<FilesPage />);
    const movedRow = screen.getByText('WebDev_Node_Modules_Backup.tar.gz').closest('tr')!;
    expect(within(movedRow).getByText('Moved')).toBeTruthy();
  });

  it('marks a Never keep file as moved in the recomputed plan', async () => {
    act(() => useAppStore.getState().loadPreset('student'));
    await finishPlan();
    const fileToMove = useAppStore.getState().files.find((item) => item.name === 'Algorithms_Final_Report.pdf')!;
    const priorCalls = runFullKnapsackAsync.mock.calls.length;
    act(() => useAppStore.getState().setFilePlacement(fileToMove.id, 'never_keep'));
    await finishPlan();
    expect(runFullKnapsackAsync).toHaveBeenCalledTimes(priorCalls + 1);
    expect(useAppStore.getState().knapsackResult?.keptItems.map((item) => item.id)).not.toContain(fileToMove.id);
    render(<FilesPage />);
    const row = screen.getByText(fileToMove.name).closest('tr')!;
    expect(within(row).getByText('Moved')).toBeTruthy();
  });

  it('applies bulk placement, importance, clearing and removal to the selected rows', () => {
    const rows = [file({ id: 'file-a' }), file({ id: 'file-b', name: 'beta.txt', path: '/beta.txt' })];
    useAppStore.setState({ files: rows });
    render(<FilesTable files={rows} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select alpha.txt' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select beta.txt' }));
    expect(screen.getByText('2 selected')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Always keep' }));
    expect(useAppStore.getState().files.every((item) => item.isPinned)).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select alpha.txt' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select beta.txt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear constraint' }));
    expect(useAppStore.getState().files.every((item) => !item.isPinned && !item.isExcluded)).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select alpha.txt' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select beta.txt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Never keep' }));
    expect(useAppStore.getState().files.every((item) => item.isExcluded)).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select alpha.txt' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select beta.txt' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Set importance' }), { target: { value: '10' } });
    expect(useAppStore.getState().files.every((item) => item.priority === 10)).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select alpha.txt' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select beta.txt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove from list' }));
    expect(useAppStore.getState().files).toHaveLength(0);
  });

  it('shows the requested Status values for constraints, duplicates and ordinary files', () => {
    const rows = [
      file({ id: 'pinned', name: 'pinned.txt', isPinned: true }),
      file({ id: 'excluded', name: 'excluded.txt', isExcluded: true }),
      file({ id: 'duplicate', name: 'duplicate.txt', isDuplicate: true }),
      file({ id: 'ordinary', name: 'ordinary.txt' }),
    ];
    render(<FilesTable files={rows} />);
    const table = screen.getByRole('table');
    expect(within(table).getByText('Always keep')).toBeTruthy();
    expect(within(table).getByText('Never keep')).toBeTruthy();
    expect(within(table).getAllByText('Duplicate').length).toBeGreaterThan(0);
    expect(within(table).getByText('none')).toBeTruthy();
  });

  it('shows duplicate groups and Keep one marks all extras Never keep; empty state is friendly', () => {
    const duplicateA = file({ id: 'dup-a', name: 'photo.jpg', path: '/One/photo.jpg', size: 2048, type: 'jpg', category: 'photo' });
    const duplicateB = file({ id: 'dup-b', name: 'PHOTO.jpg', path: '/Two/PHOTO.jpg', size: 2048, type: 'jpg', category: 'photo' });
    act(() => useAppStore.getState().setFiles([duplicateA, duplicateB]));
    const { unmount } = render(<FilesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Duplicates' }));
    expect(screen.getByText('/One/photo.jpg')).toBeTruthy();
    expect(screen.getByText('/Two/PHOTO.jpg')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep one' }));
    expect(useAppStore.getState().files.filter((item) => item.isExcluded)).toHaveLength(1);
    unmount();
    act(() => useAppStore.getState().setFiles([file({ id: 'unique', name: 'unique.txt' })]));
    render(<FilesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Duplicates' }));
    expect(screen.getByText('No duplicates detected')).toBeTruthy();
    expect(screen.getByText('Duplicates are matched by name and size.')).toBeTruthy();
  });

  it('clears files only after confirmation and then shows the empty state', () => {
    act(() => useAppStore.getState().setFiles([file()]));
    const confirm = vi.spyOn(window, 'confirm');
    render(<FilesPage />);
    confirm.mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(useAppStore.getState().files).toHaveLength(1);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(useAppStore.getState().files).toHaveLength(0);
    expect(screen.getByText('No files scanned yet')).toBeTruthy();
  });

  it('shows an over-capacity warning for Always keep files without throwing', () => {
    act(() => useAppStore.setState({
      files: [file({ id: 'pinned-a', size: 60, isPinned: true }), file({ id: 'pinned-b', size: 60, isPinned: true })],
      quotaBytes: 100,
    }));
    expect(() => render(<FilesPage />)).not.toThrow();
    expect(screen.getByText(/Always keep files \(120 B\) exceed target capacity \(100 B\)/)).toBeTruthy();
  });

  it('adds two picker files at their suggested importance using metadata only', async () => {
    vi.useRealTimers();
    const first = new File(['first file contents'], 'first.txt', { type: 'text/plain', lastModified: 1234 });
    const second = new File(['second file contents'], 'second.txt', { type: 'text/plain', lastModified: 5678 });
    const contentReaders = ['text', 'arrayBuffer', 'stream'] as const;
    const readers = [first, second].flatMap((localFile) => contentReaders.map((method) => {
      const spy = vi.fn();
      Object.defineProperty(localFile, method, { configurable: true, value: spy });
      return spy;
    }));
    const { container } = render(<FilesPage />);
    const picker = container.querySelector<HTMLInputElement>('input[type="file"][multiple]')!;
    await act(async () => {
      fireEvent.change(picker, { target: { files: [first, second] } });
      await waitFor(() => expect(useAppStore.getState().files).toHaveLength(2));
    });
    expect(useAppStore.getState().files.map((item) => [item.name, item.size, item.lastModified, item.path])).toEqual([
      ['first.txt', first.size, 1234, '/first.txt'],
      ['second.txt', second.size, 5678, '/second.txt'],
    ]);
    expect(useAppStore.getState().files.map(item => item.priority)).toEqual([6, 6]);
    expect(useAppStore.getState().files.every(item => item.prioritySource === 'auto')).toBe(true);
    expect(screen.getByText('first.txt')).toBeTruthy();
    expect(screen.getByText('second.txt')).toBeTruthy();
    expect(readers.every((spy) => spy.mock.calls.length === 0)).toBe(true);
    await waitFor(() => expect(runFullKnapsackAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useAppStore.getState().isPlanStale).toBe(false), { timeout: 3000 });
  });

  it('resets all edited scores only after confirmation', () => {
    act(() => useAppStore.getState().setFiles([
      file({ id: 'edited-a', priority: 1, prioritySource: 'edited' }),
      file({ id: 'edited-b', name: 'other.pdf', path: '/Downloads/other.pdf', priority: 10, prioritySource: 'edited' }),
    ]));
    const confirm = vi.spyOn(window, 'confirm');
    render(<FilesPage />);
    confirm.mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Reset all to suggested' }));
    expect(useAppStore.getState().files.map(file => file.priority)).toEqual([1, 10]);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Reset all to suggested' }));
    expect(useAppStore.getState().files.every(file => file.prioritySource === 'auto')).toBe(true);
    expect(useAppStore.getState().files.map(file => file.priority)).not.toEqual([1, 10]);
  });

  it('shows the detail drawer date in dd/mm/yyyy, current constraint and editable suggestion', () => {
    const selected = file({ priority: 4, isDuplicate: true, duplicateGroup: 'alpha.txt___1024' });
    act(() => useAppStore.getState().setFiles([selected, file({ id: 'alpha-copy', name: selected.name, path: '/Copies/alpha.txt' })]));
    render(<FilesPage />);
    fireEvent.click(screen.getAllByText('alpha.txt')[0]);
    expect(screen.getByText('txt / document')).toBeTruthy();
    expect(screen.getByText(/1 KB.*bytes/)).toBeTruthy();
    expect(screen.getAllByText('/Documents/alpha.txt')).toHaveLength(2);
    expect(screen.getAllByText('08/10/2026', { exact: false })).toHaveLength(3);
    expect(screen.getByText('Auto')).toBeTruthy();
    expect(screen.getAllByText('Not planned')).toHaveLength(3);
    expect(screen.getByText('alpha.txt___1024')).toBeTruthy();
    expect(screen.getAllByText('Suggested scores, a heuristic, not ground truth')).toHaveLength(2);
    expect(document.querySelectorAll('.score-reason-chip').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole('slider', { name: 'Importance score for alpha.txt' }), { target: { value: '10' } });
    expect(screen.getByText('10/10')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset to suggested' })[0]);
    expect(screen.queryByRole('button', { name: 'Reset to suggested' })).not.toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    expect(screen.queryByText('File details')).not.toBeTruthy();
  });
});
