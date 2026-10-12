import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { solveFullKnapsack } from '../../engine/knapsack';
import type { FileMetadata } from '../../engine/types';
import { useAppStore } from '../../store/useAppStore';
import { buildExportPlan, generatePlanCsv, generatePlanJson, generateShellMigrationScript, shellSingleQuote } from '../../lib/planExports';
import { ReportsPage } from './ReportsPage';

vi.mock('../../workers/solverClient', () => ({ runFullKnapsackAsync: vi.fn() }));
vi.mock('../../engine/storageDb', () => ({ saveAutoSession: vi.fn() }));

const files: FileMetadata[] = [
  { id: 'keep', name: "a b'c$(x).txt", path: "/Docs/a b'c$(x).txt\nnotes", size: 6, type: 'txt', category: 'document', priority: 10, prioritySource: 'auto', isPinned: false, isExcluded: false, lastModified: 1 },
  { id: 'move', name: '-dash.txt', path: '-dash.txt', size: 6, type: 'txt', category: 'document', priority: 4, prioritySource: 'auto', isPinned: false, isExcluded: false, lastModified: 1 },
];
const result = solveFullKnapsack(files.map(file => ({ id: file.id, name: file.name, path: file.path, originalSize: file.size, normalizedSize: file.size, value: file.priority })), { quotaUnits: 10, quotaBytes: 10, unitBytes: 1 });
const plan = buildExportPlan(files, result, '2026-10-08T00:00:00.000Z');

afterEach(() => cleanup());

describe('Results screen exports', () => {
  it('quotes CSV fields containing commas, quotes and newlines', () => {
    const csvPlan = { ...plan, files: [{ ...plan.files[0], path: '/a,b/"line"\nnext', name: 'a,"b\n.txt' }] };
    const csv = generatePlanCsv(csvPlan);
    expect(csv.split('\r\n')[0]).toBe('"path","name","size_bytes","importance","placement","constraint"');
    expect(csv).toContain('"/a,b/""line""\nnext","a,""b\n.txt","6","10","Keep",""');
  });

  it('single-quotes shell paths safely, handles leading dashes, defaults to dry run and contains no rm', () => {
    expect(shellSingleQuote("a b'c$(x).txt")).toBe(`'a b'\"'\"'c$(x).txt'`);
    const inverseResult = solveFullKnapsack(files.map(file => ({ id: file.id, name: file.name, path: file.path, originalSize: file.size, normalizedSize: file.size, value: file.id === 'keep' ? 2 : 10 })), { quotaUnits: 6, quotaBytes: 6, unitBytes: 1 });
    const script = generateShellMigrationScript(buildExportPlan(files, inverseResult, '2026-10-08T00:00:00.000Z'));
    expect(script).toContain('# Generated migration text from Vaultline. This script was NOT run by the app.');
    expect(script).toContain('DESTINATION_DIR=""');
    expect(script).toContain('DRY_RUN="${DRY_RUN:-1}"');
    expect(script).toContain('mv -- "$SOURCE_1" "$DESTINATION_DIR/"');
    expect(script).toContain(`SOURCE_1=${shellSingleQuote(files[0].path)}`);
    expect(script).not.toMatch(/\brm\b/);
  });

  it('JSON totals match the plan totals', () => {
    const decoded = JSON.parse(generatePlanJson(plan));
    expect(decoded.totals).toEqual(plan.totals);
    expect(decoded.files).toHaveLength(files.length);
  });

  it('renders a designed Results report with exactly one primary button', () => {
    useAppStore.setState({ files, knapsackResult: result, quotaBytes: 10 });
    const { container } = render(<MemoryRouter><ReportsPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Results' })).toBeTruthy();
    expect(container.textContent).not.toContain('=====');
    expect(container.querySelectorAll('button.btn-primary')).toHaveLength(1);
  });

  it('edits the shared target capacity only on Results', () => {
    useAppStore.setState({ files, knapsackResult: result, quotaBytes: 15 * 1024 ** 3 });
    render(<MemoryRouter><ReportsPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: '64 GB' }));
    expect(useAppStore.getState().quotaBytes).toBe(64 * 1024 ** 3);
    // The capacity input is identified by its id
    const capacityInput = document.getElementById('results-custom-capacity') as HTMLInputElement;
    fireEvent.change(capacityInput, { target: { value: '8.5' } });
    expect(useAppStore.getState().quotaBytes).toBe(8.5 * 1024 ** 3);
  });
});
