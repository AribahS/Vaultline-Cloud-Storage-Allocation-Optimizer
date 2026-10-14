import React, { useState } from 'react';
import { Cpu, FileText, HardDrive, Shield } from 'lucide-react';
import { HeroDemo } from '../components/HeroDemo';
import { useOpenAlgorithmDrawer } from '../components/AlgorithmDrawerContext';

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

interface LandingPageProps { onEnter: (path?: string) => void }

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [glow, setGlow] = useState({ x: 0, y: 0 });
  const openAlgorithm = useOpenAlgorithmDrawer();
  const trackPointer = (event: React.PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setGlow({
      x: Math.max(-20, Math.min(20, ((event.clientX - bounds.left) / bounds.width - .5) * 40)),
      y: Math.max(-20, Math.min(20, ((event.clientY - bounds.top) / bounds.height - .5) * 40)),
    });
  };

  return (
    <div className="landing-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', color: 'var(--ink)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflowX: 'clip' }}>

      <section className="landing-hero" style={{ position: 'relative', backgroundColor: 'var(--vault)', color: 'var(--paper)', overflow: 'hidden', '--glow-x': `${glow.x}px`, '--glow-y': `${glow.y}px` } as React.CSSProperties} onPointerMove={trackPointer} onPointerLeave={() => setGlow({ x: 0, y: 0 })}>
        <div className="landing-hero-glow" aria-hidden="true" />
        <div className="landing-hero-floats" aria-hidden="true">
          <FileText className="landing-float-file landing-float-file-one" />
          <FileText className="landing-float-file landing-float-file-two" />
          <span className="landing-float-dot landing-float-dot-one" /><span className="landing-float-dot landing-float-dot-two" /><span className="landing-float-dot landing-float-dot-three" />
        </div>
        {/* Hero body */}
        <div style={{ gap: 40, alignItems: 'center', maxWidth: 1280, margin: '0 auto', padding: '40px 40px 72px', width: '100%', boxSizing: 'border-box' }} className="landing-hero-inner">
          <div className="landing-hero-copy">
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
          <HeroDemo onWatchAlgorithm={openAlgorithm} />
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

