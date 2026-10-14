import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BYTE_UNITS, resolveUnitBytes, normaliseQuota } from '../../engine/normalizer';
import { formatSize, pluralize } from '../../lib/format';
import { buildTeachingWalkthrough, buildYourPlanDataset, cellSentences, type WalkStep } from '../../lib/walkthrough';
import { GREEDY_COUNTER_ITEMS, TUTORIAL_ITEMS } from '../../lib/walkthroughDatasets';

import { solveGreedy } from '../../engine/greedy';
import { solveBruteForce } from '../../engine/bruteForce';
import type { KnapsackItem } from '../../engine/types';

type DrawerTab = 'Watch it think' | 'Comparison' | 'Cost';
type DatasetName = 'tutorial' | 'greedy' | 'your';

const tabs: DrawerTab[] = ['Watch it think', 'Comparison', 'Cost'];

export interface AlgorithmDrawerProps { open: boolean; onClose: () => void }

export const AlgorithmDrawer: React.FC<AlgorithmDrawerProps> = ({ open, onClose }) => {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [tab, setTab] = useState<DrawerTab>('Watch it think');
  const [datasetName, setDatasetName] = useState<DatasetName>('tutorial');
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [reducedMotion, setReducedMotion] = useState(false);
  const { files, quotaBytes, quotaUnitOption, knapsackResult } = useAppStore();
  const unitBytes = knapsackResult?.unitBytes ?? resolveUnitBytes(quotaBytes, quotaUnitOption);
  const capacityUnits = normaliseQuota(quotaBytes, unitBytes);
  const yourPlan = useMemo(() => buildYourPlanDataset(files, quotaBytes, knapsackResult?.unitBytes), [files, quotaBytes, knapsackResult?.unitBytes]);
  const selected = datasetName === 'tutorial'
    ? { items: TUTORIAL_ITEMS, capacity: 5, columnBytes: BYTE_UNITS.GB }
    : datasetName === 'greedy'
      ? { items: GREEDY_COUNTER_ITEMS, capacity: 10, columnBytes: BYTE_UNITS.GB }
      : { items: yourPlan.items, capacity: yourPlan.capacity, columnBytes: yourPlan.columnBytes };
  const walkthrough = useMemo(() => buildTeachingWalkthrough(selected.items, selected.capacity), [selected.items, selected.capacity]);
  const steps = walkthrough.steps;
  const lastIndex = Math.max(0, steps.length - 1);
  const activeIndex = Math.min(stepIndex, lastIndex);
  const currentStep = steps[activeIndex] ?? null;
  const intervalMs = speed === 'slow' ? 1100 : speed === 'fast' ? 180 : 550;
  const maxCellValue = walkthrough.result.totalValue || 1;
  const baseCellWidth = 52;
  const labelColumnWidth = 158;
  const headerHeight = 38;
  const cellHeight = 38;
  const gridHeight = headerHeight + (selected.items.length + 1) * cellHeight;

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (open && reducedMotion) {
      setIsPlaying(false);
      setStepIndex(lastIndex);
    }
  }, [open, reducedMotion, lastIndex]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    closeButton.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = oldOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !isPlaying || reducedMotion || activeIndex >= lastIndex) return;
    const timer = window.setInterval(() => {
      setStepIndex(previous => {
        if (previous >= lastIndex) { setIsPlaying(false); return lastIndex; }
        return previous + 1;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [open, isPlaying, reducedMotion, activeIndex, lastIndex, intervalMs]);

  const selectDataset = (name: DatasetName) => {
    setDatasetName(name);
    setStepIndex(0);
    setIsPlaying(false);
  };

  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); setIsPlaying(false); onClose(); return; }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) { event.preventDefault(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  if (!open) return null;

  const traceSteps = steps.slice(walkthrough.fillCount, activeIndex + 1).filter((step): step is Extract<WalkStep, { phase: 'traceback' }> => step.phase === 'traceback');
  const traceCells = traceSteps.map(step => ({ row: step.row, column: step.column }));
  const traceKeys = new Set(traceCells.map(cell => `${cell.row}:${cell.column}`));
  const columnSet = new Set<number>();
  const columnStride = Math.max(1, Math.ceil(selected.capacity / 24));
  for (let column = 0; column <= selected.capacity; column += columnStride) columnSet.add(column);
  columnSet.add(selected.capacity);
  if (currentStep?.phase === 'fill') {
    columnSet.add(currentStep.column);
    columnSet.add(currentStep.skip.column);
    if (currentStep.take) columnSet.add(currentStep.take.column);
  }
  traceCells.forEach(cell => columnSet.add(cell.column));
  const visibleColumns = [...columnSet].sort((a, b) => a - b);
  const gridWidth = labelColumnWidth + visibleColumns.length * baseCellWidth;
  const finalTraceStep = traceSteps[traceSteps.length - 1];
  const justMoved = finalTraceStep?.item.id;
  const tracedById = new Map(traceSteps.map(step => [step.item.id, step]));
  const tablePoint = (row: number, column: number) => ({
    x: labelColumnWidth + Math.max(0, visibleColumns.indexOf(column)) * baseCellWidth + baseCellWidth / 2,
    y: headerHeight + row * cellHeight + cellHeight / 2,
  });
  const winnerArrows = currentStep?.phase === 'fill'
    ? [currentStep.skip, ...(currentStep.take ? [currentStep.take] : [])].map(source => ({
      source, winner: (source === currentStep.skip && currentStep.decision !== 'take') || (source === currentStep.take && currentStep.decision === 'take'),
    }))
    : [];
  const tracePoints = traceCells.map(cell => tablePoint(cell.row, cell.column));
  const tracePath = tracePoints.map(point => `${point.x},${point.y}`).join(' ');

  return <>
    <div className="algorithm-drawer-backdrop" aria-hidden="true" onMouseDown={onClose} />
    <aside className="algorithm-drawer responsive-surface" role="dialog" aria-modal="true" aria-labelledby="algorithm-drawer-title" onKeyDown={onDialogKeyDown}>
      <header className="algorithm-drawer-header">
        <div><p className="algorithm-drawer-eyebrow">VAULTLINE</p><h2 id="algorithm-drawer-title">How it works</h2></div>
        <button ref={closeButton} className="algorithm-close" aria-label="Close algorithm drawer" onClick={onClose}>Close <span aria-hidden="true">×</span></button>
      </header>
      <nav className="algorithm-tabs" role="tablist" aria-label="Algorithm topics">
        {tabs.map(label => <button key={label} type="button" role="tab" id={`algo-tab-${label.replaceAll(' ', '-')}`} aria-selected={tab === label} aria-controls="algorithm-tab-panel" onClick={() => setTab(label)}>{label}</button>)}
      </nav>
      <div id="algorithm-tab-panel" className="algorithm-drawer-content" role="tabpanel" aria-labelledby={`algo-tab-${tab.replaceAll(' ', '-')}`}>
        {tab === 'Watch it think' && <>
          <div className="walk-dataset-control">
            <label htmlFor="walk-dataset">Files to explore</label>
            <select id="walk-dataset" aria-label="Walkthrough dataset" value={datasetName} onChange={event => selectDataset(event.target.value as DatasetName)}>
              <option value="tutorial">Tutorial (3 files)</option>
              <option value="greedy">Greedy counterexample</option>
              <option value="your" disabled={!yourPlan.items.length}>Your files</option>
            </select>
            {datasetName === 'your' && !yourPlan.items.length && <span>{yourPlan.hint}</span>}
            {datasetName !== 'your' && !yourPlan.items.length && <span className="walk-your-plan-hint">Add files to enable “Your files”.</span>}
          </div>
          <div className="walk-layout">
            <section className="walk-files" aria-label="Files and placement trays">
              <h3>Files in this example</h3>
              <div className="walk-file-list">
                {selected.items.map(item => <article key={item.id} className={`walk-file ${tracedById.has(item.id) ? (tracedById.get(item.id)!.taken ? 'trace-kept' : 'trace-moved') : 'trace-waiting'} ${item.id === justMoved ? 'trace-lift' : ''}`}>
                  <span title={item.name}>{item.name}</span><b>{formatSize(item.originalSize)}</b><small>{item.value} importance</small>
                </article>)}
              </div>
              <div className="walk-tray keep-tray" data-testid="keep-tray"><h4>Keep</h4>{traceSteps.filter(step => step.taken).map(step => <span className="walk-tray-file" key={step.item.id}>{step.item.name}</span>)}{!traceSteps.some(step => step.taken) && <span className="walk-tray-empty">Files appear as the answer is traced.</span>}</div>
              <div className="walk-tray move-tray" data-testid="move-tray"><h4>Move</h4>{traceSteps.filter(step => !step.taken).map(step => <span className="walk-tray-file" key={step.item.id}>{step.item.name}</span>)}{!traceSteps.some(step => !step.taken) && <span className="walk-tray-empty">Files appear as the answer is traced.</span>}</div>
            </section>

            <section className="walk-table-section" aria-label="Dynamic programming table">
              <h3>Best score at each capacity</h3>
              <p className="walk-caption">Columns show available storage in {formatSize(selected.columnBytes)} units (file weights round up; capacity rounds down). The table displays capacity checkpoints plus the active step.</p>
              <div className="walk-table-scroll" data-testid="walk-table-scroll">
                <div className="walk-table-inner" style={{ width: gridWidth, height: gridHeight }}>
                  <table className="walk-table" aria-label="Step-by-step score table" style={{ width: gridWidth, height: gridHeight }}>
                    <thead><tr><th>Files considered</th>{visibleColumns.map(column => <th key={column} aria-label={`Capacity ${formatSize(column * selected.columnBytes)}`}>{formatSize(column * selected.columnBytes)}</th>)}</tr></thead>
                    <tbody>{Array.from({ length: selected.items.length + 1 }, (_, row) => <tr key={row}>
                      <th scope="row" title={row ? selected.items[row - 1].name : 'Starting row'}>{row ? selected.items[row - 1].name : 'Start'}</th>
                      {visibleColumns.map((column, displayColumn) => {
                        const key = `${row}:${column}`;
                        const value = walkthrough.result.table[row][column];
                        const level = value === 0 ? 0 : value / maxCellValue < .25 ? 1 : value / maxCellValue < .5 ? 2 : value / maxCellValue < .75 ? 3 : 4;
                        const current = currentStep?.phase === 'fill' && currentStep.row === row && currentStep.column === column;
                        const onPath = traceKeys.has(key);
                        const winner = current && currentStep.phase === 'fill' ? currentStep.decision : null;
                        return <td key={column} data-column-index={displayColumn} className={`walk-cell heat-${level} walk-cell-computed ${current ? 'walk-cell-current' : ''} ${onPath ? 'walk-cell-path' : ''} ${winner ? `walk-winner-${winner}` : ''}`} aria-label={`Row ${row}, capacity ${formatSize(column * selected.columnBytes)}, score ${value}`}>
                          {value}
                        </td>;
                      })}
                    </tr>)}</tbody>
                  </table>
                  <svg className="walk-arrows" width={gridWidth} height={gridHeight} viewBox={`0 0 ${gridWidth} ${gridHeight}`} aria-hidden="true">
                    <defs>
                      <marker id="walk-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)" /></marker>
                      <marker id="walk-gold-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--highlight)" /></marker>
                    </defs>
                    {winnerArrows.map(({ source, winner }, index) => {
                      const from = tablePoint(source.row, source.column); const to = tablePoint(currentStep!.row, currentStep!.column);
                      return <line key={index} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--ink)" strokeWidth={winner ? 2.5 : 1.25} strokeDasharray={winner ? undefined : '4 3'} markerEnd="url(#walk-arrow)" opacity={winner ? .92 : .5} />;
                    })}
                    {tracePath && <>
                      <polyline points={tracePath} fill="none" stroke="var(--highlight)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" opacity=".9" />
                      {tracePoints.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="6" fill="var(--highlight)" stroke="var(--vault)" strokeWidth="2" />)}
                    </>}
                  </svg>
                </div>
              </div>
            </section>
          </div>

          <section className="walk-explanation" aria-live="polite" data-testid="walk-explanation">
            <div><strong>Step {activeIndex + 1} of {steps.length}</strong><span data-testid="walk-step-index">{activeIndex}</span></div>
            {currentStep?.phase === 'fill' ? <>
              <h3>{currentStep.item.name} · capacity {currentStep.column}</h3>
              <ul>{cellSentences(currentStep, selected.columnBytes).map((sentence, index) => <li key={index}>{sentence}</li>)}</ul>
              <p>Chosen: <strong>{currentStep.decision === 'take' ? 'take this file' : 'skip this file'}</strong></p>
            </> : currentStep?.phase === 'traceback' ? <>
              <h3>{currentStep.taken ? 'Keep' : 'Move'} {currentStep.item.name}</h3>
              <p>{currentStep.taken ? `${currentStep.item.name} is in the best fit. ${formatSize(currentStep.item.originalSize)} is kept.` : `${currentStep.item.name} is left out of the best fit.`}</p>
              {traceSteps.length === selected.items.length && <p data-testid="traceback-status">Traceback complete · {pluralize(walkthrough.result.keptItemIds.length, 'file')} in the Keep tray.</p>}
            </> : <p>Start stepping to fill the table.</p>}
          </section>

          <div className="algorithm-playback" aria-label="Walkthrough controls">
            <button type="button" aria-label="Reset walkthrough" onClick={() => { setStepIndex(0); setIsPlaying(false); }}>Reset</button>
            <button type="button" aria-label="Step back" onClick={() => { setStepIndex(index => Math.max(0, index - 1)); setIsPlaying(false); }}>Back</button>
            <button type="button" aria-label={isPlaying ? 'Pause walkthrough' : 'Play walkthrough'} onClick={() => {
              if (reducedMotion) { setStepIndex(lastIndex); setIsPlaying(false); }
              else setIsPlaying(value => !value);
            }}>{isPlaying ? 'Pause' : 'Play'}</button>
            <button type="button" aria-label="Step forward" onClick={() => { setStepIndex(index => Math.min(lastIndex, index + 1)); setIsPlaying(false); }}>Step forward</button>
            <label>Speed <select aria-label="Playback speed" value={speed} onChange={event => setSpeed(event.target.value as typeof speed)}><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select></label>
            <label className="walk-scrubber-label">Step <input aria-label="Walkthrough progress" type="range" min="0" max={lastIndex} step="1" value={activeIndex} onChange={event => { setStepIndex(Number(event.target.value)); setIsPlaying(false); }} /></label>
            <button type="button" aria-label="Show final answer" onClick={() => { setStepIndex(lastIndex); setIsPlaying(false); }}>Show answer</button>
          </div>
        </>}

        {tab === 'Comparison' && <ComparisonPanel items={files.filter(file => file.size > 0).map(file => ({ id: file.id, name: file.name, originalSize: file.size, normalizedSize: Math.max(1, Math.ceil(file.size / unitBytes)), value: file.priority, isPinned: file.isPinned, isExcluded: file.isExcluded }))} capacity={capacityUnits} columnBytes={unitBytes} />}
        {tab === 'Cost' && <CostPanel fileCount={files.filter(file => !file.isExcluded && !file.isPinned).length} capacityUnits={capacityUnits} cells={knapsackResult?.cellsComputed ?? 0} />}
      </div>
    </aside>
  </>;
};

const ComparisonPanel: React.FC<{ items: KnapsackItem[]; capacity: number; columnBytes: number }> = ({ items, capacity, columnBytes }) => {
  const dp = useMemo(() => buildTeachingWalkthrough(items, capacity).result, [items, capacity]);
  const greedy = useMemo(() => { const start = performance.now(); const value = solveGreedy(items, { quotaUnits: capacity, quotaBytes: capacity * columnBytes, unitBytes: columnBytes }); return { value, ms: performance.now() - start }; }, [items, capacity, columnBytes]);
  const eligible = items.filter(item => !item.isExcluded && !item.isPinned);
  const brute = useMemo(() => eligible.length <= 20 ? solveBruteForce(eligible, capacity) : null, [items, capacity]);
  const moved = items.filter(item => !dp.keptItemIds.includes(item.id) && !item.isPinned && !item.isExcluded);
  const detail = (ids: string[]) => <ul className="comparison-file-list">{items.map(item => <li key={item.id}><span>{item.name}</span><span>{ids.includes(item.id) ? 'Kept' : item.isExcluded ? 'Excluded' : 'Moved'} · {formatSize(item.originalSize)} · {item.value} importance</span></li>)}</ul>;
  const keptSize = dp.keptItemIds.reduce((sum, id) => sum + (items.find(item => item.id === id)?.originalSize ?? 0), 0);
  const possible = items.filter(item => !item.isExcluded).reduce((sum, item) => sum + item.value, 0);
  return <section className="comparison-panel"><p className="comparison-summary">Best fit at {formatSize(capacity * columnBytes)}: keeps {dp.keptItemIds.length} of {items.length} files ({formatSize(keptSize)}), importance {dp.totalValue} of {possible} ({possible ? Math.round(dp.totalValue / possible * 100) : 0}%). Moves out {moved.length} files ({formatSize(moved.reduce((sum, item) => sum + item.originalSize, 0))}).</p>
    <h3>Method comparison on current files</h3><div className="algorithm-comparison-cards">{[{ label: 'Exact (best fit)', score: dp.totalValue, count: dp.keptItemIds.length, size: formatSize(keptSize), ms: 0 }, { label: 'Greedy', score: greedy.value.totalValue, count: greedy.value.keptItems.length, size: formatSize(greedy.value.totalSizeKept), ms: greedy.ms }, ...(brute ? [{ label: 'Brute force', score: brute.bestValue, count: brute.bestSubset.length, size: formatSize(brute.bestSize * columnBytes), ms: brute.executionTimeMs }] : [])].map(card => <article key={card.label}><span>{card.label}</span><strong>{card.score} importance</strong><small>Kept: {pluralize(card.count, 'file')}</small><small>Size: {card.size}</small><small>Time: {card.ms.toFixed(2)} ms</small></article>)}</div>
    <p>{greedy.value.totalValue < dp.totalValue ? `For this dataset and capacity, greedy scores ${dp.totalValue - greedy.value.totalValue} less importance than the exact method.` : `For this dataset and capacity, greedy ties the exact method at ${dp.totalValue} importance because the highest-density files fit neatly into the target size without awkward leftover gaps.`}</p>
    <details className="comparison-details"><summary>Show file details</summary><h4>Exact best fit</h4>{detail(dp.keptItemIds)}<h4>Greedy selection</h4>{detail(greedy.value.keptItems.map(item => item.id))}</details>
    <section className="greedy-trap"><h4>The classic greedy trap (arithmetic breakdown)</h4><p>At capacity 10: Item A (size 6, importance 30, ratio 5.0) vs Items B &amp; C (each size 5, importance 24, ratio 4.8).</p><div className="greedy-trap-grid"><div><b>Greedy choice: A</b><br/>Score: 30<br/>Remaining room: 4 (neither B nor C fits)</div><div><b>Exact 0/1 choice: B + C</b><br/>Score: 24 + 24 = 48<br/>Remaining room: 0 (optimal fit)</div></div></section></section>;
};

const CostPanel: React.FC<{ fileCount: number; capacityUnits: number; cells: number }> = ({ fileCount, capacityUnits, cells }) => {
  const teachingTableCells = (fileCount + 1) * (capacityUnits + 1);
  const productionBytes = 20 * (capacityUnits + 1) + Math.ceil(fileCount * (capacityUnits + 1) / 8);
  return <section className="algorithm-info-panel" aria-label="Solver cost">
    <h3>What the calculation costs</h3>
    <p><strong>Time: O(n × W).</strong> The solver compares each eligible file against each available capacity step.</p>
    <p>Current scan: {pluralize(fileCount, 'file')} and {capacityUnits.toLocaleString()} capacity steps ({cells.toLocaleString()} production decisions in the last run).</p>
    <p>The teaching view shows {teachingTableCells.toLocaleString()} table cells. The production solver uses two rolling rows plus a compact decision record (about {formatSize(productionBytes)} of numeric storage for this scale).</p>
    <p>The production solver is checked against brute force in the project test suite.</p>
  </section>;
};
