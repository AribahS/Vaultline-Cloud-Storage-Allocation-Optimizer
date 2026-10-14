import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, Pin, Eye, CheckCircle2, RotateCcw } from 'lucide-react';
import { GREEDY_COUNTEREXAMPLE_DATASET } from '../../engine/greedy';
import { formatScore, formatSize, pluralize } from '../../lib/format';
import { truncateTreemapLabel } from '../../lib/treemapLabels';
import {
  buildCapacityTable,
  buildUserPlayItems,
  canAdd,
  choosePlayScale,
  greedyPlan,
  importanceCurve,
  normalizePlayItems,
  planForCapacity,
  scoreSelection,
  type PlayItem,
} from '../../lib/playKnapsack';
import { createTightPlayDataset } from '../../lib/tightPlayDataset';
import { useAppStore } from '../../store/useAppStore';

type Source = 'your' | 'tight' | 'greedy';

const greedyTrapItems: PlayItem[] = [
  { id: 'trap-a', name: 'Item A (Size 6, Imp 30)', size: 6 * 1024 ** 3, weight: 6, importance: 30 },
  { id: 'trap-b', name: 'Item B (Size 5, Imp 24)', size: 5 * 1024 ** 3, weight: 5, importance: 24 },
  { id: 'trap-c', name: 'Item C (Size 5, Imp 24)', size: 5 * 1024 ** 3, weight: 5, importance: 24 },
];

export const PlayPage: React.FC = () => {
  const navigate = useNavigate();
  const openAlgorithm = useOpenAlgorithmDrawer();
  const { files, quotaBytes, setQuotaBytes, knapsackResult } = useAppStore();

  const [source, setSource] = useState<Source>(() => (files.length ? 'your' : 'tight'));
  const [sourceWasChosen, setSourceWasChosen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBestFit, setShowBestFit] = useState(false);
  const [notice, setNotice] = useState('');

  // Never silently fall back to a sample when the user has files
  const activeSource: Source =
    source === 'your' && files.length === 0
      ? 'tight'
      : source === 'tight' && files.length > 0 && !sourceWasChosen
      ? 'your'
      : source;

  // Source items definition
  const rawItems: PlayItem[] = useMemo(() => {
    if (activeSource === 'your') {
      const scale = choosePlayScale(
        files.reduce((sum, f) => sum + f.size, 0),
        files.length
      );
      return buildUserPlayItems(files, scale.unitBytes);
    }
    if (activeSource === 'tight') {
      return createTightPlayDataset();
    }
    // greedy trap
    return greedyTrapItems;
  }, [activeSource, files]);

  // Capped at 40 largest files for fair interactive comparison if user has > 40 files
  const isCappedAt40 = rawItems.length > 40;
  const displayItems = useMemo(() => {
    if (!isCappedAt40) return rawItems;
    return [...rawItems].sort((a, b) => b.size - a.size || b.importance - a.importance).slice(0, 40);
  }, [rawItems, isCappedAt40]);

  const totalBytes = useMemo(() => displayItems.reduce((sum, item) => sum + item.size, 0), [displayItems]);
  const scale = useMemo(() => choosePlayScale(totalBytes, displayItems.length), [totalBytes, displayItems.length]);
  const items = useMemo(() => normalizePlayItems(displayItems, scale.unitBytes), [displayItems, scale.unitBytes]);
  const maxCapacity = useMemo(() => items.reduce((sum, item) => sum + item.weight, 0), [items]);

  // DP table built ONCE per file set
  const table = useMemo(() => buildCapacityTable(items, maxCapacity), [items, maxCapacity]);
  const curve = useMemo(() => importanceCurve(table), [table]);

  // Shared capacity mapped to units
  const currentCapacityBytes = Math.max(0, Math.min(quotaBytes, totalBytes || quotaBytes));
  const capacityUnits = currentCapacityBytes >= totalBytes
    ? maxCapacity
    : Math.max(0, Math.floor(currentCapacityBytes / scale.unitBytes));
  const bestFitResult = useMemo(() => {
    if (activeSource === 'your' && knapsackResult?.quotaBytes === quotaBytes) {
      const keptIds = knapsackResult.keptItems.map(item => item.id);
      const keptSet = new Set(keptIds);
      const keptItems = items.filter(item => keptSet.has(item.id));
      return {
        keptIds,
        movedIds: items.filter(item => !keptSet.has(item.id)).map(item => item.id),
        totalImportance: knapsackResult.totalValue,
        totalSize: knapsackResult.totalSizeKept,
        capacity: capacityUnits,
      };
    }
    return planForCapacity(table, capacityUnits);
  }, [activeSource, knapsackResult, quotaBytes, items, table, capacityUnits]);
  const greedyResult = useMemo(() => greedyPlan(items, capacityUnits), [items, capacityUnits]);

  // User pack score
  const userPack = useMemo(() => scoreSelection(items, selectedIds), [items, selectedIds]);
  const userPackWeight = useMemo(
    () => selectedIds.reduce((sum, id) => sum + (items.find(i => i.id === id)?.weight ?? 0), 0),
    [items, selectedIds]
  );
  const usedBytes = userPack.totalSize;
  const freeBytes = Math.max(0, currentCapacityBytes - usedBytes);
  const totalImportance = items.filter(i => !i.excluded).reduce((sum, i) => sum + i.importance, 0);
  const userPackPct = totalImportance > 0 ? Math.round((userPack.totalImportance / totalImportance) * 100) : 0;

  // Auto-init always keep files in pack
  useEffect(() => {
    const pinned = items.filter(i => i.pinned).map(i => i.id);
    setSelectedIds(prev => Array.from(new Set([...prev.filter(id => items.some(i => i.id === id)), ...pinned])));
  }, [items]);

  const changeSource = (next: Source) => {
    setSourceWasChosen(true);
    setSource(next);
    setShowBestFit(false);
    setNotice('');
    if (next === 'greedy') {
      setQuotaBytes(10 * 1024 ** 3);
    }
  };

  const toggleTile = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || item.pinned || item.excluded) return;

    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(selected => selected !== id));
      setNotice('');
      return;
    }

    const check = canAdd(items, selectedIds, id, capacityUnits, scale.unitBytes);
    if (!check.allowed) {
      setNotice(check.reason || 'This file does not fit in remaining capacity.');
      return;
    }

    setSelectedIds(prev => [...prev, id]);
    setNotice('');
  };

  const handleUseBestFit = () => {
    setSelectedIds([...bestFitResult.keptIds]);
    setShowBestFit(true);
    setNotice('');
  };

  const handleClearPack = () => {
    const pinned = items.filter(i => i.pinned).map(i => i.id);
    setSelectedIds(pinned);
    setShowBestFit(false);
    setNotice('');
  };

  // Compare file differences
  const missingInUserPack = bestFitResult.keptIds.filter(id => !selectedIds.includes(id));
  const extraInUserPack = selectedIds.filter(id => !bestFitResult.keptIds.includes(id));

  // Chart data
  const curvePoints = curve.filter((_, idx) => idx % Math.max(1, Math.ceil(curve.length / 100)) === 0 || idx === curve.length - 1);
  const chartPath = curvePoints
    .map((point, index) => {
      const x = maxCapacity ? (point.capacity / maxCapacity) * 600 : 0;
      const y = 84 - (point.percent / 100) * 70;
      return `${index === 0 ? 'M' : 'L'}${x + 40},${y}`;
    })
    .join(' ');

  const bestFitX = maxCapacity ? (capacityUnits / maxCapacity) * 600 + 40 : 40;
  const bestFitY = 84 - (totalImportance > 0 ? (bestFitResult.totalImportance / totalImportance) * 70 : 0);

  const userPackX = maxCapacity ? Math.min(640, (userPackWeight / maxCapacity) * 600 + 40) : 40;
  const userPackY = 84 - (totalImportance > 0 ? (userPack.totalImportance / totalImportance) * 70 : 0);

  // Computed summary sentence for curve
  const kneePoint = curve.find(p => p.percent >= 80) ?? curve[curve.length - 1] ?? { capacity: 0, percent: 100 };
  const kneeBytes = kneePoint.capacity * scale.unitBytes;
  const kneePct = Math.round(kneePoint.percent);
  const remainingSize = Math.max(0, totalBytes - kneeBytes);
  const remainingPct = Math.max(0, 100 - kneePct);
  const curveSentence = `Most of the value (${kneePct}%) fits in ${formatSize(kneeBytes)}; the last ${formatSize(remainingSize)} adds only ${remainingPct}%.`;

  const allEqualImportance =
    activeSource === 'your' &&
    items.length > 1 &&
    new Set(items.filter(i => !i.excluded).map(i => i.importance)).size === 1;

  return (
    <div className="page-container responsive-page play-page" data-testid="play-page">
      <section className="vault-stage play-stage">
        {/* Header */}
        <div className="play-heading" style={{ marginBottom: '16px' }}>
          <div>
            <p className="play-eyebrow">INTERACTIVE EXPLORATION</p>
            <h1 className="gold-mark">Play</h1>
            <p>Explore trade-offs and pack your files interactively against real storage limits.</p>
          </div>
          <button type="button" className="play-outline" onClick={() => navigate('/results')}>
            Open results
          </button>
        </div>

        {/* Source selector */}
        <div className="play-controls" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <label htmlFor="play-source-select" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Files to use:
            <select
              id="play-source-select"
              aria-label="Files to use"
              value={activeSource}
              onChange={e => changeSource(e.target.value as Source)}
              style={{ padding: '6px 10px', borderRadius: '8px', background: 'var(--vault)', color: 'var(--paper)', border: '1px solid var(--card-border)' }}
            >
              <option value="your" disabled={!files.length}>
                Your files {files.length ? `(${pluralize(files.length, 'file')})` : '(no files yet)'}
              </option>
              <option value="tight">Tight 40 GB example</option>
              <option value="greedy">Greedy trap example (capacity 10; A 6/30, B 5/24, C 5/24; greedy 30, best 48)</option>
            </select>
          </label>
          <span style={{ color: 'var(--paper)', fontSize: '13px' }}>
            <span data-testid="kept-count">{bestFitResult.keptIds.length}</span> kept · <span data-testid="moved-count">{items.filter(i => !bestFitResult.keptIds.includes(i.id)).length}</span> moved · {formatSize(totalBytes)} total
          </span>
        </div>

        {/* All-fit message when everything fits */}
        {activeSource === 'your' && files.length > 0 && bestFitResult.keptIds.length === items.length && (
          <p data-testid="all-fit-message" role="status" style={{ margin: '0 0 16px', padding: '12px 16px', borderRadius: '10px', background: 'color-mix(in srgb, var(--kept) 25%, var(--paper))', border: '1.5px solid var(--kept)', color: 'var(--ink)', fontWeight: 600, fontSize: '14px' }}>
            All your files fit in {formatSize(currentCapacityBytes)}. Lower the capacity to see what you would keep.
          </p>
        )}

        {!files.length && activeSource === 'tight' && (
          <p className="play-data-hint" style={{ marginBottom: '16px' }}>
            Add your files to explore your own data.{' '}
            <button type="button" className="play-outline" style={{ padding: '4px 10px', marginLeft: '8px' }} onClick={() => navigate('/files')}>
              <FilePlus size={14} /> Add files
            </button>
          </p>
        )}

        {isCappedAt40 && (
          <p className="play-data-hint" role="status" style={{ marginBottom: '16px' }}>
            Showing the 40 largest files for fair interactive comparison. The chart and Results screen still use all {pluralize(files.length, 'file')}.
          </p>
        )}

        {allEqualImportance && (
          <p className="play-data-hint" data-testid="equal-importance-message" style={{ marginBottom: '16px' }}>
            All files have the same importance, so the best fit simply keeps as much as fits.{' '}
            <button type="button" className="play-inline-link" onClick={() => navigate('/files')}>
              Edit scores in Files
            </button>
          </p>
        )}

        {/* Shared Capacity Slider */}
        <div className="capacity-control" style={{ margin: '16px 0' }}>
          <div className="capacity-label">
            <span>Storage capacity</span>
            <output data-testid="capacity-value">{formatSize(currentCapacityBytes)}</output>
          </div>
          <div className="play-range-wrap">
            <input
              id="play-capacity-slider"
              aria-label="Storage capacity"
              type="range"
              min={0}
              max={totalBytes || 1}
              step="any"
              value={currentCapacityBytes}
              onChange={e => {
                const val = Number(e.target.value);
                setQuotaBytes(val);
                setNotice('');
              }}
              style={{ width: '100%', accentColor: 'var(--highlight)' }}
            />
          </div>
          <div className="play-slider-footer">
            <span>{formatSize(0)}</span>
            <span>{formatSize(totalBytes)}</span>
          </div>
        </div>

        {/* Capacity Meter Bar */}
        <div style={{ margin: '16px 0', padding: '14px', borderRadius: '10px', background: 'color-mix(in srgb, var(--paper) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--paper) 20%, transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
            <span>
              {formatSize(usedBytes)} of {formatSize(currentCapacityBytes)}, {formatSize(freeBytes)} free
            </span>
            <span>
              Your pack: {pluralize(userPack.count, 'file')}, {formatSize(usedBytes)}, importance {formatScore(userPack.totalImportance)} of {formatScore(totalImportance)} ({userPackPct}%)
            </span>
          </div>
          {/* Visual meter bar */}
          <div style={{ height: '10px', width: '100%', background: 'color-mix(in srgb, var(--paper) 15%, transparent)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, currentCapacityBytes > 0 ? (usedBytes / currentCapacityBytes) * 100 : 0)}%`,
                background: usedBytes > currentCapacityBytes ? 'var(--moved)' : 'var(--kept)',
                transition: 'width 150ms ease-out',
              }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', margin: '16px 0' }}>
          <button
            type="button"
            className="vault-btn btn-primary"
            onClick={() => setShowBestFit(prev => !prev)}
            aria-pressed={showBestFit}
          >
            <Eye size={16} /> {showBestFit ? 'Hide best fit' : 'Show best fit'}
          </button>
          <button type="button" className="vault-btn btn-secondary" onClick={handleUseBestFit}>
            <CheckCircle2 size={16} /> Use best fit
          </button>
          <button type="button" className="vault-btn btn-secondary" onClick={handleClearPack}>
            <RotateCcw size={16} /> Clear pack
          </button>
        </div>

        {/* Status Line for Notices */}
        {notice && (
          <p role="alert" className="challenge-notice" style={{ margin: '12px 0' }}>
            {notice}
          </p>
        )}

        {/* Best Fit Comparison View */}
        {showBestFit && (
          <section className="score-comparison" aria-label="Best fit comparison" data-testid="challenge-results" style={{ margin: '16px 0', background: 'var(--paper)', color: 'var(--ink)' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <article>
                <span>Your pack</span>
                <strong data-testid="your-score">{formatScore(userPack.totalImportance)}</strong>
                <small>{formatSize(usedBytes)}</small>
              </article>
              <article>
                <span>Greedy</span>
                <strong data-testid="greedy-score">{formatScore(greedyResult.totalImportance)}</strong>
                <small>{formatSize(greedyResult.totalSize)}</small>
              </article>
              <article>
                <span>Best fit (exact)</span>
                <strong data-testid="optimal-score">{formatScore(bestFitResult.totalImportance)}</strong>
                <small>{formatSize(bestFitResult.totalSize)}</small>
              </article>
            </div>
            <p style={{ margin: '6px 0', fontSize: '13px', color: 'var(--ink)' }}>
              The best fit is exact, so you can match it but never beat it. Greedy is shown as a comparison.
            </p>
            {(missingInUserPack.length > 0 || extraInUserPack.length > 0) && (
              <p style={{ margin: '6px 0', fontSize: '12px', color: 'var(--color-ink-2)' }}>
                {missingInUserPack.length > 0 && (
                  <span>
                    Best fit includes {pluralize(missingInUserPack.length, 'other file')}:{' '}
                    {missingInUserPack.map(id => items.find(i => i.id === id)?.name).join(', ')}.{' '}
                  </span>
                )}
                {extraInUserPack.length > 0 && (
                  <span>
                    Your pack has {pluralize(extraInUserPack.length, 'file')} not in best fit:{' '}
                    {extraInUserPack.map(id => items.find(i => i.id === id)?.name).join(', ')}.
                  </span>
                )}
              </p>
            )}
          </section>
        )}

        {/* File Tiles Grid */}
        <div className="play-files" aria-label="Interactive file pack tiles" style={{ margin: '20px 0' }}>
          {items.map(item => {
            const isPacked = selectedIds.includes(item.id);
            const isOptimal = showBestFit && bestFitResult.keptIds.includes(item.id);
            const isBestFitMoved = showBestFit && !bestFitResult.keptIds.includes(item.id);

            // Will not fit check
            const fitVerdict = !isPacked ? canAdd(items, selectedIds, item.id, capacityUnits, scale.unitBytes) : { allowed: true };
            const willNotFit = !isPacked && !fitVerdict.allowed;

            // Tile styling classes
            let tileStyle: React.CSSProperties = {
              flexBasis: `${Math.max(160, 800 * item.size / Math.max(1, totalBytes))}px`,
              minHeight: '74px',
              cursor: item.pinned || item.excluded || willNotFit ? 'not-allowed' : 'pointer',
              border: '2px solid var(--ink)',
              borderRadius: '10px',
              padding: '12px',
              display: 'grid',
              gap: '4px',
              textAlign: 'left',
              transition: 'all 150ms ease',
              position: 'relative',
            };

            if (isPacked) {
              tileStyle.background = 'var(--kept)';
              tileStyle.color = 'var(--ink)';
              tileStyle.borderColor = 'var(--ink)';
            } else {
              tileStyle.background = 'var(--paper)';
              tileStyle.color = 'var(--ink)';
              tileStyle.borderColor = 'var(--ink)';
            }

            if (isOptimal) {
              tileStyle.outline = '3px solid var(--highlight)';
              tileStyle.outlineOffset = '2px';
            }

            if (isBestFitMoved && isPacked) {
              // Hatching only for "best fit moves this out"
              tileStyle.backgroundImage = 'repeating-linear-gradient(135deg, transparent 0, transparent 8px, color-mix(in srgb, var(--moved) 40%, transparent) 8px, color-mix(in srgb, var(--moved) 40%, transparent) 10px)';
            }

            if (item.excluded) {
              tileStyle.opacity = 0.5;
              tileStyle.background = 'var(--color-surface-disabled)';
            }

            return (
              <button
                type="button"
                key={item.id}
                className={`play-file ${isPacked ? 'kept' : ''}`}
                style={tileStyle}
                aria-pressed={isPacked}
                disabled={item.pinned || item.excluded || willNotFit}
                onClick={() => toggleTile(item.id)}
                title={item.name}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span className="play-file-name" style={{ fontWeight: 700, fontSize: '13px' }}>
                    {truncateTreemapLabel(item.name, 22)}
                  </span>
                  {item.pinned && <Pin size={12} color="var(--ink)" />}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <b>{formatSize(item.size)}</b>
                  <span>{formatScore(item.importance)}/10</span>
                </div>

                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  {item.pinned ? (
                    <span style={{ fontWeight: 600 }}>Always keep</span>
                  ) : item.excluded ? (
                    <span>Never keep</span>
                  ) : willNotFit ? (
                    <span style={{ color: 'var(--moved)', fontWeight: 600 }}>{fitVerdict.reason}</span>
                  ) : isPacked ? (
                    <span style={{ fontWeight: 600 }}>Packed</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Tap to add</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Staircase Chart with Axes */}
        <div className="curve-card" aria-label="Importance kept vs storage chart" style={{ marginTop: '24px', height: 'auto', padding: '16px' }}>
          <span className="curve-title" style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
            Importance kept vs storage (0/1 Knapsack curve)
          </span>

          <svg viewBox="0 0 660 110" role="img" aria-label="Importance vs storage chart" style={{ width: '100%', height: '110px' }}>
            {/* Axes */}
            <line x1="40" y1="14" x2="40" y2="84" stroke="var(--paper)" strokeWidth="1.5" />
            <line x1="40" y1="84" x2="640" y2="84" stroke="var(--paper)" strokeWidth="1.5" />

            {/* Y axis ticks */}
            <text x="8" y="18" fill="var(--paper)" fontSize="10">100%</text>
            <text x="14" y="52" fill="var(--paper)" fontSize="10">50%</text>
            <text x="20" y="88" fill="var(--paper)" fontSize="10">0%</text>

            {/* Curve line */}
            <path d={chartPath} fill="none" stroke="var(--highlight)" strokeWidth="2.5" />

            {/* Current best fit dot */}
            <circle cx={bestFitX} cy={bestFitY} r="5" fill="var(--highlight)" />
            <text x={Math.max(40, bestFitX - 25)} y={Math.max(14, bestFitY - 8)} fill="var(--highlight)" fontSize="9" fontWeight="bold">
              Best fit
            </text>

            {/* User pack marker dot */}
            <circle cx={userPackX} cy={userPackY} r="4" fill="var(--kept)" stroke="var(--ink)" strokeWidth="1.5" />
            <text x={Math.min(580, userPackX + 6)} y={Math.min(94, userPackY + 12)} fill="var(--kept)" fontSize="9" fontWeight="bold">
              Your pack
            </text>

            {/* X axis end labels */}
            <text x="40" y="102" fill="var(--paper)" fontSize="10">{formatSize(0)}</text>
            <text x="640" y="102" fill="var(--paper)" fontSize="10" textAnchor="end">{formatSize(totalBytes)}</text>
          </svg>

          <p data-testid="knee-sentence" style={{ fontSize: '13px', marginTop: '10px', color: 'var(--paper)', lineHeight: 1.5 }}>
            {curveSentence}
          </p>
        </div>
      </section>
    </div>
  );
};

export default PlayPage;
