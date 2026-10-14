import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Pause, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { formatSize } from '../../lib/format';
import { HERO_DEMO_CAPACITY_KB, HERO_DEMO_SETS, nextHeroDemoSetIndex, solveHeroDemo } from '../../lib/heroDemo';

type DemoPhase = 'arrival' | 'table' | 'result';

interface HeroDemoProps {
  onWatchAlgorithm: () => void;
}

export const HeroDemo: React.FC<HeroDemoProps> = ({ onWatchAlgorithm }) => {
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>('arrival');
  const [arrivalCount, setArrivalCount] = useState(0);
  const [cellCount, setCellCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => document.visibilityState !== 'hidden');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobile, setMobile] = useState(false);
  const plan = useMemo(() => solveHeroDemo(HERO_DEMO_SETS[setIndex]), [setIndex]);
  const demoSet = HERO_DEMO_SETS[setIndex];
  const keptIds = useMemo(() => new Set(plan.result.keptItems.map(item => item.id)), [plan.result.keptItems]);
  const totalImportance = plan.result.maxPossibleValue;
  const retainedPercent = totalImportance ? Math.round(plan.result.totalValue / totalImportance * 100) : 0;
  const finalFrame = reducedMotion || phase === 'result';
  const allArrived = finalFrame || phase !== 'arrival' || arrivalCount >= demoSet.files.length;
  const arrivedBytes = demoSet.files.slice(0, arrivalCount).reduce((total, file) => total + file.sizeKb * 1024, 0);
  const usedBytes = finalFrame ? plan.result.totalSizeKept : Math.min(plan.capacityBytes, arrivedBytes);
  const fillRatio = Math.min(1, usedBytes / plan.capacityBytes);
  const visibleStartRow = Math.max(1, plan.items.length - 2);
  const displayedRows = plan.items.slice(visibleStartRow - 1).map((item, index) => ({ item, values: plan.teaching.table[visibleStartRow + index] }));
  const visibleCellCount = finalFrame ? 18 : Math.min(18, cellCount);
  const activeCellIndex = visibleCellCount - 1;
  const activeRow = Math.floor(activeCellIndex / 6);
  const activeColumn = activeCellIndex % 6;
  const actualRow = visibleStartRow + activeRow;
  const activeItem = plan.items[actualRow - 1];
  const activeCellStep = plan.teaching.steps.find(step => step.type === 'cell' && step.i === actualRow && step.w === activeColumn);
  const takesCurrentCell = activeCellStep?.type === 'cell' && activeCellStep.decision === 'take';
  const arrowSourceRow = activeRow - 1;
  const arrowSourceColumn = takesCurrentCell ? activeColumn - activeItem.normalizedSize : activeColumn;
  const showArrow = phase === 'table' && visibleCellCount > 0 && arrowSourceRow >= 0;

  useEffect(() => {
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia?.('(max-width: 700px)');
    const updateMotion = () => setReducedMotion(Boolean(motionQuery?.matches));
    const updateMobile = () => setMobile(Boolean(mobileQuery?.matches));
    updateMotion(); updateMobile();
    motionQuery?.addEventListener?.('change', updateMotion);
    mobileQuery?.addEventListener?.('change', updateMobile);
    const visibilityChanged = () => setTabVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      motionQuery?.removeEventListener?.('change', updateMotion);
      mobileQuery?.removeEventListener?.('change', updateMobile);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, []);

  useEffect(() => {
    const element = document.querySelector('.hero-demo');
    if (!element || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!reducedMotion) return;
    setPhase('result');
    setArrivalCount(demoSet.files.length);
    setCellCount(18);
    setPaused(false);
  }, [reducedMotion, demoSet.files.length]);

  useEffect(() => {
    if (paused || !isInView || !tabVisible || reducedMotion) return;
    const timer = window.setTimeout(() => {
      if (phase === 'arrival') {
        if (arrivalCount < demoSet.files.length) setArrivalCount(count => count + 1);
        else { setPhase('table'); setCellCount(0); }
      } else if (phase === 'table') {
        if (cellCount < 18) setCellCount(count => count + 1);
        else setPhase('result');
      } else {
        setSetIndex(index => nextHeroDemoSetIndex(index));
        setPhase('arrival'); setArrivalCount(0); setCellCount(0);
      }
    }, phase === 'arrival' ? (mobile ? 260 : 380) : phase === 'table' ? (mobile ? 75 : 110) : (mobile ? 1800 : 2800));
    return () => window.clearTimeout(timer);
  }, [arrivalCount, cellCount, demoSet.files.length, isInView, mobile, paused, phase, reducedMotion, tabVisible]);

  const replay = () => {
    setPhase('arrival'); setArrivalCount(0); setCellCount(0); setPaused(false);
  };

  return <div className={`hero-demo ${finalFrame ? 'hero-demo-final' : ''}`} aria-label="Live exact knapsack demonstration" aria-live="off">
    <p className="sr-only">Vaultline picks the best-fitting files within your capacity.</p>
    <div className="hero-demo-stage">
      <div className="hero-demo-candidates" aria-label="Demo files">
        {demoSet.files.map((file, index) => {
          const arrived = finalFrame || index < arrivalCount || phase !== 'arrival';
          const state = finalFrame ? (keptIds.has(file.id) ? 'kept' : 'moved') : arrived ? 'arrived' : 'waiting';
          return <div key={`${demoSet.id}-${file.id}`} className={`hero-demo-chip hero-demo-chip-${state}`} style={{ '--chip-order': index } as React.CSSProperties}>
            <FileText size={15} aria-hidden="true" />
            <span className="hero-demo-chip-name">{file.name}</span>
            <span className="hero-demo-chip-size">{file.sizeKb} KB · {file.importance}</span>
          </div>;
        })}
      </div>
      <div className="hero-demo-vault" aria-label={`Vault with ${HERO_DEMO_CAPACITY_KB} kilobyte capacity`}>
        <div className="hero-demo-vault-heading"><ShieldCheck size={17} aria-hidden="true" /><span>VAULT CAPACITY</span><strong>{HERO_DEMO_CAPACITY_KB} KB</strong></div>
        <div className="hero-demo-capacity-track" role="progressbar" aria-label={finalFrame ? 'Capacity used by kept files' : 'Incoming file sizes against capacity'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fillRatio * 100)}>
          <span style={{ '--capacity-ratio': fillRatio } as React.CSSProperties} />
        </div>
        <div className="hero-demo-capacity-copy">
          {finalFrame
            ? <><span>{formatSize(usedBytes)} used</span><span>{formatSize(Math.max(0, plan.capacityBytes - usedBytes))} free</span></>
            : <><span>{formatSize(arrivedBytes)} scanned</span><span>{formatSize(plan.capacityBytes)} capacity</span></>}
        </div>
        <div className="hero-demo-vault-files">
          {finalFrame
            ? plan.result.keptItems.map(item => <span key={item.id} className="hero-demo-vault-file is-kept">{item.name}</span>)
            : <span className="hero-demo-vault-hint">Files arrive here</span>}
        </div>
        {finalFrame && <div className="hero-demo-move-label">MOVE OUT · {plan.result.droppedItems.length}</div>}
      </div>
    </div>

    <div className="hero-demo-dp" aria-label="Dynamic programming table">
      <div className="hero-demo-dp-heading"><span>DP TABLE · FILES 4–6</span><span>UNIT = 20 KB</span></div>
      <div className="hero-demo-dp-wrap">
        <table aria-label="Exact dynamic programming scores for the final three files">
          <thead><tr><th scope="col">File</th>{Array.from({ length: 6 }, (_, column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
          <tbody>{displayedRows.map(({ item, values }, rowIndex) => <tr key={item.id}>
            <th scope="row" title={item.name}>{item.name}</th>
            {values.map((value, column) => {
              const index = rowIndex * 6 + column;
              const computed = finalFrame || (phase === 'table' && index < visibleCellCount);
              const isCurrent = phase === 'table' && index === activeCellIndex;
              return <td key={column} className={`${computed ? 'is-computed' : ''} ${isCurrent ? 'is-current' : ''}`} aria-label={`File ${item.name}, capacity ${column} units, ${computed ? `importance ${value}` : 'not computed yet'}`}>
                {computed ? value : ''}
              </td>;
            })}
          </tr>)}</tbody>
        </table>
        {showArrow && <svg className="hero-demo-dp-arrow" viewBox="0 0 318 126" aria-hidden="true">
          <defs><marker id="hero-demo-arrowhead" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 8 4 0 8Z" fill="var(--highlight)" /></marker></defs>
          <line x1={113 + arrowSourceColumn * 38} y1={46 + Math.max(0, arrowSourceRow) * 32} x2={113 + activeColumn * 38} y2={46 + activeRow * 32} stroke="var(--highlight)" strokeWidth="2" markerEnd="url(#hero-demo-arrowhead)" />
        </svg>}
      </div>
    </div>

    <div className="hero-demo-footer">
      <p className="hero-demo-result" aria-label={`Importance kept ${retainedPercent} percent, ${formatSize(plan.result.totalSizeKept)} of ${HERO_DEMO_CAPACITY_KB} kilobytes used`}>
        <strong>Importance kept {retainedPercent}%</strong><span>{formatSize(plan.result.totalSizeKept)} / {HERO_DEMO_CAPACITY_KB} KB used</span>
      </p>
      <div className="hero-demo-actions">
        <button type="button" aria-label={paused ? 'Resume demo' : 'Pause demo'} onClick={() => { if (!reducedMotion) setPaused(value => !value); }} disabled={reducedMotion}>
          {paused ? <Play size={14} /> : <Pause size={14} />}{paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" aria-label="Replay demo" onClick={replay}><RotateCcw size={14} />Replay</button>
      </div>
    </div>
    <button type="button" className="hero-demo-algorithm-link" onClick={onWatchAlgorithm}>Watch the full algorithm <span aria-hidden="true">↗</span></button>
  </div>;
};
