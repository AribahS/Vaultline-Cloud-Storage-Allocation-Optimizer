import { formatSize } from './format.js';
import { solveTeachingKnapsack } from '../engine/knapsack';
import type { KnapsackItem, TeachingEngineResult, TableStep, TracebackStep } from '../engine/types';
import type { FileMetadata } from '../engine/types';
import { normaliseQuota } from '../engine/normalizer';

export interface WalkCell { row: number; column: number; value: number }

export interface FillWalkStep {
  phase: 'fill';
  index: number;
  row: number;
  column: number;
  item: KnapsackItem;
  value: number;
  skip: WalkCell;
  take: WalkCell | null;
  decision: 'take' | 'skip' | 'fit_skip';
  isTie: boolean;
}

export interface TraceWalkStep {
  phase: 'traceback';
  index: number;
  row: number;
  column: number;
  item: KnapsackItem;
  taken: boolean;
  chosenIds: string[];
  remainingCapacity: number;
}

export type WalkStep = FillWalkStep | TraceWalkStep;

export interface TeachingWalkthrough {
  result: TeachingEngineResult;
  steps: WalkStep[];
  fillCount: number;
}

/** Purely adapts the engine's ordered cell and traceback records for index-based playback. */
export function walkthroughFromResult(result: TeachingEngineResult): TeachingWalkthrough {
  const steps: WalkStep[] = result.steps.map((step, index) => {
    if (step.type === 'cell') {
      return {
        phase: 'fill', index, row: step.i, column: step.w, item: step.item, value: step.cellValue,
        skip: { row: step.i - 1, column: step.w, value: step.prevCellValue },
        take: step.candidateTakeValue === null || step.takeRemainingValue === null ? null : {
          row: step.i - 1, column: step.w - step.item.normalizedSize, value: step.takeRemainingValue,
        },
        decision: step.decision, isTie: step.isTie,
      };
    }
    const column = step.taken ? step.remainingQuota + step.item.normalizedSize : step.remainingQuota;
    return {
      phase: 'traceback', index, row: step.i, column, item: step.item, taken: step.taken,
      chosenIds: step.chosenIds, remainingCapacity: step.remainingQuota,
    };
  });
  return { result, steps, fillCount: steps.filter(step => step.phase === 'fill').length };
}

export function buildTeachingWalkthrough(items: KnapsackItem[], capacity: number): TeachingWalkthrough {
  return walkthroughFromResult(capacity <= 25
    ? solveTeachingKnapsack(items, capacity)
    : solveScaledTeachingKnapsack(items, capacity));
}

function solveScaledTeachingKnapsack(items: KnapsackItem[], quota: number): TeachingEngineResult {
  const W = Math.max(0, Math.floor(quota));
  const dp: number[][] = Array.from({ length: items.length + 1 }, () => Array(W + 1).fill(0));
  const counts: number[][] = Array.from({ length: items.length + 1 }, () => Array(W + 1).fill(0));
  const steps: (TableStep | TracebackStep)[] = [];
  let stepIndex = 0;
  for (let i = 1; i <= items.length; i++) {
    const item = items[i - 1];
    for (let w = 0; w <= W; w++) {
      const previous = dp[i - 1][w];
      const previousCount = counts[i - 1][w];
      let takeValue: number | null = null;
      let takeBase: number | null = null;
      let decision: TableStep['decision'] = 'fit_skip';
      let value = previous;
      let count = previousCount;
      let isTie = false;
      if (item.normalizedSize <= w) {
        takeBase = dp[i - 1][w - item.normalizedSize];
        takeValue = item.value + takeBase;
        const takeCount = counts[i - 1][w - item.normalizedSize] + 1;
        if (takeValue > previous || (takeValue === previous && takeCount < previousCount)) {
          value = takeValue; count = takeCount; decision = 'take';
        } else {
          decision = 'skip';
          isTie = takeValue === previous;
        }
      }
      dp[i][w] = value;
      counts[i][w] = count;
      steps.push({
        stepIndex: stepIndex++, type: 'cell', i, w, item, cellValue: value,
        prevCellValue: previous, takeRemainingValue: takeBase, candidateTakeValue: takeValue,
        decision, isTie, prevItemsCount: previousCount, takeItemsCount: count,
        explanation: decision === 'fit_skip' ? `${item.name} does not fit at capacity ${w}.` : decision === 'take' ? `Taking ${item.name} gives ${value}.` : `Skipping ${item.name} keeps ${previous}.`,
        recurrenceFormula: takeValue === null ? `dp[${i}][${w}] = dp[${i - 1}][${w}]` : `dp[${i}][${w}] = max(${previous}, ${item.value} + dp[${i - 1}][${w - item.normalizedSize}]) = ${value}`,
      });
    }
  }
  let remaining = W;
  const keptIds: string[] = [];
  const chosen: string[] = [];
  for (let i = items.length; i >= 1; i--) {
    const item = items[i - 1];
    const value = dp[i][remaining];
    const above = dp[i - 1][remaining];
    const taken = item.normalizedSize <= remaining && value === item.value + dp[i - 1][remaining - item.normalizedSize] && (value !== above || counts[i][remaining] !== counts[i - 1][remaining]);
    if (taken) { keptIds.push(item.id); chosen.push(item.id); remaining -= item.normalizedSize; }
    steps.push({ stepIndex: stepIndex++, type: 'traceback', i, w: remaining, item, taken, reason: taken ? `${item.name} is kept.` : `${item.name} is skipped.`, chosenIds: [...chosen], remainingQuota: remaining });
  }
  keptIds.reverse();
  return { items, W, table: dp, steps, keptItemIds: keptIds, totalValue: dp[items.length][W], isTruncated: false };
}

export function cellSentences(step: FillWalkStep, columnBytes: number): string[] {
  const skipSentence = `Skipping ${step.item.name} leaves a best score of ${step.skip.value}.`;
  if (!step.take) return [`${step.item.name} does not fit here, so the score stays ${step.skip.value}.`];
  const left = Math.max(0, step.column - step.item.normalizedSize) * columnBytes;
  const takeSentence = `Taking ${step.item.name} (size ${formatSize(step.item.originalSize)}) adds ${step.item.value} to the best score with ${formatSize(left)} left, giving ${step.take.value + step.item.value}.`;
  if (step.isTie) return [skipSentence, takeSentence, `The scores tie at ${step.value}; the table keeps the option with fewer files.`];
  const winner = step.decision === 'take'
    ? `Taking wins, ${step.take.value + step.item.value} beats ${step.skip.value}.`
    : `Skipping wins, ${step.skip.value} is at least ${step.take.value + step.item.value}.`;
  return [skipSentence, takeSentence, winner];
}

export const YOUR_PLAN_COLUMNS = 12;

export function yourPlanWeight(sizeBytes: number, columnBytes: number): number {
  if (sizeBytes <= 0 || columnBytes <= 0) return 0;
  return Math.max(1, Math.ceil(sizeBytes / columnBytes));
}

export interface YourPlanDataset {
  items: KnapsackItem[];
  capacity: number;
  columnBytes: number;
  hint: string;
}

/** Builds the teaching version from the user's eligible files. */
export function buildYourPlanDataset(files: FileMetadata[], quotaBytes: number, sharedUnitBytes?: number): YourPlanDataset {
  const columnBytes = sharedUnitBytes ?? Math.max(1, quotaBytes / YOUR_PLAN_COLUMNS);
  const topFiles = [...files].filter(file => file.size > 0 && !file.isExcluded).sort((left, right) => right.priority - left.priority);
  const scaledItems = topFiles.map(file => ({
    id: file.id, name: file.name, originalSize: file.size,
    normalizedSize: yourPlanWeight(file.size, columnBytes), value: file.priority,
    isPinned: file.isPinned, isExcluded: file.isExcluded,
  }));
  const capacity = sharedUnitBytes
    ? (quotaBytes >= topFiles.reduce((sum, file) => sum + file.size, 0)
      ? scaledItems.reduce((sum, item) => sum + item.normalizedSize, 0)
      : normaliseQuota(quotaBytes, columnBytes))
    : YOUR_PLAN_COLUMNS;
  return {
    items: scaledItems,
    capacity,
    columnBytes,
    hint: topFiles.length ? '' : 'Add files to use your plan here.',
  };
}
