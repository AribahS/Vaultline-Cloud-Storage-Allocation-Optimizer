import { formatSize, pluralize } from './format';

export function generateReportSummary(result, generatedAt = new Date()) {
  const importancePct = result.maxPossibleValue > 0
    ? Math.round((result.totalValue / result.maxPossibleValue) * 100)
    : 0;
  const lines = [
    '=======================================================',
    'VAULTLINE EXECUTIVE STORAGE OPTIMIZATION REPORT',
    '=======================================================',
    `Date Generated: ${generatedAt.toLocaleDateString()}`,
    `Target Capacity: ${formatSize(result.quotaBytes)}`,
    `Storage Kept:    ${formatSize(result.totalSizeKept)} (${Math.round((result.totalSizeKept / Math.max(1, result.quotaBytes)) * 100)}% capacity)`,
    `Offloaded Space: ${formatSize(result.totalSizeDropped)} (${pluralize(result.droppedItems.length, 'file')} to move)`,
    `Importance Won:  ${result.totalValue} / ${result.maxPossibleValue} pts (${importancePct}%)`,
    `Files Kept:      ${pluralize(result.keptItems.length, 'file')}`,
    '',
    'TOP FILES RETAINED IN VAULT:',
    ...result.keptItems.slice(0, 15).map((item, index) =>
      `  ${index + 1}. ${item.name} (${formatSize(item.originalSize)}, Importance ${item.value}/10)`,
    ),
    '',
    'FILES RECOMMENDED FOR EXTERNAL ARCHIVING:',
    ...result.droppedItems.slice(0, 15).map((item, index) =>
      `  ${index + 1}. ${item.name} (${formatSize(item.originalSize)}, Importance ${item.value}/10)`,
    ),
    '',
    'Provably optimal allocation calculated via 0/1 Knapsack Dynamic Programming.',
    '=======================================================',
  ];
  return lines.join('\n');
}
