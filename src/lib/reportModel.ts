import type { FileMetadata, KnapsackResult } from '../engine/types';
import { formatSize, formatScore } from './format';

export interface ReportItem {
  id: string;
  name: string;
  folder: string;
  size: number;
  importance: number;
  edited: boolean;
  constraint: 'Always keep' | 'Never keep' | '';
}

export interface ReportModel {
  title: string;
  generatedAt: string;
  capacityBytes: number;
  spaceGivenFormatted: string;
  spaceUsedFormatted: string;
  spaceFreeFormatted: string;
  spaceUsedBytes: number;
  spaceFreeBytes: number;
  totalFilesCount: number;
  totalFilesBytes: number;
  totalFilesSizeFormatted: string;
  keptCount: number;
  keptBytes: number;
  keptSizeFormatted: string;
  movedCount: number;
  movedBytes: number;
  movedSizeFormatted: string;
  importanceKept: number;
  importanceTotal: number;
  importancePercent: number;
  keepItems: ReportItem[];
  moveItems: ReportItem[];
  alwaysKeepItems: ReportItem[];
  neverKeepItems: ReportItem[];
  solverRuntimeMs: number;
}

export function extractFolder(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash <= 0) return '/';
  return normalized.slice(0, lastSlash);
}

export function buildReportModel(
  files: FileMetadata[],
  result: KnapsackResult | null,
  capacityBytes: number,
  generatedDate = new Date()
): ReportModel {
  const keptIds = new Set(result?.keptItems.map(item => item.id) ?? []);
  const allItems: ReportItem[] = files.map(file => ({
    id: file.id,
    name: file.name,
    folder: extractFolder(file.path),
    size: file.size,
    importance: file.priority,
    edited: file.prioritySource === 'edited',
    constraint: file.isPinned ? 'Always keep' : file.isExcluded ? 'Never keep' : '',
  }));

  const keepItems = allItems
    .filter(item => keptIds.has(item.id))
    .sort((a, b) => b.importance - a.importance || b.size - a.size || a.name.localeCompare(b.name));

  const moveItems = allItems
    .filter(item => !keptIds.has(item.id))
    .sort((a, b) => b.size - a.size || b.importance - a.importance || a.name.localeCompare(b.name));

  const alwaysKeepItems = allItems.filter(item => item.constraint === 'Always keep');
  const neverKeepItems = allItems.filter(item => item.constraint === 'Never keep');

  const spaceUsedBytes = result?.totalSizeKept ?? 0;
  const spaceFreeBytes = Math.max(0, capacityBytes - spaceUsedBytes);
  const totalFilesBytes = files.reduce((sum, f) => sum + f.size, 0);

  const importanceKept = result?.totalValue ?? 0;
  const importanceTotal = result?.maxPossibleValue ?? files.reduce((sum, f) => sum + f.priority, 0);
  const importancePercent = importanceTotal > 0 ? Math.round((importanceKept / importanceTotal) * 100) : 0;

  const dateStr = generatedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = generatedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return {
    title: 'Storage report',
    generatedAt: `${dateStr} ${timeStr}`,
    capacityBytes,
    spaceGivenFormatted: formatSize(capacityBytes),
    spaceUsedFormatted: formatSize(spaceUsedBytes),
    spaceFreeFormatted: formatSize(spaceFreeBytes),
    spaceUsedBytes,
    spaceFreeBytes,
    totalFilesCount: files.length,
    totalFilesBytes,
    totalFilesSizeFormatted: formatSize(totalFilesBytes),
    keptCount: keepItems.length,
    keptBytes: spaceUsedBytes,
    keptSizeFormatted: formatSize(spaceUsedBytes),
    movedCount: moveItems.length,
    movedBytes: result?.totalSizeDropped ?? (totalFilesBytes - spaceUsedBytes),
    movedSizeFormatted: formatSize(result?.totalSizeDropped ?? (totalFilesBytes - spaceUsedBytes)),
    importanceKept,
    importanceTotal,
    importancePercent,
    keepItems,
    moveItems,
    alwaysKeepItems,
    neverKeepItems,
    solverRuntimeMs: result?.executionTimeMs ?? 0,
  };
}

export function generateReportCsv(model: ReportModel): string {
  const rows = [
    ['path_or_folder', 'name', 'size_bytes', 'importance', 'placement', 'constraint'],
    ...model.keepItems.map(item => [item.folder, item.name, item.size, item.importance, 'Keep', item.constraint]),
    ...model.moveItems.map(item => [item.folder, item.name, item.size, item.importance, 'Move', item.constraint]),
  ];
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return rows.map(r => r.map(cell).join(',')).join('\r\n');
}

export function generateReportJson(model: ReportModel): string {
  return JSON.stringify({
    title: model.title,
    generatedAt: model.generatedAt,
    targetCapacityBytes: model.capacityBytes,
    totals: {
      filesTotal: model.totalFilesCount,
      filesKept: model.keptCount,
      filesMoved: model.movedCount,
      bytesKept: model.keptBytes,
      bytesMoved: model.movedBytes,
      importanceKept: model.importanceKept,
      importanceTotal: model.importanceTotal,
      importancePercent: model.importancePercent,
      solverRuntimeMs: model.solverRuntimeMs,
    },
    files: [
      ...model.keepItems.map(item => ({
        folder: item.folder,
        name: item.name,
        size_bytes: item.size,
        importance: item.importance,
        placement: 'Keep',
        constraint: item.constraint,
        edited: item.edited,
      })),
      ...model.moveItems.map(item => ({
        folder: item.folder,
        name: item.name,
        size_bytes: item.size,
        importance: item.importance,
        placement: 'Move',
        constraint: item.constraint,
        edited: item.edited,
      })),
    ],
  }, null, 2);
}

export function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export function generateReportMigrationScript(files: FileMetadata[], model: ReportModel): string {
  const movedIds = new Set(model.moveItems.map(m => m.id));
  const movedFiles = files.filter(f => movedIds.has(f.id));
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
  movedFiles.forEach((file, index) => {
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
