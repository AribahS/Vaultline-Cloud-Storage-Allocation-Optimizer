import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus } from 'lucide-react';
import { GREEDY_COUNTEREXAMPLE_DATASET } from '../../engine/greedy';
import { formatScore, formatSize, pluralize } from '../../lib/format';
import { groupSmallTreemapFiles, truncateTreemapLabel } from '../../lib/treemapLabels';
import { buildCapacityTable, buildUserPlayItems, canAdd, choosePlayScale, greedyPlan, importanceCurve, mapCapacityToUnits, normalizePlayItems, planForCapacity, scoreSelection, selectChallengeItems, type PlayItem } from '../../lib/playKnapsack';
import { createTightPlayDataset } from '../../lib/tightPlayDataset';
import { useAppStore } from '../../store/useAppStore';

type Source = 'your' | 'tight' | 'classic';

const sampleItems = (source: Exclude<Source, 'your'>): PlayItem[] => source === 'tight'
  ? createTightPlayDataset()
  : GREEDY_COUNTEREXAMPLE_DATASET.items.map(item => ({
    id: item.id,
    name: item.name,
    size: item.originalSize,
    weight: item.normalizedSize,
    importance: item.value / 3,
  }));

const defaultCapacity = (totalBytes: number, targetBytes: number) => totalBytes > targetBytes
  ? Math.max(0, Math.min(totalBytes, targetBytes))
  : Math.floor(totalBytes / 2);

export const PlayPage: React.FC = () => {
  const navigate = useNavigate();
  const { files, quotaBytes, setQuotaBytes } = useAppStore();
  const [source, setSource] = useState<Source>(() => files.length ? 'your' : 'tight');
  const [sourceWasChosen, setSourceWasChosen] = useState(false);
  const [mode, setMode] = useState<'explore' | 'challenge'>('explore');
  const [capacityBytes, setCapacityBytes] = useState(() => defaultCapacity(files.reduce((sum, file) => sum + file.size, 0), quotaBytes));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState('');

  const activeSource: Source = source === 'your' && files.length === 0
    ? 'tight'
    : source === 'tight' && files.length > 0 && !sourceWasChosen ? 'your' : source;
  const totalBytes = activeSource === 'your' ? files.reduce((sum, file) => sum + file.size, 0) : sampleItems(activeSource).reduce((sum, item) => sum + item.size, 0);
  const scale = useMemo(() => choosePlayScale(totalBytes, activeSource === 'your' ? files.length : sampleItems(activeSource).length), [activeSource, files, totalBytes]);
  const items = useMemo(() => activeSource === 'your'
    ? buildUserPlayItems(files, scale.unitBytes)
    : normalizePlayItems(sampleItems(activeSource), scale.unitBytes), [activeSource, files, scale.unitBytes]);
  const maxCapacity = items.reduce((sum, item) => sum + item.weight, 0);
  const table = useMemo(() => buildCapacityTable(items, maxCapacity), [items, maxCapacity]);
  const curve = useMemo(() => importanceCurve(table), [table]);
  const capacityUnits = mapCapacityToUnits(capacityBytes, totalBytes, maxCapacity);
  const plan = planForCapacity(table, capacityUnits);
  const totalImportance = items.filter(item => !item.excluded).reduce((sum, item) => sum + item.importance, 0);
  const retainedPercent = totalImportance ? Math.round(plan.totalImportance / totalImportance * 100) : 0;
  const curveStride = Math.max(1, Math.ceil(curve.length / 160));
  const curvePoints = curve.filter((_, index) => index % curveStride === 0 || index === curve.length - 1);
  const chartPath = curvePoints.map((point, index) => {
    const x = maxCapacity ? point.capacity / maxCapacity * 700 : 0;
    const y = 84 - point.percent / 100 * 70;
    return `${index === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  const currentX = totalBytes ? capacityBytes / totalBytes * 700 : 0;
  const currentY = 84 - (curve[capacityUnits]?.percent ?? 0) / 100 * 70;
  const knee = curve.find(point => point.percent >= 90) ?? curve[curve.length - 1] ?? { capacity: 0, percent: 0 };
  const kneeX = maxCapacity ? knee.capacity / maxCapacity * 700 : 0;
  const grouped = groupSmallTreemapFiles(items.map(item => ({ id: item.id, name: item.name, size: item.size, category: 'file', kept: plan.keptIds.includes(item.id) })), 800 * 360, 1800);
  const challengeItems = useMemo(() => selectChallengeItems(items, 14), [items]);
  const challengeBytes = challengeItems.reduce((sum, item) => sum + item.size, 0);
  const challengeWeight = challengeItems.reduce((sum, item) => sum + item.weight, 0);
  const challengeCapacity = Math.floor(challengeWeight * (activeSource === 'classic'
    ? GREEDY_COUNTEREXAMPLE_DATASET.quota / GREEDY_COUNTEREXAMPLE_DATASET.items.reduce((sum, item) => sum + item.normalizedSize, 0)
    : .4));
  const challengeTable = useMemo(() => buildCapacityTable(challengeItems, challengeCapacity), [challengeItems, challengeCapacity]);
  const optimal = planForCapacity(challengeTable, challengeCapacity);
  const challengeGreedy = greedyPlan(challengeItems, challengeCapacity);
  const selection = scoreSelection(challengeItems, selectedIds);
  const filesToAdd = challengeItems.filter(item => optimal.keptIds.includes(item.id) && !selectedIds.includes(item.id));
  const filesToRemove = challengeItems.filter(item => selectedIds.includes(item.id) && !optimal.keptIds.includes(item.id) && !item.pinned);
  const challengeImportance = challengeItems.reduce((sum, item) => sum + item.importance, 0);
  const allEqualImportance = activeSource === 'your' && new Set(items.filter(item => !item.excluded).map(item => item.importance)).size <= 1 && items.some(item => !item.excluded);
  const fitsTarget = activeSource === 'your' && totalBytes <= quotaBytes;
  const targetMarker = totalBytes ? Math.min(100, quotaBytes / totalBytes * 100) : 0;

  useEffect(() => {
    setCapacityBytes(defaultCapacity(totalBytes, quotaBytes));
    setSelectedIds(challengeItems.filter(item => item.pinned).map(item => item.id));
    setRevealed(false);
    setNotice('');
  }, [activeSource, totalBytes, quotaBytes, challengeItems]);

  const changeSource = (next: Source) => {
    setSourceWasChosen(true);
    setSource(next);
    setMode('explore');
    setRevealed(false);
    setNotice('');
  };

  const toggleFile = (id: string) => {
    const item = challengeItems.find(candidate => candidate.id === id);
    if (!item || item.pinned || item.excluded) return;
    if (selectedIds.includes(id)) {
      setSelectedIds(ids => ids.filter(selected => selected !== id));
      setNotice('');
      setRevealed(false);
      return;
    }
    const verdict = canAdd(challengeItems, selectedIds, id, challengeCapacity, scale.unitBytes);
    if (!verdict.allowed) {
      setNotice(verdict.reason ?? 'This file does not fit in the remaining space.');
      return;
    }
    setSelectedIds(ids => [...ids, id]);
    setNotice('');
    setRevealed(false);
  };

  return <div className="page-container responsive-page play-page" data-testid="play-page">
    <section className="vault-stage play-stage">
      <div className="play-heading">
        <div><p className="play-eyebrow">MAKE ROOM FOR WHAT MATTERS</p><h1 className="gold-mark">Play</h1><p>Explore the trade-offs, then try packing the files yourself.</p></div>
        <div className="mode-switch" role="group" aria-label="Play mode">
          <button aria-pressed={mode === 'explore'} onClick={() => { setMode('explore'); setRevealed(false); }}>Explore</button>
          <button aria-pressed={mode === 'challenge'} onClick={() => { setMode('challenge'); setSelectedIds(challengeItems.filter(item => item.pinned).map(item => item.id)); setNotice(''); setRevealed(false); }}>Challenge</button>
        </div>
      </div>

      <div className="play-controls">
        <label>Files to explore <select aria-label="Play data source" value={activeSource} onChange={event => changeSource(event.target.value as Source)}>
          <option value="your" disabled={!files.length}>Your files</option><option value="tight">Tight 40 GB example</option><option value="classic">Classic counterexample</option>
        </select></label>
        <span>{pluralize(items.length, 'file')} · {formatSize(totalBytes)} total</span>
      </div>

      {!files.length && <p className="play-data-hint">Add your files to explore your own data. <button type="button" className="play-outline" onClick={() => navigate('/files')}><FilePlus size={14} /> Add files</button></p>}
      {scale.coarse && <p className="play-data-hint" role="status">Using a coarser size scale for {pluralize(items.length, 'file')}.</p>}

      {mode === 'explore' && <div className="capacity-control">
        <label className="capacity-label" htmlFor="play-capacity"><span>Storage capacity</span><output data-testid="capacity-value">{formatSize(capacityBytes)}</output></label>
        <div className="play-range-wrap">
          <input id="play-capacity" aria-label="Storage capacity" type="range" min={0} max={totalBytes} step="any" value={Math.min(capacityBytes, totalBytes)} disabled={totalBytes <= 0} onChange={event => { setCapacityBytes(Number(event.target.value)); setRevealed(false); setNotice(''); }} />
          <span className="play-target-marker" data-testid="target-capacity-marker" style={{ left: `${targetMarker}%` }} aria-label={`Target capacity ${formatSize(quotaBytes)}`}>Target · {formatSize(quotaBytes)}</span>
        </div>
        <div className="play-slider-footer"><span>{formatSize(0)}</span><span>{formatSize(totalBytes)}</span></div>
      </div>}

      {activeSource === 'your' && fitsTarget && <p className="play-data-hint" data-testid="all-fit-message">All your files fit in {formatSize(quotaBytes)}. Drag down to see what you would keep with less space.</p>}
      {allEqualImportance && <p className="play-data-hint" data-testid="equal-importance-message">All files have the same importance, so the plan just keeps as many GB as fit. <button type="button" className="play-inline-link" onClick={() => navigate('/files')}>Edit scores in Files</button></p>}

      <div className="play-scoreline" aria-live="polite">
        <div><strong className="gold-mark" data-testid="retained-importance">{retainedPercent}%</strong><small> importance retained ({formatScore(plan.totalImportance)} of {formatScore(totalImportance)})</small></div>
        <div><strong data-testid="used-space">{formatSize(plan.totalSize)}</strong><small> used of {formatSize(capacityBytes)}</small></div>
        <div><strong data-testid="kept-count">{plan.keptIds.length}</strong><small> kept · <span data-testid="moved-count">{plan.movedIds.length}</span> {pluralize(plan.movedIds.length, 'file')} moved</small></div>
      </div>
      <button type="button" className="play-outline play-target-button" onClick={() => setQuotaBytes(capacityBytes)}>Use this size as my target</button>

      {mode === 'explore' ? <>
        <div className="curve-card" aria-label="Importance retained by capacity">
          <span className="curve-title">Importance retained as capacity grows</span>
          <svg viewBox="0 0 700 96" role="img" aria-label={`Capacity curve; current capacity ${formatSize(capacityBytes)}, knee at ${formatSize(totalBytes * (maxCapacity ? knee.capacity / maxCapacity : 0))}`}>
            <path d={chartPath} fill="none" stroke="var(--highlight)" strokeWidth="3" />
            <line x1={kneeX} x2={kneeX} y1="8" y2="88" stroke="var(--paper)" strokeDasharray="4 4" />
            <line x1={currentX} x2={currentX} y1="8" y2="88" stroke="var(--highlight)" strokeWidth="2" />
            <circle cx={currentX} cy={currentY} r="5" fill="var(--highlight)" />
            <text x="4" y="12" fill="var(--paper)" fontSize="10">100%</text><text x="4" y="90" fill="var(--paper)" fontSize="10">0%</text>
          </svg>
          <p data-testid="knee-sentence">At {formatSize(totalBytes * (maxCapacity ? knee.capacity / maxCapacity : 0))}, the plan reaches {Math.round(knee.percent)}% of available importance.</p>
        </div>
        <div className="play-files" aria-label="File placement blocks">
          {grouped.map(item => <article key={item.id} className={`play-file ${item.kept ? 'kept' : 'moved'}`} title={item.name} style={{ flexBasis: `${Math.max(120, 800 * item.size / Math.max(1, totalBytes))}px` }}>
            <span className="play-file-name">{truncateTreemapLabel(item.name, 24)}</span><b>{formatSize(item.size)}</b><small>{item.kept ? 'Kept' : 'Moved'}</small>
          </article>)}
        </div>
        <button className="play-primary btn-primary" onClick={() => setMode('challenge')}>Try a challenge</button>
      </> : <>
        <p className="challenge-hint">Choose files that fit. Always-keep files stay selected; Never-keep files are removed from this challenge.</p>
        {activeSource === 'your' && <p className="challenge-hint">Challenge set: {pluralize(challengeItems.length, 'file')} chosen by highest importance, with size breaking ties.</p>}
        {notice && <p role="alert" className="challenge-notice">{notice}</p>}
        <div className="play-files challenge-files" aria-label="Challenge files">
          {challengeItems.map(item => {
            const selected = selectedIds.includes(item.id);
            return <button type="button" key={item.id} className={`play-file ${selected ? 'kept' : 'moved'}`} style={{ flexBasis: `${Math.max(120, 800 * item.size / Math.max(1, challengeBytes))}px` }} aria-pressed={selected} disabled={item.pinned} onClick={() => toggleFile(item.id)}>
              <span className="play-file-name">{truncateTreemapLabel(item.name, 24)}</span><b>{formatSize(item.size)}</b><small>{item.pinned ? 'Always keep' : `${formatScore(item.importance)}/10 importance`}</small>
            </button>;
          })}
        </div>
        <p className="challenge-hint">Your pack: {pluralize(selection.count, 'file')} · {formatSize(selection.totalSize)} · {formatScore(selection.totalImportance)} importance</p>
        <div className="challenge-actions">
          {!revealed ? <button className="reveal-button btn-primary" onClick={() => setRevealed(true)}>Reveal answers</button> : <button className="reveal-button btn-primary" onClick={() => { setSelectedIds(challengeItems.filter(item => item.pinned).map(item => item.id)); setRevealed(false); setNotice(''); }}>Try again</button>}
          <button className="play-outline" onClick={() => navigate('/plan')}>Open plan</button>
        </div>
        {revealed && <section className="score-comparison" aria-label="Challenge answers" data-testid="challenge-results">
          <article><span>Your pack</span><strong data-testid="your-score">{formatScore(selection.totalImportance)}</strong><small>{formatSize(selection.totalSize)}</small></article>
          <article><span>Greedy</span><strong data-testid="greedy-score">{formatScore(challengeGreedy.totalImportance)}</strong><small>{formatSize(challengeGreedy.totalSize)}</small></article>
          <article><span>DP optimal</span><strong data-testid="optimal-score">{formatScore(optimal.totalImportance)}</strong><small>{formatSize(optimal.totalSize)}</small></article>
          <p>DP is the best score for this capacity, so you can match it but never beat it.</p>
          <p>{pluralize(filesToAdd.length, 'optimal file')} to add{filesToAdd.length ? `: ${filesToAdd.map(item => item.name).join(', ')}` : ''} · {pluralize(filesToRemove.length, 'extra file')} to remove{filesToRemove.length ? `: ${filesToRemove.map(item => item.name).join(', ')}` : ''}.</p>
          <p>Challenge importance available: {formatScore(challengeImportance)}.</p>
        </section>}
      </>}
    </section>
  </div>;
};
