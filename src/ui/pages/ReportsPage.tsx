import React, { useMemo, useState, useEffect } from 'react';
import { FileJson2, FileSpreadsheet, Download, Terminal, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ResultsSummary } from '../components/ResultsSummary';
import { Treemap } from '../components/Treemap';
import { formatSize, pluralize, formatScore } from '../../lib/format';
import {
  buildReportModel,
  generateReportCsv,
  generateReportJson,
  generateReportMigrationScript,
  generateReportPdf,
  downloadPlanFile,
} from '../../lib/planExports';

const UNITS: Record<string, number> = {
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

function formatValueForUnit(bytes: number, unit: string): string {
  const multiplier = UNITS[unit] || UNITS.GB;
  const val = bytes / multiplier;
  return Number.isFinite(val) ? String(Number(val.toFixed(2))) : '0';
}

function detectBestUnit(bytes: number): string {
  if (bytes >= UNITS.TB) return 'TB';
  if (bytes >= UNITS.GB) return 'GB';
  if (bytes >= UNITS.MB) return 'MB';
  return 'KB';
}

export const ReportsPage: React.FC = () => {
  const { files, knapsackResult, quotaBytes, setQuotaBytes } = useAppStore();
  const totalFilesBytes = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);
  const [selectedUnit, setSelectedUnit] = useState<string>(() => detectBestUnit(quotaBytes));
  const [inputValue, setInputValue] = useState<string>(() => formatValueForUnit(quotaBytes, detectBestUnit(quotaBytes)));

  // Keep input in sync if shared quotaBytes changes externally
  useEffect(() => {
    setInputValue(formatValueForUnit(quotaBytes, selectedUnit));
  }, [quotaBytes, selectedUnit]);

  const reportModel = useMemo(() => buildReportModel(files, knapsackResult, quotaBytes), [files, knapsackResult, quotaBytes]);
  const keptIds = useMemo(() => new Set(knapsackResult?.keptItems.map(item => item.id) ?? []), [knapsackResult]);

  const allFilesFit = files.length > 0 && quotaBytes >= totalFilesBytes;
  const runtime = knapsackResult && knapsackResult.executionTimeMs > 0 ? `${knapsackResult.executionTimeMs.toFixed(2)} ms` : 'Not measured yet';

  const downloadPdf = (full = false) => {
    const doc = generateReportPdf(reportModel, { full });
    const filename = full ? 'vaultline-storage-report-full.pdf' : 'vaultline-storage-report.pdf';
    doc.save(filename);
  };

  const downloadCsv = () => {
    downloadPlanFile('vaultline-storage-report.csv', generateReportCsv(reportModel), 'text/csv;charset=utf-8');
  };

  const downloadJson = () => {
    downloadPlanFile('vaultline-storage-report.json', generateReportJson(reportModel), 'application/json;charset=utf-8');
  };

  const downloadScript = () => {
    downloadPlanFile('vaultline-migration.sh', generateReportMigrationScript(files, reportModel), 'text/x-shellscript;charset=utf-8');
  };

  const handleUnitChange = (newUnit: string) => {
    setSelectedUnit(newUnit);
    setInputValue(formatValueForUnit(quotaBytes, newUnit));
  };

  const handleNumberChange = (raw: string) => {
    setInputValue(raw);
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      const multiplier = UNITS[selectedUnit] || UNITS.GB;
      setQuotaBytes(Math.round(parsed * multiplier));
    }
  };

  const setPresetPercent = (pct: number) => {
    if (totalFilesBytes <= 0) return;
    const target = Math.round(totalFilesBytes * pct);
    setQuotaBytes(target);
    setInputValue(formatValueForUnit(target, selectedUnit));
  };

  const setPresetBytes = (bytes: number) => {
    setQuotaBytes(bytes);
    setInputValue(formatValueForUnit(bytes, selectedUnit));
  };

  return (
    <div className="page-container responsive-page plan-page">
      <header className="plan-header no-print">
        <div>
          <h1>Results</h1>
          <p>Your storage decision, with files and totals you can save or export.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary" onClick={() => downloadPdf(false)} disabled={files.length === 0}>
            <Download size={16} /> Download report (PDF)
          </Button>
          <button
            type="button"
            className="play-inline-link"
            style={{ fontSize: '13px', marginLeft: '6px' }}
            onClick={() => downloadPdf(true)}
            disabled={files.length === 0}
          >
            Download full report (all files)
          </button>
        </div>
      </header>

      {/* Shared Target Capacity Control */}
      <section className="plan-capacity no-print" aria-label="Target capacity">
        <strong style={{ marginRight: '4px' }}>Target capacity</strong>

        {/* Preset chips */}
        <div className="plan-capacity-presets" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {totalFilesBytes > 0 && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPresetPercent(0.25)}
              >
                25% ({formatSize(totalFilesBytes * 0.25)})
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPresetPercent(0.5)}
              >
                50% ({formatSize(totalFilesBytes * 0.5)})
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPresetPercent(0.75)}
              >
                75% ({formatSize(totalFilesBytes * 0.75)})
              </button>
            </>
          )}
          {[5 * UNITS.GB, 15 * UNITS.GB, 64 * UNITS.GB].map(b => (
            <button
              type="button"
              className="btn-secondary"
              key={b}
              aria-pressed={quotaBytes === b}
              onClick={() => setPresetBytes(b)}
            >
              {formatSize(b)}
            </button>
          ))}
        </div>

        {/* Custom Input + Unit dropdown */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <label htmlFor="results-custom-capacity" style={{ fontSize: '12px', fontWeight: 600 }}>Capacity</label>
          <input
            id="results-custom-capacity"
            type="number"
            min="0"
            step="any"
            value={inputValue}
            onChange={e => handleNumberChange(e.target.value)}
            style={{ width: '90px' }}
          />
          <select
            aria-label="Capacity unit"
            value={selectedUnit}
            onChange={e => handleUnitChange(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--ink)', background: 'var(--paper)', color: 'var(--ink)', fontWeight: 600 }}
          >
            <option value="KB">KB</option>
            <option value="MB">MB</option>
            <option value="GB">GB</option>
            <option value="TB">TB</option>
          </select>
        </div>
      </section>

      {/* All files fit notice: ONLY shown when capacity >= total size */}
      {allFilesFit && (
        <div
          role="status"
          style={{
            margin: '0 0 16px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'color-mix(in srgb, var(--kept) 25%, var(--paper))',
            border: '1.5px solid var(--kept)',
            color: 'var(--ink)',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          All your files fit in {formatSize(quotaBytes)}. Lower the capacity to see what you would keep.
        </div>
      )}

      {files.length === 0 ? (
        <Card className="no-print">
          <div className="plan-empty">
            <h2>No files scanned yet</h2>
            <p>Add files in the Files tab to see recommendations here.</p>
            <Link to="/files" style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'underline', marginTop: '12px', display: 'inline-block' }}>
              Go to Files
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Headline Numbers: rendered once via ResultsSummary */}
          <ResultsSummary
            values={{
              keptCount: reportModel.keptCount,
              movedCount: reportModel.movedCount,
              keptBytes: reportModel.keptBytes,
              movedBytes: reportModel.movedBytes,
              importanceKept: reportModel.importanceKept,
              importancePossible: reportModel.importanceTotal,
            }}
          />
          <p className="plan-runtime no-print" style={{ margin: '-4px 0 16px', fontSize: '12px', color: 'var(--color-ink-2)' }}>
            Solver runtime: {runtime}
          </p>

          {/* Export Actions */}
          <section className="plan-export-actions no-print" aria-label="Export report">
            <Button variant="secondary" onClick={downloadCsv}>
              <FileSpreadsheet size={16} /> Download CSV
            </Button>
            <Button variant="secondary" onClick={downloadJson}>
              <FileJson2 size={16} /> Download JSON
            </Button>
            <Button variant="secondary" onClick={downloadScript}>
              <Terminal size={16} /> Download shell script
            </Button>
          </section>

          {/* Treemap Visualization */}
          <section className="plan-treemap-section no-print" style={{ marginBottom: '20px' }}>
            <Card>
              <h2>Where the space goes</h2>
              <p className="plan-section-copy">Each block represents a file. Green marks files kept; striped rust marks files moved out.</p>
              <Treemap
                files={files.map(file => ({ id: file.id, name: file.name, category: file.category, size: file.size, priority: file.priority }))}
                keptIds={keptIds}
              />
            </Card>
          </section>

          {/* Keep and Move Out Lists */}
          <section className="plan-lists responsive-stack no-print">
            <FileList title="Keep" items={reportModel.keepItems} />
            <FileList title="Move out" items={reportModel.moveItems} moved />
          </section>

          {/* Constraints Section */}
          <Card className="plan-constraints no-print" style={{ marginTop: '20px' }}>
            <h2>Constraints</h2>
            <Link to="/files" className="plan-manage-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
              Manage constraints in Files <ArrowRight size={14} />
            </Link>
            <div className="plan-constraint-columns responsive-stack">
              <ConstraintList title="Always keep" items={reportModel.alwaysKeepItems} />
              <ConstraintList title="Never keep" items={reportModel.neverKeepItems} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

const FileList: React.FC<{
  title: string;
  items: Array<{ id: string; name: string; folder: string; size: number; importance: number; edited?: boolean }>;
  moved?: boolean;
}> = ({ title, items, moved = false }) => (
  <Card className={`plan-file-list ${moved ? 'plan-file-list-moved' : ''}`}>
    <h2>
      {title} <span>{pluralize(items.length, 'file')}</span>
    </h2>
    <div className="plan-file-scroll">
      {items.length ? (
        items.map(file => (
          <div key={file.id} className="plan-file-row">
            <span title={`${file.folder}/${file.name}`}>
              <strong>{file.name}</strong>
              <small>{file.folder}</small>
            </span>
            <b>{formatSize(file.size)}</b>
            <em>{file.importance}/10{file.edited ? ' *' : ''}</em>
          </div>
        ))
      ) : (
        <p style={{ padding: '16px 4px', color: 'var(--color-ink-2)' }}>No files in this list.</p>
      )}
    </div>
  </Card>
);

const ConstraintList: React.FC<{
  title: string;
  items: Array<{ id: string; name: string; size: number }>;
}> = ({ title, items }) => (
  <div>
    <h3>{title}</h3>
    {items.length ? (
      <ul>
        {items.map(file => (
          <li key={file.id}>
            {file.name} · {formatSize(file.size)}
          </li>
        ))}
      </ul>
    ) : (
      <p style={{ color: 'var(--color-ink-2)' }}>None</p>
    )}
  </div>
);

export default ReportsPage;
