/**
 * PackItYourselfModal: Mini-game turning box packing into an interactive challenge.
 * Drag/tap tiles in and out of the box.
 * Live fill meter turns tangerine then pink if over the limit.
 * "Reveal Vaultline's plan" button compares user total score to 100% optimum.
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, CheckCircle, RotateCcw, Sparkles } from 'lucide-react';
import { springs } from '../motion';
import { useAppStore } from '../../store/useAppStore';
import { CATEGORY_STYLES, getFileCategory, formatBytes } from '../utils/fileHelpers';
import { playSound } from '../utils/sound';

export const PackItYourselfModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { files, quotaBytes, knapsackResult } = useAppStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);

  const items: any[] = useMemo(() => {
    return (files || []).slice(0, 16);
  }, [files]);

  if (!isOpen) return null;

  const getItemSize = (i: any): number => i?.originalSize ?? i?.size ?? 0;
  const getItemVal = (i: any): number => i?.value ?? i?.priority ?? 0;

  const currentTotalSize = items
    .filter((i) => selectedIds.has(i.id))
    .reduce((sum, i) => sum + getItemSize(i), 0);

  const currentUserValue = items
    .filter((i) => selectedIds.has(i.id))
    .reduce((sum, i) => sum + getItemVal(i), 0);

  const optimalValue = knapsackResult?.totalValue || 1;
  const isOverLimit = currentTotalSize > quotaBytes;
  const fillPct = Math.min(100, (currentTotalSize / Math.max(1, quotaBytes)) * 100);

  const toggleItem = (id: string) => {
    playSound('pop');
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleReveal = () => {
    playSound('cheer');
    setRevealed(true);
  };

  const handleReset = () => {
    playSound('pop');
    setSelectedIds(new Set());
    setRevealed(false);
  };

  const userEfficiencyPct = Math.min(
    100,
    Math.round((currentUserValue / Math.max(1, optimalValue)) * 100)
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'color-mix(in srgb,var(--ink) 75%,transparent)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Pack it yourself game"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={springs.bouncy}
        className="sticker-card"
        style={{
          width: '100%',
          maxWidth: 780,
          background: 'var(--card)',
          padding: 'var(--space-xl)',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>
              Pack it yourself challenge
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-2)' }}>
              Click tiles to pack them into the box without overflowing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="sticker-chip"
            aria-label="Close game"
            style={{ padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Fill Meter */}
        <div
          style={{
            background: 'var(--paper)',
            borderRadius: 16,
            padding: 'var(--space-md)',
            border: '2px solid var(--ink)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800 }}>
              Used: {formatBytes(currentTotalSize)} / {formatBytes(quotaBytes)}
            </span>
            <span
              className="mono"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 800,
                color: isOverLimit ? 'var(--moved)' : 'var(--kept)',
              }}
            >
              {isOverLimit ? 'OVER LIMIT!' : `${Math.round(fillPct)}% full`}
            </span>
          </div>

          <div
            style={{
              height: 20,
              background: 'var(--card)',
              borderRadius: 8,
              border: '1.5px solid var(--ink)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              animate={{
                width: `${fillPct}%`,
                backgroundColor: isOverLimit
                  ? 'var(--moved)'
                  : fillPct > 85
                  ? 'var(--highlight)'
                  : 'var(--kept)',
              }}
              style={{ height: '100%' }}
            />
          </div>
        </div>

        {/* Revealed comparison banner */}
        {revealed && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="sticker-card"
            style={{
              background: isOverLimit ? 'var(--moved)' : 'var(--highlight)',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Award size={24} color="var(--ink)" />
              <span style={{ fontWeight: 800, fontSize: 'var(--text-body)' }}>
                {isOverLimit
                  ? 'Your box overflowed! Vaultline packed 100% within the limit.'
                  : `You got ${userEfficiencyPct}%. Vaultline found 100%.`}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="sticker-chip"
              style={{ fontSize: 12, gap: 4 }}
            >
              <RotateCcw size={14} />
              <span>Try again</span>
            </button>
          </motion.div>
        )}

        {/* Tiles Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: 10,
            marginTop: 8,
          }}
        >
          {items.map((item: any) => {
            const isPacked = selectedIds.has(item.id);
            const isOptimal = knapsackResult?.keptItems.some((k) => k.id === item.id);
            const cat = getFileCategory(item.name);
            const st = CATEGORY_STYLES[cat];
            const Icon = st.icon;

            return (
              <motion.button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="sticker-card"
                style={{
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isPacked ? 'var(--color-file-archives)' : 'var(--card)',
                  borderColor: revealed && isOptimal ? 'var(--ink)' : 'var(--card-border)',
                  borderWidth: revealed && isOptimal ? 3 : 2,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: st.colorVar,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--ink)',
                    }}
                  >
                    <Icon size={13} />
                  </div>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>
                    {formatBytes(getItemSize(item))}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span>{isPacked ? '✓ In box' : '+ Tap to pack'}</span>
                  {revealed && isOptimal && (
                    <span style={{ color: 'var(--ink)', fontWeight: 800 }}>★ Best pick</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <button className="sticker-button sticker-button-surface" onClick={handleReset}>
            Reset picks
          </button>
          <button
            className="sticker-button sticker-button-primary"
            onClick={handleReveal}
            disabled={revealed}
          >
            <Sparkles size={16} />
            <span>Reveal Vaultline's plan</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export default PackItYourselfModal;
