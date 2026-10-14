import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { HeroDemo } from '../components/HeroDemo';
import { useOpenAlgorithmDrawer } from '../components/AlgorithmDrawerContext';
const LandingSections = lazy(() => import('../components/LandingSections').then(module => ({ default: module.LandingSections })));

interface LandingPageProps { onEnter: (path?: string) => void }

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [glow, setGlow] = useState({ x: 0, y: 0 });
  const [belowFoldReady, setBelowFoldReady] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const belowFoldAnchor = useRef<HTMLDivElement>(null);
  const openAlgorithm = useOpenAlgorithmDrawer();
  useEffect(() => {
    const anchor = belowFoldAnchor.current;
    if (!anchor || !('IntersectionObserver' in window)) { setBelowFoldReady(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setBelowFoldReady(true); observer.disconnect(); }
    }, { rootMargin: '600px 0px' });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    document.documentElement.classList.add('landing-smooth-scroll');
    return () => document.documentElement.classList.remove('landing-smooth-scroll');
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const measure = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const range = root.scrollHeight - root.clientHeight;
        setScrollProgress(range > 0 ? Math.min(1, window.scrollY / range) : 0);
      });
    };
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
    resizeObserver?.observe(root);
    window.addEventListener('scroll', measure, { passive: true }); window.addEventListener('resize', measure);
    measure();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', measure); window.removeEventListener('resize', measure);
    };
  }, [belowFoldReady]);
  const trackPointer = (event: React.PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setGlow({
      x: Math.max(-20, Math.min(20, ((event.clientX - bounds.left) / bounds.width - .5) * 40)),
      y: Math.max(-20, Math.min(20, ((event.clientY - bounds.top) / bounds.height - .5) * 40)),
    });
  };

  return (
    <div className="landing-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', color: 'var(--ink)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflowX: 'clip' }}>
      <div className="landing-progress" role="progressbar" aria-label="Page reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(scrollProgress * 100)}><span style={{ transform: `scaleX(${scrollProgress})` }} /></div>

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
            <a className="landing-scroll-link" href="#landing-how" onClick={(event) => { event.preventDefault(); belowFoldAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Explore how it works <span aria-hidden="true">↓</span></a>
          </div>
          <HeroDemo onWatchAlgorithm={openAlgorithm} />
        </div>
      </section>
      <div ref={belowFoldAnchor} className="landing-lazy-anchor" aria-hidden="true" />
      {belowFoldReady && <Suspense fallback={<div className="landing-sections-loading" role="status">Loading Vaultline details…</div>}><LandingSections onEnter={onEnter} /></Suspense>}
    </div>
  );
};

