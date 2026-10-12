import type { FileMetadata, KnapsackResult } from '../engine/types';
import {
  buildReportModel,
  generateReportCsv,
  generateReportJson,
  generateReportMigrationScript,
  shellSingleQuote,
  type ReportModel,
} from './reportModel';
import { generateReportPdf, type GeneratePdfOptions } from './reportPdf';

export {
  buildReportModel,
  generateReportCsv,
  generateReportJson,
  generateReportMigrationScript,
  shellSingleQuote,
  generateReportPdf,
};

export type PlanPlacement = 'Keep' | 'Move';
export interface ExportPlanFile {
  id: string;
  path: string;
  name: string;
  size_bytes: number;
  importance: number;
  placement: PlanPlacement;
  constraint: 'Always keep' | 'Never keep' | '';
}

export function buildExportPlan(files: FileMetadata[], result: KnapsackResult, generatedAt = new Date().toISOString()) {
  const kept = new Set(result.keptItems.map(item => item.id));
  const rows: ExportPlanFile[] = files.map(file => ({
    id: file.id,
    path: file.path,
    name: file.name,
    size_bytes: file.size,
    importance: file.priority,
    placement: kept.has(file.id) ? 'Keep' : 'Move',
    constraint: file.isPinned ? 'Always keep' : file.isExcluded ? 'Never keep' : '',
  }));
  return {
    generatedAt,
    targetCapacityBytes: result.quotaBytes,
    totals: {
      filesKept: result.keptItems.length,
      filesMoved: result.droppedItems.length,
      bytesKept: result.totalSizeKept,
      bytesMoved: result.totalSizeDropped,
      importanceKept: result.totalValue,
      importanceAvailable: result.maxPossibleValue,
      solverRuntimeMs: result.executionTimeMs,
    },
    files: rows,
  };
}

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export function generatePlanCsv(plan: ReturnType<typeof buildExportPlan>): string {
  const rows = [
    ['path', 'name', 'size_bytes', 'importance', 'placement', 'constraint'],
    ...plan.files.map(file => [file.path, file.name, file.size_bytes, file.importance, file.placement, file.constraint]),
  ];
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}

export function generateShellMigrationScript(plan: ReturnType<typeof buildExportPlan>): string {
  const moved = plan.files.filter(file => file.placement === 'Move');
  const lines = [
    '#!/usr/bin/env bash',
    '# Generated migration text from Vaultline. This script was NOT run by the app.',
    '# Review every path and command before use. It uses mv into a destination folder.',
    '# Set DESTINATION_DIR before running. DRY_RUN defaults to 1; set DRY_RUN=0 to move files.',
    'set -euo pipefail',
    'DESTINATION_DIR=""',
    'DRY_RUN="${DRY_RUN:-1}"',
    'if [[ -z "$DESTINATION_DIR" ]]; then echo "Set DESTINATION_DIR in this script before use." >&2; exit 1; fi',
    '',
  ];
  moved.forEach((file, index) => {
    const variable = `SOURCE_${index + 1}`;
    lines.push(`${variable}=${shellSingleQuote(file.path)}`);
    lines.push(`if [[ "$DRY_RUN" == "0" ]]; then`);
    lines.push(`  mv -- "\${${variable}}" "$DESTINATION_DIR/"`);
    lines.push('else');
    lines.push(`  printf '%s\\n' ${shellSingleQuote(`DRY RUN: mv -- "$${variable}" "$DESTINATION_DIR/"`)}`);
    lines.push('fi', '');
  });
  return lines.join('\n');
}

export function generatePlanJson(plan: ReturnType<typeof buildExportPlan>): string {
  return JSON.stringify(plan, null, 2);
}

export function planFileMetadata(files: FileMetadata[], ids: string[]) {
  const byId = new Map(files.map(file => [file.id, file]));
  return ids.map(id => byId.get(id)).filter((file): file is FileMetadata => Boolean(file));
}

export function downloadPlanFile(filename: string, content: string | Blob, mime?: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
