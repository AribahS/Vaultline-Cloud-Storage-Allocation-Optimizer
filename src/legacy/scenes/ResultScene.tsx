/**
 * SCENE 5: RESULT (#/result)
 * Compact one-screen dashboard at 1366x768.
 * Left: 3 big count-up metrics (Files kept, Space used with meter, Importance kept).
 * Center: Packed box treemap with sticker popovers & one-line reasons.
 * Right: Move pile with "Actually keep" button.
 * Bottom: 4 action buttons (Checklist, Pack it yourself, What if room, Show how decided) + "Start over" link.
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Sliders,
  HelpCircle,
  Gamepad2,
  RotateCcw,
  Check,
  ArrowUpRight,
  Pin,
  Ban,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useFlowStore } from '../store/useFlowStore';
import { Boxy } from '../components/Boxy';
import { ChecklistModal } from '../components/ChecklistModal';
import { WhatIfDrawer } from '../components/WhatIfDrawer';
import { PackItYourselfModal } from '../components/PackItYourselfModal';
import { StoryModal } from '../components/StoryModal';
import { springs } from '../motion';
import { CATEGORY_STYLES, getFileCategory, formatBytes } from '../utils/fileHelpers';
import { playSound } from '../utils/sound';
import { KnapsackItem } from '../../engine/types';

export const ResultScene: React.FC = () => {
  const {
    files,
    quotaBytes,
    knapsackResult,
    setFilePlacement,
    triggerRecompute,
  } = useAppStore();

  const { startOver, setScene, showTips, setShowTips } = useFlowStore();

  // Modals state
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isPackItOpen, setIsPackItOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  // Active hover/popover item
  const [hoveredItem, setHoveredItem] = useState<{
    item: KnapsackItem;
    status: 'kept' | 'moved';
    reason: string;
  } | null>(null);

  const keptItems = knapsackResult?.keptItems || [];
  const keptIds = useMemo(() => new Set(keptItems.map((k) => k.id)), [keptItems]);
  const allItems: any[] = knapsackResult
    ? [...knapsackResult.keptItems, ...knapsackResult.droppedItems]
    : files || [];
  const movedItems = useMemo(
    () => allItems.filter((i: any) => !keptIds.has(i.id)),
    [allItems, keptIds]
  );

  const totalFiles = allItems.length;
  const totalSizeKept = knapsackResult?.totalSizeKept || 0;
  const fillPct = Math.min(100, Math.round((totalSizeKept / Math.max(1, quotaBytes)) * 100));

  const getItemSize = (item: any): number => item?.originalSize ?? item?.size ?? 0;
  const getItemValue = (item: any): number => item?.value ?? item?.priority ?? 0;

  // Compute total potential importance
  const totalPotentialValue = allItems.reduce((sum: number, i: any) => sum + getItemValue(i), 0);
  const totalKeptValue = knapsackResult?.totalValue || 0;
  const importancePct =
    totalPotentialValue > 0
      ? Math.min(100, Math.round((totalKeptValue / totalPotentialValue) * 100))
      : 100;

  // Reason text derivation
  const getItemReason = (item: any, isKept: boolean): string => {
    const originalFile = files.find((f) => f.id === item.id);
    if (originalFile?.isPinned) {
      return 'Kept: locked by you as must-keep';
    }
    if (originalFile?.isExcluded) {
      return 'Moved: excluded from packing';
    }

    const itemSize = getItemSize(item);
    const itemVal = getItemValue(item);
    const shareOfSpace = Math.round((itemSize / Math.max(1, quotaBytes)) * 100);

    if (isKept) {
      if (itemVal >= 8) {
        return `Kept: high importance (${itemVal}/10), fits smoothly`;
      }
      return 'Kept: high efficiency pick for your available room';
    } else {
      if (shareOfSpace > 20) {
        return `Moved: takes ${shareOfSpace}% of space for modest value`;
      }
      return 'Moved: lower priority than the files that fit';
    }
  };

  const handleActuallyKeep = (id: string) => {
    playSound('pop');
    setFilePlacement(id, 'always_keep');
  };

  const handleNeverKeep = (id: string) => {
    playSound('pop');
    setFilePlacement(id, 'never_keep');
  };

  const handleStartOver = () => {
    playSound('click');
    startOver();
    window.location.hash = '#/drop';
  };

  return (
    <div
      className="scene-container"
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--space-md) var(--space-lg)',
        maxWidth: 1366,
        margin: '0 auto',
      }}
    >
      {/* 3-Column Compact Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr 280px',
          gap: 'var(--space-md)',
          alignItems: 'stretch',
          flex: 1,
          minHeight: 460,
        }}
      >
        {/* Left Column: 3 Count-up Metrics Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {/* Files Kept */}
          <div
            className="sticker-card"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              background: 'var(--surface)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', fontWeight: 800 }}>
              FILES KEPT
            </span>
            <div className="mono" style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)' }}>
              {keptItems.length}
              <span style={{ fontSize: 16, color: 'var(--ink-muted)' }}> / {totalFiles}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
              {movedItems.length} stored elsewhere
            </span>
          </div>

          {/* Space Used & Fill Meter */}
          <div
            className="sticker-card"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: 'var(--surface)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', fontWeight: 800 }}>
              SPACE USED
            </span>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--grape)' }}>
              {formatBytes(totalSizeKept)}
            </div>
            {/* Meter */}
            <div
              style={{
                height: 12,
                borderRadius: 999,
                background: 'var(--canvas)',
                border: '1.5px solid var(--ink)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${fillPct}%`,
                  background: 'var(--mint)',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
              <span>{fillPct}% full</span>
              <span>Room: {formatBytes(quotaBytes)}</span>
            </div>
          </div>

          {/* Importance Kept */}
          <div
            className="sticker-card"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              background: 'var(--surface)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', fontWeight: 800 }}>
              IMPORTANCE KEPT
            </span>
            <div className="mono" style={{ fontSize: 32, fontWeight: 800, color: 'var(--mint)' }}>
              {importancePct}%
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
              Optimal mathematical mix
            </span>
          </div>
        </div>

        {/* Center Column: The Packed Box Treemap */}
        <div
          className="sticker-card"
          style={{
            background: 'var(--surface)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)' }}>
              Packed Box Treemap
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
              Hover or tap any tile for reasons
            </span>
          </div>

          {/* Treemap visual canvas */}
          <div
            style={{
              flex: 1,
              background: 'var(--canvas)',
              borderRadius: 14,
              border: '2px solid var(--ink)',
              padding: 8,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              alignContent: 'flex-start',
              overflowY: 'auto',
              minHeight: 320,
            }}
          >
            {keptItems.map((item) => {
              const cat = getFileCategory(item.name);
              const st = CATEGORY_STYLES[cat];
              const Icon = st.icon;
              const reason = getItemReason(item, true);

              // Relative flex basis based on item size
              const itemSize = getItemSize(item);
              const sizeRatio = Math.max(1, Math.min(10, Math.round((itemSize / Math.max(1, totalSizeKept)) * 30)));

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.03, zIndex: 10 }}
                  onClick={() => setHoveredItem({ item, status: 'kept', reason })}
                  onMouseEnter={() => setHoveredItem({ item, status: 'kept', reason })}
                  className="sticker-card"
                  style={{
                    flexGrow: sizeRatio,
                    flexBasis: `${Math.max(100, sizeRatio * 28)}px`,
                    height: Math.max(54, sizeRatio * 14),
                    padding: '6px 10px',
                    background: st.colorVar,
                    borderRadius: 12,
                    border: '2px solid var(--ink)',
                    boxShadow: '2px 2px 0 var(--ink)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                  }}
                  title={item.name}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon size={12} />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 120,
                        }}
                      >
                        {item.name}
                      </span>
                    </div>
                    <Check size={12} strokeWidth={3} />
                  </div>

                  <span className="mono" style={{ fontSize: 10, fontWeight: 700 }}>
                    {formatBytes(getItemSize(item))}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Sticker Popover */}
          <AnimatePresence>
            {hoveredItem && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="sticker-card"
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: 24,
                  right: 24,
                  background: 'var(--surface)',
                  border: '2.5px solid var(--ink)',
                  boxShadow: '4px 4px 0 var(--ink)',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 20,
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>
                    {hoveredItem.item.name} ({formatBytes(getItemSize(hoveredItem.item))})
                  </span>
                  <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                    {hoveredItem.reason}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {hoveredItem.status === 'kept' ? (
                    <button
                      className="sticker-chip"
                      onClick={() => handleNeverKeep(hoveredItem.item.id)}
                      style={{ fontSize: 11, gap: 4 }}
                      title="Never keep this file"
                    >
                      <Ban size={12} />
                      <span>Never keep</span>
                    </button>
                  ) : (
                    <button
                      className="sticker-chip"
                      onClick={() => handleActuallyKeep(hoveredItem.item.id)}
                      style={{ fontSize: 11, background: 'var(--mint)', gap: 4 }}
                      title="Pin and keep this file"
                    >
                      <Pin size={12} />
                      <span>Actually keep</span>
                    </button>
                  )}
                  <button
                    className="sticker-chip"
                    onClick={() => setHoveredItem(null)}
                    style={{ padding: '2px 6px', fontSize: 10 }}
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Move Pile Stacked Cards */}
        <div
          className="sticker-card"
          style={{
            background: 'var(--surface)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--bubblegum)' }}>
              Move Pile ({movedItems.length})
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
              Doesn't fit
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingRight: 4,
              maxHeight: 380,
            }}
          >
            {movedItems.map((item: any) => {
              const reason = getItemReason(item, false);
              return (
                <div
                  key={item.id}
                  onClick={() => setHoveredItem({ item, status: 'moved', reason })}
                  className="sticker-card"
                  style={{
                    padding: '8px 10px',
                    background: 'var(--canvas)',
                    border: '1.5px solid var(--bubblegum)',
                    boxShadow: '2px 2px 0 var(--bubblegum)',
                    borderRadius: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 130,
                      }}
                    >
                      {item.name}
                    </span>
                    <button
                      className="sticker-chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActuallyKeep(item.id);
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: 10,
                        background: 'var(--mint)',
                        fontWeight: 800,
                      }}
                    >
                      Actually keep
                    </button>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)' }}>
                    {formatBytes(getItemSize(item))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Action Row (Max 4 buttons) + Start Over Link */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--space-md)',
          paddingTop: 'var(--space-sm)',
          borderTop: '2px solid var(--canvas)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {/* Button 1: Download checklist */}
          <motion.button
            className="sticker-button sticker-button-surface"
            onClick={() => setIsChecklistOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ fontSize: 13, padding: '8px 14px', gap: 6, display: 'inline-flex', alignItems: 'center' }}
          >
            <Download size={14} />
            <span>Download checklist</span>
          </motion.button>

          {/* Button 2: Pack it yourself */}
          <motion.button
            className="sticker-button sticker-button-surface"
            onClick={() => setIsPackItOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ fontSize: 13, padding: '8px 14px', gap: 6, display: 'inline-flex', alignItems: 'center' }}
          >
            <Gamepad2 size={14} />
            <span>Pack it yourself</span>
          </motion.button>

          {/* Button 3: What if I had more room? */}
          <motion.button
            className="sticker-button sticker-button-surface"
            onClick={() => setIsWhatIfOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ fontSize: 13, padding: '8px 14px', gap: 6, display: 'inline-flex', alignItems: 'center' }}
          >
            <Sliders size={14} />
            <span>What if I had more room?</span>
          </motion.button>

          {/* Button 4: Show me how it decided */}
          <motion.button
            className="sticker-button sticker-button-primary"
            onClick={() => setIsStoryOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ fontSize: 13, padding: '8px 14px', gap: 6, display: 'inline-flex', alignItems: 'center' }}
          >
            <HelpCircle size={14} />
            <span>Show me how it decided</span>
          </motion.button>
        </div>

        {/* Small "Start over" link */}
        <button
          onClick={handleStartOver}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-muted)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Start over
        </button>
      </div>

      {/* Modals */}
      <ChecklistModal isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} />
      <WhatIfDrawer isOpen={isWhatIfOpen} onClose={() => setIsWhatIfOpen(false)} />
      <PackItYourselfModal isOpen={isPackItOpen} onClose={() => setIsPackItOpen(false)} />
      <StoryModal isOpen={isStoryOpen} onClose={() => setIsStoryOpen(false)} />

      {/* Mascot bottom-left */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 100,
        }}
      >
        <Boxy
          mood="cheer"
          tip="Here is your optimal mix! Click any tile to inspect reasons."
          showTips={showTips}
          onHideTips={() => setShowTips(false)}
        />
      </div>
    </div>
  );
};
export default ResultScene;
