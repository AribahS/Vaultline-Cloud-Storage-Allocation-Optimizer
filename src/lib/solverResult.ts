import type { KnapsackItem, KnapsackResult } from '../engine/types';

/** Completes zero-weight regular items that the engine's zero-capacity fast path omits. */
export function includeProfitableZeroWeightItems(items: KnapsackItem[], result: KnapsackResult): KnapsackResult {
  const keptIds = new Set(result.keptItems.map(item => item.id));
  const zeroWeight = items.filter(item => !item.isExcluded && !item.isPinned && item.normalizedSize === 0 && item.value > 0 && !keptIds.has(item.id));
  if (!zeroWeight.length) return result;
  const zeroIds = new Set(zeroWeight.map(item => item.id));
  return {
    ...result,
    keptItems: [...result.keptItems, ...zeroWeight],
    droppedItems: result.droppedItems.filter(item => !zeroIds.has(item.id)),
    totalValue: result.totalValue + zeroWeight.reduce((sum, item) => sum + item.value, 0),
    totalSizeKept: result.totalSizeKept + zeroWeight.reduce((sum, item) => sum + item.originalSize, 0),
    totalSizeDropped: result.totalSizeDropped - zeroWeight.reduce((sum, item) => sum + item.originalSize, 0),
    normalizedSizeKept: result.normalizedSizeKept + zeroWeight.reduce((sum, item) => sum + item.normalizedSize, 0),
  };
}
