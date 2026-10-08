import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import { useAppStore } from '../../store/useAppStore';
import { solveTeachingKnapsack } from '../../engine/knapsack';
import { solveGreedy } from '../../engine/greedy';
import { solveBruteForce } from '../../engine/bruteForce';
import { KnapsackItem, TeachingStep, TableStep, TracebackStep, TeachingEngineResult } from '../../engine/types';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

// Small tutorial datasets
const TUTORIAL_ITEMS: KnapsackItem[] = [
  { id: 't1', name: 'A', originalSize: 2000, normalizedSize: 2, value: 3 },
  { id: 't2', name: 'B', originalSize: 3000, normalizedSize: 3, value: 4 },
  { id: 't3', name: 'C', originalSize: 4000, normalizedSize: 4, value: 5 },
];
const TUTORIAL_CAPACITY = 5;

const GREEDY_COUNTER: KnapsackItem[] = [
  { id: 'g1', name: 'A', originalSize: 6000, normalizedSize: 6, value: 30 },
  { id: 'g2', name: 'B', originalSize: 5000, normalizedSize: 5, value: 24 },
  { id: 'g3', name: 'C', originalSize: 5000, normalizedSize: 5, value: 24 },
];
const GREEDY_CAPACITY = 10;

export const AlgorithmPage: React.FC = () => {
  const navigate = useNavigate();
  const { files, quotaBytes } = useAppStore();

  const [activeTab, setActiveTab] = useState('Walkthrough');
  const [dataset, setDataset] = useState<'tutorial' | 'greedy' | 'your'>('tutorial');
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve items and capacity
  const { items, capacity } = useMemo(() => {
    if (dataset === 'tutorial') return { items: TUTORIAL_ITEMS, capacity: TUTORIAL_CAPACITY };
    if (dataset === 'greedy') return { items: GREEDY_COUNTER, capacity: GREEDY_CAPACITY };
    // 'your' - take top 8 by value from user's files
    const sorted = [...files]
      .filter(f => f.size > 0 && !f.isExcluded)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8);
    const cap = Math.min(15, sorted.length > 0 ? sorted.reduce((s, f) => s + 1, 0) + 2 : 8);
    const mapped: KnapsackItem[] = sorted.map((f, i) => ({
      id: f.id,
      name: f.name.length > 12 ? f.name.slice(0, 12) + '...' : f.name,
      originalSize: f.size,
      normalizedSize: i + 1, // simplified sizes for table
      value: f.priority,
    }));
    return { items: mapped, capacity: cap };
  }, [dataset, files]);

  // Run teaching engine
  const result: TeachingEngineResult = useMemo(() => {
    return solveTeachingKnapsack(items, capacity);
  }, [items, capacity]);

  const totalSteps = result.steps.length;
  const currentStep = result.steps[stepIndex] || null;

  // Playback
  useEffect(() => {
    if (isPlaying && stepIndex < totalSteps - 1) {
      timerRef.current = setInterval(() => {
        setStepIndex(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800 / speed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, stepIndex, totalSteps, speed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setStepIndex(p => Math.min(p + 1, totalSteps - 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setStepIndex(p => Math.max(p - 1, 0)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [totalSteps]);

  // Cell state for the table
  const getCellState = (i: number, w: number): 'current' | 'dep-skip' | 'dep-take' | 'computed' | 'traceback' | 'empty' => {
    if (!currentStep) return 'empty';
    if (currentStep.type === 'cell') {
      const cs = currentStep as TableStep;
      if (cs.i === i && cs.w === w) return 'current';
      if (cs.i - 1 === i && cs.w === w) return 'dep-skip';
      if (cs.candidateTakeValue !== null && cs.i - 1 === i && cs.w - items[cs.i - 1].normalizedSize === w) return 'dep-take';
    }
    // Check if this cell was already computed
    const prevSteps = result.steps.slice(0, stepIndex + 1);
    for (const s of prevSteps) {
      if (s.type === 'traceback' && s.i === i && (s as TracebackStep).w === w) return 'traceback';
      if (s.type === 'cell' && s.i === i && (s as TableStep).w === w) return 'computed';
    }
    return 'empty';
  };

  const cellColors: Record<string, { bg: string; text: string; border?: string }> = {
    'current': { bg: 'var(--color-forest)', text: '#fff' },
    'dep-skip': { bg: 'transparent', text: 'var(--color-ink)', border: 'var(--color-brass)' },
    'dep-take': { bg: 'transparent', text: 'var(--color-ink)', border: 'var(--color-brass)' },
    'computed': { bg: 'var(--color-surface-sunken)', text: 'var(--color-ink)' },
    'traceback': { bg: 'transparent', text: 'var(--color-forest)', border: 'var(--color-forest)' },
    'empty': { bg: 'transparent', text: 'var(--color-ink-3)' },
  };

  return (
    <div className="page-container animate-page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1>Algorithm analysis</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Terminology strip */}
      <div style={{
        display: 'flex', gap: '24px', padding: '12px 16px', marginBottom: '24px',
        backgroundColor: 'var(--color-forest-50)',
        borderRadius: 'var(--radius-control)',
        fontSize: '13px', color: 'var(--color-forest-700)', flexWrap: 'wrap'
      }}>
        <span><strong>space</strong> = capacity W</span>
        <span><strong>file</strong> = item</span>
        <span><strong>size</strong> = weight w<sub>i</sub></span>
        <span><strong>importance</strong> = value v<sub>i</sub></span>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '16px' }}>
        <SegmentedControl
          options={['Walkthrough', 'Comparison', 'Complexity', 'Correctness']}
          selected={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Dataset selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Button variant={dataset === 'tutorial' ? 'primary' : 'secondary'} size="sm" onClick={() => { setDataset('tutorial'); setStepIndex(0); setIsPlaying(false); }}>
          Tutorial (3 items)
        </Button>
        <Button variant={dataset === 'greedy' ? 'primary' : 'secondary'} size="sm" onClick={() => { setDataset('greedy'); setStepIndex(0); setIsPlaying(false); }}>
          Greedy counterexample
        </Button>
        {files.length > 0 && (
          <Button variant={dataset === 'your' ? 'primary' : 'secondary'} size="sm" onClick={() => { setDataset('your'); setStepIndex(0); setIsPlaying(false); }}>
            Your plan (top {Math.min(8, files.length)} items)
          </Button>
        )}
      </div>

      {/* ===== WALKTHROUGH TAB ===== */}
      {activeTab === 'Walkthrough' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          {/* DP Table */}
          <Card style={{ overflow: 'auto' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 10px', borderBottom: '2px solid var(--color-border-strong)', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--color-surface-raised)', zIndex: 2 }}>
                      Item
                    </th>
                    {Array.from({ length: capacity + 1 }, (_, w) => (
                      <th key={w} style={{
                        padding: '6px 10px',
                        borderBottom: '2px solid var(--color-border-strong)',
                        textAlign: 'center',
                        minWidth: '42px',
                        color: 'var(--color-ink-2)'
                      }}>
                        w={w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: items.length + 1 }, (_, i) => (
                    <tr key={i}>
                      <td style={{
                        padding: '6px 10px',
                        fontWeight: 600,
                        borderRight: '1px solid var(--color-border-hairline)',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'var(--color-surface-raised)',
                        zIndex: 1
                      }}>
                        {i === 0 ? '--' : `${items[i - 1].name} (w=${items[i - 1].normalizedSize}, v=${items[i - 1].value})`}
                      </td>
                      {Array.from({ length: capacity + 1 }, (_, w) => {
                        const state = getCellState(i, w);
                        const colors = cellColors[state];
                        return (
                          <td key={w} style={{
                            padding: '6px 10px',
                            textAlign: 'center',
                            backgroundColor: colors.bg,
                            color: colors.text,
                            border: colors.border ? `2px solid ${colors.border}` : '1px solid var(--color-border-hairline)',
                            fontWeight: state === 'current' ? 700 : 400,
                            borderRadius: state === 'current' ? '4px' : '0',
                            transition: 'all 120ms ease'
                          }}>
                            {result.table[i]?.[w] ?? 0}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Explanation panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Step {stepIndex + 1} of {totalSteps}</h3>
              {currentStep && (
                <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-ink)' }}>
                  {currentStep.type === 'cell'
                    ? (currentStep as TableStep).explanation
                    : (currentStep as TracebackStep).reason}
                </div>
              )}
            </Card>

            {currentStep?.type === 'cell' && (
              <Card style={{ backgroundColor: 'var(--color-surface-sunken)' }}>
                <div className="text-caption text-ink-3" style={{ marginBottom: '6px' }}>Recurrence</div>
                <code style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', lineHeight: 1.6, wordBreak: 'break-all' }}>
                  {(currentStep as TableStep).recurrenceFormula}
                </code>
              </Card>
            )}

            {currentStep?.type === 'traceback' && (
              <Card style={{ backgroundColor: 'var(--color-forest-50)' }}>
                <div className="text-caption" style={{ color: 'var(--color-forest-700)', marginBottom: '4px' }}>Chosen so far</div>
                <div style={{ fontSize: '14px' }}>
                  {(currentStep as TracebackStep).chosenIds.map(id => items.find(it => it.id === id)?.name).join(', ') || 'None yet'}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      {activeTab === 'Walkthrough' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px', marginTop: '24px', padding: '16px',
          backgroundColor: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border-hairline)',
          borderRadius: 'var(--radius-card)'
        }}>
          <Button variant="ghost" size="sm" iconOnly icon={<RotateCcw size={16} />} onClick={() => { setStepIndex(0); setIsPlaying(false); }} aria-label="Restart" />
          <Button variant="ghost" size="sm" iconOnly icon={<SkipBack size={16} />} onClick={() => setStepIndex(Math.max(0, stepIndex - 1))} aria-label="Step back" />
          <Button variant="primary" size="sm" iconOnly icon={isPlaying ? <Pause size={16} /> : <Play size={16} />} onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? 'Pause' : 'Play'} />
          <Button variant="ghost" size="sm" iconOnly icon={<SkipForward size={16} />} onClick={() => setStepIndex(Math.min(totalSteps - 1, stepIndex + 1))} aria-label="Step forward" />
          <Button variant="ghost" size="sm" iconOnly icon={<ChevronRight size={16} />} onClick={() => { setStepIndex(totalSteps - 1); setIsPlaying(false); }} aria-label="Skip to end" />

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border-hairline)', margin: '0 4px' }} />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-ink-2)' }}>
            Speed
            <input
              type="range" min="0.25" max="4" step="0.25"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              style={{ width: '80px' }}
            />
            <span className="font-mono" style={{ width: '36px' }}>{speed}x</span>
          </label>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border-hairline)', margin: '0 4px' }} />

          {/* Scrubber */}
          <input
            type="range"
            min={0}
            max={totalSteps - 1}
            value={stepIndex}
            onChange={(e) => { setStepIndex(parseInt(e.target.value)); setIsPlaying(false); }}
            style={{ width: '160px' }}
          />
          <span className="font-mono text-caption">{stepIndex + 1}/{totalSteps}</span>
        </div>
      )}

      {/* ===== COMPARISON TAB ===== */}
      {activeTab === 'Comparison' && (
        <ComparisonTab items={items} capacity={capacity} />
      )}

      {/* ===== COMPLEXITY TAB ===== */}
      {activeTab === 'Complexity' && (
        <Card>
          <h3 style={{ margin: '0 0 16px 0' }}>Complexity analysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '8px' }}>
              <div className="text-caption text-ink-3">Items (n)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 600, color: 'var(--color-forest)' }}>{items.length}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '8px' }}>
              <div className="text-caption text-ink-3">Capacity (W)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 600, color: 'var(--color-forest)' }}>{capacity}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '8px' }}>
              <div className="text-caption text-ink-3">Table size</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 600, color: 'var(--color-forest)' }}>{((items.length + 1) * (capacity + 1)).toLocaleString()} cells</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '8px' }}>
              <div className="text-caption text-ink-3">Cells computed</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 600, color: 'var(--color-forest)' }}>{result.steps.filter(s => s.type === 'cell').length.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--color-ink-2)' }}>
            <p style={{ marginBottom: '12px' }}>
              <strong>Time complexity: O(nW)</strong> where n is the number of items and W is the capacity in normalised units.
              This is <em>pseudo-polynomial</em>: polynomial in the numeric value of W, but exponential in the number of
              bits needed to encode W. This makes the 0/1 knapsack problem <em>weakly NP-complete</em>.
            </p>
            <p>
              <strong>Space complexity: O(nW)</strong> for the full table, reduced to O(W) with rolling rows when traceback is
              not needed, plus O(n*W/8) for the bit-packed decision array used in the production solver.
            </p>
          </div>
        </Card>
      )}

      {/* ===== CORRECTNESS TAB ===== */}
      {activeTab === 'Correctness' && (
        <CorrectnessTab />
      )}
    </div>
  );
};

// --- Comparison sub-tab ---
const ComparisonTab: React.FC<{ items: KnapsackItem[]; capacity: number }> = ({ items, capacity }) => {
  const dpResult = useMemo(() => solveTeachingKnapsack(items, capacity), [items, capacity]);
  const greedyResult = useMemo(() => solveGreedy(items, {
    quotaUnits: capacity,
    quotaBytes: capacity,
    unitBytes: 1,
  }), [items, capacity]);

  const canBrute = items.length <= 20;
  const bruteResult = useMemo(() => canBrute ? solveBruteForce(items, capacity) : null, [items, capacity, canBrute]);

  return (
    <Card>
      <h3 style={{ margin: '0 0 16px 0' }}>DP vs Greedy{canBrute ? ' vs Brute Force' : ''}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border-strong)' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Metric</th>
            <th style={{ padding: '8px 12px', textAlign: 'right' }}>DP (optimal)</th>
            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Greedy</th>
            {canBrute && <th style={{ padding: '8px 12px', textAlign: 'right' }}>Brute Force</th>}
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--color-border-hairline)' }}>
            <td style={{ padding: '8px 12px' }}>Total value</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{dpResult.totalValue}</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: greedyResult.totalValue < dpResult.totalValue ? 'var(--color-semantic-move)' : undefined }}>{greedyResult.totalValue}</td>
            {canBrute && bruteResult && <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{bruteResult.bestValue}</td>}
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border-hairline)' }}>
            <td style={{ padding: '8px 12px' }}>Items chosen</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{dpResult.keptItemIds.length}</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{greedyResult.keptItems.length}</td>
            {canBrute && bruteResult && <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{bruteResult.bestSubset.length}</td>}
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border-hairline)' }}>
            <td style={{ padding: '8px 12px' }}>Total weight</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {dpResult.keptItemIds.reduce((s, id) => s + (items.find(it => it.id === id)?.normalizedSize || 0), 0)}
            </td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {greedyResult.keptItems.reduce((s, it) => s + it.normalizedSize, 0)}
            </td>
            {canBrute && bruteResult && <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {bruteResult.bestSubset.reduce((s, it) => s + it.normalizedSize, 0)}
            </td>}
          </tr>
        </tbody>
      </table>
      {greedyResult.totalValue < dpResult.totalValue && (
        <div style={{
          marginTop: '16px', padding: '12px 16px',
          backgroundColor: 'var(--color-brass-soft)',
          borderRadius: '8px', fontSize: '14px', lineHeight: 1.6
        }}>
          The greedy algorithm chose items by value-to-weight ratio, but for the 0/1 knapsack this does not guarantee
          optimality. Greedy achieves {greedyResult.totalValue} vs DP's {dpResult.totalValue}.
        </div>
      )}
    </Card>
  );
};

// --- Correctness sub-tab ---
const CorrectnessTab: React.FC = () => {
  const [testState, setTestState] = useState<'idle' | 'running' | 'done'>('idle');
  const [passCount, setPassCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [failCase, setFailCase] = useState<string | null>(null);

  const runTests = () => {
    setTestState('running');
    let passed = 0;
    let failed = 0;
    let firstFail: string | null = null;

    for (let t = 0; t < 200; t++) {
      const n = Math.floor(Math.random() * 6) + 2;
      const W = Math.floor(Math.random() * 10) + 3;
      const items: KnapsackItem[] = [];
      for (let i = 0; i < n; i++) {
        const sz = Math.floor(Math.random() * W) + 1;
        const v = Math.floor(Math.random() * 10) + 1;
        items.push({ id: `r${t}-${i}`, name: `Item${i}`, originalSize: sz * 1000, normalizedSize: sz, value: v });
      }
      const dp = solveTeachingKnapsack(items, W);
      const brute = solveBruteForce(items, W);
      if (dp.totalValue === brute.bestValue) {
        passed++;
      } else {
        failed++;
        if (!firstFail) {
          firstFail = `Test ${t}: n=${n}, W=${W}, DP=${dp.totalValue}, BF=${brute.bestValue}`;
        }
      }
    }
    setPassCount(passed);
    setFailCount(failed);
    setFailCase(firstFail);
    setTestState('done');
  };

  return (
    <Card>
      <h3 style={{ margin: '0 0 16px 0' }}>Correctness verification</h3>
      <p className="text-body-small text-ink-2" style={{ marginBottom: '16px' }}>
        Run 200 randomised tests comparing the DP result against brute force to verify correctness.
      </p>
      <Button variant="primary" size="sm" onClick={runTests} disabled={testState === 'running'}>
        {testState === 'running' ? 'Running...' : testState === 'done' ? 'Run again' : 'Run 200 tests'}
      </Button>

      {testState === 'done' && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
          <div style={{
            padding: '16px', borderRadius: '8px', flex: 1, textAlign: 'center',
            backgroundColor: 'var(--color-forest-50)', border: '1px solid var(--color-forest-100)'
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 600, color: 'var(--color-semantic-keep)' }}>{passCount}</div>
            <div className="text-caption text-ink-2">Passed</div>
          </div>
          <div style={{
            padding: '16px', borderRadius: '8px', flex: 1, textAlign: 'center',
            backgroundColor: failCount > 0 ? '#fdf2f1' : 'var(--color-surface-sunken)',
            border: failCount > 0 ? '1px solid #e8c6c1' : '1px solid var(--color-border-hairline)'
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 600, color: failCount > 0 ? 'var(--color-semantic-danger)' : 'var(--color-ink-3)' }}>{failCount}</div>
            <div className="text-caption text-ink-2">Failed</div>
          </div>
        </div>
      )}
      {failCase && (
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fdf2f1', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
          {failCase}
        </div>
      )}
    </Card>
  );
};

