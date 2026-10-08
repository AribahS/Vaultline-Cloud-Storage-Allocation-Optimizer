import React, { useMemo } from 'react';
import { FileJson2, FileSpreadsheet, Printer, Terminal } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Treemap } from '../components/Treemap';
import { formatSize, pluralize } from '../../lib/format';
import { buildExportPlan, downloadPlanFile, generatePlanCsv, generatePlanJson, generateShellMigrationScript, planFileMetadata } from '../../lib/planExports';

const sortForPlan = <T extends { priority: number; size: number }>(items: T[]) => [...items].sort((left, right) => right.priority - left.priority || right.size - left.size);

export const ReportsPage: React.FC = () => {
  const { files, knapsackResult, quotaBytes } = useAppStore();
  const plan = useMemo(() => knapsackResult ? buildExportPlan(files, knapsackResult) : null, [files, knapsackResult]);
  const keptIds = useMemo(() => new Set(knapsackResult?.keptItems.map(item => item.id) ?? []), [knapsackResult]);
  const keptFiles = useMemo(() => sortForPlan(planFileMetadata(files, knapsackResult?.keptItems.map(item => item.id) ?? [])), [files, knapsackResult]);
  const movedFiles = useMemo(() => sortForPlan(planFileMetadata(files, knapsackResult?.droppedItems.map(item => item.id) ?? [])), [files, knapsackResult]);
  const importancePct = knapsackResult && knapsackResult.maxPossibleValue > 0
    ? Math.round(knapsackResult.totalValue / knapsackResult.maxPossibleValue * 100)
    : 0;
  const runtime = knapsackResult && knapsackResult.executionTimeMs > 0 ? `${knapsackResult.executionTimeMs.toFixed(2)} ms` : 'Not measured yet';

  const saveFile = (filename: string, content: string, mime: string) => downloadPlanFile(filename, content, mime);
  const printReport = () => window.print();

  return <div className="page-container responsive-page plan-page">
    <style>{`
      @page { size: A4; margin: 16mm; }
      .plan-print { display: none; }
      @media print {
        html, body, #root { background: var(--paper) !important; color: var(--ink) !important; margin: 0 !important; }
        .vaultline-topbar, .no-print, .algorithm-drawer, .algorithm-drawer-backdrop { display: none !important; }
        .plan-page { width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
        .plan-print { display: block !important; }
        .plan-print-header { border-bottom: 2px solid var(--ink); margin-bottom: 8mm; padding-bottom: 4mm; }
        .plan-print-kpis { display: grid; grid-template-columns: repeat(3,1fr); gap: 4mm; margin: 5mm 0 8mm; }
        .plan-print-card { border: 1px solid var(--card-border); border-radius: 4px; padding: 4mm; }
        .plan-print-card strong { display: block; font-size: 18pt; color: var(--ink); }
        .plan-print-section { break-before: page; }
        .plan-print-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        .plan-print-table th, .plan-print-table td { border-bottom: 1px solid var(--card-border); padding: 2mm; text-align: left; overflow-wrap: anywhere; }
        .plan-print-table th { background: var(--vault) !important; color: var(--paper) !important; print-color-adjust: exact; }
        .plan-print-table tr.move-row td { background: repeating-linear-gradient(135deg,var(--paper) 0,var(--paper) 5px,var(--moved-stripe) 5px,var(--moved-stripe) 7px) !important; border-left: 2px solid var(--moved); print-color-adjust: exact; }
      }
    `}</style>

    <header className="plan-header no-print">
      <div><h1>Plan</h1><p>Your storage decision, with files and totals you can save or print.</p></div>
      <Button variant="primary" onClick={printReport} disabled={!knapsackResult}><Printer size={16} />Print / Save PDF</Button>
    </header>
    <p className="plan-score-note no-print">Suggested scores, a heuristic, not ground truth</p>

    {!knapsackResult ? <Card className="no-print"><div className="plan-empty"><h2>No plan yet</h2><p>Add files and run the optimizer to see a plan here.</p></div></Card> : <>
      <section className="plan-kpis no-print" aria-label="Plan summary">
        <Kpi label="Files kept" value={pluralize(knapsackResult.keptItems.length, 'file')} />
        <Kpi label="Files moved" value={pluralize(knapsackResult.droppedItems.length, 'file')} moved />
        <Kpi label="Space kept" value={formatSize(knapsackResult.totalSizeKept)} />
        <Kpi label="Space moved" value={formatSize(knapsackResult.totalSizeDropped)} moved />
        <Kpi label="Importance retained" value={`${importancePct}% (${knapsackResult.totalValue} of ${knapsackResult.maxPossibleValue})`} />
        <Kpi label="Target capacity" value={formatSize(knapsackResult.quotaBytes || quotaBytes)} />
        <Kpi label="Solver runtime" value={runtime} />
      </section>

      <section className="plan-export-actions no-print" aria-label="Save plan">
        <Button variant="secondary" onClick={() => saveFile('vaultline-plan.csv', generatePlanCsv(plan!), 'text/csv;charset=utf-8')}><FileSpreadsheet size={16} />Download CSV</Button>
        <Button variant="secondary" onClick={() => saveFile('vaultline-plan.json', generatePlanJson(plan!), 'application/json;charset=utf-8')}><FileJson2 size={16} />Download JSON</Button>
        <Button variant="secondary" onClick={() => saveFile('vaultline-migration.sh', generateShellMigrationScript(plan!), 'text/x-shellscript;charset=utf-8')}><Terminal size={16} />Download shell script</Button>
      </section>

      <section className="plan-treemap-section no-print">
        <Card><h2>Where the space goes</h2><p className="plan-section-copy">Each block represents a file. Green marks files kept; striped rust marks files moved.</p>
          <Treemap files={files.map(file => ({ id: file.id, name: file.name, category: file.category, size: file.size, priority: file.priority }))} keptIds={keptIds} />
        </Card>
      </section>

      <section className="plan-lists responsive-stack no-print">
        <FileList title="Keep" items={keptFiles} />
        <FileList title="Move" items={movedFiles} moved />
      </section>
      <Card className="plan-constraints no-print"><h2>Constraints</h2><div className="plan-constraint-columns responsive-stack">
        <ConstraintList title="Always keep" items={files.filter(file => file.isPinned)} />
        <ConstraintList title="Never keep" items={files.filter(file => file.isExcluded)} />
      </div></Card>

      <article className="plan-print" aria-label="Printable storage plan">
        <header className="plan-print-header"><h1>Vaultline storage plan</h1><p>Generated {plan!.generatedAt}</p></header>
        <div className="plan-print-kpis">
          <PrintCard title="Files kept" value={String(knapsackResult.keptItems.length)} />
          <PrintCard title="Files moved" value={String(knapsackResult.droppedItems.length)} />
          <PrintCard title="Space kept" value={formatSize(knapsackResult.totalSizeKept)} />
          <PrintCard title="Space moved" value={formatSize(knapsackResult.totalSizeDropped)} />
          <PrintCard title="Importance retained" value={`${importancePct}% (${knapsackResult.totalValue} of ${knapsackResult.maxPossibleValue})`} />
          <PrintCard title="Target capacity" value={formatSize(knapsackResult.quotaBytes || quotaBytes)} />
          <PrintCard title="Solver runtime" value={runtime} />
        </div>
        <PrintTable title="Keep" items={keptFiles} />
        <PrintTable title="Move" items={movedFiles} moved />
        <section className="plan-print-section"><h2>Constraints</h2><p>Always keep: {files.filter(file => file.isPinned).map(file => file.name).join(', ') || 'None'}</p><p>Never keep: {files.filter(file => file.isExcluded).map(file => file.name).join(', ') || 'None'}</p></section>
      </article>
    </>}
  </div>;
};

const Kpi: React.FC<{ label: string; value: string; moved?: boolean }> = ({ label, value, moved = false }) => <Card className={`plan-kpi ${moved ? 'plan-kpi-moved' : ''}`}><span>{label}</span><strong>{value}</strong><i aria-hidden="true" /></Card>;

const FileList: React.FC<{ title: string; items: ReturnType<typeof planFileMetadata>; moved?: boolean }> = ({ title, items, moved = false }) => <Card className={`plan-file-list ${moved ? 'plan-file-list-moved' : ''}`}><h2>{title} <span>{pluralize(items.length, 'file')}</span></h2><div className="plan-file-scroll">{items.length ? items.map(file => <div key={file.id} className="plan-file-row"><span title={file.path}><strong>{file.name}</strong><small>{file.path}</small></span><b>{formatSize(file.size)}</b><em>{file.priority}/10</em></div>) : <p>No files in this list.</p>}</div></Card>;

const ConstraintList: React.FC<{ title: string; items: ReturnType<typeof planFileMetadata> }> = ({ title, items }) => <div><h3>{title}</h3>{items.length ? <ul>{items.map(file => <li key={file.id}>{file.name} · {formatSize(file.size)}</li>)}</ul> : <p>None</p>}</div>;

const PrintCard: React.FC<{ title: string; value: string }> = ({ title, value }) => <div className="plan-print-card"><small>{title}</small><strong>{value}</strong></div>;

const PrintTable: React.FC<{ title: string; items: ReturnType<typeof planFileMetadata>; moved?: boolean }> = ({ title, items, moved = false }) => <section className="plan-print-section"><h2>{title} · {pluralize(items.length, 'file')}</h2><table className="plan-print-table"><thead><tr><th>Name</th><th>Path</th><th>Size</th><th>Importance</th><th>Constraint</th></tr></thead><tbody>{items.map(file => <tr className={moved ? 'move-row' : ''} key={file.id}><td>{file.name}</td><td>{file.path}</td><td>{formatSize(file.size)}</td><td>{file.priority}/10</td><td>{file.isPinned ? 'Always keep' : file.isExcluded ? 'Never keep' : '—'}</td></tr>)}</tbody></table></section>;

export default ReportsPage;
