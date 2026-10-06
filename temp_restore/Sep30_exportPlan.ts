import { FileMetadata, KnapsackResult } from './types';
import { formatBytes } from './normalizer';

export function generateCsvExport(files: FileMetadata[], result: KnapsackResult): string {
  const keptIdSet = new Set(result.keptItems.map((i) => i.id));

  const headers = ['Name', 'Relative Path', 'Size (Bytes)', 'Size (Formatted)', 'Category', 'Priority', 'Status', 'Pinned', 'Excluded'];
  const rows = files.map((f) => {
    let status = 'Move/Archive';
    if (keptIdSet.has(f.id)) {
      status = 'Keep in Paid Cloud';
    } else if (f.isExcluded) {
      status = 'Excluded';
    }

    return [
      `"${f.name.replace(/"/g, '""')}"`,
      `"${f.path.replace(/"/g, '""')}"`,
      f.size,
      `"${formatBytes(f.size)}"`,
      f.category,
      f.priority,
      status,
      f.isPinned ? 'Yes' : 'No',
      f.isExcluded ? 'Yes' : 'No',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function generateJsonExport(files: FileMetadata[], result: KnapsackResult): string {
  const keptIdSet = new Set(result.keptItems.map((i) => i.id));
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    tool: 'Vaultline Cloud Storage Allocation Optimizer',
    quotaBytes: result.quotaBytes,
    quotaFormatted: formatBytes(result.quotaBytes),
    totalStorageUsed: formatBytes(result.totalSizeKept),
    totalPriorityAchieved: result.totalValue,
    maxPossiblePriority: result.maxPossibleValue,
    filesKeptCount: result.keptItems.length,
    filesDroppedCount: result.droppedItems.length,
    keptFiles: files.filter((f) => keptIdSet.has(f.id)).map((f) => ({
      name: f.name,
      path: f.path,
      size: f.size,
      sizeFormatted: formatBytes(f.size),
      priority: f.priority,
      category: f.category,
    })),
    droppedFiles: files.filter((f) => !keptIdSet.has(f.id)).map((f) => ({
      name: f.name,
      path: f.path,
      size: f.size,
      sizeFormatted: formatBytes(f.size),
      priority: f.priority,
      category: f.category,
    })),
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function generateTextSummary(files: FileMetadata[], result: KnapsackResult): string {
  const keptPercent = result.maxPossibleValue > 0
    ? Math.round((result.totalValue / result.maxPossibleValue) * 100)
    : 0;

  return [
    `=======================================================`,
    `VAULTLINE EXECUTIVE STORAGE OPTIMIZATION REPORT`,
    `=======================================================`,
    `Date Generated: ${new Date().toLocaleDateString()}`,
    `Target Capacity: ${formatBytes(result.quotaBytes)}`,
    `Storage Kept:    ${formatBytes(result.totalSizeKept)} (${Math.round((result.totalSizeKept / Math.max(1, result.quotaBytes)) * 100)}% capacity)`,
    `Offloaded Space: ${formatBytes(result.totalSizeDropped)} (${result.droppedItems.length} files to move)`,
    `Importance Won:  ${result.totalValue} / ${result.maxPossibleValue} pts (${keptPercent}%)`,
    `Files Kept:      ${result.keptItems.length} files`,
    ``,
    `TOP FILES RETAINED IN VAULT:`,
    ...result.keptItems.slice(0, 15).map((item, idx) => `  ${idx + 1}. ${item.name} (${formatBytes(item.originalSize)}, Importance ${item.value}/10)`),
    result.keptItems.length > 15 ? `  ... and ${result.keptItems.length - 15} more files` : '',
    ``,
    `FILES RECOMMENDED FOR EXTERNAL ARCHIVING:`,
    ...result.droppedItems.slice(0, 15).map((item, idx) => `  ${idx + 1}. ${item.name} (${formatBytes(item.originalSize)}, Importance ${item.value}/10)`),
    result.droppedItems.length > 15 ? `  ... and ${result.droppedItems.length - 15} more files` : '',
    ``,
    `Provably optimal allocation calculated via 0/1 Knapsack Dynamic Programming.`,
    `=======================================================`,
  ].filter(Boolean).join('\n');
}

export function generateWordDocumentHtml(files: FileMetadata[], result: KnapsackResult): string {
  const keptPercent = result.maxPossibleValue > 0
    ? Math.round((result.totalValue / result.maxPossibleValue) * 100)
    : 0;

  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Vaultline Executive Storage Report</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; margin: 36px; }
    h1 { color: #1e3a29; border-bottom: 3px solid #b8860b; padding-bottom: 8px; font-size: 26pt; margin-bottom: 4pt; }
    .subtitle { color: #64748b; font-size: 11pt; margin-bottom: 24pt; }
    h2 { color: #2f6b4f; margin-top: 24pt; font-size: 16pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .kpi-table { width: 100%; border-collapse: separate; border-spacing: 12px; margin: 16px 0; }
    .kpi-card { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; text-align: center; border-radius: 8px; }
    .kpi-title { font-size: 9pt; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .kpi-val { font-size: 20pt; font-weight: 700; color: #1e3a29; margin-top: 4px; }
    table.data-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    table.data-table th { background-color: #1e3a29; color: #ffffff; padding: 10px 12px; text-align: left; font-size: 10pt; }
    table.data-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 9.5pt; }
    .kept-badge { color: #166534; font-weight: bold; }
    .move-badge { color: #991b1b; font-weight: bold; }
    .footer-note { margin-top: 40px; font-size: 9pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>Vaultline Executive Storage Report</h1>
  <div class="subtitle">Generated on ${new Date().toLocaleDateString()} &bull; Provably Optimal Allocation Plan</div>
  
  <h2>Executive Summary KPIs</h2>
  <table class="kpi-table">
    <tr>
      <td class="kpi-card">
        <div class="kpi-title">Target Capacity</div>
        <div class="kpi-val">${formatBytes(result.quotaBytes)}</div>
      </td>
      <td class="kpi-card">
        <div class="kpi-title">Kept Storage Payload</div>
        <div class="kpi-val">${formatBytes(result.totalSizeKept)}</div>
      </td>
      <td class="kpi-card">
        <div class="kpi-title">Offloaded Space</div>
        <div class="kpi-val">${formatBytes(result.totalSizeDropped)}</div>
      </td>
      <td class="kpi-card">
        <div class="kpi-title">Importance Retained</div>
        <div class="kpi-val">${keptPercent}%</div>
      </td>
    </tr>
  </table>

  <h2>Kept Files Manifest (${result.keptItems.length} items)</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>File Name</th>
        <th>Size</th>
        <th>Importance Score</th>
        <th>Category</th>
      </tr>
    </thead>
    <tbody>
      ${result.keptItems.map(item => `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td>${formatBytes(item.originalSize)}</td>
          <td><span class="kept-badge">${item.value}/10</span></td>
          <td>${item.category || 'file'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>External Storage Action List (${result.droppedItems.length} items)</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>File Name</th>
        <th>Size</th>
        <th>Importance Score</th>
        <th>Category</th>
      </tr>
    </thead>
    <tbody>
      ${result.droppedItems.map(item => `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td>${formatBytes(item.originalSize)}</td>
          <td><span class="move-badge">${item.value}/10</span></td>
          <td>${item.category || 'file'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer-note">
    This executive document was generated by Vaultline. Zero file payload was transmitted off your machine.
  </div>
</body>
</html>
  `;
}

export function generateActionPlanBash(files: FileMetadata[], result: KnapsackResult): string {
  const keptIdSet = new Set(result.keptItems.map((i) => i.id));
  const toMove = files.filter((f) => !keptIdSet.has(f.id) && !f.isExcluded);

  const lines = [
    `#!/usr/bin/env bash`,
    `# ==============================================================================`,
    `# VAULTLINE CLOUD STORAGE ACTION PLAN (BASH / ZSH)`,
    `# Generated at: ${new Date().toISOString()}`,
    `# `,
    `# [SAFETY NOTICE & DISCLAIMER]:`,
    `# This script moves dropped files into a local folder named "_to_archive/".`,
    `# It DOES NOT delete any files.`,
    `# ALWAYS REVIEW the list of commands before executing.`,
    `# To run: chmod +x vaultline_archive_plan.sh && ./vaultline_archive_plan.sh`,
    `# ==============================================================================`,
    ``,
    `set -e`,
    `echo "Starting Vaultline Archive Plan..."`,
    `mkdir -p "_to_archive"`,
    ``,
    `# Total files to move: ${toMove.length} (${formatBytes(result.totalSizeDropped)})`,
    ...toMove.map((f) => {
      const sanitizedSrc = f.path.startsWith('/') ? f.path.slice(1) : f.path;
      return `mkdir -p "_to_archive/$(dirname "${sanitizedSrc}")" && mv "${sanitizedSrc}" "_to_archive/${sanitizedSrc}"`;
    }),
    ``,
    `echo "Action plan completed! All dropped files are now safely in _to_archive/."`,
  ];

  return lines.join('\n');
}

export function generateActionPlanPowerShell(files: FileMetadata[], result: KnapsackResult): string {
  const keptIdSet = new Set(result.keptItems.map((i) => i.id));
  const toMove = files.filter((f) => !keptIdSet.has(f.id) && !f.isExcluded);

  const lines = [
    `<#`,
    `==============================================================================`,
    `VAULTLINE CLOUD STORAGE ACTION PLAN (POWERSHELL)`,
    `Generated at: ${new Date().toISOString()}`,
    ``,
    `[SAFETY NOTICE & DISCLAIMER]:`,
    `This script moves dropped files into a local folder named "_to_archive/".`,
    `It DOES NOT delete any files.`,
    `ALWAYS REVIEW the list of commands before executing.`,
    `==============================================================================`,
    `#>`,
    `$ErrorActionPreference = "Stop"`,
    `Write-Host "Starting Vaultline Archive Plan..." -ForegroundColor Cyan`,
    `$archiveDir = Join-Path $PSScriptRoot "_to_archive"`,
    `if (-not (Test-Path $archiveDir)) { New-Item -ItemType Directory -Path $archiveDir | Out-Null }`,
    ``,
    `# Files to archive: ${toMove.length} (${formatBytes(result.totalSizeDropped)})`,
    ...toMove.map((f) => {
      const sanitizedSrc = f.path.replace(/\//g, '\\').replace(/^\\/, '');
      return `New-Item -ItemType Directory -Force -Path (Split-Path (Join-Path $archiveDir "${sanitizedSrc}")) | Out-Null; Move-Item -Path "${sanitizedSrc}" -Destination (Join-Path $archiveDir "${sanitizedSrc}") -Force`;
    }),
    ``,
    `Write-Host "Action plan completed! Files are in _to_archive." -ForegroundColor Green`,
  ];

  return lines.join('\r\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

