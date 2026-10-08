import React, { useState, useMemo } from 'react';
import { runKnapsackBenchmark, BenchmarkPoint } from '../../engine/variations/benchmark';

export const LabBenchmark: React.FC = () => {
  const [benchmarkPoints, setBenchmarkPoints] = useState<BenchmarkPoint[]>(() => runKnapsackBenchmark(150, 25));
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const data = runKnapsackBenchmark(200, 25);
      setBenchmarkPoints(data);
      setIsRunning(false);
    }, 50);
  };

  // SVG Chart scaling calculations
  const { dpPath, linearFitPath, maxN, maxTime } = useMemo(() => {
    if (benchmarkPoints.length === 0) {
      return { dpPath: '', linearFitPath: '', maxN: 200, maxTime: 10 };
    }

    const max_n = Math.max(...benchmarkPoints.map((p) => p.n));
    const max_t = Math.max(...benchmarkPoints.map((p) => p.dpTimeMs), 1.0);

    const width = 500;
    const height = 180;
    const padX = 45;
    const padY = 25;

    const scaleX = (n: number) => padX + (n / max_n) * (width - padX - 20);
    const scaleY = (t: number) => height - padY - (t / max_t) * (height - padY - 20);

    let d = '';
    benchmarkPoints.forEach((p, idx) => {
      const x = scaleX(p.n);
      const y = scaleY(p.dpTimeMs);
      d += idx === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
    });

    // Linear fit line O(nW) overlay
    const first = benchmarkPoints[0];
    const last = benchmarkPoints[benchmarkPoints.length - 1];
    const fitD = `M ${scaleX(first.n)},${scaleY(first.dpTimeMs)} L ${scaleX(last.n)},${scaleY(last.dpTimeMs)}`;

    return { dpPath: d, linearFitPath: fitD, maxN: max_n, maxTime: max_t };
  }, [benchmarkPoints]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-ink)' }}>
          Measure how work changes as files are added
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', marginTop: '4px' }}>
          This chart measures solve time in this browser, adding 25 files per step with capacity fixed at 1,000 columns. Times vary by device.
        </p>
        <div style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
          <strong>Search estimate:</strong> The red curve shows the number of file combinations an exhaustive search would examine. It is a theoretical estimate, not a measured duration, and is capped at 2⁶⁰.
        </div>
      </div>

      {/* Run benchmark button */}
      <div className="card" style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>Execute In-Browser Benchmark</span>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginTop: '2px' }}>
            Measures exact millisecond execution in your current browser JavaScript engine
          </div>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="btn btn-primary btn-sm"
        >
          {isRunning ? 'Benchmarking...' : 'Re-run Benchmark'}
        </button>
      </div>

      {/* Handcrafted SVG Chart */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>Measured DP Runtime Scaling</span>
          <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>● Measured DP (ms)</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>— Fitted O(nW) line</span>
            <span style={{ color: 'var(--color-danger)', fontWeight: 500 }}>- - Estimated combinations (capped at 2⁶⁰)</span>
          </div>
        </div>

        <svg viewBox="0 0 500 180" style={{ width: '100%', height: '180px', display: 'block' }}>
          {/* Axis lines */}
          <line x1="45" y1="155" x2="480" y2="155" stroke="var(--color-border)" strokeWidth="1" />
          <line x1="45" y1="20" x2="45" y2="155" stroke="var(--color-border)" strokeWidth="1" />

          {/* Grid lines */}
          <line x1="45" y1="90" x2="480" y2="90" stroke="var(--color-border)" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="45" y1="30" x2="480" y2="30" stroke="var(--color-border)" strokeDasharray="3 3" strokeWidth="1" />

          {/* Labels */}
          <text x="10" y="34" fill="var(--color-dim)" fontSize="10" className="font-mono">{maxTime.toFixed(1)}ms</text>
          <text x="10" y="94" fill="var(--color-dim)" fontSize="10" className="font-mono">{(maxTime / 2).toFixed(1)}ms</text>
          <text x="25" y="159" fill="var(--color-dim)" fontSize="10" className="font-mono">0ms</text>

          <text x="45" y="172" fill="var(--color-dim)" fontSize="10" className="font-mono">n=25</text>
          <text x="450" y="172" fill="var(--color-dim)" fontSize="10" className="font-mono">n={maxN}</text>

          {/* O(nW) straight line overlay */}
          <path d={linearFitPath} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="4 2" />

          {/* Illustrative curve for the capped exhaustive-search estimate; not a measured time series. */}
          <path
            d="M 45,153 Q 120,150 160,25"
            fill="none"
            stroke="var(--color-danger)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          {/* Measured DP Line */}
          <path d={dpPath} fill="none" stroke="var(--color-success)" strokeWidth="2.5" />

          {/* Points */}
          {benchmarkPoints.map((p, idx) => {
            const x = 45 + (p.n / maxN) * (500 - 45 - 20);
            const y = 155 - (p.dpTimeMs / maxTime) * (155 - 25);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3.5"
                fill="var(--color-success)"
                stroke="#fff"
                strokeWidth="1"
              />
            );
          })}
        </svg>

        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', textAlign: 'right', marginTop: '8px' }}>
          The green line shows measured solve times. The red curve is an illustrative estimate of exhaustive-search combinations, not elapsed time.
        </div>
      </div>
    </div>
  );
};
