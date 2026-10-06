import { KnapsackItem } from '../types';
import { solveFullKnapsack } from '../knapsack';

export interface FptasResult {
  epsilon: number;
  scalingFactorK: number;
  scaledItems: { item: KnapsackItem; scaledValue: number }[];
  approxOptimalItems: KnapsackItem[];
  approxValueOriginal: number;
  exactOptimalValue: number;
  achievedRatio: number; // approx / exact
  guaranteedRatio: number; // 1 - epsilon
  exactTableColumns: number; // W
  scaledTableColumns: number; // sum(v'_i)
  speedupPercentage: number;
}

export function solveFPTAS(
  items: KnapsackItem[],
  quotaUnits: number,
  epsilon: number = 0.2
): FptasResult {
  const n = items.length;
  if (n === 0) {
    return {
      epsilon,
      scalingFactorK: 1,
      scaledItems: [],
      approxOptimalItems: [],
      approxValueOriginal: 0,
      exactOptimalValue: 0,
      achievedRatio: 1,
      guaranteedRatio: 1 - epsilon,
      exactTableColumns: quotaUnits,
      scaledTableColumns: 0,
      speedupPercentage: 0,
    };
  }

  // 1. Solve exact DP first as baseline
  const unitBytes = 1024 * 1024;
  const exactRes = solveFullKnapsack(items, {
    quotaUnits,
    quotaBytes: quotaUnits * unitBytes,
    unitBytes,
  });
  const exactOptimalValue = Math.max(1, exactRes.totalValue);

  // 2. FPTAS Scaling factor K
  const maxVal = Math.max(...items.map((i) => i.value));
  const K = Math.max(0.1, (epsilon * maxVal) / n);

  const scaledItems = items.map((item) => ({
    item,
    scaledValue: Math.max(1, Math.floor(item.value / K)),
  }));

  const maxScaledValueSum = scaledItems.reduce((acc, it) => acc + it.scaledValue, 0);

  // 3. DP by value: dp[i][v] = minimum weight required to achieve scaled value v
  // dp array size: (maxScaledValueSum + 1)
  const dpWeight: number[] = new Array(maxScaledValueSum + 1).fill(Infinity);
  dpWeight[0] = 0;

  // Track parent for backtracking: parent[i][v] = true if item i was taken
  const decisions: boolean[][] = Array.from({ length: n }, () =>
    new Array(maxScaledValueSum + 1).fill(false)
  );

  for (let i = 0; i < n; i++) {
    const it = scaledItems[i];
    const w = it.item.normalizedSize;
    const v = it.scaledValue;

    for (let curV = maxScaledValueSum; curV >= v; curV--) {
      if (dpWeight[curV - v] + w < dpWeight[curV]) {
        dpWeight[curV] = dpWeight[curV - v] + w;
        decisions[i][curV] = true;
      }
    }
  }

  // Find max scaled value with weight <= quotaUnits
  let bestScaledVal = 0;
  for (let v = maxScaledValueSum; v >= 0; v--) {
    if (dpWeight[v] <= quotaUnits) {
      bestScaledVal = v;
      break;
    }
  }

  // Backtrack
  const approxOptimalItems: KnapsackItem[] = [];
  let curV = bestScaledVal;
  for (let i = n - 1; i >= 0; i--) {
    if (decisions[i][curV]) {
      approxOptimalItems.push(scaledItems[i].item);
      curV -= scaledItems[i].scaledValue;
    }
  }

  approxOptimalItems.reverse();
  const approxValueOriginal = approxOptimalItems.reduce((acc, it) => acc + it.value, 0);
  const achievedRatio = Math.min(1.0, Math.round((approxValueOriginal / exactOptimalValue) * 1000) / 1000);
  const guaranteedRatio = Math.round((1 - epsilon) * 1000) / 1000;

  const exactTableColumns = quotaUnits;
  const scaledTableColumns = maxScaledValueSum;
  const speedupPercentage = Math.round(
    Math.max(0, (1 - (n * scaledTableColumns) / Math.max(1, n * exactTableColumns))) * 100
  );

  return {
    epsilon,
    scalingFactorK: Math.round(K * 100) / 100,
    scaledItems,
    approxOptimalItems,
    approxValueOriginal,
    exactOptimalValue,
    achievedRatio,
    guaranteedRatio,
    exactTableColumns,
    scaledTableColumns,
    speedupPercentage,
  };
}
