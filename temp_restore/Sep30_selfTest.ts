import { KnapsackItem } from './types';
import { solveFullKnapsack } from './knapsack';
import { solveBruteForce } from './bruteForce';
import { GREEDY_COUNTEREXAMPLE_DATASET, solveGreedy } from './greedy';

export interface SelfTestResult {
  totalCases: number;
  passedCases: number;
  failedCases: number;
  durationMs: number;
  counterExampleFound?: {
    caseIndex: number;
    items: KnapsackItem[];
    quota: number;
    dpValue: number;
    bfValue: number;
  };
  greedyCheckPassed: boolean;
  greedyDpValue: number;
  greedyValue: number;
}

export function runSelfTest(testCount: number = 200): SelfTestResult {
  const startTime = performance.now();
  let passedCases = 0;
  let failedCases = 0;
  let counterExampleFound: SelfTestResult['counterExampleFound'] = undefined;

  for (let c = 0; c < testCount; c++) {
    // Generate 4 to 12 items with random sizes (1-10) and priorities (1-20)
    const n = Math.floor(Math.random() * 8) + 4;
    const items: KnapsackItem[] = [];
    let totalSize = 0;

    for (let i = 0; i < n; i++) {
      const size = Math.floor(Math.random() * 8) + 1;
      const value = Math.floor(Math.random() * 15) + 1;
      totalSize += size;
      items.push({
        id: `test-${c}-${i}`,
        name: `Item ${i + 1}`,
        originalSize: size * 1024 * 1024,
        normalizedSize: size,
        value,
      });
    }

    // Random quota between 1 and totalSize - 1
    const quota = Math.max(1, Math.floor(Math.random() * (totalSize * 0.75)) + 1);

    const bf = solveBruteForce(items, quota);
    const dp = solveFullKnapsack(items, {
      quotaUnits: quota,
      quotaBytes: quota * 1024 * 1024,
      unitBytes: 1024 * 1024,
    });

    if (dp.totalValue === bf.bestValue) {
      // Validate that kept items size does not exceed quota
      const actualSize = dp.keptItems.reduce((acc, it) => acc + it.normalizedSize, 0);
      if (actualSize <= quota) {
        passedCases++;
      } else {
        failedCases++;
        if (!counterExampleFound) {
          counterExampleFound = {
            caseIndex: c,
            items,
            quota,
            dpValue: dp.totalValue,
            bfValue: bf.bestValue,
          };
        }
      }
    } else {
      failedCases++;
      if (!counterExampleFound) {
        counterExampleFound = {
          caseIndex: c,
          items,
          quota,
          dpValue: dp.totalValue,
          bfValue: bf.bestValue,
        };
      }
    }
  }

  // Also verify standard textbook greedy counterexample:
  const greedyCheck = solveGreedy(GREEDY_COUNTEREXAMPLE_DATASET.items, {
    quotaUnits: GREEDY_COUNTEREXAMPLE_DATASET.quota,
    quotaBytes: GREEDY_COUNTEREXAMPLE_DATASET.quota * 1024 * 1024 * 1024,
    unitBytes: 1024 * 1024 * 1024,
  });

  const dpCheck = solveFullKnapsack(GREEDY_COUNTEREXAMPLE_DATASET.items, {
    quotaUnits: GREEDY_COUNTEREXAMPLE_DATASET.quota,
    quotaBytes: GREEDY_COUNTEREXAMPLE_DATASET.quota * 1024 * 1024 * 1024,
    unitBytes: 1024 * 1024 * 1024,
  });

  const greedyCheckPassed = greedyCheck.totalValue === 30 && dpCheck.totalValue === 48;

  return {
    totalCases: testCount,
    passedCases,
    failedCases,
    durationMs: Math.round(performance.now() - startTime),
    counterExampleFound,
    greedyCheckPassed,
    greedyDpValue: dpCheck.totalValue,
    greedyValue: greedyCheck.totalValue,
  };
}

