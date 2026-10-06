import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { KnapsackItem, TeachingEngineResult } from '../engine/types';
import { solveTeachingKnapsack } from '../engine/knapsack';
import { GREEDY_COUNTEREXAMPLE_DATASET } from '../engine/greedy';
import { PseudocodePanel } from '../components/theatre/PseudocodePanel';
import { DpTable } from '../components/theatre/DpTable';
import { NarrationPanel } from '../components/theatre/NarrationPanel';
import { TheatreControls } from '../components/theatre/TheatreControls';
import { GreedyVsDpComparison } from '../components/theatre/GreedyVsDpComparison';
import { ComplexityCard } from '../components/theatre/ComplexityCard';
import { formatBytes } from '../engine/normalizer';
import {
  Lightbulb,
  Zap,
  Table2,
  BarChart3,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Play,
  SkipForward,
} from 'lucide-react';

type ChapterId = 'puzzle' | 'bruteforce' | 'smart' | 'compare';

interface ChapterConfig {
  id: ChapterId;
  number: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

const CHAPTERS: ChapterConfig[] = [
  {
    id: 'puzzle',
    number: 1,
    title: 'The puzzle',
    subtitle: 'Why "pick the biggest value" doesn\'t always work',
    icon: <Lightbulb size={18} />,
    color: '#F5A524',
  },
  {
    id: 'bruteforce',
    number: 2,
    title: 'Try everything?',
    subtitle: '8 combinations — some break the limit',
    icon: <Zap size={18} />,
    color: '#FF6B6B',
  },
  {
    id: 'smart',
    number: 3,
    title: 'The smart way',
    subtitle: 'Build a table, row by row, to find the best answer',
    icon: <Table2 size={18} />,
    color: '#6C47FF',
  },
  {
    id: 'compare',
    number: 4,
    title: 'Quick method vs careful method',
    subtitle: 'Compare greedy speed vs optimal accuracy',
    icon: <BarChart3 size={18} />,
    color: '#10B981',
  },
];

export const UnderTheHoodRoute: React.FC = () => {
  const { files, quotaBytes } = useAppStore();
  const complexityMode = useAppStore((s) => s.complexityMode);
  const [activeChapter, setActiveChapter] = useState<ChapterId>('puzzle');
  const [showExamSection, setShowExamSection] = useState(false);

  // Playback state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fillRowByRow, setFillRowByRow] = useState(false);
  const playTimerRef = useRef<any>(null);

  // ------- Data for each chapter -------

  // Chapter 1 & 2: The greedy-fails counterexample (A:6/30, B:5/24, C:5/24, quota=10)
  const counterexampleData = useMemo(() => {
    return {
      items: GREEDY_COUNTEREXAMPLE_DATASET.items,
      quotaUnits: GREEDY_COUNTEREXAMPLE_DATASET.quota,
      note: 'Quota = 10 units. A (size 6, importance 30), B (size 5, importance 24), C (size 5, importance 24)',
    };
  }, []);

  // Chapter 3: Small tutorial or user files
  const smartData = useMemo(() => {
    const activeFiles = files.filter((f) => !f.isExcluded);
    if (activeFiles.length >= 3) {
      const topFiles = [...activeFiles].sort((a, b) => b.size - a.size).slice(0, 8);
      const maxFileSize = Math.max(...topFiles.map((f) => f.size), 1);
      const scaledItems: KnapsackItem[] = topFiles.map((f) => {
        const scaledSize = Math.max(1, Math.min(10, Math.round((f.size / maxFileSize) * 8)));
        return {
          id: f.id,
          name: f.name,
          originalSize: f.size,
          normalizedSize: scaledSize,
          value: f.priority,
        };
      });
      const scaledQuota = Math.min(15, Math.max(6, Math.round((quotaBytes / (maxFileSize * 2)) * 12)));
      return {
        items: scaledItems,
        quotaUnits: scaledQuota,
        note: `Top ${scaledItems.length} of your files, scaled for step-by-step visualization`,
      };
    }
    // Fallback tutorial items
    const tutItems: KnapsackItem[] = [
      { id: 'tut-1', name: 'Project_Assets.zip', originalSize: 2 * 1024, normalizedSize: 2, value: 3 },
      { id: 'tut-2', name: 'Wedding_Video.mp4', originalSize: 3 * 1024, normalizedSize: 3, value: 4 },
      { id: 'tut-3', name: 'Database_Dump.sql', originalSize: 4 * 1024, normalizedSize: 4, value: 7 },
    ];
    return { items: tutItems, quotaUnits: 5, note: '3 sample files — space limit = 5 units' };
  }, [files, quotaBytes]);

  // Resolve active data based on chapter
  const activeData = useMemo(() => {
    if (activeChapter === 'puzzle' || activeChapter === 'bruteforce' || activeChapter === 'compare') {
      return counterexampleData;
    }
    return smartData;
  }, [activeChapter, counterexampleData, smartData]);

  // Teaching result from engine
  const teachingResult: TeachingEngineResult = useMemo(() => {
    return solveTeachingKnapsack(activeData.items, activeData.quotaUnits);
  }, [activeData]);

  const totalSteps = teachingResult.steps.length;
  const currentStep = teachingResult.steps[currentStepIndex] || null;

  // Reset on chapter change
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [activeChapter]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }
    const intervalMs = Math.max(30, Math.round(500 / speed));
    playTimerRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (fillRowByRow) {
          const curStep = teachingResult.steps[prev];
          if (curStep && curStep.type === 'cell') {
            const nextRowFirstIdx = teachingResult.steps.findIndex(
              (s, idx) => idx > prev && (s.type !== 'cell' || s.i !== curStep.i)
            );
            if (nextRowFirstIdx !== -1) return nextRowFirstIdx;
          }
        }
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => { if (playTimerRef.current) clearInterval(playTimerRef.current); };
  }, [isPlaying, speed, totalSteps, fillRowByRow, teachingResult.steps]);

  // Live chosen items for traceback
  const chosenItemsLive = useMemo(() => {
    if (!currentStep || currentStep.type !== 'traceback') return [];
    const chosenIds = new Set(currentStep.chosenIds);
    return activeData.items.filter((i) => chosenIds.has(i.id));
  }, [currentStep, activeData.items]);

  // Handlers
  const handleTogglePlay = () => { if (currentStepIndex >= totalSteps - 1) setCurrentStepIndex(0); setIsPlaying(!isPlaying); };
  const handleStepForward = () => { setIsPlaying(false); setCurrentStepIndex((p) => Math.min(totalSteps - 1, p + 1)); };
  const handleStepBackward = () => { setIsPlaying(false); setCurrentStepIndex((p) => Math.max(0, p - 1)); };
  const handleReset = () => { setIsPlaying(false); setCurrentStepIndex(0); };
  const handleSkipToEnd = () => { setIsPlaying(false); setCurrentStepIndex(totalSteps - 1); };

  // Brute force combinations for Chapter 2
  const bruteForceData = useMemo(() => {
    const items = counterexampleData.items;
    const W = counterexampleData.quotaUnits;
    const n = items.length;
    const combos: { bits: boolean[]; totalSize: number; totalValue: number; fits: boolean }[] = [];
    for (let mask = 0; mask < (1 << n); mask++) {
      const bits = items.map((_, idx) => !!(mask & (1 << idx)));
      const totalSize = items.reduce((sum, item, idx) => sum + (bits[idx] ? item.normalizedSize : 0), 0);
      const totalValue = items.reduce((sum, item, idx) => sum + (bits[idx] ? item.value : 0), 0);
      combos.push({ bits, totalSize, totalValue, fits: totalSize <= W });
    }
    return combos;
  }, [counterexampleData]);

  const bestCombo = useMemo(() => {
    const valid = bruteForceData.filter((c) => c.fits);
    return valid.reduce((best, c) => c.totalValue > best.totalValue ? c : best, valid[0]);
  }, [bruteForceData]);

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2" style={{ color: 'var(--ink)' }}>
          How it works
        </h1>
        <p className="text-sm max-w-xl leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
          A guided story in 4 chapters. Watch how the algorithm finds the best combination of files to keep
          within your space limit — and why the obvious approach doesn't always win.
        </p>
      </div>

      {/* Chapter Cards — horizontal scrollable */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {CHAPTERS.map((ch) => {
          const isActive = activeChapter === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChapter(ch.id)}
              className="flex-shrink-0 w-[220px] p-4 rounded-2xl text-left transition-all border"
              style={{
                background: isActive ? 'var(--surface-card)' : 'rgba(255,255,255,0.6)',
                borderColor: isActive ? ch.color : 'rgba(20, 17, 43, 0.08)',
                boxShadow: isActive ? `0 2px 12px ${ch.color}25, 0 0 0 1px ${ch.color}` : 'none',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${ch.color}18`, color: ch.color }}
                >
                  {ch.icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: isActive ? ch.color : 'var(--ink-muted)' }}>
                  Chapter {ch.number}
                </span>
              </div>
              <div className="text-sm font-bold mb-1" style={{ color: isActive ? ch.color : 'var(--ink)' }}>
                {ch.title}
              </div>
              <div className="text-[11px] leading-snug" style={{ color: 'var(--ink-muted)' }}>
                {ch.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Data note */}
      <div className="text-xs mb-6 px-3 py-2 rounded-lg bg-white/50 border border-slate-200/50 inline-flex items-center gap-2"
        style={{ color: 'var(--ink-muted)' }}>
        <span style={{ opacity: 0.6 }}>ℹ</span>
        {activeData.note}
      </div>

      {/* ========== CHAPTER CONTENT ========== */}

      {/* Chapter 1: The Puzzle — Greedy fails */}
      {activeChapter === 'puzzle' && (
        <div className="animate-fade-in space-y-6">
          <div className="bento-card p-6 rounded-2xl" style={{ background: 'var(--surface-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}>
            <h2 className="text-lg font-bold font-heading mb-3" style={{ color: 'var(--ink)' }}>
              You have 3 files. Which two fit best?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {counterexampleData.items.map((item, idx) => {
                const letters = ['A', 'B', 'C'];
                const colors = ['#F5A524', '#6C47FF', '#FF6B6B'];
                return (
                  <div key={item.id} className="p-4 rounded-xl border bg-white/80"
                    style={{ borderColor: `${colors[idx]}40` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold font-mono" style={{ color: colors[idx] }}>{letters[idx]}</span>
                      <span className="text-xs font-mono text-muted">{item.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Size: <span className="font-semibold text-slate-800">{item.normalizedSize}</span></span>
                      <span className="text-muted">Importance: <span className="font-semibold text-slate-800">{item.value}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 mb-4">
              <p className="text-sm font-semibold text-amber-900 mb-1">Space limit: {counterexampleData.quotaUnits} units</p>
              <p className="text-xs text-amber-800">
                If you pick the most important file first (A = 30), you fill 6 units, leaving only 4. Neither B (5) nor C (5) fits.
                <strong> You end up with just 30 importance.</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/60">
              <p className="text-sm font-semibold text-emerald-900 mb-1">The better answer</p>
              <p className="text-xs text-emerald-800">
                Skip A and take B + C instead. Total size = 10 (fits perfectly). Total importance = <strong>48</strong>.
                That's <strong>60% more</strong> than greedy's 30.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setActiveChapter('bruteforce')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'var(--brand-primary)' }}>
              Next: Try everything? <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Chapter 2: Try Everything — Brute Force */}
      {activeChapter === 'bruteforce' && (
        <div className="animate-fade-in space-y-6">
          <div className="bento-card p-6 rounded-2xl" style={{ background: 'var(--surface-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}>
            <h2 className="text-lg font-bold font-heading mb-2" style={{ color: 'var(--ink)' }}>
              With 3 files, there are {bruteForceData.length} possible combinations
            </h2>
            <p className="text-xs text-muted mb-5">
              We can test every combination — but with <em>n</em> files there are 2<sup>n</sup> combos.
              At 20 files that's over a million. At 50 it's more than atoms in the universe.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {bruteForceData.map((combo, idx) => {
                const isBest = combo === bestCombo;
                return (
                  <div key={idx}
                    className="p-3 rounded-xl border text-center transition-all"
                    style={{
                      background: isBest ? 'rgba(16, 185, 129, 0.08)' : !combo.fits ? 'rgba(255, 107, 107, 0.04)' : 'white',
                      borderColor: isBest ? '#10B981' : !combo.fits ? '#FF6B6B40' : 'rgba(20,17,43,0.08)',
                      textDecoration: !combo.fits ? 'line-through' : 'none',
                      opacity: !combo.fits ? 0.5 : 1,
                    }}
                  >
                    <div className="text-xs font-mono font-bold mb-1">
                      {counterexampleData.items.map((item, i) => combo.bits[i] ? ['A', 'B', 'C'][i] : '—').join(' ')}
                    </div>
                    <div className="text-[10px] text-muted">
                      Size: {combo.totalSize} | Value: {combo.totalValue}
                    </div>
                    {isBest && (
                      <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">Best</span>
                    )}
                    {!combo.fits && (
                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide">Too big</span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted">
              ✓ Works, but doesn't scale. We need a smarter approach...
            </p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setActiveChapter('puzzle')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">
              ← The puzzle
            </button>
            <button onClick={() => setActiveChapter('smart')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--brand-primary)' }}>
              Next: The smart way <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Chapter 3: The Smart Way — DP Table */}
      {activeChapter === 'smart' && (
        <div className="animate-fade-in space-y-5">
          {/* Main theatre: table left, mini-box + narration right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* DP Table: 62% */}
            <div className="lg:col-span-7 bento-card p-4 rounded-2xl" style={{ background: 'var(--surface-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}>
              <DpTable
                items={activeData.items}
                W={activeData.quotaUnits}
                table={teachingResult.table}
                currentStepIndex={currentStepIndex}
                steps={teachingResult.steps}
              />
            </div>

            {/* Narration + Mini Bento Box: 38% */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <NarrationPanel
                currentStep={currentStep}
                chosenItems={chosenItemsLive}
                totalOptimalValue={teachingResult.totalValue}
              />

              {/* Pseudocode drawer (Detailed mode only) */}
              {complexityMode === 'detailed' && (
                <PseudocodePanel
                  currentStep={currentStep}
                  isTraceback={currentStep?.type === 'traceback'}
                />
              )}
            </div>
          </div>

          {/* Playback Controls */}
          <TheatreControls
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onReset={handleReset}
            onSkipToEnd={handleSkipToEnd}
            speed={speed}
            onSpeedChange={setSpeed}
            fillRowByRow={fillRowByRow}
            onToggleFillRowByRow={() => setFillRowByRow(!fillRowByRow)}
            currentStepIndex={currentStepIndex}
            totalSteps={totalSteps}
          />

          <div className="flex justify-between">
            <button onClick={() => setActiveChapter('bruteforce')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">
              ← Try everything?
            </button>
            <button onClick={() => setActiveChapter('compare')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--brand-primary)' }}>
              Next: Quick vs careful <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Chapter 4: Quick Method vs Careful Method */}
      {activeChapter === 'compare' && (
        <div className="animate-fade-in space-y-5">
          <GreedyVsDpComparison
            items={counterexampleData.items}
            quota={counterexampleData.quotaUnits}
            onLoadCounterexample={() => setActiveChapter('puzzle')}
          />

          {/* Brute force count (only for small n) */}
          {activeData.items.length <= 20 && (
            <div className="bento-card p-4 rounded-2xl text-xs" style={{ background: 'var(--surface-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}>
              <span className="text-muted">Brute force would check </span>
              <span className="font-mono font-bold text-slate-800">
                {Math.pow(2, activeData.items.length).toLocaleString()}
              </span>
              <span className="text-muted"> combinations. The table only needed </span>
              <span className="font-mono font-bold text-slate-800">
                {(activeData.items.length * (activeData.quotaUnits + 1)).toLocaleString()}
              </span>
              <span className="text-muted"> cells.</span>
            </div>
          )}

          <div className="flex justify-start">
            <button onClick={() => setActiveChapter('smart')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">
              ← The smart way
            </button>
          </div>
        </div>
      )}

      {/* ========== FOR THE EXAM (Detailed mode only) ========== */}
      {complexityMode === 'detailed' && (
        <div className="mt-8 border-t pt-6" style={{ borderColor: 'rgba(20, 17, 43, 0.08)' }}>
          <button
            type="button"
            onClick={() => setShowExamSection(!showExamSection)}
            className="flex items-center gap-2 mb-4 text-sm font-bold font-heading"
            style={{ color: 'var(--brand-primary)' }}
          >
            <GraduationCap size={18} />
            <span>For the exam</span>
            {showExamSection ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {showExamSection && (
            <div className="animate-fade-in">
              <ComplexityCard
                n={activeData.items.length}
                W={activeData.quotaUnits}
                items={activeData.items}
                cellsComputed={activeData.items.length * (activeData.quotaUnits + 1)}
                runtimeMs={0.15}
              />
            </div>
          )}
        </div>
      )}
    </main>
  );
};

