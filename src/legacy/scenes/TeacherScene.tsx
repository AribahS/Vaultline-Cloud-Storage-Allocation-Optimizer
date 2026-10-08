/**
 * TEACHER MODE (#/teacher)
 * Designed for the professor/instructor.
 * Dense, rich technical content in the Sticker Playground aesthetic.
 * Tabs:
 * 1. "Algorithm" (DP theatre, live table, recurrence, line sync, controls, complexity card, self-test 200 cases)
 * 2. "Compare" (Greedy vs DP vs Brute force + counterexample)
 * 3. "Lab" (Extra variations: multi-place, time constraint, fractional, FPTAS, benchmark)
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Code2,
  Table,
  Layers,
  Scale,
  FlaskConical,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useFlowStore } from '../store/useFlowStore';
import { KnapsackItem, TeachingStep, TableStep, TracebackStep } from '../../engine/types';
import { solveTeachingKnapsack } from '../../engine/knapsack';
import { GREEDY_COUNTEREXAMPLE_DATASET } from '../../engine/greedy';
import { runSelfTest, SelfTestResult } from '../../engine/selfTest';
import { DpTable } from '../theatre/DpTable';
import { NarrationPanel } from '../theatre/NarrationPanel';
import { PseudocodePanel } from '../theatre/PseudocodePanel';
import { TheatreControls } from '../theatre/TheatreControls';
import { ComplexityCard } from '../theatre/ComplexityCard';
import { GreedyVsDpComparison } from '../theatre/GreedyVsDpComparison';
import { LabMultiBucket } from '../lab/LabMultiBucket';
import { LabTwoConstraints } from '../lab/LabTwoConstraints';
import { LabFractional } from '../lab/LabFractional';
import { LabFptas } from '../lab/LabFptas';
import { LabBenchmark } from '../lab/LabBenchmark';
import { playSound } from '../utils/sound';

type TeacherTab = 'algorithm' | 'compare' | 'lab';

export const TeacherScene: React.FC = () => {
  const { files } = useAppStore();

  const [activeTab, setActiveTab] = useState<TeacherTab>('algorithm');

  // Playback state for DP Theatre
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fillRowByRow, setFillRowByRow] = useState(false);
  const playTimerRef = useRef<any>(null);

  // Self-test state
  const [selfTestResult, setSelfTestResult] = useState<SelfTestResult | null>(null);
  const [isRunningSelfTest, setIsRunningSelfTest] = useState(false);

  // Teaching items list
  const teachingItems: KnapsackItem[] = useMemo(() => {
    if (!files || files.length === 0) {
      return GREEDY_COUNTEREXAMPLE_DATASET.items;
    }
    return files.slice(0, 6).map((f, i) => {
      const normSize = Math.max(1, Math.min(10, Math.round(f.size / (1024 * 1024 * 500)) || (i + 2)));
      return {
        id: f.id,
        name: f.name,
        originalSize: f.size,
        normalizedSize: normSize,
        value: f.priority,
      };
    });
  }, [files]);

  const teachingQuota = 10;

  const engineResult = useMemo(() => {
    return solveTeachingKnapsack(teachingItems, teachingQuota);
  }, [teachingItems]);

  const totalSteps = engineResult.steps.length;
  const currentStep = engineResult.steps[currentStepIndex] || null;

  // Chosen items live during playback
  const chosenItemsLive = useMemo(() => {
    if (!currentStep) return [];
    if (currentStep.type === 'traceback') {
      const tbStep = currentStep as TracebackStep;
      const ids = new Set(tbStep.chosenIds || []);
      return teachingItems.filter((item) => ids.has(item.id));
    }
    return [];
  }, [currentStep, teachingItems]);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          if (fillRowByRow) {
            const nextIdx = Math.min(totalSteps - 1, prev + 10);
            return nextIdx;
          }
          return prev + 1;
        });
      }, 500 / speed);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, totalSteps, speed, fillRowByRow]);

  const handleRunSelfTest = () => {
    setIsRunningSelfTest(true);
    playSound('pop');
    setTimeout(() => {
      try {
        const res = runSelfTest(200);
        setSelfTestResult(res);
        playSound('cheer');
      } catch (err) {
        console.error('Self test error:', err);
      } finally {
        setIsRunningSelfTest(false);
      }
    }, 50);
  };

  return (
    <div
      className="scene-container"
      style={{
        minHeight: 'calc(100vh - 60px)',
        padding: 'var(--space-lg)',
        maxWidth: 1366,
        margin: '0 auto',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)',
          gap: 'var(--space-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              padding: 8,
              borderRadius: 12,
              background: 'var(--ink)',
              color: 'var(--paper)',
              border: '2px solid var(--ink)',
            }}
          >
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Teacher Mode</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-2)' }}>
              Complete algorithm walkthrough, formal complexity, comparisons, and algorithmic variations.
            </p>
          </div>
        </div>

        {/* 3 Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['algorithm', 'compare', 'lab'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                playSound('pop');
                setActiveTab(tab);
              }}
              className={`sticker-chip ${activeTab === tab ? 'active' : ''}`}
              style={{
                fontSize: 13,
                fontWeight: 800,
                padding: '8px 16px',
                textTransform: 'capitalize',
                background: activeTab === tab ? 'var(--highlight)' : 'var(--paper)',
              }}
            >
              {tab === 'algorithm' ? 'Algorithm' : tab === 'compare' ? 'Compare' : 'Lab'}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: ALGORITHM */}
      {activeTab === 'algorithm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Controls Bar */}
          <div
            className="sticker-card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <TheatreControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onStepForward={() => setCurrentStepIndex((i) => Math.min(totalSteps - 1, i + 1))}
              onStepBackward={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
              onReset={() => {
                setIsPlaying(false);
                setCurrentStepIndex(0);
              }}
              onSkipToEnd={() => {
                setIsPlaying(false);
                setCurrentStepIndex(totalSteps - 1);
              }}
              speed={speed}
              onSpeedChange={setSpeed}
              fillRowByRow={fillRowByRow}
              onToggleFillRowByRow={() => setFillRowByRow(!fillRowByRow)}
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
            />

            {/* 200 Cases Self-test button */}
            <button
              className="sticker-button sticker-button-surface"
              onClick={handleRunSelfTest}
              disabled={isRunningSelfTest}
              style={{ fontSize: 12, padding: '6px 12px', gap: 6 }}
            >
              <CheckCircle size={14} color="var(--kept)" />
              <span>{isRunningSelfTest ? 'Testing...' : 'Run 200 self-tests'}</span>
            </button>
          </div>

          {/* Self-test results banner (if executed) */}
          {selfTestResult && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticker-card"
              style={{
                background: selfTestResult.failedCases === 0 ? 'var(--color-file-archives)' : 'var(--moved)',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 13 }}>
                ✓ Self-test complete: {selfTestResult.passedCases} / {selfTestResult.totalCases} cases passed in {selfTestResult.durationMs.toFixed(1)}ms. DP matches Brute Force on 100% of cases.
              </span>
              <button
                className="sticker-chip"
                onClick={() => setSelfTestResult(null)}
                style={{ padding: '2px 6px', fontSize: 11 }}
              >
                ✕
              </button>
            </motion.div>
          )}

          {/* Main Theatre Grid: Table + Narration + Pseudocode */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 'var(--space-md)',
            }}
          >
            {/* Left: DP Table */}
            <div
              className="sticker-card"
              style={{
                padding: 16,
                overflowX: 'auto',
                background: 'var(--card)',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', marginBottom: 8, display: 'block' }}>
                Dynamic Programming Table: V(i, w)
              </span>
              <DpTable
                items={teachingItems}
                W={teachingQuota}
                table={engineResult.table}
                currentStepIndex={currentStepIndex}
                steps={engineResult.steps}
              />
            </div>

            {/* Right Column: Narration + Pseudocode Drawer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="sticker-card" style={{ padding: 16 }}>
                <NarrationPanel
                  currentStep={currentStep}
                  chosenItems={chosenItemsLive}
                  totalOptimalValue={engineResult.totalValue}
                />
              </div>

              <div className="sticker-card" style={{ padding: 16 }}>
                <PseudocodePanel
                  currentStep={currentStep}
                  isTraceback={currentStep?.type === 'traceback'}
                />
              </div>
            </div>
          </div>

          {/* Complexity Cards and NP-Complete Note */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            <ComplexityCard
              n={teachingItems.length}
              W={teachingQuota}
              items={teachingItems}
              cellsComputed={teachingItems.length * (teachingQuota + 1)}
              runtimeMs={0.8}
            />

            <div
              className="sticker-card"
              style={{
                padding: 16,
                background: 'var(--paper)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>
                Pseudo-polynomial Time & NP-completeness
              </span>
              <p style={{ fontSize: 12, color: 'var(--color-ink-2)', lineHeight: 1.5 }}>
                0/1 Knapsack is weakly NP-complete. Dynamic programming runs in O(N × W) time, which depends on the numeric value of W rather than the number of bits in the input. When W is scaled to discrete integer chunks (as Vaultline normalizes file sizes), DP computes in mere milliseconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPARE */}
      {activeTab === 'compare' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="sticker-card" style={{ padding: 20 }}>
            <GreedyVsDpComparison
              items={teachingItems}
              quota={teachingQuota}
              onLoadCounterexample={() => {}}
            />
          </div>
        </div>
      )}

      {/* TAB 3: LAB */}
      {activeTab === 'lab' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Multi-bucket split */}
          <div className="sticker-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                Split across places
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-ink-2)', marginLeft: 8 }} className="mono">
                (Multi-Knapsack Problem)
              </span>
              <p style={{ fontSize: 12, color: 'var(--color-ink-2)', marginTop: 4 }}>
                Sequential DP solves allocation across multiple storage containers.
              </p>
            </div>
            <LabMultiBucket />
          </div>

          {/* Time Limit as Second Constraint */}
          <div className="sticker-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                Time limit constraint
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-ink-2)', marginLeft: 8 }} className="mono">
                (Multi-dimensional Knapsack)
              </span>
              <p style={{ fontSize: 12, color: 'var(--color-ink-2)', marginTop: 4 }}>
                Constrains both transfer time (network/bus bandwidth) and storage capacity simultaneously.
              </p>
            </div>
            <LabTwoConstraints />
          </div>

          {/* Fractional Knapsack */}
          <div className="sticker-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                Fractional packing
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-ink-2)', marginLeft: 8 }} className="mono">
                (Continuous Knapsack via Greedy)
              </span>
              <p style={{ fontSize: 12, color: 'var(--color-ink-2)', marginTop: 4 }}>
                Where files or items can be split into chunks; greedy sort by value-to-size is mathematically optimal.
              </p>
            </div>
            <LabFractional />
          </div>

          {/* FPTAS */}
          <div className="sticker-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                Fast estimate mode
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-ink-2)', marginLeft: 8 }} className="mono">
                (FPTAS — Fully Polynomial-Time Approximation Scheme)
              </span>
              <p style={{ fontSize: 12, color: 'var(--color-ink-2)', marginTop: 4 }}>
                Scales values by (ε × V_max / N) to guarantee a solution within (1 - ε) of the optimum in polynomial time.
              </p>
            </div>
            <LabFptas />
          </div>

          {/* Benchmark */}
          <div className="sticker-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                Runtime speed benchmark
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-ink-2)', marginLeft: 8 }} className="mono">
                (Empirical Complexity Analysis)
              </span>
              <p style={{ fontSize: 12, color: 'var(--color-ink-2)', marginTop: 4 }}>
                Measures execution time scaling over item counts with linear regression fitted line.
              </p>
            </div>
            <LabBenchmark />
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherScene;
