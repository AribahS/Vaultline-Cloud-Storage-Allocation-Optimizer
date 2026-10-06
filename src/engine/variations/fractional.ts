export interface FractionalItem {
  id: string;
  name: string;
  sizeGb: number;
  priority: number;
}

export interface FractionalChunk {
  item: FractionalItem;
  fractionTaken: number; // 0.0 to 1.0
  sizeTakenGb: number;
  priorityAchieved: number;
  ratio: number;
  isPartial: boolean;
}

export interface FractionalResult {
  chunks: FractionalChunk[];
  totalSizeTaken: number;
  totalPriorityAchieved: number;
  zeroOneOptimalPriority: number;
  gapPriority: number; // Fractional gives >= 0/1, gap is the relaxation gain
}

export function solveFractionalKnapsack(
  items: FractionalItem[],
  quotaGb: number,
  zeroOneOpt: number
): FractionalResult {
  // Sort items by priority / size (descending)
  const sorted = [...items].map((it) => ({
    ...it,
    ratio: it.priority / Math.max(0.01, it.sizeGb),
  })).sort((a, b) => b.ratio - a.ratio);

  let remaining = quotaGb;
  let totalPriority = 0;
  let totalSize = 0;
  const chunks: FractionalChunk[] = [];

  for (const item of sorted) {
    if (remaining <= 0) {
      chunks.push({
        item,
        fractionTaken: 0,
        sizeTakenGb: 0,
        priorityAchieved: 0,
        ratio: item.ratio,
        isPartial: false,
      });
      continue;
    }

    if (item.sizeGb <= remaining) {
      // Take 100%
      chunks.push({
        item,
        fractionTaken: 1.0,
        sizeTakenGb: item.sizeGb,
        priorityAchieved: item.priority,
        ratio: item.ratio,
        isPartial: false,
      });
      totalPriority += item.priority;
      totalSize += item.sizeGb;
      remaining -= item.sizeGb;
    } else {
      // Take fractional piece
      const frac = remaining / item.sizeGb;
      const takenSize = remaining;
      const takenPrio = item.priority * frac;

      chunks.push({
        item,
        fractionTaken: Math.round(frac * 1000) / 1000,
        sizeTakenGb: Math.round(takenSize * 100) / 100,
        priorityAchieved: Math.round(takenPrio * 100) / 100,
        ratio: item.ratio,
        isPartial: true,
      });

      totalPriority += takenPrio;
      totalSize += takenSize;
      remaining = 0;
    }
  }

  const roundedTotalPrio = Math.round(totalPriority * 100) / 100;
  const gap = Math.max(0, Math.round((roundedTotalPrio - zeroOneOpt) * 100) / 100);

  return {
    chunks,
    totalSizeTaken: Math.round(totalSize * 100) / 100,
    totalPriorityAchieved: roundedTotalPrio,
    zeroOneOptimalPriority: zeroOneOpt,
    gapPriority: gap,
  };
}
