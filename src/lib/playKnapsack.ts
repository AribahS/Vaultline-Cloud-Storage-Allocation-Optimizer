import { formatSize } from './format.js';

export interface PlayItem {
  id: string;
  name: string;
  size: number;
  importance: number;
  weight: number;
  excluded?: boolean;
  pinned?: boolean;
}

export interface PlayPlan {
  keptIds: string[];
  movedIds: string[];
  totalImportance: number;
  totalSize: number;
  capacity: number;
}

export interface CapacityTable {
  items: PlayItem[];
  maxCapacity: number;
  values: number[][];
  counts: number[][];
  decisions: boolean[][];
  pinnedIds: string[];
  pinnedSize: number;
  pinnedImportance: number;
}

/** Builds one exact 0/1 DP table. `weight` and capacities use normalized units. */
export function buildCapacityTable(items: PlayItem[], maxCapacity: number): CapacityTable {
  const limit = Math.max(0, Math.floor(maxCapacity));
  const active = items.filter(item => !item.excluded);
  const pinned = active.filter(item => item.pinned);
  const regular = active.filter(item => !item.pinned);
  const pinnedWeight = pinned.reduce((sum, item) => sum + item.weight, 0);
  const available = Math.max(0, limit - pinnedWeight);
  const values = Array.from({ length: regular.length + 1 }, () => new Array<number>(available + 1).fill(0));
  const counts = Array.from({ length: regular.length + 1 }, () => new Array<number>(available + 1).fill(0));
  const decisions = Array.from({ length: regular.length + 1 }, () => new Array<boolean>(available + 1).fill(false));
  regular.forEach((item, index) => {
    for (let capacity = 0; capacity <= available; capacity++) {
      const skipValue = values[index][capacity];
      const skipCount = counts[index][capacity];
      if (item.weight <= capacity) {
        const takeValue = item.importance + values[index][capacity - item.weight];
        const takeCount = 1 + counts[index][capacity - item.weight];
        if (takeValue > skipValue || (takeValue === skipValue && takeCount < skipCount)) {
          values[index + 1][capacity] = takeValue;
          counts[index + 1][capacity] = takeCount;
          decisions[index + 1][capacity] = true;
          continue;
        }
      }
      values[index + 1][capacity] = skipValue;
      counts[index + 1][capacity] = skipCount;
    }
  });
  return {
    items: active,
    maxCapacity: limit,
    values,
    counts,
    decisions,
    pinnedIds: pinned.map(item => item.id),
    pinnedSize: pinned.reduce((sum, item) => sum + item.size, 0),
    pinnedImportance: pinned.reduce((sum, item) => sum + item.importance, 0),
  };
}

/** Reads a plan from the precomputed table without running the solver again. */
export function planForCapacity(table: CapacityTable, capacity: number): PlayPlan {
  const target = Math.max(0, Math.min(table.maxCapacity, Math.floor(capacity)));
  const pinnedWeight = table.items.filter(item => item.pinned).reduce((sum, item) => sum + item.weight, 0);
  const available = Math.max(0, Math.min(table.values[0].length - 1, target - pinnedWeight));
  const kept = new Set(table.pinnedIds);
  let current = available;
  for (let row = table.items.filter(item => !item.pinned).length; row > 0; row--) {
    if (table.decisions[row][current]) {
      const item = table.items.filter(candidate => !candidate.pinned)[row - 1];
      kept.add(item.id);
      current -= item.weight;
    }
  }
  const keptItems = table.items.filter(item => kept.has(item.id));
  const totalImportance = keptItems.reduce((sum, item) => sum + item.importance, 0);
  return {
    keptIds: keptItems.map(item => item.id),
    movedIds: table.items.filter(item => !kept.has(item.id)).map(item => item.id),
    totalImportance,
    totalSize: keptItems.reduce((sum, item) => sum + item.size, 0),
    capacity: target,
  };
}

export interface CurvePoint { capacity: number; importance: number; percent: number }

export function importanceCurve(table: CapacityTable): CurvePoint[] {
  const total = table.items.reduce((sum, item) => sum + item.importance, 0);
  return Array.from({ length: table.maxCapacity + 1 }, (_, capacity) => {
    const plan = planForCapacity(table, capacity);
    return { capacity, importance: plan.totalImportance, percent: total ? plan.totalImportance / total * 100 : 0 };
  });
}

/** The knee is the smallest capacity that reaches 90% of all available importance. */
export function findKnee(curve: CurvePoint[]): CurvePoint {
  const target = (curve.at(-1)?.importance ?? 0) * 0.9;
  return curve.find(point => point.importance >= target) ?? curve.at(-1) ?? { capacity: 0, importance: 0, percent: 0 };
}

export function kneeSentence(curve: CurvePoint[], capacity: number, unitBytes: number): string {
  if (!curve.length) return 'Add files to see how capacity changes importance.';
  const knee = findKnee(curve);
  const point = curve[Math.max(0, Math.min(curve.length - 1, Math.floor(capacity)))];
  const next = curve[Math.min(curve.length - 1, point.capacity + Math.max(1, knee.capacity - point.capacity))];
  const extraGb = Math.max(0, (next.capacity - point.capacity) * unitBytes / 1024 ** 3);
  const gain = Math.max(0, next.percent - point.percent);
  return `The next ${extraGb.toFixed(2)} GB buys ${gain.toFixed(0)}% more importance.`;
}

export function greedyPlan(items: PlayItem[], capacity: number): PlayPlan {
  const active = items.filter(item => !item.excluded);
  const kept: PlayItem[] = [];
  let remaining = Math.max(0, Math.floor(capacity));
  const sorted = [...active].sort((a, b) => b.importance / Math.max(1, b.weight) - a.importance / Math.max(1, a.weight));
  for (const item of [...sorted.filter(item => item.pinned), ...sorted.filter(item => !item.pinned)]) {
    if (item.weight <= remaining) { kept.push(item); remaining -= item.weight; }
  }
  const ids = new Set(kept.map(item => item.id));
  return {
    keptIds: kept.map(item => item.id), movedIds: active.filter(item => !ids.has(item.id)).map(item => item.id),
    totalImportance: kept.reduce((sum, item) => sum + item.importance, 0),
    totalSize: kept.reduce((sum, item) => sum + item.size, 0), capacity: Math.max(0, Math.floor(capacity)),
  };
}

export function scoreSelection(items: PlayItem[], ids: string[]) {
  const selected = items.filter(item => ids.includes(item.id));
  return { totalImportance: selected.reduce((sum, item) => sum + item.importance, 0), totalSize: selected.reduce((sum, item) => sum + item.size, 0), count: selected.length };
}

export function canAdd(items: PlayItem[], ids: string[], id: string, capacity: number, unitBytes = 1): { allowed: boolean; reason?: string } {
  const item = items.find(candidate => candidate.id === id);
  if (!item || ids.includes(id)) return { allowed: false, reason: 'This file is already selected.' };
  const remaining = Math.max(0, Math.floor(capacity)) - ids.reduce((sum, selectedId) => sum + (items.find(candidate => candidate.id === selectedId)?.weight ?? 0), 0);
  if (item.weight > remaining) return { allowed: false, reason: `Needs ${formatSize(item.weight * unitBytes)}, only ${formatSize(Math.max(0, remaining) * unitBytes)} left.` };
  return { allowed: true };
}
