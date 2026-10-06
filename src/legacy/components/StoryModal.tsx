/**
 * Story Mode modal: "How Vaultline decided"
 * 4 short non-technical slides with big visuals, next/back and progress dots.
 * Slide 1: "A tricky puzzle" (greedy-fails interactive box)
 * Slide 2: "Too many options" (8 combinations flipping, >1 billion message)
 * Slide 3: "The smart shortcut" (visual table step-through & trace back)
 * Slide 4: "Quick vs careful" (side-by-side comparison)
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Play, Pause, RotateCcw, GraduationCap } from 'lucide-react';
import { springs } from '../motion';
import { playSound } from '../utils/sound';
import { useFlowStore } from '../store/useFlowStore';

export const StoryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { toggleTeacherMode } = useFlowStore();
  const [slide, setSlide] = useState(0);

  // Slide 1 interactive state
  const [slide1Selection, setSlide1Selection] = useState<('A' | 'B' | 'C')[]>([]);

  // Slide 3 animation state
  const [tableStep, setTableStep] = useState(0);
  const [isPlayingTable, setIsPlayingTable] = useState(false);

  if (!isOpen) return null;

  const totalSlides = 4;

  const handleNext = () => {
    if (slide < totalSlides - 1) {
      playSound('pop');
      setSlide(slide + 1);
    }
  };

  const handlePrev = () => {
    if (slide > 0) {
      playSound('pop');
      setSlide(slide - 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(27, 21, 51, 0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="How Vaultline decided"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={springs.bouncy}
        className="sticker-card"
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'var(--surface)',
          padding: 'var(--space-xl)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header: Title, Slide dots, Close button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-lg)',
            borderBottom: '2px solid var(--canvas)',
            paddingBottom: 'var(--space-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>
              How Vaultline decided
            </span>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: idx === slide ? 'var(--grape)' : 'var(--canvas-dot)',
                    border: '1.5px solid var(--ink)',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="sticker-chip"
            aria-label="Close story"
            style={{ padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content of the active slide */}
        <div style={{ flex: 1, minHeight: 340, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {slide === 0 && (
            <Slide1
              selection={slide1Selection}
              setSelection={setSlide1Selection}
            />
          )}
          {slide === 1 && <Slide2 />}
          {slide === 2 && (
            <Slide3
              step={tableStep}
              setStep={setTableStep}
              isPlaying={isPlayingTable}
              setIsPlaying={setIsPlayingTable}
            />
          )}
          {slide === 3 && (
            <Slide4
              onOpenTeacher={() => {
                onClose();
                toggleTeacherMode();
                window.location.hash = '#/teacher';
              }}
            />
          )}
        </div>

        {/* Footer navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'var(--space-lg)',
            borderTop: '2px solid var(--canvas)',
            paddingTop: 'var(--space-md)',
          }}
        >
          <motion.button
            className="sticker-button sticker-button-surface"
            onClick={handlePrev}
            disabled={slide === 0}
            style={{
              opacity: slide === 0 ? 0.3 : 1,
              cursor: slide === 0 ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--text-sm)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </motion.button>

          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', fontWeight: 700 }}>
            Slide {slide + 1} of {totalSlides}
          </span>

          <motion.button
            className="sticker-button sticker-button-primary"
            onClick={slide === totalSlides - 1 ? onClose : handleNext}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--text-sm)',
            }}
          >
            <span>{slide === totalSlides - 1 ? 'Done' : 'Next'}</span>
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

/* --- SLIDE 1: A tricky puzzle --- */
const Slide1: React.FC<{
  selection: ('A' | 'B' | 'C')[];
  setSelection: React.Dispatch<React.SetStateAction<('A' | 'B' | 'C')[]>>;
}> = ({ selection, setSelection }) => {
  const blocks = {
    A: { name: 'Block A', size: 6, score: 30, color: 'var(--bubblegum)' },
    B: { name: 'Block B', size: 5, score: 24, color: 'var(--mint)' },
    C: { name: 'Block C', size: 5, score: 24, color: 'var(--sky)' },
  };

  const totalUsed = selection.reduce((sum, key) => sum + blocks[key].size, 0);
  const totalScore = selection.reduce((sum, key) => sum + blocks[key].score, 0);
  const isOver = totalUsed > 10;

  const toggle = (key: 'A' | 'B' | 'C') => {
    playSound('pop');
    setSelection((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: 'var(--text-scene-title)', marginBottom: 8 }}>
        A tricky puzzle
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: 20 }}>
        You have a 10-unit box. The quick way grabs the biggest single item first. But does that get you the best total?
      </p>

      {/* 10-unit Box Visual */}
      <div
        style={{
          width: 340,
          height: 54,
          margin: '0 auto 16px auto',
          background: 'var(--canvas)',
          border: '2.5px solid var(--ink)',
          borderRadius: 14,
          display: 'flex',
          overflow: 'hidden',
          boxShadow: isOver ? '3px 3px 0 var(--bubblegum)' : '3px 3px 0 var(--ink)',
        }}
      >
        {selection.map((key) => {
          const b = blocks[key];
          return (
            <motion.div
              key={key}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              style={{
                width: `${(b.size / 10) * 100}%`,
                height: '100%',
                background: b.color,
                borderRight: '2px solid var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {key} ({b.size})
            </motion.div>
          );
        })}
      </div>

      <div style={{ marginBottom: 16, fontSize: 'var(--text-sm)', fontWeight: 800 }}>
        Space: <span className="mono">{totalUsed} / 10</span> · Score: <span className="mono">{totalScore}</span>
        {isOver && <span style={{ color: 'var(--bubblegum)', marginLeft: 8 }}>Over capacity!</span>}
      </div>

      {/* 3 Blocks to click */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
        {(['A', 'B', 'C'] as const).map((k) => {
          const b = blocks[k];
          const isSelected = selection.includes(k);
          return (
            <button
              key={k}
              onClick={() => toggle(k)}
              className="sticker-chip"
              style={{
                background: isSelected ? b.color : 'var(--canvas)',
                fontWeight: 800,
                fontSize: 13,
                padding: '6px 14px',
              }}
            >
              {b.name} (size {b.size}, score {b.score})
            </button>
          );
        })}
      </div>

      {/* Quick vs Better helper buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button
          className="sticker-chip"
          onClick={() => {
            playSound('pop');
            setSelection(['A']);
          }}
          style={{ fontSize: 12 }}
        >
          Try the quick way (A only: score 30)
        </button>
        <button
          className="sticker-chip"
          onClick={() => {
            playSound('cheer');
            setSelection(['B', 'C']);
          }}
          style={{ fontSize: 12, background: 'var(--mint)' }}
        >
          Try the better way (B & C: score 48)
        </button>
      </div>
    </div>
  );
};

/* --- SLIDE 2: Too many options --- */
const Slide2: React.FC = () => {
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: 'var(--text-scene-title)', marginBottom: 8 }}>
        Too many options
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: 24 }}>
        With 3 items, there are 8 possible combinations. Some fit, some don’t.
      </p>

      {/* Combinations grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          maxWidth: 480,
          margin: '0 auto 24px auto',
        }}
      >
        {[
          { label: 'None', fit: true },
          { label: 'A only', fit: true },
          { label: 'B only', fit: true },
          { label: 'C only', fit: true },
          { label: 'A + B', fit: false },
          { label: 'A + C', fit: false },
          { label: 'B + C', fit: true, best: true },
          { label: 'A + B + C', fit: false },
        ].map((comb, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{
              padding: '10px 6px',
              borderRadius: 12,
              border: '2px solid var(--ink)',
              background: comb.best ? 'var(--mint)' : comb.fit ? 'var(--canvas)' : 'var(--surface)',
              opacity: comb.fit ? 1 : 0.45,
              textDecoration: comb.fit ? 'none' : 'line-through',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {comb.label}
          </motion.div>
        ))}
      </div>

      <div
        className="sticker-card"
        style={{
          maxWidth: 460,
          margin: '0 auto',
          background: 'var(--lemon)',
          padding: '12px 18px',
        }}
      >
        <span style={{ fontSize: 'var(--text-body)', fontWeight: 800 }}>
          With 30 files, there are over a billion combinations!
        </span>
      </div>
    </div>
  );
};

/* --- SLIDE 3: The smart shortcut --- */
const Slide3: React.FC<{
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ step, setStep, isPlaying, setIsPlaying }) => {
  const steps = [
    'Vaultline builds a grid of smart shortcuts, answering smaller questions first.',
    'For each file, it asks: "Is the box better with this file, or without it?"',
    'It only remembers the best answer for each room size, skipping dead ends.',
    'Finally, it traces backward from the finish line to pack the exact winning files.',
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: 'var(--text-scene-title)', marginBottom: 8 }}>
        The smart shortcut
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: 16 }}>
        Instead of guessing billions of times, Vaultline solves it step-by-step.
      </p>

      {/* Mini Grid Illustration */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 6,
          maxWidth: 380,
          margin: '0 auto 16px auto',
        }}
      >
        {Array.from({ length: 18 }).map((_, idx) => {
          const isHighlighted = idx <= (step + 1) * 4;
          return (
            <motion.div
              key={idx}
              animate={{
                background: isHighlighted ? 'var(--mint)' : 'var(--canvas)',
                scale: isHighlighted ? [1, 1.1, 1] : 1,
              }}
              style={{
                height: 32,
                borderRadius: 8,
                border: '1.5px solid var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {isHighlighted ? '✓' : ''}
            </motion.div>
          );
        })}
      </div>

      <p
        style={{
          fontSize: 'var(--text-body)',
          fontWeight: 800,
          minHeight: 48,
          maxWidth: 480,
          margin: '0 auto 16px auto',
          color: 'var(--grape)',
        }}
      >
        {steps[step]}
      </p>

      {/* Step controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        <button
          className="sticker-chip"
          onClick={() => {
            playSound('pop');
            setStep((s) => (s > 0 ? s - 1 : 0));
          }}
          style={{ fontSize: 12 }}
        >
          Back step
        </button>
        <button
          className="sticker-chip"
          onClick={() => {
            playSound('pop');
            setStep((s) => (s < steps.length - 1 ? s + 1 : 0));
          }}
          style={{ fontSize: 12, background: 'var(--lemon)' }}
        >
          Next step
        </button>
      </div>
    </div>
  );
};

/* --- SLIDE 4: Quick vs careful --- */
const Slide4: React.FC<{ onOpenTeacher: () => void }> = ({ onOpenTeacher }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: 'var(--text-scene-title)', marginBottom: 8 }}>
        Quick vs careful
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: 20 }}>
        Two methods side-by-side:
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          maxWidth: 520,
          margin: '0 auto 20px auto',
        }}
      >
        {/* Quick method */}
        <div
          className="sticker-card"
          style={{
            padding: 16,
            background: 'var(--canvas)',
            textAlign: 'left',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 14 }}>Quick method</span>
          <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
            Grabs the highest value per size until full.
          </p>
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: 'var(--tangerine)' }}>
            Can get stuck leaving awkward gaps.
          </div>
        </div>

        {/* Vaultline */}
        <div
          className="sticker-card"
          style={{
            padding: 16,
            background: 'var(--surface)',
            border: '2.5px solid var(--grape)',
            textAlign: 'left',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--grape)' }}>
            Vaultline
          </span>
          <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
            Mathematically proves the exact best combination.
          </p>
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: 'var(--mint)' }}>
            100% optimal every single time.
          </div>
        </div>
      </div>

      <button
        onClick={onOpenTeacher}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--grape)',
          fontWeight: 800,
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          textDecoration: 'underline',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <GraduationCap size={16} />
        <span>Teacher mode: see the full algorithm</span>
      </button>
    </div>
  );
};
