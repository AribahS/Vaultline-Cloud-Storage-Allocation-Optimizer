/**
 * WhatIfDrawer: "What if I had more room?"
 * Slider panel with live room adjustment, change point dots, and reacting sentence:
 * "With X more, you would also keep [file]."
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Plus } from 'lucide-react';
import { springs } from '../motion';
import { useAppStore } from '../../store/useAppStore';
import { formatBytes } from '../utils/fileHelpers';
import { playSound } from '../utils/sound';
import { BYTE_UNITS } from '../../engine/normalizer';

export const WhatIfDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { files, quotaBytes, knapsackResult, setQuotaBytes } = useAppStore();

  const [extraBytes, setExtraBytes] = useState<number>(2 * BYTE_UNITS.GB);

  // Moved items sorted by priority / size efficiency
  const candidateExtraItems = useMemo(() => {
    if (!knapsackResult) return [];
    const keptIds = new Set(knapsackResult.keptItems.map((k) => k.id));
    const getItemSize = (i: any): number => i?.originalSize ?? i?.size ?? 1;
    const getItemVal = (i: any): number => i?.value ?? i?.priority ?? 1;
    const moved = (knapsackResult.droppedItems || files || [])
      .filter((i: any) => !keptIds.has(i.id))
      .sort((a: any, b: any) => getItemVal(b) / getItemSize(b) - getItemVal(a) / getItemSize(a));
    return moved;
  }, [knapsackResult]);

  // Which candidate item fits inside extraBytes?
  const nextKeptItem = useMemo(() => {
    return candidateExtraItems.find((item: any) => (item.originalSize ?? item.size ?? 0) <= extraBytes);
  }, [candidateExtraItems, extraBytes]);

  // Points of change
  const changePoints = useMemo(() => {
    return candidateExtraItems.slice(0, 4).map((item: any) => ({
      name: item.name,
      size: item.originalSize ?? item.size ?? 0,
    }));
  }, [candidateExtraItems]);

  if (!isOpen) return null;

  const maxSliderGB = 20;
  const currentExtraGB = extraBytes / BYTE_UNITS.GB;

  const handleSliderChange = (gbVal: number) => {
    const bytes = Math.round(gbVal * BYTE_UNITS.GB);
    setExtraBytes(bytes);
  };

  const handleApplyExtra = () => {
    playSound('cheer');
    setQuotaBytes(quotaBytes + extraBytes);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'color-mix(in srgb,var(--ink) 65%,transparent)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="What if I had more room?"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={springs.bouncy}
        className="sticker-card"
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--card)',
          padding: 'var(--space-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>
              What if I had more room?
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-2)' }}>
              See what files you would unlock with a bigger box.
            </p>
          </div>
          <button
            onClick={onClose}
            className="sticker-chip"
            aria-label="Close drawer"
            style={{ padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Big Extra Room Display */}
        <div
          style={{
            background: 'var(--paper)',
            borderRadius: 16,
            padding: 'var(--space-lg)',
            textAlign: 'center',
            border: '2px solid var(--ink)',
          }}
        >
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-ink-2)' }}>
            Extra space added:
          </span>
          <div className="mono" style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink)' }}>
            +{formatBytes(extraBytes)}
          </div>
          <p
            style={{
              fontSize: 'var(--text-body)',
              fontWeight: 800,
              marginTop: 10,
              color: nextKeptItem ? 'var(--kept)' : 'var(--color-ink-2)',
            }}
          >
            {nextKeptItem
              ? `With ${formatBytes(extraBytes)} more, you would also keep "${nextKeptItem.name}".`
              : 'Add a bit more room to unlock the next file!'}
          </p>
        </div>

        {/* Slider & Change Dots */}
        <div>
          <input
            type="range"
            min="0.5"
            max={maxSliderGB}
            step="0.5"
            value={currentExtraGB}
            onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'var(--ink)',
              cursor: 'pointer',
              height: 8,
            }}
          />

          {/* Dots marking where plan changes */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--color-ink-2)',
            }}
          >
            <span>+0.5 GB</span>
            {changePoints.map((cp: any, idx: number) => (
              <span key={idx} style={{ color: 'var(--ink)' }} title={cp.name}>
                ● +{formatBytes(cp.size)}
              </span>
            ))}
            <span>+{maxSliderGB} GB</span>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="sticker-button sticker-button-surface" onClick={onClose}>
            Cancel
          </button>
          <button className="sticker-button sticker-button-primary" onClick={handleApplyExtra}>
            <Plus size={16} />
            <span>Apply to box</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export default WhatIfDrawer;
