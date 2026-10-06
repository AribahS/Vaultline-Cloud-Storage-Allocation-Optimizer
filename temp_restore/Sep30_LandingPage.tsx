import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, HardDrive, Shield, Cpu, ChevronRight, ArrowRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                   */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ease: [0.22, 1, 0.36, 1], duration: 0.65 },
  },
};

const stagger = {
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const heroLine = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.6, ease: 'easeInOut', delay: 0.3 },
  },
};

/* ------------------------------------------------------------------ */
/*  Feature data                                                         */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: Shield,
    title: 'Private by design',
    body: 'Only file names, sizes and dates are read. Nothing leaves your device — ever.',
  },
  {
    icon: Cpu,
    title: 'Optimal, not guessed',
    body: 'Dynamic programming finds the provably best keep/move plan for your exact constraints.',
  },
  {
    icon: HardDrive,
    title: 'Works on real folders',
    body: 'Drop 100 000 files. The table stays smooth. The algorithm completes in milliseconds.',
  },
];

/* ------------------------------------------------------------------ */
/*  Animated SVG hero                                                    */
/* ------------------------------------------------------------------ */
const HeroSVG: React.FC = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 480 360"
    fill="none"
    aria-hidden="true"
    style={{ overflow: 'visible' }}
  >
    {/* Background glow */}
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#B8893C" stopOpacity="0.18" />
      <stop offset="100%" stopColor="#14382B" stopOpacity="0" />
    </radialGradient>
    <ellipse cx="240" cy="180" rx="220" ry="160" fill="url(#glow)" />

    {/* Vault/folder outline */}
    <motion.rect
      x="80" y="80" width="320" height="220" rx="16"
      fill="#1F4D3A" stroke="#B8893C" strokeWidth="1.5"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    />

    {/* Folder tab */}
    <motion.path
      d="M80 96 C80 87 87 80 96 80 H180 L196 64 H360 C369 64 376 71 376 80 V80 H80 Z"
      fill="#2F6B4F" stroke="#B8893C" strokeWidth="1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    />

    {/* Vault door circle */}
    <motion.circle
      cx="240" cy="195" r="68"
      fill="#14382B" stroke="#B8893C" strokeWidth="2"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    />
    <motion.circle
      cx="240" cy="195" r="50"
      fill="#0E2A20" stroke="#B8893C" strokeWidth="1.5" strokeDasharray="6 4"
      initial={{ rotate: -180, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.6 }}
    />

    {/* Lock / sparkle icon */}
    <motion.path
      d="M230 185 L240 175 L250 185 L250 200 L230 200 Z"
      fill="#B8893C"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    />
    <motion.circle cx="240" cy="190" r="5" fill="#F6F1E4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 1.1 }}
    />

    {/* Connector lines to "Keep" and "Move" file chips */}
    <motion.path
      d="M180 195 L120 155" stroke="#2F6B4F" strokeWidth="1.5"
      variants={heroLine}
      initial="hidden"
      animate="show"
      style={{ pathLength: 0 }}
    />
    <motion.path
      d="M300 195 L360 155" stroke="#9C4A3A" strokeWidth="1.5"
      variants={heroLine}
      initial="hidden"
      animate="show"
      style={{ pathLength: 0 }}
    />

    {/* Keep chip */}
    <motion.rect
      x="60" y="135" width="72" height="40" rx="8"
      fill="#2F6B4F"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1.2 }}
    />
    <motion.text
      x="96" y="160" textAnchor="middle" fill="#F6F1E4"
      fontSize="11" fontWeight="600"
      fontFamily="Inter, sans-serif"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4 }}
    >
      KEEP
    </motion.text>

    {/* Move chip */}
    <motion.rect
      x="348" y="135" width="72" height="40" rx="8"
      fill="#9C4A3A"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1.2 }}
    />
    <motion.text
      x="384" y="160" textAnchor="middle" fill="#F6F1E4"
      fontSize="11" fontWeight="600"
      fontFamily="Inter, sans-serif"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4 }}
    >
      MOVE
    </motion.text>

    {/* Floating file dots */}
    {[
      { cx: 140, cy: 240, r: 5, fill: '#2D5A7B', delay: 0.8 },
      { cx: 165, cy: 255, r: 4, fill: '#B5654A', delay: 0.9 },
      { cx: 310, cy: 248, r: 5, fill: '#7A5C8C', delay: 1.0 },
      { cx: 338, cy: 237, r: 4, fill: '#4E8A6B', delay: 1.1 },
    ].map((d) => (
      <motion.circle
        key={`${d.cx}-${d.cy}`}
        cx={d.cx} cy={d.cy} r={d.r} fill={d.fill}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.8, scale: 1 }}
        transition={{ duration: 0.4, delay: d.delay }}
      />
    ))}
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Landing page                                                         */
/* ------------------------------------------------------------------ */
interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Short timeout so fonts are loaded before we animate
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0E2A20',
        color: '#F6F1E4',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* ── Skip to app link (always visible for accessibility) ── */}
      <a
        href="#main-app"
        onClick={(e) => { e.preventDefault(); onEnter(); }}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 9999,
          padding: '6px 14px',
          borderRadius: 6,
          backgroundColor: '#B8893C',
          color: '#0E2A20',
          fontWeight: 600,
          fontSize: 13,
          textDecoration: 'none',
          opacity: 0.85,
          transition: 'opacity 150ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
        id="skip-to-app"
      >
        Skip to app
      </a>

      {/* ── Top navigation bar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : -16 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 40px',
          borderBottom: '1px solid rgba(184,137,60,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Box size={22} color="#B8893C" />
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: '#F6F1E4' }}>
            Vaultline
          </span>
        </div>
        <button
          onClick={onEnter}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid rgba(184,137,60,0.5)',
            backgroundColor: 'transparent',
            color: '#B8893C',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(184,137,60,0.12)';
            e.currentTarget.style.borderColor = '#B8893C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(184,137,60,0.5)';
          }}
          id="landing-open-app-btn"
        >
          Open app <ChevronRight size={14} />
        </button>
      </motion.nav>

      {/* ── Hero section ── */}
      <AnimatePresence>
        {ready && (
          <motion.section
            key="hero"
            variants={stagger}
            initial="hidden"
            animate="show"
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 48,
              alignItems: 'center',
              maxWidth: 1200,
              margin: '0 auto',
              padding: '64px 40px',
              width: '100%',
            }}
          >
            {/* Left: copy */}
            <div>
              {/* Gold badge */}
              <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '1px solid rgba(184,137,60,0.4)',
                  backgroundColor: 'rgba(184,137,60,0.08)',
                  color: '#B8893C',
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#B8893C' }} />
                  Provably optimal file planning
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontWeight: 600,
                  lineHeight: 1.15,
                  color: '#F6F1E4',
                  margin: '0 0 20px 0',
                }}
              >
                Decide what<br />
                <span style={{
                  background: 'linear-gradient(135deg, #B8893C 0%, #E8B96E 60%, #B8893C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  to keep.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                style={{
                  fontSize: 17,
                  lineHeight: 1.75,
                  color: 'rgba(246,241,228,0.72)',
                  margin: '0 0 40px 0',
                  maxWidth: 440,
                }}
              >
                Vaultline reads your file names, sizes and dates,
                then uses dynamic programming to find the best
                mix to fit any target device.{' '}
                <strong style={{ color: '#F6F1E4' }}>Nothing leaves your device.</strong>
              </motion.p>

              <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={onEnter}
                  id="landing-cta-primary"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '14px 28px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #B8893C, #C99A4E)',
                    color: '#0E2A20',
                    fontSize: 15, fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(184,137,60,0.35)',
                    transition: 'transform 150ms, box-shadow 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(184,137,60,0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(184,137,60,0.35)';
                  }}
                >
                  Get started <ArrowRight size={16} />
                </button>

                <button
                  id="landing-cta-secondary"
                  onClick={onEnter}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '14px 24px',
                    borderRadius: 10,
                    border: '1px solid rgba(246,241,228,0.2)',
                    backgroundColor: 'rgba(246,241,228,0.06)',
                    color: 'rgba(246,241,228,0.8)',
                    fontSize: 15, fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'border-color 150ms, background-color 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(246,241,228,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(246,241,228,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(246,241,228,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(246,241,228,0.2)';
                  }}
                >
                  Try sample data
                </button>
              </motion.div>

              {/* Social proof strip */}
              <motion.div
                variants={fadeUp}
                style={{
                  marginTop: 40,
                  display: 'flex',
                  gap: 24,
                  flexWrap: 'wrap',
                  color: 'rgba(246,241,228,0.45)',
                  fontSize: 13,
                }}
              >
                {[
                  { num: '100k+', label: 'files handled' },
                  { num: '<1 ms', label: 'typical runtime' },
                  { num: '0 bytes', label: 'uploaded' },
                ].map((stat) => (
                  <div key={stat.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#B8893C' }}>{stat.num}</span>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: animated SVG */}
            <motion.div
              variants={fadeUp}
              style={{
                height: 360,
                position: 'relative',
              }}
            >
              {/* Soft radial bg glow behind SVG */}
              <div style={{
                position: 'absolute', inset: -40,
                background: 'radial-gradient(circle at 50% 50%, rgba(47,107,79,0.3) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <HeroSVG />
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Feature strip ── */}
      {ready && (
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{
            backgroundColor: 'rgba(14,42,32,0.6)',
            borderTop: '1px solid rgba(184,137,60,0.1)',
            padding: '64px 40px',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <motion.h2
              variants={fadeUp}
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 'clamp(24px, 3vw, 36px)',
                fontWeight: 600,
                color: '#F6F1E4',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Why Vaultline?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              style={{
                textAlign: 'center',
                color: 'rgba(246,241,228,0.55)',
                fontSize: 16,
                marginBottom: 48,
              }}
            >
              Not a guess. Not a heuristic. A mathematical guarantee.
            </motion.p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 24,
              }}
            >
              {FEATURES.map((feat) => (
                <motion.div
                  key={feat.title}
                  variants={fadeUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  style={{
                    backgroundColor: 'rgba(31,77,58,0.5)',
                    border: '1px solid rgba(184,137,60,0.15)',
                    borderRadius: 14,
                    padding: '28px 24px',
                    cursor: 'default',
                    transition: 'border-color 200ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(184,137,60,0.4)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(184,137,60,0.15)')}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: 'rgba(184,137,60,0.12)',
                      border: '1px solid rgba(184,137,60,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <feat.icon size={20} color="#B8893C" />
                  </div>
                  <h3
                    style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#F6F1E4',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {feat.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: 'rgba(246,241,228,0.6)',
                      margin: 0,
                    }}
                  >
                    {feat.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── CTA footer ── */}
      {ready && (
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{
            padding: '48px 40px',
            textAlign: 'center',
            borderTop: '1px solid rgba(184,137,60,0.1)',
          }}
        >
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 600,
              color: '#F6F1E4',
              marginBottom: 16,
            }}
          >
            Ready to organise your files?
          </h2>
          <p style={{ color: 'rgba(246,241,228,0.55)', marginBottom: 32, fontSize: 15 }}>
            Drop files anywhere — it runs entirely in your browser.
          </p>
          <button
            onClick={onEnter}
            id="landing-footer-cta"
            style={{
              padding: '14px 36px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #B8893C, #C99A4E)',
              color: '#0E2A20',
              fontSize: 16, fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(184,137,60,0.4)',
              transition: 'transform 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Open Vaultline
          </button>
          <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(246,241,228,0.3)' }}>
            No sign-up · No upload · No tracking
          </p>
        </motion.footer>
      )}
    </div>
  );
};

