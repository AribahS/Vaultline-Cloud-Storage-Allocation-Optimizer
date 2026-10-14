import React, { useEffect, useRef, useState } from 'react';
import { Cpu, FileText, HardDrive, ListChecks, Shield, SlidersHorizontal } from 'lucide-react';
import { BYTE_UNITS } from '../../engine/normalizer';
import { solveFullKnapsack } from '../../engine/knapsack';
import { solveGreedy } from '../../engine/greedy';
import { formatSize } from '../../lib/format';
import type { KnapsackItem } from '../../engine/types';

interface LandingSectionsProps { onEnter: (path?: string) => void }

const STEPS = [
  { n: '1', label: 'Add your files', sub: 'Use the Files page to add files or pick a folder.', to: '/files', icon: FileText },
  { n: '2', label: 'Set your capacity', sub: 'Choose how much space you want to fill on the Play page.', to: '/play', icon: SlidersHorizontal },
  { n: '3', label: 'See your results', sub: 'Check Results for what to keep and a printable report.', to: '/results', icon: ListChecks },
];

const FEATURES = [
  { icon: Shield, kind: 'shield', title: 'Private by design', body: 'Nothing is uploaded. Only names, sizes and dates are read in your browser.' },
  { icon: Cpu, kind: 'chip', title: 'Exact 0/1 knapsack', body: 'Dynamic programming, O(n × W), finds the optimal fit — not a greedy shortcut.' },
  { icon: HardDrive, kind: 'drive', title: 'Works with files and folders', body: 'Add files or choose a folder. Vaultline uses their metadata to find the best selection.' },
];

const KB = BYTE_UNITS.KB;
const COMPARISON_ITEMS: KnapsackItem[] = [
  { id: 'greedy-a', name: 'File A', originalSize: 6 * KB, normalizedSize: 6, value: 30 },
  { id: 'exact-b', name: 'File B', originalSize: 5 * KB, normalizedSize: 5, value: 24 },
  { id: 'exact-c', name: 'File C', originalSize: 5 * KB, normalizedSize: 5, value: 24 },
];
const COMPARISON_OPTIONS = { quotaUnits: 10, quotaBytes: 10 * KB, unitBytes: KB };
const GREEDY_RESULT = solveGreedy(COMPARISON_ITEMS, COMPARISON_OPTIONS);
const EXACT_RESULT = solveFullKnapsack(COMPARISON_ITEMS, COMPARISON_OPTIONS);

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const update = () => setReduced(query.matches);
    update(); query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

function useReveal<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) { setVisible(true); return; }
    const revealIfPassed = () => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight + 200 || bounds.bottom < 0) setVisible(true);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.15 });
    observer.observe(element);
    window.addEventListener('scroll', revealIfPassed, { passive: true });
    window.addEventListener('resize', revealIfPassed);
    revealIfPassed();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', revealIfPassed);
      window.removeEventListener('resize', revealIfPassed);
    };
  }, []);
  return [ref, visible];
}

const CountUp: React.FC<{ value: number; suffix?: string; active: boolean; reduced: boolean }> = ({ value, suffix = '', active, reduced }) => {
  const [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    if (!active) return;
    if (reduced || value === 0) { setShown(value); return; }
    let frame = 0;
    let start: number | null = null;
    const duration = 950;
    const tick = (time: number) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / duration);
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced, value]);
  return <>{shown}{suffix}</>;
};

const ScoreVault: React.FC<{ label: string; files: KnapsackItem[]; score: number; exact: boolean; active: boolean; reduced: boolean }> = ({ label, files, score, exact, active, reduced }) => (
  <article className={`landing-compare-vault ${exact ? 'is-exact' : 'is-greedy'}`}>
    <div className="landing-compare-vault-heading"><span>{label}</span><strong>{exact ? 'OPTIMAL' : 'GREEDY'}</strong></div>
    <div className="landing-compare-bin" aria-label={`${label} keeps ${files.map(file => file.name).join(', ')}`}>
      {files.map(file => <span key={file.id}>{file.name} · {formatSize(file.originalSize)}</span>)}
    </div>
    <div className="landing-compare-score"><span>Importance</span><strong><CountUp value={score} active={active} reduced={reduced} /></strong></div>
    <div className="landing-compare-bar" aria-hidden="true"><span style={{ '--score-scale': score / EXACT_RESULT.totalValue } as React.CSSProperties} /></div>
  </article>
);

export const LandingSections: React.FC<LandingSectionsProps> = ({ onEnter }) => {
  const reduced = useReducedMotion();
  const [howRef, howVisible] = useReveal<HTMLElement>();
  const [statsRef, statsVisible] = useReveal<HTMLDivElement>();
  const [featuresRef, featuresVisible] = useReveal<HTMLElement>();
  const [compareRef, compareVisible] = useReveal<HTMLElement>();
  const [closingRef, closingVisible] = useReveal<HTMLElement>();

  return <>
    <div className="landing-stats" ref={statsRef} role="region" aria-label="Vaultline at a glance">
      <div className={`landing-stats-grid ${statsVisible ? 'is-visible' : ''}`}>
        <article><strong><CountUp value={100} suffix="%" active={statsVisible} reduced={reduced} /></strong><span>on-device</span></article>
        <article><strong>O(n × W)</strong><span>dynamic programming</span></article>
        <article><strong>Exact</strong><span>not greedy</span></article>
        <article><strong><CountUp value={0} active={statsVisible} reduced={reduced} /></strong><span>bytes uploaded</span></article>
      </div>
    </div>

    <section className="landing-how" id="landing-how" ref={howRef}>
      <div className="landing-section-inner">
        <p className="landing-section-eyebrow">A CLEAR PATH THROUGH THE CLUTTER</p>
        <h2>How it works</h2>
        <div className={`landing-step-grid ${howVisible ? 'is-visible' : ''}`}>
          {STEPS.map((step, index) => <article className="landing-step-card" key={step.n} style={{ '--card-index': index } as React.CSSProperties}>
            <div className="landing-step-icon"><step.icon size={30} strokeWidth={1.7} aria-hidden="true" /></div>
            <span className="landing-step-number">STEP {step.n}</span>
            <button type="button" onClick={() => onEnter(step.to)}>
              <span className="landing-step-title">{step.label}</span><span>{step.sub}</span>
            </button>
          </article>)}
        </div>
      </div>
    </section>

    <section className="landing-features landing-why" ref={featuresRef}>
      <div className="landing-section-inner">
        <p className="landing-section-eyebrow">WHY VAULTLINE?</p>
        <h2>Private, exact, and in your hands.</h2>
        <p className="landing-section-intro">A clear view of what fits your target, entirely in your browser.</p>
        <div className={`landing-feature-grid ${featuresVisible ? 'is-visible' : ''}`}>
          {FEATURES.map((feature, index) => <article className="landing-feature-card" key={feature.title} style={{ '--card-index': index } as React.CSSProperties}>
            <div className={`landing-feature-icon landing-feature-icon-${feature.kind}`}><feature.icon size={29} strokeWidth={1.7} aria-hidden="true" /></div>
            <h3>{feature.title}</h3><p>{feature.body}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="landing-comparison" ref={compareRef}>
      <div className="landing-section-inner">
        <p className="landing-section-eyebrow">A GREEDY TRAP · 10 KB CAPACITY</p>
        <h2>Exact beats the shortcut.</h2>
        <p className="landing-section-intro">The highest-value single file looks best until two files fit together.</p>
        <div className={`landing-comparison-grid ${compareVisible ? 'is-visible' : ''}`}>
          <ScoreVault label="Greedy choice" files={GREEDY_RESULT.keptItems} score={GREEDY_RESULT.totalValue} exact={false} active={compareVisible} reduced={reduced} />
          <ScoreVault label="Exact 0/1 choice" files={EXACT_RESULT.keptItems} score={EXACT_RESULT.totalValue} exact active={compareVisible} reduced={reduced} />
        </div>
        <p className="landing-comparison-proof">Greedy keeps File A for {GREEDY_RESULT.totalValue}. Exact keeps Files B + C for {EXACT_RESULT.totalValue} importance.</p>
      </div>
    </section>

    <section className="landing-closing" ref={closingRef}>
      <div className={`landing-closing-inner ${closingVisible ? 'is-visible' : ''}`}>
        <p className="landing-section-eyebrow">MAKE ROOM FOR WHAT MATTERS</p>
        <h2>Ready to organise your files?</h2>
        <p>Add files or choose a folder — it runs entirely in your browser.</p>
        <div className="landing-closing-actions">
          <a className="landing-cta-primary" href="#/play" onClick={(event) => { event.preventDefault(); onEnter('/play'); }}>Try sample data</a>
          <a className="landing-cta-secondary" href="#/files" onClick={(event) => { event.preventDefault(); onEnter(); }}>Open app</a>
        </div>
      </div>
      <footer className="landing-footer"><span>Vaultline</span><span>Private file decisions, made on this device.</span></footer>
    </section>
  </>;
};
