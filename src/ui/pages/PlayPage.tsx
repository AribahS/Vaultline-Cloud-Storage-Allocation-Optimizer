import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BYTE_UNITS, normaliseItemSize } from '../../engine/normalizer';
import { GREEDY_COUNTEREXAMPLE_DATASET } from '../../engine/greedy';
import { STUDENT_LAPTOP_DATASET } from '../../data/sampleDatasets';
import { formatSize, pluralize } from '../../lib/format';
import { groupSmallTreemapFiles, truncateTreemapLabel } from '../../lib/treemapLabels';
import { buildCapacityTable, canAdd, findKnee, greedyPlan, importanceCurve, kneeSentence, planForCapacity, scoreSelection, type PlayItem } from '../../lib/playKnapsack';
import { createTightPlayDataset } from '../../lib/tightPlayDataset';

type Scenario = 'tight' | 'student' | 'classic';
const asPlayItems = (scenario: Scenario): PlayItem[] => {
  if (scenario === 'tight') return createTightPlayDataset();
  if (scenario === 'classic') return GREEDY_COUNTEREXAMPLE_DATASET.items.map(item => ({ id: item.id, name: item.name, size: item.originalSize, weight: item.normalizedSize, importance: item.value }));
  return STUDENT_LAPTOP_DATASET.map(file => ({ id: file.id, name: file.name, size: file.size, weight: normaliseItemSize(file.size, BYTE_UNITS.MB), importance: file.priority }));
};

const gb = BYTE_UNITS.GB;

export const PlayPage: React.FC = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<Scenario>('tight');
  const [mode, setMode] = useState<'explore' | 'challenge'>('explore');
  const items = useMemo(() => asPlayItems(scenario), [scenario]);
  const unitBytes = scenario === 'classic' ? gb : BYTE_UNITS.MB;
  const totalBytes = items.reduce((sum, item) => sum + item.size, 0);
  const maxCapacity = Math.floor(totalBytes / unitBytes);
  const table = useMemo(() => buildCapacityTable(items, maxCapacity), [items, maxCapacity]);
  const curve = useMemo(() => importanceCurve(table), [table]);
  const [capacity, setCapacity] = useState(() => Math.floor((scenario === 'classic' ? 10 * gb : 15 * gb) / unitBytes));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState('');
  const actualCapacity = Math.min(maxCapacity, Math.max(0, capacity));
  const plan = planForCapacity(table, actualCapacity);
  const optimal = planForCapacity(table, actualCapacity);
  const greedy = greedyPlan(items, actualCapacity);
  const selection = scoreSelection(items, selectedIds);
  const filesToAdd = items.filter(item => optimal.keptIds.includes(item.id) && !selectedIds.includes(item.id));
  const filesToRemove = items.filter(item => selectedIds.includes(item.id) && !optimal.keptIds.includes(item.id));
  const totalImportance = items.filter(item => !item.excluded).reduce((sum, item) => sum + item.importance, 0);
  const retainedPercent = totalImportance ? Math.round(plan.totalImportance / totalImportance * 100) : 0;
  const knee = findKnee(curve);
  const curvePoints = useMemo(() => {
    const stride = Math.max(1, Math.ceil(curve.length / 160));
    return curve.filter((_, index) => index % stride === 0 || index === curve.length - 1);
  }, [curve]);
  const chartPath = curvePoints.map((point, index) => {
    const x = curve.length <= 1 ? 0 : point.capacity / (curve.length - 1) * 700;
    const y = 84 - point.percent / 100 * 70;
    return `${index === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  const currentX = maxCapacity ? actualCapacity / maxCapacity * 700 : 0;
  const currentY = 84 - (curve[actualCapacity]?.percent ?? 0) / 100 * 70;
  const kneeX = maxCapacity ? knee.capacity / maxCapacity * 700 : 0;
  const grouped = groupSmallTreemapFiles(items.map(item => ({ id: item.id, name: item.name, size: item.size, category: 'file', kept: plan.keptIds.includes(item.id) })), 800 * 360, 1800);

  const changeScenario = (value: Scenario) => {
    setScenario(value);
    const nextUnit = value === 'classic' ? gb : BYTE_UNITS.MB;
    setCapacity(Math.floor((value === 'classic' ? 10 * gb : 15 * gb) / nextUnit));
    setSelectedIds([]);
    setRevealed(false);
    setNotice('');
  };

  const toggleFile = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(ids => ids.filter(selected => selected !== id));
      setNotice('');
      setRevealed(false);
      return;
    }
    const verdict = canAdd(items, selectedIds, id, actualCapacity, unitBytes);
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
          <button aria-pressed={mode === 'challenge'} onClick={() => { setMode('challenge'); setRevealed(false); }}>Challenge</button>
        </div>
      </div>

      <div className="play-controls">
        <label>Sample data <select aria-label="Sample data" value={scenario} onChange={event => changeScenario(event.target.value as Scenario)}>
          <option value="tight">Tight 40 GB</option><option value="student">Student sample</option><option value="classic">Classic challenge</option>
        </select></label>
        <span>{pluralize(items.length, 'file')} · {formatSize(totalBytes)} total</span>
      </div>

      <div className="capacity-control">
        <label className="capacity-label" htmlFor="play-capacity"><span>Storage capacity</span><output data-testid="capacity-value">{formatSize(actualCapacity * unitBytes)}</output></label>
        <input id="play-capacity" aria-label="Storage capacity" type="range" min={0} max={maxCapacity} step={1} value={actualCapacity} onChange={event => { setCapacity(Number(event.target.value)); setRevealed(false); }} />
        <div className="drive-ticks">{[5, 15, 64].filter(value => Math.floor(value * gb / unitBytes) <= maxCapacity).map(value => <button key={value} onClick={() => setCapacity(Math.floor(value * gb / unitBytes))}>{value} GB</button>)}</div>
      </div>

      <div className="play-scoreline" aria-live="polite">
        <div><strong className="gold-mark" data-testid="retained-importance">{retainedPercent}%</strong><small> importance retained ({plan.totalImportance} of {totalImportance})</small></div>
        <div><strong data-testid="used-space">{formatSize(plan.totalSize)}</strong><small> used of {formatSize(actualCapacity * unitBytes)}</small></div>
        <div><strong data-testid="kept-count">{plan.keptIds.length}</strong><small> kept · <span data-testid="moved-count">{plan.movedIds.length}</span> {pluralize(plan.movedIds.length, 'file')} moved</small></div>
      </div>

      {mode === 'explore' ? <>
        <div className="curve-card" aria-label="Importance retained by capacity">
          <span className="curve-title">Importance retained as capacity grows</span>
          <svg viewBox="0 0 700 96" role="img" aria-label={`Capacity curve; current capacity ${formatSize(actualCapacity * unitBytes)}, knee at ${formatSize(knee.capacity * unitBytes)}`}>
            <path d={chartPath} fill="none" stroke="var(--highlight)" strokeWidth="3" />
            <line x1={kneeX} x2={kneeX} y1="8" y2="88" stroke="var(--paper)" strokeDasharray="4 4" />
            <line x1={currentX} x2={currentX} y1="8" y2="88" stroke="var(--highlight)" strokeWidth="2" />
            <circle cx={currentX} cy={currentY} r="5" fill="var(--highlight)" />
            <text x="4" y="12" fill="var(--paper)" fontSize="10">100%</text><text x="4" y="90" fill="var(--paper)" fontSize="10">0%</text>
          </svg>
          <p data-testid="knee-sentence">{kneeSentence(curve, actualCapacity, unitBytes)}</p>
        </div>
        <div className="play-files" aria-label="File placement blocks">
          {grouped.map(item => <article key={item.id} className={`play-file ${item.kept ? 'kept' : 'moved'}`} title={item.name} style={{ flexBasis: `${Math.max(120, 800 * item.size / totalBytes)}px` }}>
            <span className="play-file-name">{truncateTreemapLabel(item.name, 24)}</span><b>{formatSize(item.size)}</b><small>{item.kept ? 'Kept' : 'Moved'}</small>
          </article>)}
        </div>
        <button className="play-primary btn-primary" onClick={() => setMode('challenge')}>Try a challenge</button>
      </> : <>
        <p className="challenge-hint">Choose files that fit. Your score updates as you pack.</p>
        {notice && <p role="alert" className="challenge-notice">{notice}</p>}
        <div className="play-files challenge-files" aria-label="Challenge files">
          {items.map(item => {
            const selected = selectedIds.includes(item.id);
            return <button type="button" key={item.id} className={`play-file ${selected ? 'kept' : 'moved'}`} style={{ flexBasis: `${Math.max(120, 800 * item.size / totalBytes)}px` }} aria-pressed={selected} onClick={() => toggleFile(item.id)}>
              <span className="play-file-name">{truncateTreemapLabel(item.name, 24)}</span><b>{formatSize(item.size)}</b><small>{item.importance} importance</small>
            </button>;
          })}
        </div>
        <p className="challenge-hint">Your pack: {pluralize(selection.count, 'file')} · {formatSize(selection.totalSize)} · {selection.totalImportance} importance</p>
        <div className="challenge-actions">
          {!revealed ? <button className="reveal-button btn-primary" onClick={() => setRevealed(true)}>Reveal answers</button> : <button className="reveal-button btn-primary" onClick={() => { setSelectedIds([]); setRevealed(false); setNotice(''); }}>Try again</button>}
          <button className="play-outline" onClick={() => navigate('/optimizer')}>Open optimizer</button>
        </div>
        {revealed && <section className="score-comparison" aria-label="Challenge answers" data-testid="challenge-results">
          <article><span>Your pack</span><strong data-testid="your-score">{selection.totalImportance}</strong><small>{formatSize(selection.totalSize)}</small></article>
          <article><span>Greedy</span><strong data-testid="greedy-score">{greedy.totalImportance}</strong><small>{formatSize(greedy.totalSize)}</small></article>
          <article><span>DP optimal</span><strong data-testid="optimal-score">{optimal.totalImportance}</strong><small>{formatSize(optimal.totalSize)}</small></article>
          <p>DP is the best score for this capacity, so you can match it but never beat it.</p>
          <p>{pluralize(filesToAdd.length, 'optimal file')} to add{filesToAdd.length ? `: ${filesToAdd.map(item => item.name).join(', ')}` : ''} · {pluralize(filesToRemove.length, 'extra file')} to remove{filesToRemove.length ? `: ${filesToRemove.map(item => item.name).join(', ')}` : ''}.</p>
        </section>}
      </>}
    </section>
  </div>;
};
