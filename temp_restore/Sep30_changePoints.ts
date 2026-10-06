import { KnapsackItem, KnapsackResult } from './types';
import { formatBytes } from './normalizer';

export interface ChangePoint {
  quotaBytes: number;
  totalValue: number;
  deltaValue: number;
}

export interface WhatIfPrediction {
  targetQuotaBytes: number;
  deltaBytes: number;
  deltaValue: number;
  description: string;
  nextGainFile?: KnapsackItem;
}

export function extractChangePoints(curve: { quotaBytes: number; totalValue: number }[]): ChangePoint[] {
  if (!curve || curve.length < 2) return [];

  const changePoints: ChangePoint[] = [];
  let prevVal = curve[0].totalValue;

  for (let i = 1; i < curve.length; i++) {
    const pt = curve[i];
    if (pt.totalValue > prevVal) {
      changePoints.push({
        quotaBytes: pt.quotaBytes,
        totalValue: pt.totalValue,
        deltaValue: pt.totalValue - prevVal,
      });
      prevVal = pt.totalValue;
    }
  }

  return changePoints;
}

export function computeWhatIfInsight(
  currentQuotaBytes: number,
  simulatedQuotaBytes: number,
  result: KnapsackResult
): WhatIfPrediction {
  const curve = result.quotaCurve || [];
  const deltaBytes = simulatedQuotaBytes - currentQuotaBytes;

  // Find nearest curve points
  const findValueAt = (bytes: number) => {
    if (curve.length === 0) return result.totalValue;
    let closest = curve[0];
    for (const pt of curve) {
      if (pt.quotaBytes <= bytes) closest = pt;
      else break;
    }
    return closest.totalValue;
  };

  const currVal = result.totalValue;
  const simVal = findValueAt(simulatedQuotaBytes);
  const deltaValue = simVal - currVal;

  // Check which dropped file would fit next
  const dropped = [...result.droppedItems].sort((a, b) => {
    // sort by best efficiency ratio
    const ratioA = a.value / Math.max(1, a.originalSize);
    const ratioB = b.value / Math.max(1, b.originalSize);
    return ratioB - ratioA;
  });

  const nextFile = dropped.find((f) => f.originalSize <= Math.abs(deltaBytes));

  let description = '';
  if (Math.abs(deltaBytes) < 1024 * 1024) {
    if (dropped.length > 0) {
      const cheapest = [...dropped].sort((a, b) => a.originalSize - b.originalSize)[0];
      description = `Add ${formatBytes(cheapest.originalSize)} more to also keep "${cheapest.name}".`;
    } else {
      description = `All your files fit into this space!`;
    }
  } else if (deltaBytes > 0) {
    if (nextFile) {
      description = `With ${formatBytes(deltaBytes)} more, you could also keep "${nextFile.name}". (+${deltaValue > 0 ? deltaValue : nextFile.value} importance)`;
    } else if (deltaValue > 0) {
      description = `With ${formatBytes(deltaBytes)} more, you gain +${deltaValue} importance points.`;
    } else {
      description = `With ${formatBytes(deltaBytes)} more, you have extra room, but all your files already fit.`;
    }
  } else {
    // Space reduced
    const absDelta = Math.abs(deltaBytes);
    description = `With ${formatBytes(absDelta)} less space, total kept importance drops by ${Math.abs(deltaValue)} points.`;
  }

  return {
    targetQuotaBytes: simulatedQuotaBytes,
    deltaBytes,
    deltaValue,
    description,
    nextGainFile: nextFile,
  };
}

export function findSweetSpot(curve: { quotaBytes: number; totalValue: number }[]): { quotaBytes: number; totalValue: number } | null {
  if (!curve || curve.length < 5) return null;

  // The sweet spot is the "elbow" point where marginal gain per byte drops significantly (plateau)
  const maxVal = curve[curve.length - 1].totalValue;
  if (maxVal === 0) return null;

  // Typically 85%-92% of max value achieved with much less than 100% capacity
  const targetThreshold = maxVal * 0.9;
  for (const pt of curve) {
    if (pt.totalValue >= targetThreshold) {
      return pt;
    }
  }

  return curve[Math.floor(curve.length / 2)];
}

