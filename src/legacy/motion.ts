/**
 * Central motion tokens for the Sticker Playground animation system.
 * All Framer Motion transitions reference these constants.
 */
import { type Transition } from 'framer-motion';

// --- Spring presets ---
export const springs = {
  soft: { type: 'spring', stiffness: 120, damping: 20, mass: 1 } as Transition,
  snappy: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 } as Transition,
  bouncy: { type: 'spring', stiffness: 300, damping: 15, mass: 0.6 } as Transition,
  gentle: { type: 'spring', stiffness: 80, damping: 18, mass: 1.2 } as Transition,
};

// --- Duration presets (for tween) ---
export const durations = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  cinematic: 0.6,
} as const;

// --- Easing presets ---
export const easings = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.42, 0, 0.58, 1] as [number, number, number, number],
  bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export const isReducedMotion = prefersReducedMotion;

// --- Transition helpers ---
export function safeTransition(transition: Transition): Transition {
  if (prefersReducedMotion()) {
    return { duration: 0.01 };
  }
  return transition;
}

// --- Common animation variants ---
export const popIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  transition: springs.bouncy,
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: durations.normal },
};

export const slideUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: springs.soft,
};

export const slideRight = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: springs.soft,
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: springs.soft,
};

export const squashPress = {
  whileTap: { scale: 0.95 },
  transition: springs.snappy,
};

export const wiggle = {
  animate: {
    rotate: [0, -3, 3, -2, 2, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

export const bounceOnce = {
  animate: {
    y: [0, -15, 0],
    transition: { duration: 0.4, ease: easings.bounce },
  },
};
