import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { formatBytes } from '../../engine/normalizer';
import {
  generateCsvExport,
  generateJsonExport,
  generateTextSummary,
  generateActionPlanBash,
  generateActionPlanPowerShell,
  generateWordDocumentHtml,
  downloadTextFile
} from '../../engine/exportPlan';
import { Printer, Download, FileText, Check, Copy, FileCode, Table, FileSpreadsheet, Shield, Cpu, HardDrive } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { files, knapsackResult: optimizationResult, quotaBytes: activeQuotaBytes } = useAppStore();
  const [activeExportTab, setActiveExportTab] = useState<'pdf' | 'word' | 'summary' | 'bash' | 'ps1' | 'csv' | 'json'>('pdf');
  const [copied, setCopied] = useState(false);

  // Generate preview content based on active tab
  const previewContent = useMemo(() => {
    if (!optimizationResult || files.length === 0) return 'No optimization data available. Run the optimizer first on the Optimizer page.';

    switch (activeExportTab) {
      case 'pdf':
      case 'summary':
        return generateTextSummary(files, optimizationResult);
      case 'word':
        return generateWordDocumentHtml(files, optimizationResult);
      case 'bash':
        return generateActionPlanBash(files, optimizationResult);
      case 'ps1':
        return generateActionPlanPowerShell(files, optimizationResult);
      case 'csv':
        return generateCsvExport(files, optimizationResult);
      case 'json':
        return generateJsonExport(files, optimizationResult);
      default:
        return '';
    }
  }, [files, optimizationResult, activeExportTab]);

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!optimizationResult) return;

    if (activeExportTab === 'pdf') {
      window.print();
      return;
    }

    const filenameMap: Record<string, { filename: string; mime: string }> = {
      word: { filename: 'vaultline_executive_report.doc', mime: 'application/msword' },
      summary: { filename: 'vaultline_executive_summary.txt', mime: 'text/plain' },
      bash: { filename: 'vaultline_archive_plan.sh', mime: 'application/x-sh' },
      ps1: { filename: 'vaultline_archive_plan.ps1', mime: 'text/plain' },
      csv: { filename: 'vaultline_export.csv', mime: 'text/csv' },
      json: { filename: 'vaultline_export.json', mime: 'application/json' },
    };

    const target = filenameMap[activeExportTab];
    if (target) {
      downloadTextFile(target.filename, previewContent, target.mime);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const importanceRetainedPct = optimizationResult && optimizationResult.maxPossibleValue > 0
    ? Math.round((optimizationResult.totalValue / optimizationResult.maxPossibleValue) * 100)
    : 0;

  return (
    <div className="page-container" style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── PRINT-ONLY STYLES & EXECUTIVE DOCUMENT ── */}
      <style>{`
        .print-only { display: none !important; }

        @media print {
          /* Hide all app chrome */
          header, nav, sidebar, .no-print, .app-sidebar, .app-topbar {
            display: none !important;
          }

          body, html, #root {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          .page-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }

          .print-only {
            display: block !important;
            padding: 24px !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
          }

          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #b8860b;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }

          .print-title {
            font-size: 24pt;
            font-weight: 700;
            color: #1e3a29;
            margin: 0;
          }

          .print-subtitle {
            font-size: 10pt;
            color: #64748b;
            margin-top: 4px;
          }

          .print-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .print-card {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 12px;
            background: #f8fafc;
            text-align: center;
          }

          .print-card-label {
            font-size: 8pt;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
          }

          .print-card-val {
            font-size: 16pt;
            font-weight: 700;
            color: #1e3a29;
            margin-top: 4px;
          }

          .print-section-title {
            font-size: 14pt;
            font-weight: 700;
            color: #1e3a29;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
            margin: 20px 0 12px 0;
          }

          table.print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
            margin-bottom: 20px;
          }

          table.print-table th {
            background-color: #1e3a29;
            color: #ffffff;
            padding: 8px 10px;
            text-align: left;
          }

          table.print-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
          }

          .print-footer {
            margin-top: 36px;
            border-top: 1px solid #cbd5e1;
            padding-top: 12px;
            font-size: 8.5pt;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
        }
      `}</style>

      {/* ── PRINT-ONLY EXECUTIVE DOCUMENT ── */}
      {optimizationResult && (
        <div className="print-only">
          <div className="print-header">
            <div>
              <h1 className="print-title">Vaultline Executive Storage Report</h1>
              <div className="print-subtitle">
                Generated: {new Date().toLocaleDateString()} &bull; Target Device Allocation Plan
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '9pt', color: '#64748b' }}>
              <div><strong>Status:</strong> Provably Optimal</div>
              <div><strong>Algorithm:</strong> 0/1 Knapsack DP</div>
            </div>
          </div>

          <div className="print-grid">
            <div className="print-card">
              <div className="print-card-label">Target Capacity</div>
              <div className="print-card-val">{formatBytes(optimizationResult.quotaBytes)}</div>
            </div>
            <div className="print-card">
              <div className="print-card-label">Kept Storage Payload</div>
              <div className="print-card-val" style={{ color: '#166534' }}>{formatBytes(optimizationResult.totalSizeKept)}</div>
            </div>
            <div className="print-card">
              <div className="print-card-label">Offloaded Space</div>
              <div className="print-card-val" style={{ color: '#991b1b' }}>{formatBytes(optimizationResult.totalSizeDropped)}</div>
            </div>
            <div className="print-card">
              <div className="print-card-label">Importance Retained</div>
              <div className="print-card-val" style={{ color: '#b8860b' }}>{importanceRetainedPct}%</div>
            </div>
          </div>

          <h2 className="print-section-title">Kept Files Manifest ({optimizationResult.keptItems.length} files)</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>Importance</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {optimizationResult.keptItems.slice(0, 20).map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{formatBytes(item.originalSize)}</td>
                  <td>{item.value}/10</td>
                  <td>{item.category || 'file'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="print-section-title">Offloaded Files Action List ({optimizationResult.droppedItems.length} files)</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>Importance</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {optimizationResult.droppedItems.slice(0, 20).map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{formatBytes(item.originalSize)}</td>
                  <td>{item.value}/10</td>
                  <td>{item.category || 'file'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="print-footer">
            <span>Vaultline Private Storage Allocation System</span>
            <span>Zero file contents were uploaded off-device</span>
          </div>
        </div>
      )}

      {/* Header (Screen UI) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--color-ink)', margin: 0 }}>
            Reports & Executive Exports
          </h1>
          <p style={{ color: 'var(--color-ink-3)', margin: '4px 0 0 0', fontSize: '14px' }}>
            Export executive summaries, PDF reports, Word documents, or shell migration action plans.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer size={16} style={{ marginRight: '8px' }} /> Print Executive Summary / PDF
          </Button>
          <Button variant="primary" onClick={handleDownload} disabled={!optimizationResult}>
            <Download size={16} style={{ marginRight: '8px' }} />
            {activeExportTab === 'pdf' ? 'Print / Save PDF' : `Download (${activeExportTab.toUpperCase()})`}
          </Button>
        </div>
      </div>

      {!optimizationResult ? (
        <Card className="no-print">
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-ink-3)' }}>
            <FileText size={48} style={{ marginBottom: '16px', color: 'var(--color-ink-3)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '20px', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>
              No Optimization Plan Generated Yet
            </h3>
            <p style={{ maxWidth: '460px', margin: '0 auto 20px auto', fontSize: '14px', color: 'var(--color-ink-2)' }}>
              Scan your files and run the optimizer engine to generate formatted PDF, Word, CSV, and script reports.
            </p>
          </div>
        </Card>
      ) : (
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: '24px' }}>
          {/* Executive Overview & Format Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card title="Executive Overview">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px', background: 'var(--color-surface-sunken)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>Storage Quota</div>
                  <div style={{ fontSize: '18px', color: 'var(--color-ink)', fontWeight: 700 }}>
                    {formatBytes(optimizationResult.quotaBytes)}
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--color-surface-sunken)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>Storage Used (Kept Payload)</div>
                  <div style={{ fontSize: '18px', color: 'var(--color-semantic-keep)', fontWeight: 700 }}>
                    {formatBytes(optimizationResult.totalSizeKept)} ({Math.round((optimizationResult.totalSizeKept / Math.max(1, optimizationResult.quotaBytes)) * 100)}%)
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--color-surface-sunken)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>Priority Score Retained</div>
                  <div style={{ fontSize: '18px', color: 'var(--color-brass)', fontWeight: 700 }}>
                    {optimizationResult.totalValue} / {optimizationResult.maxPossibleValue} pts ({importanceRetainedPct}%)
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--color-surface-sunken)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>Overflow Space To Offload</div>
                  <div style={{ fontSize: '18px', color: 'var(--color-semantic-move)', fontWeight: 700 }}>
                    {formatBytes(optimizationResult.totalSizeDropped)} ({optimizationResult.droppedItems.length} files)
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Report & Document Format">
              <p style={{ fontSize: '13px', color: 'var(--color-ink-2)', marginBottom: '12px' }}>
                Select a formatted document or raw export format:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'pdf', name: '📄 PDF Executive Report (.pdf)', desc: 'Formatted multi-page PDF document' },
                  { id: 'word', name: '📝 Word Executive Report (.doc)', desc: 'Formatted Microsoft Word document' },
                  { id: 'summary', name: '📃 Text Executive Summary (.txt)', desc: 'Plain text report' },
                  { id: 'bash', name: '⚡ Bash Action Plan (.sh)', desc: 'Mac / Linux auto-archive script' },
                  { id: 'ps1', name: '💻 PowerShell Action Plan (.ps1)', desc: 'Windows auto-archive script' },
                  { id: 'csv', name: '📊 CSV Spreadsheet Export (.csv)', desc: 'Raw spreadsheet table' },
                  { id: 'json', name: '⚙️ JSON Metadata Dump (.json)', desc: 'Structured JSON export' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveExportTab(item.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '8px',
                      border: activeExportTab === item.id ? '2px solid var(--color-forest-500)' : '1px solid var(--color-border-hairline)',
                      background: activeExportTab === item.id ? 'var(--color-forest-50)' : 'var(--color-surface-raised)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-ink)' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Document & Code Preview Card */}
          <Card title={`Generated Document Preview (${activeExportTab.toUpperCase()})`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)' }}>
                {activeExportTab === 'pdf' ? 'executive_summary_report.pdf' :
                 activeExportTab === 'word' ? 'vaultline_report.doc' :
                 activeExportTab === 'bash' ? 'vaultline_archive_plan.sh' :
                 activeExportTab === 'ps1' ? 'vaultline_archive_plan.ps1' : 'preview'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check size={14} style={{ marginRight: '6px', color: 'var(--color-forest-500)' }} /> : <Copy size={14} style={{ marginRight: '6px' }} />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownload}>
                  <Download size={14} style={{ marginRight: '6px' }} />
                  {activeExportTab === 'pdf' ? 'Print / PDF' : 'Download'}
                </Button>
              </div>
            </div>

            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: '1.5',
                padding: '16px',
                background: 'var(--color-surface-sunken)',
                color: 'var(--color-ink)',
                borderRadius: '8px',
                overflowX: 'auto',
                maxHeight: '520px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
                border: '1px solid var(--color-border-hairline)'
              }}
            >
              {previewContent}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

