/**
 * Boxy — the friendly bento-box mascot.
 * A rounded square with two eyes and a small smile, drawn as inline SVG.
 * States: idle, curious, munching, thinking, cheer, squished, oops.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springs, prefersReducedMotion } from '../motion';
import { X } from 'lucide-react';

export type BoxyMood =
  | 'idle'
  | 'curious'
  | 'munching'
  | 'thinking'
  | 'cheer'
  | 'squished'
  | 'oops';

interface BoxyProps {
  mood?: BoxyMood;
  tip?: string;
  size?: number;
  showTips?: boolean;
  onHideTips?: () => void;
}

const moodAnimations: Record<BoxyMood, any> = {
  idle: {
    y: [0, -4, 0],
    transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
  },
  curious: {
    rotate: [0, -5, 5, 0],
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
  munching: {
    scaleY: [1, 0.85, 1, 0.9, 1],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
  thinking: {
    rotate: [0, -3, 3, -2, 2, 0],
    transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
  },
  cheer: {
    y: [0, -20, 0],
    scale: [1, 1.1, 1],
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  },
  squished: {
    scaleY: [1, 0.8, 1],
    scaleX: [1, 1.15, 1],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
  oops: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

// Eye positions for different moods
function getEyeOffset(mood: BoxyMood): { lx: number; ly: number; rx: number; ry: number } {
  switch (mood) {
    case 'curious': return { lx: 2, ly: -1, rx: 2, ry: -1 };
    case 'oops': return { lx: 0, ly: 2, rx: 0, ry: 2 };
    case 'thinking': return { lx: -1, ly: -2, rx: 1, ry: -2 };
    default: return { lx: 0, ly: 0, rx: 0, ry: 0 };
  }
}

function getMouthPath(mood: BoxyMood): string {
  switch (mood) {
    case 'cheer': return 'M 28 44 Q 36 54 44 44'; // big smile
    case 'oops': return 'M 28 46 Q 36 40 44 46'; // frown
    case 'munching': return 'M 30 44 L 42 44'; // flat line
    case 'squished': return 'M 29 45 Q 36 50 43 45'; // small grimace
    default: return 'M 30 43 Q 36 49 42 43'; // gentle smile
  }
}

export const Boxy: React.FC<BoxyProps> = ({
  mood = 'idle',
  tip,
  size = 80,
  showTips = true,
  onHideTips,
}) => {
  const reduced = prefersReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const eyeOffset = getEyeOffset(mood);
  const mouthPath = getMouthPath(mood);

  // Reset dismissed when tip changes
  useEffect(() => {
    setDismissed(false);
  }, [tip]);

  const boxyVariant = reduced ? {} : moodAnimations[mood];

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
      aria-label={`Boxy is ${mood}`}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {showTips && tip && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={springs.soft}
            role="status"
            aria-live="polite"
            style={{
              position: 'absolute',
              bottom: size + 12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--surface)',
              border: '2px solid var(--outline-color)',
              borderRadius: 14,
              padding: '8px 14px',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
              boxShadow: '2px 2px 0 var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 10,
              maxWidth: 260,
            }}
          >
            <span style={{ whiteSpace: 'normal', lineHeight: 1.3 }}>{tip}</span>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss tip"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-faint)',
                padding: 2,
                flexShrink: 0,
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
            {/* Tail */}
            <div
              style={{
                position: 'absolute',
                bottom: -7,
                left: '50%',
                marginLeft: -6,
                width: 12,
                height: 12,
                background: 'var(--surface)',
                border: '2px solid var(--outline-color)',
                borderTop: 'none',
                borderLeft: 'none',
                transform: 'rotate(45deg)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boxy SVG */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 72 72"
        fill="none"
        animate={boxyVariant}
        style={{ display: 'block' }}
      >
        {/* Body */}
        <rect
          x="4" y="8" width="64" height="56" rx="14"
          fill="var(--primary)"
          stroke="var(--outline-color)"
          strokeWidth="2.5"
        />

        {/* Compartment lines */}
        <line x1="4" y1="28" x2="68" y2="28" stroke="var(--outline-color)" strokeWidth="2" />
        <line x1="36" y1="28" x2="36" y2="64" stroke="var(--outline-color)" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Left eye */}
        <circle
          cx={26 + eyeOffset.lx}
          cy={19 + eyeOffset.ly}
          r="4"
          fill="var(--surface)"
        />
        <circle
          cx={26 + eyeOffset.lx}
          cy={19 + eyeOffset.ly}
          r="2"
          fill="var(--ink)"
        />

        {/* Right eye */}
        <circle
          cx={46 + eyeOffset.rx}
          cy={19 + eyeOffset.ry}
          r="4"
          fill="var(--surface)"
        />
        <circle
          cx={46 + eyeOffset.rx}
          cy={19 + eyeOffset.ry}
          r="2"
          fill="var(--ink)"
        />

        {/* Blink line for idle */}
        {mood === 'idle' && (
          <motion.line
            x1="22" y1="19" x2="30" y2="19"
            stroke="var(--surface)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 0, 0] }}
            transition={{ repeat: Infinity, duration: 4, times: [0, 0.45, 0.48, 0.52, 1] }}
          />
        )}

        {/* Mouth */}
        <path
          d={mouthPath}
          stroke="var(--surface)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheeks for cheer */}
        {mood === 'cheer' && (
          <>
            <circle cx="18" cy="24" r="4" fill="var(--bubblegum)" opacity="0.4" />
            <circle cx="54" cy="24" r="4" fill="var(--bubblegum)" opacity="0.4" />
          </>
        )}
      </motion.svg>

      {/* Hide tips toggle */}
      {showTips && onHideTips && (
        <button
          onClick={onHideTips}
          style={{
            marginTop: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--text-xs)',
            color: 'var(--ink-faint)',
            textDecoration: 'underline',
          }}
        >
          Hide tips
        </button>
      )}
    </div>
  );
};

export default Boxy;
