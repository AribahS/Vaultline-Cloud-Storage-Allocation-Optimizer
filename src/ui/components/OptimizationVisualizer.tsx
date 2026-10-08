import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { useAppStore } from '../../store/useAppStore';
import { KnapsackItem, TeachingStep, TableStep } from '../../engine/types';
import { solveTeachingKnapsack } from '../../engine/knapsack';
import { solveGreedy } from '../../engine/greedy';
import { normaliseItemSize } from '../../engine/normalizer';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, CheckCircle2, XCircle, ArrowRight, Lightbulb, Cpu, BarChart3, Layers } from 'lucide-react';

export const OptimizationVisualizer: React.FC = () => {
  const { files, quotaBytes } = useAppStore();
  const [stage, setStage] = useState<'density' | 'packing' | 'dp_matrix'>('density');
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prepare items for visualizer
  const visualizerData = useMemo(() => {
    const validFiles = files.filter(f => f.size > 0 && !f.isExcluded).slice(0, 7);
    if (validFiles.length === 0) {
      // Default teaching items if no files loaded
      return {
        items: [
          { id: '1', name: 'Design_Assets.zip', originalSize: 4000000000, normalizedSize: 4, value: 9 },
          { id: '2', name: 'Raw_Footage.mp4', originalSize: 5000000000, normalizedSize: 5, value: 7 },
          { id: '3', name: 'Project_Report.pdf', originalSize: 2000000000, normalizedSize: 2, value: 8 },
          { id: '4', name: 'Backup_Db.sql', originalSize: 3000000000, normalizedSize: 3, value: 6 },
        ],
        capacity: 8,
        unitBytes: 1000000000
      };
    }

    const minSize = Math.min(...validFiles.map(f => f.size));
    const unitBytes = Math.max(1, Math.floor(minSize / 2));
    const mapped: KnapsackItem[] = validFiles.map(f => ({
      id: f.id,
      name: f.name.length > 16 ? f.name.slice(0, 14) + '...' : f.name,
      originalSize: f.size,
      normalizedSize: normaliseItemSize(f.size, unitBytes),
      value: f.priority,
    }));

    const maxNormSize = Math.max(...mapped.map(m => m.normalizedSize), 1);
    const cap = Math.min(12, Math.max(maxNormSize + 2, Math.floor(quotaBytes / unitBytes)));

    return { items: mapped, capacity: cap, unitBytes };
  }, [files, quotaBytes]);

  // Calculated Density (Value / Size) sorted items
  const sortedByDensity = useMemo(() => {
    return [...visualizerData.items].map(item => ({
      ...item,
      density: (item.value / item.normalizedSize).toFixed(2)
    })).sort((a, b) => (b.value / b.normalizedSize) - (a.value / a.normalizedSize));
  }, [visualizerData.items]);

  // Run DP teaching engine
  const dpResult = useMemo(() => {
    return solveTeachingKnapsack(visualizerData.items, visualizerData.capacity);
  }, [visualizerData.items, visualizerData.capacity]);

  const keptItems = useMemo(() => {
    const set = new Set(dpResult?.keptItemIds || []);
    return visualizerData.items.filter(i => set.has(i.id));
  }, [dpResult, visualizerData.items]);

  const droppedItems = useMemo(() => {
    const set = new Set(dpResult?.keptItemIds || []);
    return visualizerData.items.filter(i => !set.has(i.id));
  }, [dpResult, visualizerData.items]);

  const totalSizeKept = useMemo(() => {
    return keptItems.reduce((acc, i) => acc + i.normalizedSize, 0);
  }, [keptItems]);

  const totalSteps = dpResult?.steps?.length || 0;
  const currentStep = dpResult?.steps?.[stepIndex] || null;

  // Auto-play timer
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
      }, 900 / speed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, stepIndex, totalSteps, speed]);

  return (
    <Card style={{ padding: '24px', border: '1px solid var(--color-border-hairline)', backgroundColor: 'var(--color-surface-raised)' }}>
      {/* Visualizer Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="var(--highlight)" />
            <h3 style={{ margin: 0 }}>Optimization Visualizer</h3>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--paper)', color: 'var(--ink)', fontWeight: 600 }}>
              Transparent Engine Rationale
            </span>
          </div>
          <p className="text-body-small text-ink-2" style={{ marginTop: '4px' }}>
            See how Vaultline weighs file importance against size to build a plan on the selected size scale.
          </p>
        </div>

        {/* View stage toggles */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--color-surface-sunken)', padding: '4px', borderRadius: '8px' }}>
          {[
            { id: 'density', label: '1. Value Density', icon: <BarChart3 size={14} /> },
            { id: 'packing', label: '2. Vault Packing', icon: <ArrowRight size={14} /> },
            { id: 'dp_matrix', label: '3. DP Decision Grid', icon: <Layers size={14} /> },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => {
                setStage(st.id as any);
                setStepIndex(0);
                setIsPlaying(false);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '6px', border: 'none',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                backgroundColor: stage === st.id ? 'var(--color-surface-raised)' : 'transparent',
                color: stage === st.id ? 'var(--ink)' : 'var(--color-ink-2)',
                boxShadow: stage === st.id ? 'var(--shadow-soft-sm)' : 'none'
              }}
            >
              {st.icon} {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stage 1: Efficiency & Density Ranking */}
      {stage === 'density' && (
        <div>
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--paper)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--ink)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Step 1: Value Density Calculation</strong>
              <p style={{ margin: '4px 0 0' }}>
                Each file's efficiency is calculated as <code>Importance / Size</code>. High density items give maximum importance per megabyte of space!
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {sortedByDensity.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border-hairline)',
                  backgroundColor: 'var(--color-surface-sunken)',
                  position: 'relative'
                }}
              >
                <span style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                  #{idx + 1} Rank
                </span>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-ink-2)', marginBottom: '8px' }}>
                  <span>Importance: <strong>{item.value}/10</strong></span>
                  <span>Units: <strong>{item.normalizedSize}</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--color-border-hairline)', fontSize: '12px' }}>
                  <span className="text-ink-3">Efficiency Density:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)', fontSize: '14px' }}>
                    {item.density} pts/unit
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage 2: Vault Capacity Packing Simulation */}
      {stage === 'packing' && (
        <div>
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--paper)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--color-ink)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--highlight)' }} />
            <div>
              <strong>Step 2: Capacity Allocation & Constraint Checking</strong>
              <p style={{ margin: '4px 0 0' }}>
                Files are packed into the target Vault capacity ({visualizerData.capacity} units). Items that fit and deliver optimal total value are kept, while others are recommended for external storage.
              </p>
            </div>
          </div>

          {/* Packing Bar Visual */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              <span>Vault Capacity Utilization</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {totalSizeKept} / {visualizerData.capacity} Units Used
              </span>
            </div>
            <div style={{ height: '24px', width: '100%', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '12px', overflow: 'hidden', display: 'flex', padding: '2px', border: '1px solid var(--color-border-strong)' }}>
              {keptItems.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    width: `${(item.normalizedSize / visualizerData.capacity) * 100}%`,
                    height: '100%',
                    backgroundColor: 'var(--ink)',
                    marginRight: '2px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--card)',
                    fontSize: '10px',
                    fontWeight: 700,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                  title={`${item.name} (${item.normalizedSize} units, value ${item.value})`}
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          {/* Result item comparison cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ border: '1px solid var(--heat-1)', borderRadius: '8px', padding: '14px', backgroundColor: 'var(--paper)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--color-semantic-keep)', marginBottom: '10px' }}>
                <CheckCircle2 size={16} /> Kept in Vault ({keptItems.length} files)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {keptItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--card)', borderRadius: '6px', fontSize: '13px' }}>
                    <span>{item.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Value {item.value} | {item.normalizedSize}u</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '14px', backgroundColor: 'var(--paper)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--color-semantic-move)', marginBottom: '10px' }}>
                <XCircle size={16} /> Moved to External Storage ({droppedItems.length} files)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {droppedItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--card)', borderRadius: '6px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-semantic-move)' }}>{item.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Value {item.value} | {item.normalizedSize}u</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage 3: Animated Step-by-Step DP Grid Matrix */}
      {stage === 'dp_matrix' && (
        <div>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px', padding: '8px 12px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Button
                variant="secondary"
                size="sm"
                icon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? 'Pause' : 'Play Step Animation'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<SkipBack size={14} />}
                disabled={stepIndex === 0}
                onClick={() => { setStepIndex(prev => Math.max(prev - 1, 0)); setIsPlaying(false); }}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<SkipForward size={14} />}
                disabled={stepIndex >= totalSteps - 1}
                onClick={() => { setStepIndex(prev => Math.min(prev + 1, totalSteps - 1)); setIsPlaying(false); }}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={() => { setStepIndex(0); setIsPlaying(false); }}
              >
                Reset
              </Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
              <span>Step <strong>{stepIndex + 1}</strong> of <strong>{totalSteps}</strong></span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0.5, 1, 2].map(sp => (
                  <button
                    key={sp}
                    onClick={() => setSpeed(sp)}
                    style={{
                      padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border-strong)',
                      backgroundColor: speed === sp ? 'var(--ink)' : 'transparent',
                      color: speed === sp ? 'var(--card)' : 'var(--color-ink-2)',
                      fontSize: '11px', cursor: 'pointer'
                    }}
                  >
                    {sp}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current Step Explanation Box */}
          {currentStep && (
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--paper)', borderLeft: '4px solid var(--ink)', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: 'var(--ink)' }}>
              <strong>Step Analysis:</strong> {(currentStep as TableStep)?.explanation || (currentStep as any)?.reason}
            </div>
          )}

          {/* Dynamic Programming Table Visual */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-hairline)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-sunken)' }}>
                  <th style={{ padding: '8px', borderBottom: '1px solid var(--color-border-hairline)', borderRight: '1px solid var(--color-border-hairline)' }}>File Item</th>
                  {Array.from({ length: visualizerData.capacity + 1 }).map((_, w) => (
                    <th key={w} style={{ padding: '8px', borderBottom: '1px solid var(--color-border-hairline)', width: '36px' }}>
                      {w}u
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visualizerData.items.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-hairline)' }}>
                    <td style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderRight: '1px solid var(--color-border-hairline)', whiteSpace: 'nowrap' }}>
                      {item.name} (w={item.normalizedSize}, v={item.value})
                    </td>
                    {Array.from({ length: visualizerData.capacity + 1 }).map((_, w) => {
                      const isCurrentCell = currentStep?.type === 'cell' && (currentStep as TableStep).i === i + 1 && (currentStep as TableStep).w === w;
                      const cellVal = dpResult?.table?.[i + 1]?.[w] ?? 0;
                      return (
                        <td
                          key={w}
                          style={{
                            padding: '6px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: isCurrentCell ? 700 : 500,
                            backgroundColor: isCurrentCell ? 'var(--highlight)' : 'transparent',
                            color: 'var(--ink)',
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          {cellVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};
