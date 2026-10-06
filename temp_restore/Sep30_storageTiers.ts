export type StorageTierId = 'hot' | 'cool' | 'archive' | 'skip';

export interface StorageTierConfig {
  id: StorageTierId;
  name: string;
  costMultiplier: number; // cost per GB multiplier relative to standard Hot
  retainedPriorityFactor: number; // fraction of priority retained (e.g. 1.0 for hot, 0.7 for cool)
  color: string;
}

export const DEFAULT_STORAGE_TIERS: Record<StorageTierId, StorageTierConfig> = {
  hot: {
    id: 'hot',
    name: 'Hot (Immediate Access)',
    costMultiplier: 1.0,
    retainedPriorityFactor: 1.0,
    color: 'var(--color-accent-lime, #10b981)',
  },
  cool: {
    id: 'cool',
    name: 'Cool (Infrequent Access)',
    costMultiplier: 0.4,
    retainedPriorityFactor: 0.75,
    color: 'var(--color-primary-blue, #3b82f6)',
  },
  archive: {
    id: 'archive',
    name: 'Glacier Archive (Deep)',
    costMultiplier: 0.1,
    retainedPriorityFactor: 0.45,
    color: 'var(--color-amber, #f59e0b)',
  },
  skip: {
    id: 'skip',
    name: 'Purge / Exclude',
    costMultiplier: 0.0,
    retainedPriorityFactor: 0.0,
    color: 'var(--color-slate, #64748b)',
  },
};

export interface TierItemInput {
  id: string;
  name: string;
  sizeGb: number;
  basePriority: number;
}

export interface TierAllocationResult {
  allocations: {
    item: TierItemInput;
    chosenTier: StorageTierId;
    effectivePriority: number;
    monthlyCost: number;
  }[];
  totalCost: number;
  totalPriority: number;
  costBudget: number;
}

/**
 * Multiple-choice knapsack algorithm (MCKP) for storage tiers:
 * Each item has 4 mutually exclusive choices (Hot, Cool, Archive, Skip).
 * Solved via dynamic programming where each group has multiple candidate options.
 */
export function solveStorageTiers(
  items: TierItemInput[],
  monthlyBudget: number,
  baseRatePerGb: number = 0.02, // $0.02 per GB Hot
  tiers: Record<StorageTierId, StorageTierConfig> = DEFAULT_STORAGE_TIERS
): TierAllocationResult {
  // Discretize budget in cents for integer DP
  const budgetCents = Math.max(1, Math.round(monthlyBudget * 100));

  // dp[c] = max priority achievable with budget c cents
  // We also track the choice made for each item
  const n = items.length;
  // choices[i][c] = StorageTierId chosen for item i at budget c
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(budgetCents + 1).fill(-1));
  const chosenTier: StorageTierId[][] = Array.from({ length: n + 1 }, () => new Array(budgetCents + 1).fill('skip'));

  dp[0][0] = 0;
  for (let c = 1; c <= budgetCents; c++) {
    dp[0][c] = 0;
  }

  const tierKeys: StorageTierId[] = ['hot', 'cool', 'archive', 'skip'];

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];

    for (let c = 0; c <= budgetCents; c++) {
      let maxVal = -1;
      let bestTier: StorageTierId = 'skip';

      for (const t of tierKeys) {
        const tierCfg = tiers[t];
        const costForThisTier = item.sizeGb * baseRatePerGb * tierCfg.costMultiplier;
        const costCents = Math.round(costForThisTier * 100);
        const priorityVal = item.basePriority * tierCfg.retainedPriorityFactor;

        if (c >= costCents) {
          const prevBest = dp[i - 1][c - costCents];
          if (prevBest >= 0) {
            const candidateTotal = prevBest + priorityVal;
            if (candidateTotal > maxVal) {
              maxVal = candidateTotal;
              bestTier = t;
            }
          }
        }
      }

      dp[i][c] = maxVal;
      chosenTier[i][c] = bestTier;
    }
  }

  // Find best budget state
  let bestC = budgetCents;
  let maxP = -1;
  for (let c = 0; c <= budgetCents; c++) {
    if (dp[n][c] > maxP) {
      maxP = dp[n][c];
      bestC = c;
    }
  }

  // Backtrack
  const allocations: TierAllocationResult['allocations'] = [];
  let curC = bestC;
  let totalCalculatedCost = 0;
  let totalCalculatedPriority = 0;

  for (let i = n; i >= 1; i--) {
    const item = items[i - 1];
    const tier = chosenTier[i][curC];
    const tierCfg = tiers[tier];
    const costForTier = item.sizeGb * baseRatePerGb * tierCfg.costMultiplier;
    const costCents = Math.round(costForTier * 100);
    const effP = Math.round(item.basePriority * tierCfg.retainedPriorityFactor * 10) / 10;

    allocations.push({
      item,
      chosenTier: tier,
      effectivePriority: effP,
      monthlyCost: costForTier,
    });

    totalCalculatedCost += costForTier;
    totalCalculatedPriority += effP;
    curC = Math.max(0, curC - costCents);
  }

  allocations.reverse();

  return {
    allocations,
    totalCost: totalCalculatedCost,
    totalPriority: Math.round(totalCalculatedPriority * 10) / 10,
    costBudget: monthlyBudget,
  };
}

