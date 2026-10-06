import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { formatBytes } from '../../utils/formatBytes';
import { pluralize } from '../../utils/pluralize';
import {
  generateCsvExport,
  generateJsonExport,
  generateTextSummary,
  generateActionPlanBash,
  generateActionPlanPowerShell,
  generateWordDocumentHtml,
  downloadTextFile
} from '../../engine/exportPlan';
import { Download, FileText, Check, Copy } from 'lucide-react';

type ExportTab = 'pdf' | 'word' | 'summary' | 'bash' | 'ps1' | 'csv' | 'json';

const FORMAT_META: Record<ExportTab, { label: string; desc: string; ext: string; mime: string }> = {
  pdf:     { label: '📄 PDF Executive Report',        desc: 'Formatted multi-page PDF document',      ext: '.pdf', mime: 'application/pdf' },
  word:    { label: '📝 Word Executive Report',        desc: 'Formatted Microsoft Word document',       ext: '.doc', mime: 'application/msword' },
  summary: { label: '📃 Text Executive Summary',       desc: 'Plain text report',                       ext: '.txt', mime: 'text/plain' },
  bash:    { label: '⚡ Bash Action Plan',              desc: 'Mac / Linux auto-archive script',         ext: '.sh',  mime: 'application/x-sh' },
  ps1:     { label: '💻 PowerShell Action Plan',        desc: 'Windows auto-archive script',             ext: '.ps1', mime: 'text/plain' },
  csv:     { label: '📊 CSV Spreadsheet Export',        desc: 'Raw spreadsheet table',                   ext: '.csv', mime: 'text/csv' },
  json:    { label: '⚙️ JSON Metadata Dump',           desc: 'Structured JSON export',                  ext: '.json', mime: 'application/json' },
};

export const ReportsPage: React.FC = () => {
  const { files, knapsackResult: optimizationResult, quotaBytes: activeQuotaBytes } = useAppStore();
  const [activeExportTab, setActiveExportTab] = useState<ExportTab>('pdf');
  const [copied, setCopied] = useState(false);

  const previewContent = useMemo(() => {
    if (!optimizationResult || files.length === 0) return 'No optimization data available. Run the optimizer first on the Optimizer page.';
    switch (activeExportTab) {
      case 'pdf':
      case 'summary': return generateTextSummary(files, optimizationResult);
      case 'word':    return generateWordDocumentHtml(files, optimizationResult);
      case 'bash':    return generateActionPlanBash(files, optimizationResult);
      case 'ps1':     return generateActionPlanPowerShell(files, optimizationResult);
      case 'csv':     return generateCsvExport(files, optimizationResult);
      case 'json':    return generateJsonExport(files, optimizationResult);
      default:        return '';
    }
  }, [files, optimizationResult, activeExportTab]);

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // A9: Single download/print action whose label follows the selected format
  const handleDownload = () => {
    if (!optimizationResult) return;
    if (activeExportTab === 'pdf') {
      window.print();
      return;
    }
    const meta = FORMAT_META[activeExportTab];
    downloadTextFile(`vaultline_export${meta.ext}`, previewContent, meta.mime);
  };

  const importanceRetainedPct = optimizationResult && optimizationResult.maxPossibleValue > 0
    ? Math.round((optimizationResult.totalValue / optimizationResult.maxPossibleValue) * 100)
    : 0;

  // A9: Download button label follows format
  const downloadLabel = activeExportTab === 'pdf'
    ? 'Print / Save PDF'
    : `Download ${FORMAT_META[activeExportTab].ext}`;

  return (
    <div className="page-container" style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── PRINT STYLES ── */}
      <style>{`
        .print-only { display: none !important; }
        @media print {
          header, nav, .no-print, .vaultline-sidebar, .vaultline-topbar { display: none !important; }
          body, html, #root { background: #fff !important; color: #000 !important; margin: 0 !important; padding: 0 !important; }
          .page-container { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .print-only { display: block !important; padding: 24px !important; }
          .print-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #b8860b; padding-bottom: 16px; margin-bottom: 24px; }
          .print-title { font-size: 24pt; font-weight: 700; color: #1e3a29; margin: 0; }
          .print-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
          .print-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; text-align: center; }
          .print-card-label { font-size: 8pt; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .print-card-val { font-size: 16pt; font-weight: 700; color: #1e3a29; margin-top: 4px; }
          .print-section-title { font-size: 14pt; font-weight: 700; color: #1e3a29; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin: 20px 0 12px; }
          table.print-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 20px; }
          table.print-table th { background-color: #1e3a29; color: #fff; padding: 8px 10px; text-align: left; }
          table.print-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          .print-footer { margin-top: 36px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 8.5pt; color: #64748b; display: flex; justify-content: space-between; }
        }
      `}</style>

      {/* ── PRINT-ONLY DOCUMENT ── */}
      {optimizationResult && (
        <div className="print-only">
          <div className="print-header">
            <div>
              <h1 className="print-title">Vaultline Storage Report</h1>
              <div style={{ fontSize: '10pt', color: '#64748b', marginTop: '4px' }}>
                Generated: {new Date().toLocaleDateString()} · Target Device Allocation Plan
              </div>
            </div>
          </div>
          <div className="print-grid">
            <div className="print-card"><div className="print-card-label">Target</div><div className="print-card-val">{formatBytes(optimizationResult.quotaBytes)}</div></div>
            <div className="print-card"><div className="print-card-label">Kept</div><div className="print-card-val" style={{ color: '#166534' }}>{formatBytes(optimizationResult.totalSizeKept)}</div></div>
            <div className="print-card"><div className="print-card-label">Offloaded</div><div className="print-card-val" style={{ color: '#991b1b' }}>{formatBytes(optimizationResult.totalSizeDropped)}</div></div>
            <div className="print-card"><div className="print-card-label">Importance</div><div className="print-card-val" style={{ color: '#b8860b' }}>{importanceRetainedPct}%</div></div>
          </div>
          <h2 className="print-section-title">Kept {pluralize(optimizationResult.keptItems.length, 'file')}</h2>
          <table className="print-table">
            <thead><tr><th>File</th><th>Size</th><th>Importance</th><th>Category</th></tr></thead>
            <tbody>
              {optimizationResult.keptItems.slice(0, 30).map(item => (
                <tr key={item.id}><td><strong>{item.name}</strong></td><td>{formatBytes(item.originalSize)}</td><td>{item.value}/10</td><td>{item.category || 'file'}</td></tr>
              ))}
            </tbody>
          </table>
          <h2 className="print-section-title">Move {pluralize(optimizationResult.droppedItems.length, 'file')}</h2>
          <table className="print-table">
            <thead><tr><th>File</th><th>Size</th><th>Importance</th><th>Category</th></tr></thead>
            <tbody>
              {optimizationResult.droppedItems.slice(0, 30).map(item => (
                <tr key={item.id}><td>{item.name}</td><td>{formatBytes(item.originalSize)}</td><td>{item.value}/10</td><td>{item.category || 'file'}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="print-footer">
            <span>Vaultline · Private Storage Allocation</span>
            <span>Zero file contents uploaded off-device</span>
          </div>
        </div>
      )}

      {/* ── SCREEN: Header — A2: SINGLE action button ── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--color-ink)', margin: 0 }}>Reports &amp; Exports</h1>
          <p style={{ color: 'var(--color-ink-3)', margin: '4px 0 0 0', fontSize: '14px' }}>
            Export your plan as PDF, CSV, JSON, or a shell migration script.
          </p>
        </div>
        {/* A2: Single primary button, label follows format */}
        <Button variant="primary" onClick={handleDownload} disabled={!optimizationResult}>
          <Download size={16} style={{ marginRight: '8px' }} />
          {downloadLabel}
        </Button>
      </div>

      {!optimizationResult ? (
        <Card className="no-print">
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-ink-3)' }}>
            {/* C7: Empty state */}
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ margin: '0 auto 16px', display: 'block' }}>
              <rect x="8" y="20" width="48" height="36" rx="6" fill="var(--color-surface-sunken)" stroke="var(--color-border-strong)" strokeWidth="1.5" />
              <circle cx="32" cy="38" r="8" fill="var(--color-forest-50)" stroke="var(--color-brass)" strokeWidth="1.5" />
              <path d="M29 38L31 40L35 36" stroke="var(--color-brass)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3 style={{ fontSize: '20px', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>No plan generated yet</h3>
            <p style={{ maxWidth: '460px', margin: '0 auto', fontSize: '14px', color: 'var(--color-ink-2)' }}>
              Run the optimizer to generate your plan, then come back here to export it.
            </p>
          </div>
        </Card>
      ) : (
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: '24px' }}>
          {/* Left: Overview + Format Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card>
              <h3 style={{ margin: '0 0 14px 0' }}>Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Target capacity', value: formatBytes(optimizationResult.quotaBytes), color: undefined },
                  { label: 'Kept payload', value: `${formatBytes(optimizationResult.totalSizeKept)} (${Math.round((optimizationResult.totalSizeKept / Math.max(1, optimizationResult.quotaBytes)) * 100)}%)`, color: 'var(--color-semantic-keep)' },
                  { label: 'Importance retained', value: `${optimizationResult.totalValue} / ${optimizationResult.maxPossibleValue} (${importanceRetainedPct}%)`, color: 'var(--color-brass)' },
                  { label: 'Move', value: `${formatBytes(optimizationResult.totalSizeDropped)} (${pluralize(optimizationResult.droppedItems.length, 'file')})`, color: 'var(--color-semantic-move)' },
                ].map(row => (
                  <div key={row.label} style={{ padding: '10px 12px', background: 'var(--color-surface-sunken)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>{row.label}</div>
                    <div style={{ fontSize: '16px', color: row.color || 'var(--color-ink)', fontWeight: 700 }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 style={{ margin: '0 0 12px 0' }}>Format</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(Object.entries(FORMAT_META) as [ExportTab, typeof FORMAT_META[ExportTab]][]).map(([id, meta]) => (
                  <button
                    key={id}
                    onClick={() => setActiveExportTab(id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                      border: activeExportTab === id ? '2px solid var(--color-forest-500)' : '1px solid var(--color-border-hairline)',
                      background: activeExportTab === id ? 'var(--color-forest-50)' : 'var(--color-surface-raised)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-ink)' }}>{meta.label} <span style={{ opacity: 0.5, fontWeight: 400 }}>{meta.ext}</span></div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>{meta.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Preview */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)' }}>
                vaultline_export{FORMAT_META[activeExportTab].ext}
              </span>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check size={14} style={{ marginRight: '6px', color: 'var(--color-forest-500)' }} /> : <Copy size={14} style={{ marginRight: '6px' }} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            {/* A9: pre with proper wrap — no horizontal scroll */}
            <pre style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: '1.55',
              padding: '16px',
              background: 'var(--color-surface-sunken)',
              color: 'var(--color-ink)',
              borderRadius: '8px',
              overflowX: 'auto',
              maxHeight: '520px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              border: '1px solid var(--color-border-hairline)',
            }}>
              {previewContent}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

