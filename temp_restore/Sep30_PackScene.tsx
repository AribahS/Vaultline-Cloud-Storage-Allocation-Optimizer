/**
 * SCENE 4: PACK (#/pack)
 * 4-6 second skippable cinematic.
 * Boxy thinking -> tiles drop into the box with bounce & squash.
 * Non-fitting tiles hop to "Move pile" on the right with boing sound.
 * Running totals count up ("Kept: X files, Y GB").
 * Snug fit (>= 95%) triggers confetti + cheer.
 * Over-limit triggers oops + friendly warning.
 * Auto-advances or skip button.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FastForward, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useFlowStore } from '../store/useFlowStore';
import { Boxy, BoxyMood } from '../components/Boxy';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { springs } from '../motion';
import { CATEGORY_STYLES, getFileCategory, formatBytes } from '../utils/fileHelpers';
import { playSound } from '../utils/sound';
import { KnapsackItem } from '../../engine/types';

export const PackScene: React.FC = () => {
  const {
    files,
    quotaBytes,
    knapsackResult,
    isComputing,
    triggerRecompute,
    setFilePlacement,
  } = useAppStore();

  const {
    setScene,
    setPackAnimationDone,
    showTips,
    setShowTips,
  } = useFlowStore();

  const [phase, setPhase] = useState<'thinking' | 'packing' | 'done'>('thinking');
  const [visibleKept, setVisibleKept] = useState<KnapsackItem[]>([]);
  const [visibleMoved, setVisibleMoved] = useState<KnapsackItem[]>([]);
  const [boxyMood, setBoxyMood] = useState<BoxyMood>('thinking');
  const [tipText, setTipText] = useState('Finding the perfect balance of files...');
  const [showConfetti, setShowConfetti] = useState(false);

  // Check if pinned items alone exceed quota
  const pinnedTotalSize = files
    .filter((f) => f.isPinned)
    .reduce((acc, f) => acc + f.size, 0);
  const isPinnedOverLimit = pinnedTotalSize > quotaBytes;

  // Trigger solver computation on mount
  useEffect(() => {
    triggerRecompute();
  }, [triggerRecompute]);

  // Transition from thinking to packing once computation finishes
  useEffect(() => {
    if (!isComputing && knapsackResult) {
      const timer = setTimeout(() => {
        setPhase('packing');
        setBoxyMood('curious');
        setTipText('Packing your most important files into the box!');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isComputing, knapsackResult]);

  // Sequence the tiles dropping in and bouncing out
  useEffect(() => {
    if (phase !== 'packing' || !knapsackResult) return;

    const kept = knapsackResult.keptItems || [];
    const keptIds = new Set(kept.map((k) => k.id));
    const moved = (knapsackResult.allItems || []).filter((i) => !keptIds.has(i.id));

    let currentIdx = 0;
    const maxItemsToAnimate = 16;
    const itemsToDrop = kept.slice(0, maxItemsToAnimate);
    const itemsToBounce = moved.slice(0, 8);

    const interval = setInterval(() => {
      if (currentIdx < itemsToDrop.length) {
        const nextItem = itemsToDrop[currentIdx];
        setVisibleKept((prev) => [...prev, nextItem]);
        playSound('pop');
        currentIdx++;
      } else if (currentIdx < itemsToDrop.length + itemsToBounce.length) {
        const bounceIdx = currentIdx - itemsToDrop.length;
        const nextBounce = itemsToBounce[bounceIdx];
        setVisibleMoved((prev) => [...prev, nextBounce]);
        playSound('boing');
        currentIdx++;
      } else {
        clearInterval(interval);
        setPhase('done');
        const fillPct = (knapsackResult.totalSizeKept / Math.max(1, quotaBytes)) * 100;
        if (fillPct >= 95) {
          setShowConfetti(true);
          setBoxyMood('cheer');
          playSound('cheer');
          setTipText('A super snug fit! Maximum space saved.');
        } else {
          setBoxyMood('cheer');
          setTipText('All packed and ready to go!');
        }

        // Auto-advance after 2 seconds
        const advanceTimer = setTimeout(() => {
          handleFinish();
        }, 2200);
        return () => clearTimeout(advanceTimer);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [phase, knapsackResult, quotaBytes]);

  const handleFinish = () => {
    setPackAnimationDone(true);
    setScene('result');
    window.location.hash = '#/result';
  };

  const currentKeptSize = visibleKept.reduce((sum, item) => sum + item.size, 0);

  // If pinned files over limit
  if (isPinnedOverLimit) {
    return (
      <div
        className="scene-container"
        style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-xl)',
          textAlign: 'center',
        }}
      >
        <div
          className="sticker-card"
          style={{
            maxWidth: 520,
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--bubblegum)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2.5px solid var(--ink)',
            }}
          >
            <AlertTriangle size={32} color="var(--ink)" />
          </div>
          <h2 style={{ fontSize: 'var(--text-scene-title)' }}>Must-keep files over limit</h2>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--ink-muted)' }}>
            Your must-keep files use {formatBytes(pinnedTotalSize)}, more than your{' '}
            {formatBytes(quotaBytes)}. Let one go, or make more room.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
            <button
              className="sticker-button sticker-button-surface"
              onClick={() => {
                setScene('swipe');
                window.location.hash = '#/swipe';
              }}
            >
              Let one go
            </button>
            <button
              className="sticker-button sticker-button-primary"
              onClick={() => {
                setScene('room');
                window.location.hash = '#/room';
              }}
            >
              Make more room
            </button>
          </div>
        </div>

        <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 100 }}>
          <Boxy mood="oops" tip="Oops! Those must-keep files are bigger than the whole box." />
        </div>
      </div>
    );
  }

  return (
    <div
      className="scene-container"
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-xl) var(--space-lg)',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <ConfettiBurst trigger={showConfetti} />

      {/* Header bar with Skip button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--text-scene-title)', color: 'var(--ink)' }}>
            {phase === 'thinking' ? 'Vaultline is calculating...' : 'Packing your box'}
          </h2>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--ink-muted)' }}>
            {visibleKept.length > 0
              ? `Kept: ${visibleKept.length} files, ${formatBytes(currentKeptSize)}`
              : 'Testing thousands of combinations in real time...'}
          </p>
        </div>

        <motion.button
          className="sticker-button sticker-button-surface"
          onClick={handleFinish}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--text-sm)',
            padding: '8px 16px',
          }}
        >
          <span>Skip</span>
          <FastForward size={16} />
        </motion.button>
      </div>

      {/* Packing arena */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 'var(--space-2xl)',
          alignItems: 'start',
        }}
      >
        {/* Left: Bento Box where items drop in */}
        <div
          className="sticker-card"
          style={{
            minHeight: 380,
            background: 'var(--surface)',
            border: '3px solid var(--ink)',
            boxShadow: '6px 6px 0 var(--ink)',
            borderRadius: 24,
            padding: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>Inside the Box</span>
            <span className="mono" style={{ fontWeight: 800, color: 'var(--mint)' }}>
              {formatBytes(quotaBytes)}
            </span>
          </div>

          {/* Dropped items grid / treemap */}
          <div
            style={{
              flex: 1,
              background: 'var(--canvas)',
              borderRadius: 16,
              border: '2px dashed var(--outline-color)',
              padding: 12,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignContent: 'flex-start',
              minHeight: 280,
              overflow: 'hidden',
            }}
          >
            {phase === 'thinking' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  color: 'var(--ink-muted)',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: '3px solid var(--grape)',
                    borderTopColor: 'transparent',
                  }}
                />
                <span style={{ fontWeight: 700 }}>Shuffling options...</span>
              </div>
            ) : (
              visibleKept.map((item, idx) => {
                const cat = getFileCategory(item.name);
                const st = CATEGORY_STYLES[cat];
                const Icon = st.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0, y: -40 }}
                    animate={{ scale: [1, 1.15, 0.95, 1], y: 0 }}
                    transition={springs.bouncy}
                    style={{
                      background: st.colorVar,
                      padding: '8px 12px',
                      borderRadius: 12,
                      border: '2px solid var(--ink)',
                      boxShadow: '2px 2px 0 var(--ink)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 'var(--text-xs)',
                      fontWeight: 800,
                      maxWidth: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={`${item.name} (${formatBytes(item.size)})`}
                  >
                    <Icon size={14} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </span>
                    <span className="mono" style={{ opacity: 0.8 }}>
                      {formatBytes(item.size)}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: "Move Pile" where skipped/unfitted items hop */}
        <div
          className="sticker-card"
          style={{
            minHeight: 380,
            background: 'var(--surface)',
            border: '3px solid var(--ink)',
            boxShadow: '4px 4px 0 var(--ink)',
            borderRadius: 24,
            padding: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>Move Pile</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
              Doesn't fit
            </span>
          </div>

          <div
            style={{
              flex: 1,
              background: 'var(--canvas)',
              borderRadius: 16,
              border: '2px dashed var(--bubblegum)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minHeight: 280,
              overflow: 'hidden',
            }}
          >
            {visibleMoved.map((item) => {
              const cat = getFileCategory(item.name);
              const st = CATEGORY_STYLES[cat];
              return (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0.5, x: -60, rotate: -10 }}
                  animate={{ scale: 1, x: 0, rotate: 0 }}
                  transition={springs.bouncy}
                  style={{
                    background: 'var(--surface)',
                    border: '2px solid var(--bubblegum)',
                    borderRadius: 10,
                    padding: '6px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 160,
                    }}
                  >
                    {item.name}
                  </span>
                  <span className="mono" style={{ color: 'var(--ink-muted)' }}>
                    {formatBytes(item.size)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Boxy mascot bottom-left */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 100,
        }}
      >
        <Boxy
          mood={boxyMood}
          tip={tipText}
          showTips={showTips}
          onHideTips={() => setShowTips(false)}
        />
      </div>
    </div>
  );
};
export default PackScene;

