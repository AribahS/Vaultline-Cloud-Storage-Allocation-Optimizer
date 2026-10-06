import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Card } from '../components/Card';
import { Layers, Clock, Zap, Cpu, Archive, Search } from 'lucide-react';
import { SplitTool } from './tools/SplitTool';
import { TransferTool } from './tools/TransferTool';
import { CompressionTool } from './tools/CompressionTool';
import { WhatIfTool } from './tools/WhatIfTool';
import { ApproximateTool } from './tools/ApproximateTool';
import { CleanupTool } from './tools/CleanupTool';

const TOOLS_GALLERY = [
  {
    id: 'split',
    name: 'Split across destinations',
    icon: Layers,
    desc: 'Calculate the optimal partition of files across multiple target drives.',
    // A8: how it differs from basic optimizer
    differs: 'Unlike the basic optimizer (single destination), this runs independent plans for each drive and balances total importance across all of them.',
  },
  {
    id: 'transfer',
    name: 'Transfer time planner',
    icon: Clock,
    desc: 'Estimate the real-world time to move payload over various interfaces.',
    differs: 'Complements the optimizer by telling you how long the physical move will take — USB 2, USB 3, Thunderbolt, Wi-Fi, and cloud.',
  },
  {
    id: 'compression',
    name: 'Compression-aware planning',
    icon: Archive,
    desc: 'Simulate archive ratios to maximise cold storage utility.',
    differs: 'Extends the optimizer by shrinking file sizes via simulated compression before solving, so you can fit more into the same quota.',
  },
  {
    id: 'what-if',
    name: 'What-if explorer',
    icon: Zap,
    desc: 'Evaluate hypothetical rule changes before committing.',
    differs: 'Lets you test a different quota or importance preset and see a side-by-side diff against your current plan without overwriting it.',
  },
  {
    id: 'approximate',
    name: 'Approximate mode',
    icon: Cpu,
    desc: 'Benchmark Fully Polynomial-Time Approximation Scheme scaling.',
    differs: 'Trades optimality for speed using FPTAS — useful when you have 10 000+ files and the exact DP table would be too large.',
  },
  {
    id: 'cleanup',
    name: 'Cleanup finder',
    icon: Search,
    desc: 'Quickly detect temporary or cache files clogging the active scan.',
    differs: 'Identifies files you almost certainly do not need (caches, logs, installer debris) so you can exclude them before running the optimizer.',
  },
];

export const ToolsPage: React.FC = () => {
  const location = useLocation();
  const isRoot = location.pathname === '/tools' || location.pathname === '/tools/';

  if (!isRoot) {
    return (
      <div className="page-container animate-page-enter" style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link to="/tools" style={{ color: 'var(--color-ink-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            ← Back to Extra tools
          </Link>
        </div>
        <Routes>
          <Route path="split" element={<SplitTool />} />
          <Route path="transfer" element={<TransferTool />} />
          <Route path="compression" element={<CompressionTool />} />
          <Route path="what-if" element={<WhatIfTool />} />
          <Route path="approximate" element={<ApproximateTool />} />
          <Route path="cleanup" element={<CleanupTool />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="page-container animate-page-enter" style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-ink)', margin: 0 }}>
          Extra tools
        </h1>
        <p style={{ color: 'var(--color-ink-3)', margin: '4px 0 0 0', fontSize: '14px' }}>
          Specialized algorithms that run on your active scan data.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {TOOLS_GALLERY.map((tool) => (
          // A8: whole card is clickable
          <Link
            key={tool.id}
            to={`/tools/${tool.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <Card style={{
              display: 'flex', flexDirection: 'column', height: '100%',
              cursor: 'pointer',
              transition: 'box-shadow 150ms ease, transform 150ms ease',
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-level-2)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-soft-sm)';
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'var(--color-forest-50)',
                  border: '1px solid var(--color-forest-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-forest-500)', flexShrink: 0,
                }}>
                  <tool.icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>{tool.name}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-ink-2)', lineHeight: 1.4 }}>
                    {tool.desc}
                  </p>
                </div>
              </div>

              {/* A8: How it differs from basic optimizer */}
              <div style={{
                padding: '10px 12px',
                backgroundColor: 'var(--color-surface-sunken)',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '12px',
                color: 'var(--color-ink-3)',
                lineHeight: 1.5,
              }}>
                <span style={{ fontWeight: 600, color: 'var(--color-ink-2)' }}>vs basic optimizer: </span>
                {tool.differs}
              </div>

              {/* A8: small "Open →" link, not full-width button */}
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  color: 'var(--color-forest-500)',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  Open →
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;

