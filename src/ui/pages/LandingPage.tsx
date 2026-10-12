import React, { useEffect, useState } from 'react';
import { Shield, Cpu, HardDrive } from 'lucide-react';

const FEATURES = [
  { icon: Shield, title: 'Private by design', body: 'Nothing is uploaded. Only names, sizes and dates are read in your browser.' },
  { icon: Cpu, title: 'Exact 0/1 knapsack', body: 'Dynamic programming, O(n × W), finds the optimal fit — not a greedy shortcut.' },
  { icon: HardDrive, title: 'Works with files and folders', body: 'Add files or choose a folder. Vaultline uses their metadata to find the best selection.' },
];

const STEPS = [
  { n: '1', label: 'Add your files', sub: 'Use the Files page to add files or pick a folder.', to: '/files' },
  { n: '2', label: 'Set your capacity', sub: 'Choose how much space you want to fill on the Play page.', to: '/play' },
  { n: '3', label: 'See your results', sub: 'Check Results for what to keep and a printable report.', to: '/results' },
];

const HeroSVG: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 520 380" fill="none" aria-hidden="true" style={{ overflow: 'visible' }}>
    <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="var(--highlight)" stopOpacity="0.14" />
      <stop offset="100%" stopColor="var(--vault)" stopOpacity="0" />
    </radialGradient>
    <ellipse cx="260" cy="190" rx="240" ry="175" fill="url(#hero-glow)" />
    <rect x="100" y="90" width="320" height="220" rx="16" fill="var(--ink)" stroke="var(--highlight)" strokeWidth="1.5" />
    <path d="M100 106 C100 97 107 90 116 90 H200 L216 74 H380 C389 74 396 81 396 90 V90 H100 Z" fill="var(--ink)" stroke="var(--highlight)" strokeWidth="1" />
    <circle cx="260" cy="200" r="68" fill="var(--vault)" stroke="var(--highlight)" strokeWidth="2" />
    <circle cx="260" cy="200" r="50" fill="var(--vault)" stroke="var(--highlight)" strokeWidth="1.5" strokeDasharray="6 4" />
    <path d="M250 190 L260 180 L270 190 L270 205 L250 205 Z" fill="var(--highlight)" />
    <circle cx="260" cy="195" r="5" fill="var(--paper)" />
    <path d="M200 200 L140 162" stroke="var(--kept)" strokeWidth="2" strokeDasharray="5 3" opacity="0.9" />
    <path d="M320 200 L378 162" stroke="var(--moved)" strokeWidth="2" strokeDasharray="5 3" opacity="0.9" />
    <rect x="40" y="142" width="84" height="40" rx="8" fill="var(--kept)" />
    <text x="82" y="167" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">KEEP</text>
    <rect x="396" y="142" width="84" height="40" rx="8" fill="var(--moved)" />
    <text x="438" y="167" textAnchor="middle" fill="var(--paper)" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">MOVE</text>
    {[{ cx: 160, cy: 260, r: 5, fill: 'var(--highlight)' }, { cx: 185, cy: 275, r: 4, fill: 'var(--moved)' }, { cx: 330, cy: 268, r: 5, fill: 'var(--kept)' }, { cx: 358, cy: 257, r: 4, fill: 'var(--highlight)' }].map((d) => (
      <circle key={`${d.cx}-${d.cy}`} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} opacity={0.8} />
    ))}
  </svg>
);

interface LandingPageProps { onEnter: (path?: string) => void }

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 30); return () => clearTimeout(t); }, []);

  return (
    <div className="landing-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', color: 'var(--ink)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      <section className="landing-hero" style={{ position: 'relative', backgroundColor: 'var(--vault)', color: 'var(--paper)', overflow: 'hidden' }}>
        {/* Hero body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', maxWidth: 1200, margin: '0 auto', padding: '40px 40px 72px', width: '100%', boxSizing: 'border-box' }} className="landing-hero-inner">
          <div>
            <div style={{ marginBottom: 24 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, border: '1px solid color-mix(in srgb,var(--highlight) 50%,transparent)', backgroundColor: 'color-mix(in srgb,var(--highlight) 10%,transparent)', color: 'var(--highlight)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--highlight)' }} />
                Make room for what matters
              </span>
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600, lineHeight: 1.15, color: 'var(--paper)', margin: '0 0 20px' }}>
              Decide what<br /><span style={{ color: 'var(--highlight)' }}>to keep.</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-muted-on-dark)', margin: '0 0 40px', maxWidth: 440 }}>
              Vaultline reads file names, sizes and dates on this device. Dynamic programming, O(n × W), finds the best fit — keeping everything private.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {/* Gold fill + violet text (vault-stage context applies in CSS) */}
              <button className="vault-btn btn-primary" onClick={() => onEnter('/play')} id="landing-cta-primary" style={{ padding: '14px 28px', fontSize: 15, fontWeight: 700, backgroundColor: 'var(--highlight)', color: 'var(--ink)', borderColor: 'var(--highlight)' }}>
                Try sample data
              </button>
              {/* Paper outline + paper text */}
              <button className="vault-btn btn-secondary" id="landing-cta-secondary" onClick={() => onEnter()} style={{ padding: '14px 24px', fontSize: 15, fontWeight: 600, backgroundColor: 'transparent', color: 'var(--paper)', borderColor: 'var(--paper)' }}>
                Open app
              </button>
            </div>
            <div style={{ marginTop: 32, display: 'flex', gap: 20, flexWrap: 'wrap', color: 'var(--text-muted-on-dark)', fontSize: 13 }}>
              <span>Names, sizes and dates stay on this device.</span>
              <span>Exact 0/1 knapsack · O(n × W)</span>
            </div>
          </div>
          <div style={{ height: 380, position: 'relative' }} className="landing-hero-svg">
            <HeroSVG />
          </div>
        </div>
      </section>

      {/* ── 3-step strip ── */}
      <section style={{ backgroundColor: 'var(--paper)', padding: '56px 40px 48px', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(22px, 3vw, 32px)', color: 'var(--ink)', marginBottom: 40, textAlign: 'center' }}>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {STEPS.map((step) => (
              <div key={step.n} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-heading)', flexShrink: 0 }}>{step.n}</div>
                <button onClick={() => onEnter(step.to)} style={{ border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  <strong style={{ fontFamily: 'Fraunces, serif', fontSize: 18, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>{step.label}</strong>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.sub}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="landing-features" style={{ backgroundColor: 'var(--paper)', padding: '56px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(22px, 3vw, 32px)', color: 'var(--ink)', textAlign: 'center', marginBottom: 12 }}>Why Vaultline?</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 16, marginBottom: 48 }}>A clear view of what fits your target, entirely in your browser.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {FEATURES.map((feat) => (
              <div key={feat.title} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '28px 24px', boxShadow: 'var(--shadow-level-1)' }}>
                {/* Mint tile + violet icon */}
                <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'color-mix(in srgb, var(--kept) 30%, var(--paper))', border: '1px solid color-mix(in srgb, var(--kept) 50%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <feat.icon size={20} color="var(--ink)" />
                </div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px' }}>{feat.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-muted)', margin: 0 }}>{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing band (violet, gold CTA) ── */}
      <section style={{ backgroundColor: 'var(--vault)', padding: '56px 40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600, color: 'var(--paper)', marginBottom: 16 }}>Ready to organise your files?</h2>
        <p style={{ color: 'var(--text-muted-on-dark)', marginBottom: 20, fontSize: 15 }}>Add files or choose a folder — it runs entirely in your browser.</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted-on-dark)', opacity: 0.8 }}>Your selection is calculated in this browser from file metadata.</p>
      </section>
    </div>
  );
};

