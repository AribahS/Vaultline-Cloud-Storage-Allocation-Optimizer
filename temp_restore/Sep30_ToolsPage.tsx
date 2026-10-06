import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Layers, Clock, Zap, Cpu, Archive, Search } from 'lucide-react';
import { SplitTool } from './tools/SplitTool';
import { TransferTool } from './tools/TransferTool';
import { CompressionTool } from './tools/CompressionTool';
import { WhatIfTool } from './tools/WhatIfTool';
import { ApproximateTool } from './tools/ApproximateTool';
import { CleanupTool } from './tools/CleanupTool';

const TOOLS_GALLERY = [
  { id: 'split', name: 'Split across destinations', icon: Layers, desc: 'Calculate the optimal partition of files across multiple target drives.' },
  { id: 'transfer', name: 'Transfer time planner', icon: Clock, desc: 'Estimate the real-world time to move payload over various interfaces.' },
  { id: 'compression', name: 'Compression-aware planning', icon: Archive, desc: 'Simulate archive ratios to maximize cold storage utility.' },
  { id: 'what-if', name: 'What-if explorer', icon: Zap, desc: 'Evaluate hypothetical rule changes before committing.' },
  { id: 'approximate', name: 'Approximate mode', icon: Cpu, desc: 'Benchmark Fully Polynomial-Time Approximation Scheme scaling.' },
  { id: 'cleanup', name: 'Cleanup finder', icon: Search, desc: 'Quickly detect temporary or cache files clogging the active scan.' },
];

export const ToolsPage: React.FC = () => {
  const location = useLocation();
  const isRoot = location.pathname === '/tools' || location.pathname === '/tools/';

  if (!isRoot) {
    return (
      <div className="page-container" style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link to="/tools" style={{ color: 'var(--color-ink-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            &larr; Back to Extra tools
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
    <div className="page-container" style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', color: 'var(--color-ink)', margin: 0 }}>
          Extra tools
        </h1>
        <p style={{ color: 'var(--color-ink-3)', margin: '4px 0 0 0', fontSize: '14px' }}>
          Specialized algorithms and utilities that run on your active scan data.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {TOOLS_GALLERY.map((tool) => (
          <Card key={tool.id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-forest)' }}>
                <tool.icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>{tool.name}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-ink-2)', lineHeight: 1.4 }}>
                  {tool.desc}
                </p>
              </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-hairline)' }}>
              <Link to={`/tools/${tool.id}`} style={{ textDecoration: 'none' }}>
                <Button variant="secondary" fullWidth>Open tool</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;

