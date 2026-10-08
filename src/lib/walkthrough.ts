import { formatSize } from './format.js';
import { solveTeachingKnapsack } from '../engine/knapsack';
import type { KnapsackItem, TeachingEngineResult } from '../engine/types';
import type { FileMetadata } from '../engine/types';

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
  return walkthroughFromResult(solveTeachingKnapsack(items, capacity));
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

/** Builds the teaching version from up to eight of the user's highest-importance files. */
export function buildYourPlanDataset(files: FileMetadata[], quotaBytes: number): YourPlanDataset {
  const columnBytes = Math.max(1, quotaBytes / YOUR_PLAN_COLUMNS);
  const topFiles = [...files]
    .filter(file => file.size > 0 && !file.isExcluded)
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 8);
  return {
    items: topFiles.map(file => ({
      id: file.id, name: file.name, originalSize: file.size,
      normalizedSize: yourPlanWeight(file.size, columnBytes), value: file.priority,
    })),
    capacity: YOUR_PLAN_COLUMNS,
    columnBytes,
    hint: topFiles.length ? '' : 'Add files to use your plan here.',
  };
}
