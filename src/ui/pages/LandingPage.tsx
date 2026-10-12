import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, HardDrive, Shield, Cpu, ArrowRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                   */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ease: 'easeOut' as any, duration: 0.65 },
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
    transition: { duration: 1.6, ease: 'easeInOut' as const, delay: 0.3 },
  },
};

/* ------------------------------------------------------------------ */
/*  Feature data                                                         */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: Shield,
    title: 'Private by design',
    body: 'Nothing is uploaded: only names, sizes and dates are read.',
  },
  {
    icon: Cpu,
    title: 'Dynamic programming',
    body: 'Exact dynamic programming, O(n × W), finds the best fit on the selected size scale.',
  },
  {
    icon: HardDrive,
    title: 'Works with folders',
    body: 'Add files or choose a folder. Vaultline uses their names, sizes and dates to find recommendations in your browser.',
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
      <stop offset="0%" stopColor="var(--highlight)" stopOpacity="0.18" />
      <stop offset="100%" stopColor="var(--vault)" stopOpacity="0" />
    </radialGradient>
    <ellipse cx="240" cy="180" rx="220" ry="160" fill="url(#glow)" />

    {/* Vault/folder outline */}
    <motion.rect
      x="80" y="80" width="320" height="220" rx="16"
      fill="var(--ink)" stroke="var(--highlight)" strokeWidth="1.5"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' as any }}
    />

    {/* Folder tab */}
    <motion.path
      d="M80 96 C80 87 87 80 96 80 H180 L196 64 H360 C369 64 376 71 376 80 V80 H80 Z"
      fill="var(--ink)" stroke="var(--highlight)" strokeWidth="1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    />

    {/* Vault door circle */}
    <motion.circle
      cx="240" cy="195" r="68"
      fill="var(--vault)" stroke="var(--highlight)" strokeWidth="2"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' as any }}
    />
    <motion.circle
      cx="240" cy="195" r="50"
      fill="var(--vault)" stroke="var(--highlight)" strokeWidth="1.5" strokeDasharray="6 4"
      initial={{ rotate: -180, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.6 }}
    />

    {/* Lock / sparkle icon */}
    <motion.path
      d="M230 185 L240 175 L250 185 L250 200 L230 200 Z"
      fill="var(--highlight)"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    />
    <motion.circle cx="240" cy="190" r="5" fill="var(--paper)"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 1.1 }}
    />

    {/* Connector lines to "Keep" and "Move" file chips */}
    <motion.path
      d="M180 195 L120 155" stroke="var(--ink)" strokeWidth="1.5"
      variants={heroLine}
      initial="hidden"
      animate="show"
      style={{ pathLength: 0 }}
    />
    <motion.path
      d="M300 195 L360 155" stroke="var(--moved)" strokeWidth="1.5"
      variants={heroLine}
      initial="hidden"
      animate="show"
      style={{ pathLength: 0 }}
    />

    {/* Keep chip */}
    <motion.rect
      x="60" y="135" width="72" height="40" rx="8"
      fill="var(--ink)"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1.2 }}
    />
    <motion.text
      x="96" y="160" textAnchor="middle" fill="var(--paper)"
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
      fill="var(--moved)"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1.2 }}
    />
    <motion.text
      x="384" y="160" textAnchor="middle" fill="var(--paper)"
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
      { cx: 140, cy: 240, r: 5, fill: 'var(--highlight)', delay: 0.8 },
      { cx: 165, cy: 255, r: 4, fill: 'var(--moved)', delay: 0.9 },
      { cx: 310, cy: 248, r: 5, fill: 'var(--ink)', delay: 1.0 },
      { cx: 338, cy: 237, r: 4, fill: 'var(--color-file-docs)', delay: 1.1 },
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
  onEnter: (path?: string) => void;
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
      className="landing-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--paper)',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* ── Top navigation bar ── */}
      <motion.nav
        className="landing-nav"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : -16 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 40px',
          backgroundColor: 'var(--paper)',
          borderBottom: '1px solid var(--card-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Box size={22} color="var(--highlight)" />
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: 'var(--paper)' }}>
            Vaultline
          </span>
        </div>
      </motion.nav>

      {/* ── Hero section ── */}
      <AnimatePresence>
        {ready && (
          <motion.section
            className="landing-hero"
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
              backgroundColor: 'var(--vault)',
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
                  border: '1px solid color-mix(in srgb,var(--highlight) 40%,transparent)',
                  backgroundColor: 'color-mix(in srgb,var(--highlight) 8%,transparent)',
                  color: 'var(--highlight)',
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--highlight)' }} />
                  Make room for what matters
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontWeight: 600,
                  lineHeight: 1.15,
                  color: 'var(--paper)',
                  margin: '0 0 20px 0',
                }}
              >
                Decide what<br />
                <span style={{
                  background: 'linear-gradient(135deg, var(--highlight) 0%, var(--highlight) 60%, var(--highlight) 100%)',
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
                  color: 'var(--text-muted-on-dark)',
                  margin: '0 0 40px 0',
                  maxWidth: 440,
                }}
              >
                Vaultline reads file names, sizes and dates on this device. Dynamic programming, O(n × W), finds the best fit on the selected size scale.
              </motion.p>

              <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  className="landing-primary btn-primary"
                  onClick={() => onEnter('/play')}
                  id="landing-cta-primary"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '14px 28px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--ink)',
                    color: 'var(--paper)',
                    fontSize: 15, fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px color-mix(in srgb,var(--highlight) 35%,transparent)',
                    transition: 'transform 150ms, box-shadow 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 28px color-mix(in srgb,var(--highlight) 45%,transparent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px color-mix(in srgb,var(--highlight) 35%,transparent)';
                  }}
                >
                  Try sample data <ArrowRight size={16} />
                </button>

                <button
                  className="landing-secondary"
                  id="landing-cta-secondary"
                  onClick={() => onEnter()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '14px 24px',
                    borderRadius: 10,
                    border: '1px solid var(--ink)',
                    backgroundColor: 'var(--paper)',
                    color: 'var(--ink)',
                    fontSize: 15, fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'border-color 150ms, background-color 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--card)';
                    e.currentTarget.style.borderColor = 'var(--ink)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--paper)';
                    e.currentTarget.style.borderColor = 'var(--ink)';
                  }}
                >
                  Open app
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
                  color: 'var(--text-muted-on-dark)',
                  fontSize: 13,
                }}
              >
                <span>Names, sizes and dates stay on this device.</span>
                <span>Dynamic programming · O(n × W)</span>
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
                background: 'radial-gradient(circle at 50% 50%, color-mix(in srgb,var(--kept) 30%,transparent) 0%, transparent 70%)',
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
          className="landing-features"
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{
            backgroundColor: 'var(--paper)',
            borderTop: '1px solid var(--card-border)',
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
                color: 'var(--paper)',
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
                color: 'var(--text-muted)',
                fontSize: 16,
                marginBottom: 48,
              }}
            >
              A clear view of what fits your target.
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
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 14,
                    padding: '28px 24px',
                    cursor: 'default',
                    transition: 'border-color 200ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'color-mix(in srgb,var(--highlight) 40%,transparent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'color-mix(in srgb,var(--highlight) 15%,transparent)')}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: 'color-mix(in srgb,var(--highlight) 12%,transparent)',
                      border: '1px solid color-mix(in srgb,var(--highlight) 25%,transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <feat.icon size={20} color="var(--highlight)" />
                  </div>
                  <h3
                    style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: 18,
                      fontWeight: 600,
                      color: 'var(--paper)',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {feat.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                    color: 'var(--text-muted)',
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
          className="landing-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{
            padding: '48px 40px',
            textAlign: 'center',
            backgroundColor: 'var(--paper)',
            borderTop: '1px solid var(--card-border)',
          }}
        >
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 600,
              color: 'var(--paper)',
              marginBottom: 16,
            }}
          >
            Ready to organise your files?
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 15 }}>
            Drop files anywhere — it runs entirely in your browser.
          </p>
          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', opacity: .8 }}>
            Your recommendation is calculated in this browser from file metadata.
          </p>
        </motion.footer>
      )}
    </div>
  );
};




