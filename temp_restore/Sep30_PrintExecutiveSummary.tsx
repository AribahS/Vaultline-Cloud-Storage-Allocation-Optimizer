import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatBytes } from '../../engine/normalizer';

export const PrintExecutiveSummary: React.FC = () => {
  const { files, knapsackResult: optimizationResult } = useAppStore();

  if (!optimizationResult || files.length === 0) {
    return (
      <div className="print-only" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Vaultline Storage Optimization Report</h2>
        <p>No optimization data available yet. Please add files and run the optimizer.</p>
      </div>
    );
  }

  const importanceRetainedPct = optimizationResult.maxPossibleValue > 0
    ? Math.round((optimizationResult.totalValue / optimizationResult.maxPossibleValue) * 100)
    : 0;

  return (
    <div className="print-only">
      {/* Printable page setup & css */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 15mm;
        }

        .print-only {
          display: none;
        }

        @media print {
          /* Force hide everything else */
          body * {
            visibility: hidden;
          }

          /* Force show print document */
          .print-only, .print-only * {
            visibility: visible !important;
          }

          .print-only {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #1f2937 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            font-size: 10pt !important;
            line-height: 1.5 !important;
          }

          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #b8893c;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }

          .print-logo-title {
            font-size: 22pt;
            font-weight: 700;
            color: #14382b;
            margin: 0;
            line-height: 1.2;
          }

          .print-subtitle {
            font-size: 9.5pt;
            color: #66746a;
            margin-top: 4px;
          }

          .print-badge-box {
            text-align: right;
            font-size: 9pt;
            color: #465349;
          }

          .print-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .print-kpi-card {
            border: 1px solid #dcd2b9;
            border-radius: 6px;
            padding: 10px 12px;
            background-color: #fcfbfa;
            text-align: center;
          }

          .print-kpi-label {
            font-size: 7.5pt;
            color: #66746a;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .print-kpi-val {
            font-size: 15pt;
            font-weight: 700;
            color: #14382b;
            margin-top: 2px;
          }

          .print-section-header {
            font-size: 12pt;
            font-weight: 700;
            color: #14382b;
            border-bottom: 1px solid #dcd2b9;
            padding-bottom: 4px;
            margin: 20px 0 10px 0;
            page-break-after: avoid;
            break-after: avoid;
          }

          table.print-report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-bottom: 16px;
          }

          table.print-report-table th {
            background-color: #14382b;
            color: #ffffff;
            padding: 6px 10px;
            text-align: left;
            font-weight: 600;
          }

          table.print-report-table td {
            padding: 6px 10px;
            border-bottom: 1px solid #eef4ec;
          }

          table.print-report-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .status-kept {
            color: #2f6b4f;
            font-weight: 600;
          }

          .status-moved {
            color: #9c4a3a;
            font-weight: 600;
          }

          .print-doc-footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #dcd2b9;
            font-size: 8pt;
            color: #66746a;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="print-header">
        <div>
          <h1 className="print-logo-title">Vaultline Executive Storage Report</h1>
          <div className="print-subtitle">
            Generated: {new Date().toLocaleDateString()} &bull; Storage Capacity Allocation Summary
          </div>
        </div>
        <div className="print-badge-box">
          <div><strong>Guarantee:</strong> Provably Optimal</div>
          <div><strong>Engine:</strong> 0/1 Knapsack DP</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="print-kpi-grid">
        <div className="print-kpi-card">
          <div className="print-kpi-label">Target Capacity</div>
          <div className="print-kpi-val">{formatBytes(optimizationResult.quotaBytes)}</div>
        </div>
        <div className="print-kpi-card">
          <div className="print-kpi-label">Kept Storage Payload</div>
          <div className="print-kpi-val" style={{ color: '#2f6b4f' }}>
            {formatBytes(optimizationResult.totalSizeKept)}
          </div>
        </div>
        <div className="print-kpi-card">
          <div className="print-kpi-label">Offloaded Space</div>
          <div className="print-kpi-val" style={{ color: '#9c4a3a' }}>
            {formatBytes(optimizationResult.totalSizeDropped)}
          </div>
        </div>
        <div className="print-kpi-card">
          <div className="print-kpi-label">Importance Retained</div>
          <div className="print-kpi-val" style={{ color: '#b8893c' }}>
            {importanceRetainedPct}%
          </div>
        </div>
      </div>

      {/* Kept Items Table */}
      <div className="print-section-header">
        Kept Files Manifest ({optimizationResult.keptItems.length} items &bull; {formatBytes(optimizationResult.totalSizeKept)})
      </div>
      <table className="print-report-table">
        <thead>
          <tr>
            <th style={{ width: '45%' }}>File Name</th>
            <th style={{ width: '20%', textAlign: 'right' }}>Size</th>
            <th style={{ width: '15%', textAlign: 'center' }}>Importance</th>
            <th style={{ width: '20%' }}>Category</th>
          </tr>
        </thead>
        <tbody>
          {optimizationResult.keptItems.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.name}</strong></td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatBytes(item.originalSize)}</td>
              <td style={{ textAlign: 'center' }} className="status-kept">{item.value}/10</td>
              <td style={{ textTransform: 'capitalize' }}>{item.category || 'file'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Offloaded Items Table */}
      <div className="print-section-header">
        External Storage Action List ({optimizationResult.droppedItems.length} items &bull; {formatBytes(optimizationResult.totalSizeDropped)})
      </div>
      <table className="print-report-table">
        <thead>
          <tr>
            <th style={{ width: '45%' }}>File Name</th>
            <th style={{ width: '20%', textAlign: 'right' }}>Size</th>
            <th style={{ width: '15%', textAlign: 'center' }}>Importance</th>
            <th style={{ width: '20%' }}>Category</th>
          </tr>
        </thead>
        <tbody>
          {optimizationResult.droppedItems.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatBytes(item.originalSize)}</td>
              <td style={{ textAlign: 'center' }} className="status-moved">{item.value}/10</td>
              <td style={{ textTransform: 'capitalize' }}>{item.category || 'file'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-doc-footer">
        <span>Vaultline Private Storage Allocation System</span>
        <span>Zero file contents were uploaded off-device</span>
      </div>
    </div>
  );
};

