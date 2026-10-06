export interface DualConstraintItem {
  id: string;
  name: string;
  storageGb: number;
  bandwidthMbps: number;
  priority: number;
}

export interface DualConstraintResult {
  keptItems: DualConstraintItem[];
  droppedItems: DualConstraintItem[];
  totalPriority: number;
  totalStorageGb: number;
  totalBandwidthMbps: number;
  storageCapGb: number;
  bandwidthCapMbps: number;
  // 2D slice of table at item i: dp[w][b]
  sliceRowIndex: number;
  sliceItemName: string;
  slice2D: number[][]; // [w][b]
  storageOnlyViolatesBandwidth: boolean;
  storageOnlyBandwidthUsed: number;
}

/**
 * 2D (Multi-dimensional) Knapsack: Maximize priority subject to Storage <= W and Bandwidth <= B.
 * Demonstrates how another dimension expands state space from O(nW) to O(nW B).
 */
export function solveDualConstraint(
  items: DualConstraintItem[],
  storageCapGb: number,
  bandwidthCapMbps: number,
  selectedSliceRow: number = 0
): DualConstraintResult {
  const n = items.length;
  const W = Math.max(1, Math.min(25, storageCapGb));
  const B = Math.max(1, Math.min(25, bandwidthCapMbps));

  // dp[w][b] using 3D table for sliced inspection
  // dimensions: (n+1) x (W+1) x (B+1)
  const dp: number[][][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: W + 1 }, () => new Array(B + 1).fill(0))
  );

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    const s = item.storageGb;
    const b = item.bandwidthMbps;
    const v = item.priority;

    for (let w = 0; w <= W; w++) {
      for (let bw = 0; bw <= B; bw++) {
        const skip = dp[i - 1][w][bw];
        if (s <= w && b <= bw) {
          const take = v + dp[i - 1][w - s][bw - b];
          dp[i][w][bw] = Math.max(skip, take);
        } else {
          dp[i][w][bw] = skip;
        }
      }
    }
  }

  // Backtrack to find kept items
  let curW = W;
  let curB = B;
  const kept: DualConstraintItem[] = [];
  const dropped: DualConstraintItem[] = [];

  for (let i = n; i >= 1; i--) {
    const item = items[i - 1];
    const s = item.storageGb;
    const b = item.bandwidthMbps;
    const valCurr = dp[i][curW][curB];
    const valPrev = dp[i - 1][curW][curB];

    if (s <= curW && b <= curB && valCurr === item.priority + dp[i - 1][curW - s][curB - b] && valCurr !== valPrev) {
      kept.push(item);
      curW -= s;
      curB -= b;
    } else {
      dropped.push(item);
    }
  }

  kept.reverse();
  dropped.reverse();

  // Storage-only check: what if we solved only for Storage?
  // Let's see if 1D knapsack over-allocates bandwidth:
  const dp1D: number[] = new Array(W + 1).fill(0);
  const parent1D: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    for (let w = W; w >= item.storageGb; w--) {
      if (dp1D[w - item.storageGb] + item.priority > dp1D[w]) {
        dp1D[w] = dp1D[w - item.storageGb] + item.priority;
        parent1D[i][w] = 1;
      }
    }
  }

  let testW = W;
  let storageOnlyBandwidthUsed = 0;
  for (let i = n; i >= 1; i--) {
    if (parent1D[i][testW] === 1) {
      storageOnlyBandwidthUsed += items[i - 1].bandwidthMbps;
      testW -= items[i - 1].storageGb;
    }
  }

  const storageOnlyViolatesBandwidth = storageOnlyBandwidthUsed > bandwidthCapMbps;

  // Extract 2D slice at requested row index
  const safeSliceIdx = Math.max(1, Math.min(n, selectedSliceRow || n));
  const slice2D = dp[safeSliceIdx];
  const sliceItemName = items[safeSliceIdx - 1]?.name || 'Item';

  return {
    keptItems: kept,
    droppedItems: dropped,
    totalPriority: dp[n][W][B],
    totalStorageGb: kept.reduce((a, b) => a + b.storageGb, 0),
    totalBandwidthMbps: kept.reduce((a, b) => a + b.bandwidthMbps, 0),
    storageCapGb: W,
    bandwidthCapMbps: B,
    sliceRowIndex: safeSliceIdx,
    sliceItemName,
    slice2D,
    storageOnlyViolatesBandwidth,
    storageOnlyBandwidthUsed,
  };
}

