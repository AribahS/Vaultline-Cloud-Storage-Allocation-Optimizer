import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatBytes } from '../../engine/normalizer';
import { Download, Copy, FileSpreadsheet, Terminal, GitCompare, Check, X } from 'lucide-react';

export const PlanActionsCard: React.FC = () => {
  const files = useAppStore((s) => s.files);
  const quotaBytes = useAppStore((s) => s.quotaBytes);
  const knapsackResult = useAppStore((s) => s.knapsackResult);
  const savedPlanA = useAppStore((s) => s.savedPlanA);
  const saveCurrentAsPlanA = useAppStore((s) => s.saveCurrentAsPlanA);
  const clearPlanA = useAppStore((s) => s.clearPlanA);
  const profileId = useAppStore((s) => s.profileId);

  const [copied, setCopied] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const keptItemIds = useMemo(() => {
    if (!knapsackResult) return new Set<string>();
    return new Set(knapsackResult.keptItems.map((i) => i.id));
  }, [knapsackResult]);

  const keptFiles = files.filter((f) => keptItemIds.has(f.id));
  const movedFiles = files.filter((f) => !keptItemIds.has(f.id) && !f.isExcluded);
  const keptBytes = keptFiles.reduce((acc, f) => acc + f.size, 0);
  const movedBytes = movedFiles.reduce((acc, f) => acc + f.size, 0);

  // 1. Download Checklist HTML
  const downloadChecklist = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vaultline Plan - Checklist</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #14112B; max-width: 800px; margin: 0 auto; line-height: 1.5; }
    h1 { font-size: 24px; margin-bottom: 4px; color: #6C47FF; }
    .meta { color: #5B5878; font-size: 14px; margin-bottom: 24px; }
    .box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: 700; margin: 24px 0 12px; display: flex; align-items: center; justify-content: space-between; }
    .badge-keep { color: #10B981; font-weight: 700; }
    .badge-move { color: #FF6B6B; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #E2E8F0; }
    th { background: #EDF2F7; font-weight: 600; }
    .check { width: 28px; text-align: center; }
    input[type="checkbox"] { transform: scale(1.2); }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>Vaultline Storage Checklist</h1>
  <div class="meta">Generated ${new Date().toLocaleDateString()} &bull; Total limit: ${formatBytes(quotaBytes)}</div>
  <div class="box">
    <strong>Summary:</strong> Keep ${keptFiles.length} files (${formatBytes(keptBytes)}) &bull; Move ${movedFiles.length} files (${formatBytes(movedBytes)})
  </div>
  <div class="section-title"><span class="badge-keep">Files to Keep (${keptFiles.length})</span><span>${formatBytes(keptBytes)}</span></div>
  <table>
    <thead><tr><th class="check"></th><th>File Name</th><th>Path</th><th>Size</th></tr></thead>
    <tbody>${keptFiles.map((f) => `<tr><td class="check"><input type="checkbox" checked /></td><td><strong>${f.name}</strong></td><td>${f.path || '/'}</td><td>${formatBytes(f.size)}</td></tr>`).join('')}</tbody>
  </table>
  <div class="section-title" style="margin-top: 36px;"><span class="badge-move">Files to Move (${movedFiles.length})</span><span>${formatBytes(movedBytes)}</span></div>
  <table>
    <thead><tr><th class="check"></th><th>File Name</th><th>Path</th><th>Size</th></tr></thead>
    <tbody>${movedFiles.map((f) => `<tr><td class="check"><input type="checkbox" /></td><td><strong>${f.name}</strong></td><td>${f.path || '/'}</td><td>${formatBytes(f.size)}</td></tr>`).join('')}</tbody>
  </table>
  <br/>
  <div class="no-print" style="margin-top: 24px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #6C47FF; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Print this Checklist</button>
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vaultline-plan-checklist.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. Copy summary
  const copySummary = () => {
    const summary = `Vaultline Storage Plan\nLimit: ${formatBytes(quotaBytes)}\nKeep: ${keptFiles.length} files (${formatBytes(keptBytes)})\nMove: ${movedFiles.length} files (${formatBytes(movedBytes)})\n\nKeep:\n${keptFiles.map((f) => `- ${f.name} (${formatBytes(f.size)})`).join('\n')}\n\nMove:\n${movedFiles.map((f) => `- ${f.name} (${formatBytes(f.size)})`).join('\n')}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 3. Export CSV
  const exportCsv = () => {
    const rows = [
      ['Action', 'Name', 'Path', 'SizeBytes', 'Category', 'Importance'],
      ...keptFiles.map((f) => ['KEEP', f.name, f.path || '/', f.size, f.category, f.priority]),
      ...movedFiles.map((f) => ['MOVE', f.name, f.path || '/', f.size, f.category, f.priority]),
    ];
    const csvContent = rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vaultline-plan.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 4. Export Shell Script
  const exportScript = () => {
    const scriptContent = `#!/bin/sh\n# Vaultline relocation script — Review before running!\nDEST="./vaultline_moved"\nmkdir -p "$DEST"\n\n${movedFiles.map((f) => `mv "${f.path || f.name}" "$DEST/"`).join('\n')}\n\necho "Moved ${movedFiles.length} files (${formatBytes(movedBytes)}) to $DEST"`;
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relocate_files.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold font-heading" style={{ color: 'var(--ink)' }}>
              Your plan actions
            </h2>
            <button
              type="button"
              onClick={() => {
                if (!savedPlanA) saveCurrentAsPlanA();
                setShowCompareModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={{
                background: savedPlanA ? 'rgba(108, 71, 255, 0.15)' : 'rgba(20, 17, 43, 0.05)',
                color: savedPlanA ? 'var(--brand-primary)' : 'var(--ink)',
                border: '1px solid rgba(20, 17, 43, 0.1)',
              }}
            >
              <GitCompare size={13} />
              <span>{savedPlanA ? 'Compare with Plan A' : 'Compare plans'}</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={downloadChecklist}
            className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-semibold text-xs shadow-sm transition-all hover:opacity-95 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-hover))' }}
          >
            <Download size={15} />
            <span>Download my checklist</span>
          </button>
          <p className="text-[11px] text-muted mb-4 -mt-1 text-center">
            Printable page with Keep and Move checkboxes
          </p>

          {/* Secondary Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={copySummary}
              className="flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all bg-white/70 hover:bg-white border border-slate-200/60"
              title="Copy text summary to clipboard"
            >
              {copied ? <Check size={16} className="text-emerald-500 mb-1" /> : <Copy size={16} className="text-slate-600 mb-1" />}
              <span className="text-[11px] font-semibold text-slate-800">Copy</span>
              <span className="text-[9px] text-muted leading-tight mt-0.5">Summary</span>
            </button>

            <button type="button" onClick={exportCsv}
              className="flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all bg-white/70 hover:bg-white border border-slate-200/60"
              title="Download CSV"
            >
              <FileSpreadsheet size={16} className="text-slate-600 mb-1" />
              <span className="text-[11px] font-semibold text-slate-800">CSV</span>
              <span className="text-[9px] text-muted leading-tight mt-0.5">Spreadsheet</span>
            </button>

            <button type="button" onClick={exportScript}
              className="flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all bg-white/70 hover:bg-white border border-slate-200/60"
              title="Download shell script"
            >
              <Terminal size={16} className="text-slate-600 mb-1" />
              <span className="text-[11px] font-semibold text-slate-800">Script</span>
              <span className="text-[9px] text-muted leading-tight mt-0.5">mv commands</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compare Plans Modal */}
      {showCompareModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
            style={{ background: 'var(--surface-card)', color: 'var(--ink)' }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <GitCompare size={20} className="text-[var(--brand-primary)]" />
                <h3 className="text-lg font-bold font-heading">Compare Plans</h3>
              </div>
              <button type="button" onClick={() => setShowCompareModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1">
              {!savedPlanA ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted mb-4">
                    Save the current state as <strong>Plan A</strong>, then change your space, profile or file pins.
                    Come back here to compare.
                  </p>
                  <button type="button" onClick={() => saveCurrentAsPlanA()}
                    className="px-4 py-2 rounded-xl text-white font-semibold text-xs bg-[var(--brand-primary)]">
                    Save Current as Plan A
                  </button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-600">Plan A (Snapshot)</span>
                        <button type="button" onClick={() => clearPlanA()} className="text-[11px] text-red-500 hover:underline">Clear</button>
                      </div>
                      <div className="text-sm font-semibold mb-1">Space: {formatBytes(savedPlanA.quotaBytes)}</div>
                      <div className="text-xs font-medium text-emerald-600">
                        Keeping: {savedPlanA.keptIds.length} files ({formatBytes(savedPlanA.totalSize)})
                      </div>
                      <div className="text-xs text-muted mt-1">Total importance: {savedPlanA.totalValue}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-[var(--brand-primary)]">Plan B (Current)</span>
                        <button type="button" onClick={() => saveCurrentAsPlanA()} className="text-[11px] text-[var(--brand-primary)] hover:underline">Update A</button>
                      </div>
                      <div className="text-sm font-semibold mb-1">Space: {formatBytes(quotaBytes)}</div>
                      <div className="text-xs font-medium text-emerald-600">
                        Keeping: {keptFiles.length} files ({formatBytes(keptBytes)})
                      </div>
                      <div className="text-xs text-muted mt-1">Total importance: {knapsackResult?.totalValue ?? 0}</div>
                    </div>
                  </div>

                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">Key Differences</h4>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto text-xs">
                    {files.map((f) => {
                      const inA = savedPlanA.keptIds.includes(f.id);
                      const inB = keptItemIds.has(f.id);
                      if (inA === inB) return null;
                      return (
                        <div key={f.id}
                          className="flex items-center justify-between p-2 rounded-lg border bg-white"
                          style={{ borderColor: inB ? 'rgba(16, 185, 129, 0.4)' : 'rgba(249, 168, 184, 0.4)' }}>
                          <span className="font-medium truncate max-w-[280px]">{f.name}</span>
                          <span className="font-mono text-muted">{formatBytes(f.size)}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold"
                            style={{
                              background: inB ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 168, 184, 0.25)',
                              color: inB ? '#10B981' : '#E11D48',
                            }}>
                            {inB ? 'Now kept' : 'Now moved'}
                          </span>
                        </div>
                      );
                    })}
                    {files.every((f) => savedPlanA.keptIds.includes(f.id) === keptItemIds.has(f.id)) && (
                      <p className="text-xs text-muted text-center py-4">Both plans keep the exact same files.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button type="button" onClick={() => setShowCompareModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

