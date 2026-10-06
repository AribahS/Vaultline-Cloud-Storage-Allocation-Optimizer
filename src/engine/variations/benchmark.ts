import { KnapsackItem } from '../types';
import { solveFullKnapsack } from '../knapsack';

export interface BenchmarkPoint {
  n: number;
  W: number;
  productNW: number;
  dpTimeMs: number;
  bruteForceTheoreticalOps: number;
  bruteForceActualMs?: number;
}

export function runKnapsackBenchmark(maxN: number = 200, step: number = 25): BenchmarkPoint[] {
  const points: BenchmarkPoint[] = [];
  const W_fixed = 1000;
  const unitBytes = 1024 * 1024;

  for (let n = 25; n <= maxN; n += step) {
    // Generate synthetic items
    const items: KnapsackItem[] = Array.from({ length: n }, (_, i) => ({
      id: `bench-${i}`,
      name: `item-${i}`,
      originalSize: ((i % 15) + 1) * unitBytes,
      normalizedSize: (i % 15) + 1,
      value: (i % 10) + 1,
    }));

    const start = performance.now();
    solveFullKnapsack(items, {
      quotaUnits: W_fixed,
      quotaBytes: W_fixed * unitBytes,
      unitBytes,
    });
    const dpTimeMs = Math.max(0.01, performance.now() - start);

    // Brute force theoretical subsets 2^n
    const bruteForceTheoreticalOps = Math.pow(2, Math.min(60, n));

    let bruteForceActualMs: number | undefined;
    if (n <= 20) {
      // Run quick real brute force timing if small
      const bfStart = performance.now();
      let bestV = 0;
      const maskLimit = 1 << n;
      for (let m = 0; m < maskLimit; m++) {
        let curW = 0;
        let curV = 0;
        for (let j = 0; j < n; j++) {
          if ((m & (1 << j)) !== 0) {
            curW += items[j].normalizedSize;
            curV += items[j].value;
          }
        }
        if (curW <= W_fixed && curV > bestV) {
          bestV = curV;
        }
      }
      bruteForceActualMs = Math.max(0.01, performance.now() - bfStart);
    }

    points.push({
      n,
      W: W_fixed,
      productNW: n * W_fixed,
      dpTimeMs: Math.round(dpTimeMs * 100) / 100,
      bruteForceTheoreticalOps,
      bruteForceActualMs: bruteForceActualMs ? Math.round(bruteForceActualMs * 100) / 100 : undefined,
    });
  }

  return points;
}
