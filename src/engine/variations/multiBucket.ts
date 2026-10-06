import { KnapsackItem } from '../types';
import { solveFullKnapsack } from '../knapsack';

export interface StorageBucket {
  id: string;
  name: string;
  quotaGb: number;
  color: string;
}

export interface MultiBucketAllocation {
  bucket: StorageBucket;
  assignedItems: KnapsackItem[];
  usedGb: number;
  totalPriority: number;
}

export interface MultiBucketResult {
  allocations: MultiBucketAllocation[];
  unassignedItems: KnapsackItem[];
  totalAchievedPriority: number;
  isHeuristicNote: string;
}

/**
 * Multiple Knapsack Problem (MKP) heuristic using sequential DP:
 * Fills highest priority buckets first. Clear academic notice that exact MKP is strongly NP-hard.
 */
export function solveMultiBucketSequential(
  items: KnapsackItem[],
  buckets: StorageBucket[]
): MultiBucketResult {
  let remainingCandidates = [...items];
  const allocations: MultiBucketAllocation[] = [];
  let grandTotalPriority = 0;

  for (const bucket of buckets) {
    if (remainingCandidates.length === 0 || bucket.quotaGb <= 0) {
      allocations.push({
        bucket,
        assignedItems: [],
        usedGb: 0,
        totalPriority: 0,
      });
      continue;
    }

    const quotaUnits = Math.round(bucket.quotaGb);
    const unitBytes = 1024 * 1024 * 1024; // 1 GB units

    const res = solveFullKnapsack(remainingCandidates, {
      quotaUnits,
      quotaBytes: quotaUnits * unitBytes,
      unitBytes,
    });

    const assigned = res.keptItems;
    const assignedIds = new Set(assigned.map((i) => i.id));
    remainingCandidates = remainingCandidates.filter((i) => !assignedIds.has(i.id));

    const usedGb = assigned.reduce((acc, it) => acc + it.normalizedSize, 0);
    const prio = assigned.reduce((acc, it) => acc + it.value, 0);
    grandTotalPriority += prio;

    allocations.push({
      bucket,
      assignedItems: assigned,
      usedGb,
      totalPriority: prio,
    });
  }

  return {
    allocations,
    unassignedItems: remainingCandidates,
    totalAchievedPriority: grandTotalPriority,
    isHeuristicNote:
      'Sequential DP solves each bucket optimally in priority order. Note: The exact Multiple Knapsack Problem (MKP) is strongly NP-hard; sequential allocation is a well-known polynomial heuristic.',
  };
}
