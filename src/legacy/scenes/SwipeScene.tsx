/**
 * SCENE 3: SWIPE (#/swipe)
 * Title: "Quick: what matters?"
 * Subtitle: "Swipe your biggest files. We will guess the rest."
 * Tinder-style cards (drag right=Important, left=Can go, up=Must keep, down=Normal).
 * Keyboard arrow shortcuts + big accessible action buttons.
 * Three animated jars: Important, Can go, Must keep.
 * Insight chips: duplicates, old files.
 * "Skip, let Vaultline guess" link.
 * Next: "Pack it!"
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Flame,
  Archive,
  Star,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useFlowStore } from '../store/useFlowStore';
import { Boxy, BoxyMood } from '../components/Boxy';
import { springs } from '../motion';
import { CATEGORY_STYLES, getFileCategory, formatBytes, formatAge } from '../utils/fileHelpers';
import { playSound } from '../utils/sound';
import { FileMetadata } from '../../engine/types';

export const SwipeScene: React.FC = () => {
  const { files, updatePriority, setFilePlacement } = useAppStore();
  const {
    setScene,
    setSwipeDone,
    addSwipeDecision,
    showTips,
    setShowTips,
  } = useFlowStore();

  // Find candidate files to swipe (up to 12 files: biggest size, duplicates, old files)
  const candidateFiles = useMemo(() => {
    if (!files || files.length === 0) return [];
    // Clone and score for interestingness
    const sorted = [...files].sort((a, b) => b.size - a.size);
    return sorted.slice(0, 12);
  }, [files]);

  const [deck, setDeck] = useState<FileMetadata[]>([]);
  const [swipedCounts, setSwipedCounts] = useState({
    important: 0,
    can_go: 0,
    must_keep: 0,
    normal: 0,
  });
  const [activeMood, setActiveMood] = useState<BoxyMood>('curious');

  useEffect(() => {
    setDeck(candidateFiles);
  }, [candidateFiles]);

  // Insight detection
  const duplicateFiles = useMemo(
    () => files.filter((f) => f.isDuplicate),
    [files]
  );
  const oldFiles = useMemo(() => {
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    return files.filter((f) => f.lastModified && f.lastModified < oneYearAgo);
  }, [files]);

  const currentCard = deck[0];

  const handleDecision = useCallback(
    (verdict: 'important' | 'can_go' | 'must_keep' | 'normal') => {
      if (!currentCard) return;

      playSound('pop');
      addSwipeDecision({ fileId: currentCard.id, verdict });

      // Apply to engine store
      if (verdict === 'must_keep') {
        setFilePlacement(currentCard.id, 'always_keep');
        updatePriority(currentCard.id, 10);
      } else if (verdict === 'important') {
        updatePriority(currentCard.id, 9);
      } else if (verdict === 'can_go') {
        updatePriority(currentCard.id, 2);
      } else {
        updatePriority(currentCard.id, 5);
      }

      setSwipedCounts((prev) => ({
        ...prev,
        [verdict]: prev[verdict] + 1,
      }));

      if (verdict === 'must_keep' || verdict === 'important') {
        setActiveMood('cheer');
      } else {
        setActiveMood('idle');
      }

      setDeck((prev) => prev.slice(1));
    },
    [currentCard, addSwipeDecision, setFilePlacement, updatePriority]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (deck.length === 0) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleDecision('important');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleDecision('can_go');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleDecision('must_keep');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecision('normal');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, handleDecision]);

  const handleSendToFront = (list: FileMetadata[]) => {
    if (list.length === 0) return;
    playSound('pop');
    setDeck((prev) => {
      const ids = new Set(list.map((f) => f.id));
      const remaining = prev.filter((f) => !ids.has(f.id));
      return [...list, ...remaining];
    });
  };

  const handleFinishSwipe = () => {
    playSound('click');
    setSwipeDone(true);
    setScene('pack');
    window.location.hash = '#/pack';
  };

  const isDeckEmpty = deck.length === 0;

  return (
    <div
      className="scene-container"
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-xl) var(--space-lg)',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      {/* Title & Subtitle */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
        <h2
          style={{
            fontSize: 'var(--text-scene-title)',
            color: 'var(--ink)',
            marginBottom: 'var(--space-xs)',
          }}
        >
          Quick: what matters?
        </h2>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--ink-muted)' }}>
          Swipe your biggest files. We will guess the rest.
        </p>
      </div>

      {/* Row of Tiny Insight Chips (if relevant) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
          minHeight: 32,
        }}
      >
        {duplicateFiles.length > 0 && (
          <motion.button
            className="sticker-chip"
            onClick={() => handleSendToFront(duplicateFiles)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'var(--tangerine)',
              color: 'var(--ink)',
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              gap: 4,
            }}
          >
            <Sparkles size={14} />
            <span>{duplicateFiles.length} possible duplicates</span>
          </motion.button>
        )}

        {oldFiles.length > 0 && (
          <motion.button
            className="sticker-chip"
            onClick={() => handleSendToFront(oldFiles)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'var(--sky)',
              color: 'var(--ink)',
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              gap: 4,
            }}
          >
            <Archive size={14} />
            <span>{oldFiles.length} files not opened in a year</span>
          </motion.button>
        )}
      </div>

      {/* Three Little Jars Side-by-Side Counters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        {/* Must Keep Jar */}
        <div
          className="sticker-card"
          style={{
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 'var(--radius-chip)',
            background: 'var(--surface)',
          }}
        >
          <Star size={16} color="var(--grape)" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800 }}>Must keep:</span>
          <span className="mono" style={{ fontWeight: 800, color: 'var(--grape)' }}>
            {swipedCounts.must_keep}
          </span>
        </div>

        {/* Important Jar */}
        <div
          className="sticker-card"
          style={{
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 'var(--radius-chip)',
            background: 'var(--surface)',
          }}
        >
          <Flame size={16} color="var(--mint)" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800 }}>Important:</span>
          <span className="mono" style={{ fontWeight: 800, color: 'var(--mint)' }}>
            {swipedCounts.important}
          </span>
        </div>

        {/* Can Go Jar */}
        <div
          className="sticker-card"
          style={{
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 'var(--radius-chip)',
            background: 'var(--surface)',
          }}
        >
          <ArrowLeft size={16} color="var(--bubblegum)" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800 }}>Can go:</span>
          <span className="mono" style={{ fontWeight: 800, color: 'var(--bubblegum)' }}>
            {swipedCounts.can_go}
          </span>
        </div>
      </div>

      {/* Card Deck Area */}
      <div
        style={{
          position: 'relative',
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <AnimatePresence>
          {!isDeckEmpty ? (
            <SwipeCard
              key={currentCard.id}
              file={currentCard}
              onSwipeRight={() => handleDecision('important')}
              onSwipeLeft={() => handleDecision('can_go')}
              onSwipeUp={() => handleDecision('must_keep')}
              onSwipeDown={() => handleDecision('normal')}
            />
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="sticker-card"
              style={{
                textAlign: 'center',
                padding: 'var(--space-xl)',
                maxWidth: 400,
                background: 'var(--surface)',
              }}
            >
              <CheckCircle size={48} color="var(--mint)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 8 }}>
                All done swiping!
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: 16 }}>
                Vaultline will use smart defaults for all your remaining files.
              </p>
              <motion.button
                className="sticker-button sticker-button-primary"
                onClick={handleFinishSwipe}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: '100%' }}
              >
                Pack it!
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons under the stack (for mouse/touch/keyboard) */}
      {!isDeckEmpty && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          {/* Can Go button (Left) */}
          <motion.button
            className="sticker-button"
            onClick={() => handleDecision('can_go')}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            style={{
              background: 'var(--bubblegum)',
              color: 'var(--ink)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Press Left Arrow"
          >
            <ArrowLeft size={18} />
            <span style={{ fontWeight: 800 }}>Can go</span>
          </motion.button>

          {/* Normal button (Down) */}
          <motion.button
            className="sticker-button sticker-button-surface"
            onClick={() => handleDecision('normal')}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Press Down Arrow"
          >
            <ArrowDown size={18} />
            <span style={{ fontWeight: 800 }}>Normal</span>
          </motion.button>

          {/* Must keep button (Up) */}
          <motion.button
            className="sticker-button"
            onClick={() => handleDecision('must_keep')}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            style={{
              background: 'var(--grape)',
              color: '#FFFFFF',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Press Up Arrow"
          >
            <ArrowUp size={18} />
            <span style={{ fontWeight: 800 }}>Must keep</span>
          </motion.button>

          {/* Important button (Right) */}
          <motion.button
            className="sticker-button sticker-button-primary"
            onClick={() => handleDecision('important')}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            style={{
              background: 'var(--mint)',
              color: 'var(--ink)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Press Right Arrow"
          >
            <span style={{ fontWeight: 800 }}>Important</span>
            <ArrowRight size={18} />
          </motion.button>
        </div>
      )}

      {/* Skip / Next Actions */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-lg)' }}>
        {!isDeckEmpty && (
          <button
            onClick={handleFinishSwipe}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-muted)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Skip, let Vaultline guess
          </button>
        )}
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
          mood={activeMood}
          tip="Swipe right if you care a lot, left if it can go, or up to lock it in!"
          showTips={showTips}
          onHideTips={() => setShowTips(false)}
        />
      </div>
    </div>
  );
};

interface SwipeCardProps {
  file: FileMetadata;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  file,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  onSwipeDown,
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-250, -150, 0, 150, 250], [0, 1, 1, 1, 0]);

  const cat = getFileCategory(file.name, file.type);
  const style = CATEGORY_STYLES[cat];
  const Icon = style.icon;

  const handleDragEnd = (_: any, info: { offset: { x: number; y: number } }) => {
    const { x: offsetX, y: offsetY } = info.offset;
    if (offsetX > 100) {
      onSwipeRight();
    } else if (offsetX < -100) {
      onSwipeLeft();
    } else if (offsetY < -80) {
      onSwipeUp();
    } else if (offsetY > 80) {
      onSwipeDown();
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      style={{
        x,
        y,
        rotate,
        opacity,
        position: 'absolute',
        width: 320,
        height: 240,
        cursor: 'grab',
      }}
      whileTap={{ cursor: 'grabbing' }}
      className="sticker-card"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        {/* Card Header: Icon & Category */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: style.colorVar,
              border: '2px solid var(--ink)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
            }}
          >
            <Icon size={14} />
            <span>{style.label}</span>
          </div>

          <span
            className="mono"
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--ink-muted)',
            }}
          >
            {formatAge(file.lastModified)}
          </span>
        </div>

        {/* Card Body: File Name */}
        <div style={{ margin: 'var(--space-md) 0' }}>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 800,
              color: 'var(--ink)',
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {file.name}
          </p>
        </div>

        {/* Card Footer: Size & Path */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid var(--canvas)',
            paddingTop: 'var(--space-sm)',
          }}
        >
          <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--grape)' }}>
            {formatBytes(file.size)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            Swipe or use arrows
          </span>
        </div>
      </div>
    </motion.div>
  );
};
export default SwipeScene;
