import { KnapsackItem, KnapsackResult } from './types';
import { SolveFullKnapsackOptions } from './knapsack';

export interface GreedyStep {
  item: KnapsackItem;
  ratio: number;
  fits: boolean;
  cumulativeValue: number;
  cumulativeSize: number;
  reason: string;
}

export interface GreedyResult {
  keptItems: KnapsackItem[];
  droppedItems: KnapsackItem[];
  totalValue: number;
  totalSizeKept: number;
  steps: GreedyStep[];
}

export function solveGreedy(
  items: KnapsackItem[],
  options: SolveFullKnapsackOptions
): GreedyResult {
  const { quotaUnits: W } = options;
  const active = items.filter((item) => !item.isExcluded);

  const pinned = active.filter((i) => i.isPinned);
  const regular = active.filter((i) => !i.isPinned);

  let currentQuota = W;
  let totalValue = 0;
  let totalSizeKept = 0;
  const kept: KnapsackItem[] = [];
  const dropped: KnapsackItem[] = [];
  const steps: GreedyStep[] = [];

  // Add pinned items first
  for (const item of pinned) {
    if (item.normalizedSize <= currentQuota) {
      kept.push(item);
      currentQuota -= item.normalizedSize;
      totalValue += item.value;
      totalSizeKept += item.originalSize;
      steps.push({
        item,
        ratio: item.value / Math.max(1, item.normalizedSize),
        fits: true,
        cumulativeValue: totalValue,
        cumulativeSize: totalSizeKept,
        reason: `Pinned item "${item.name}" was forcibly included first.`,
      });
    } else {
      dropped.push(item);
      steps.push({
        item,
        ratio: item.value / Math.max(1, item.normalizedSize),
        fits: false,
        cumulativeValue: totalValue,
        cumulativeSize: totalSizeKept,
        reason: `Pinned item "${item.name}" exceeds remaining quota.`,
      });
    }
  }

  // Sort regular items by priority-to-size ratio (descending)
  const sorted = [...regular].sort((a, b) => {
    const ratioA = a.value / Math.max(1, a.normalizedSize);
    const ratioB = b.value / Math.max(1, b.normalizedSize);
    if (Math.abs(ratioA - ratioB) > 1e-9) {
      return ratioB - ratioA;
    }
    // Tie breaker: higher absolute value, then smaller size
    if (a.value !== b.value) {
      return b.value - a.value;
    }
    return a.normalizedSize - b.normalizedSize;
  });

  for (const item of sorted) {
    const ratio = item.value / Math.max(1, item.normalizedSize);
    if (item.normalizedSize <= currentQuota) {
      kept.push(item);
      currentQuota -= item.normalizedSize;
      totalValue += item.value;
      totalSizeKept += item.originalSize;
      steps.push({
        item,
        ratio,
        fits: true,
        cumulativeValue: totalValue,
        cumulativeSize: totalSizeKept,
        reason: `Density ${ratio.toFixed(2)} pts/unit. Fits in remaining capacity (${currentQuota + item.normalizedSize} -> ${currentQuota}). Included.`,
      });
    } else {
      dropped.push(item);
      steps.push({
        item,
        ratio,
        fits: false,
        cumulativeValue: totalValue,
        cumulativeSize: totalSizeKept,
        reason: `Density ${ratio.toFixed(2)} pts/unit. Needs ${item.normalizedSize} units, but only ${currentQuota} available. Dropped.`,
      });
    }
  }

  return {
    keptItems: kept,
    droppedItems: dropped,
    totalValue,
    totalSizeKept,
    steps,
  };
}

/**
 * Standard textbook counterexample where Greedy fails compared to DP:
 * Quota: 10
 * Item A: size 6, value 30 (ratio = 5.0)
 * Item B: size 5, value 24 (ratio = 4.8)
 * Item C: size 5, value 24 (ratio = 4.8)
 * Greedy takes A (30), leaves 4 units (B & C do not fit). Total = 30.
 * DP takes B + C (24 + 24), leaves 0 units. Total = 48.
 */
export const GREEDY_COUNTEREXAMPLE_DATASET = {
  quota: 10,
  items: [
    {
      id: 'counter-a',
      name: 'System_VM_Snapshot.raw',
      originalSize: 6 * 1024 * 1024 * 1024,
      normalizedSize: 6,
      value: 30,
      category: 'archive' as const,
    },
    {
      id: 'counter-b',
      name: 'Client_Project_Assets.tar',
      originalSize: 5 * 1024 * 1024 * 1024,
      normalizedSize: 5,
      value: 24,
      category: 'document' as const,
    },
    {
      id: 'counter-c',
      name: 'Financial_Records_2025.sql',
      originalSize: 5 * 1024 * 1024 * 1024,
      normalizedSize: 5,
      value: 24,
      category: 'database' as const,
    },
  ],
};
