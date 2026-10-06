import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatBytes } from '../../engine/normalizer';
import { extractChangePoints, computeWhatIfInsight, findSweetSpot } from '../../engine/changePoints';
import { SlidersHorizontal, ChevronDown, ChevronUp, Info } from 'lucide-react';

export const WhatIfCard: React.FC = () => {
  const files = useAppStore((s) => s.files);
  const quotaBytes = useAppStore((s) => s.quotaBytes);
  const setQuotaBytes = useAppStore((s) => s.setQuotaBytes);
  const knapsackResult = useAppStore((s) => s.knapsackResult);
  const complexityMode = useAppStore((s) => s.complexityMode);

  const [showChart, setShowChart] = useState(false);
  const [sliderValue, setSliderValue] = useState(quotaBytes);

  // Total size of all files
  const totalFilesBytes = useMemo(
    () => files.reduce((acc, f) => acc + f.size, 0),
    [files]
  );
  const maxSlider = Math.max(totalFilesBytes * 1.25, quotaBytes * 1.5, 1024 * 1024 * 1024);

  // Extract change points from quota curve
  const changePoints = useMemo(() => {
    if (!knapsackResult?.quotaCurve) return [];
    return extractChangePoints(knapsackResult.quotaCurve);
  }, [knapsackResult]);

  // Live what-if sentence
  const liveSentence = useMemo(() => {
    if (!knapsackResult) return 'Add files and set a space limit to see what-if scenarios.';
    const insight = computeWhatIfInsight(quotaBytes, sliderValue, knapsackResult);
    return insight.description;
  }, [quotaBytes, sliderValue, knapsackResult]);

  // Change-point dots on slider
  const sliderDots = useMemo(() => {
    if (maxSlider <= 0) return [];
    return changePoints
      .filter((cp) => cp.quotaBytes <= maxSlider)
      .map((cp) => ({
        pct: Math.min(100, Math.max(0, (cp.quotaBytes / maxSlider) * 100)),
        bytes: cp.quotaBytes,
      }));
  }, [changePoints, maxSlider]);

  const handleSliderCommit = () => {
    setQuotaBytes(sliderValue);
  };

  return (
    <div
      className="bento-card p-5 flex flex-col justify-between"
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        background: 'var(--surface-card)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg"
              style={{ background: 'rgba(108, 71, 255, 0.1)', color: 'var(--brand-primary)' }}
            >
              <SlidersHorizontal size={16} />
            </span>
            <h2 className="text-base font-bold font-heading" style={{ color: 'var(--ink)' }}>
              What if I had more (or less) space?
            </h2>
          </div>
          <span
            className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(108, 71, 255, 0.08)', color: 'var(--brand-primary)' }}
          >
            {formatBytes(sliderValue)}
          </span>
        </div>

        {/* Live dynamic sentence */}
        <p className="text-xs leading-relaxed mb-4 min-h-[36px]" style={{ color: 'var(--ink-muted)' }}>
          {liveSentence}
        </p>

        {/* Interactive slider with change-point dots */}
        <div className="relative mb-4 pt-2">
          {/* Change point dots track */}
          <div className="relative w-full h-2 mb-1">
            {sliderDots.map((dot, idx) => (
              <div
                key={idx}
                title={formatBytes(dot.bytes)}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                style={{
                  left: `${dot.pct}%`,
                  background: 'var(--brand-primary)',
                  border: '1.5px solid #FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                }}
              />
            ))}
          </div>

          <input
            type="range"
            min={0}
            max={maxSlider}
            step={Math.max(1024 * 1024, Math.floor(maxSlider / 100))}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            className="w-full cursor-pointer accent-[var(--brand-primary)]"
            aria-label="Adjust storage space"
          />

          <div className="flex justify-between text-[11px] font-mono text-muted mt-1">
            <span>0</span>
            <span>{formatBytes(sliderValue)}</span>
            <span>{formatBytes(maxSlider)}</span>
          </div>
        </div>
      </div>

      {/* Detailed mode: Expandable curve chart */}
      {complexityMode === 'detailed' && (
        <div className="border-t pt-2" style={{ borderColor: 'rgba(20, 17, 43, 0.08)' }}>
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="flex items-center justify-between w-full text-xs font-semibold py-1"
            style={{ color: 'var(--brand-primary)' }}
          >
            <span>{showChart ? 'Hide the chart' : 'Show the chart'}</span>
            {showChart ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showChart && knapsackResult?.quotaCurve && (
            <div className="mt-3 p-3 rounded-lg bg-white/70 border border-slate-200/60">
              <div className="text-[11px] font-medium text-muted mb-2 flex items-center gap-1">
                <Info size={12} />
                <span>Value vs Space (last row of dynamic programming table)</span>
              </div>
              <svg viewBox="0 0 300 100" className="w-full h-24 overflow-visible">
                <line x1="20" y1="85" x2="290" y2="85" stroke="#CBD5E1" strokeWidth="1" />
                <line x1="20" y1="10" x2="20" y2="85" stroke="#CBD5E1" strokeWidth="1" />

                {(() => {
                  const curve = knapsackResult.quotaCurve;
                  if (!curve || curve.length === 0) return null;
                  const maxVal = Math.max(...curve.map((p) => p.totalValue), 1);
                  const maxB = Math.max(...curve.map((p) => p.quotaBytes), 1);

                  const pts = curve.map((p) => {
                    const x = 20 + (p.quotaBytes / maxB) * 270;
                    const y = 85 - (p.totalValue / maxVal) * 70;
                    return `${x},${y}`;
                  }).join(' ');

                  const curX = 20 + Math.min(1, sliderValue / maxB) * 270;

                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="var(--brand-primary)"
                        strokeWidth="2"
                        points={pts}
                      />
                      <line
                        x1={curX}
                        y1="10"
                        x2={curX}
                        y2="85"
                        stroke="#FF6B6B"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                      />
                      <circle cx={curX} cy="85" r="3" fill="#FF6B6B" />
                    </>
                  );
                })()}
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

