import { KnapsackItem } from './types';

export interface BruteForceResult {
  bestSubset: KnapsackItem[];
  bestValue: number;
  bestSize: number;
  subsetsChecked: number;
  executionTimeMs: number;
}

export function solveBruteForce(
  items: KnapsackItem[],
  quotaUnits: number
): BruteForceResult {
  const startTime = performance.now();
  const n = items.length;

  if (n > 22) {
    throw new Error(`Brute force is capped at 22 items for browser safety (received ${n} items).`);
  }

  const totalSubsets = 1 << n; // 2^n
  let bestValue = 0;
  let bestSize = 0;
  let bestMask = 0;
  let bestCount = Infinity;

  for (let mask = 0; mask < totalSubsets; mask++) {
    let currentWeight = 0;
    let currentValue = 0;
    let count = 0;

    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) {
        currentWeight += items[i].normalizedSize;
        currentValue += items[i].value;
        count++;
      }
    }

    if (currentWeight <= quotaUnits) {
      if (currentValue > bestValue) {
        bestValue = currentValue;
        bestSize = currentWeight;
        bestMask = mask;
        bestCount = count;
      } else if (currentValue === bestValue && count < bestCount) {
        // Tie-breaker: prefer fewer items
        bestSize = currentWeight;
        bestMask = mask;
        bestCount = count;
      }
    }
  }

  const bestSubset: KnapsackItem[] = [];
  for (let i = 0; i < n; i++) {
    if ((bestMask & (1 << i)) !== 0) {
      bestSubset.push(items[i]);
    }
  }

  return {
    bestSubset,
    bestValue,
    bestSize,
    subsetsChecked: totalSubsets,
    executionTimeMs: performance.now() - startTime,
  };
}

