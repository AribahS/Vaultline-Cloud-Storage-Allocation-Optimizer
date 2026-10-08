import { formatSize } from './format.js';
import type { FileMetadata } from '../engine/types';

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
  values: Float64Array;
  decisions: Uint8Array;
  columns: number;
  maxAvailable: number;
  pinnedWeight: number;
  pinnedIds: string[];
  pinnedSize: number;
  pinnedImportance: number;
}

/** Selects a size scale that keeps the exact table bounded for interactive use. */
export function choosePlayScale(totalBytes: number, fileCount: number) {
  const columnBudget = fileCount > 2000 ? 700 : 2000;
  return {
    unitBytes: Math.max(1, Math.ceil(Math.max(0, totalBytes) / columnBudget)),
    coarse: fileCount > 2000,
  };
}

export function mapCapacityToUnits(capacityBytes: number, totalBytes: number, maxCapacity: number): number {
  if (capacityBytes <= 0 || totalBytes <= 0 || maxCapacity <= 0) return 0;
  return Math.max(0, Math.min(maxCapacity, Math.round(capacityBytes / totalBytes * maxCapacity)));
}

export function buildUserPlayItems(files: FileMetadata[], unitBytes: number): PlayItem[] {
  return files.map(file => ({
    id: file.id,
    name: file.name,
    size: file.size,
    importance: file.priority,
    weight: file.size > 0 ? Math.max(1, Math.ceil(file.size / unitBytes)) : 0,
    excluded: file.isExcluded,
    pinned: file.isPinned,
  }));
}

export function normalizePlayItems(items: PlayItem[], unitBytes: number): PlayItem[] {
  return items.map(item => ({ ...item, weight: item.size > 0 ? Math.max(1, Math.ceil(item.size / unitBytes)) : 0 }));
}

export function selectChallengeItems(items: PlayItem[], limit = 14): PlayItem[] {
  return items.filter(item => !item.excluded)
    .sort((left, right) => right.importance - left.importance || right.size - left.size || left.id.localeCompare(right.id))
    .slice(0, limit);
}

/** Builds an exact 0/1 table with rolling typed-array scores and bit-packed traceback choices. */
export function buildCapacityTable(items: PlayItem[], maxCapacity: number): CapacityTable {
  const limit = Math.max(0, Math.floor(maxCapacity));
  const active = items.filter(item => !item.excluded);
  const pinned = active.filter(item => item.pinned);
  const regular = active.filter(item => !item.pinned);
  const pinnedWeight = pinned.reduce((sum, item) => sum + item.weight, 0);
  const available = Math.max(0, limit - pinnedWeight);
  const columns = available + 1;
  const values = new Float64Array(columns);
  const counts = new Uint32Array(columns);
  const decisionCount = regular.length * columns;
  const decisions = new Uint8Array(Math.ceil(decisionCount / 8));
  const setDecision = (index: number, capacity: number) => {
    const bit = index * columns + capacity;
    decisions[bit >> 3] |= 1 << (bit & 7);
  };
  regular.forEach((item, index) => {
    if (item.weight <= 0 || item.weight > available) return;
    for (let capacity = available; capacity >= item.weight; capacity--) {
      const previous = capacity - item.weight;
      const takeValue = item.importance + values[previous];
      const takeCount = counts[previous] + 1;
      if (takeValue > values[capacity] || (takeValue === values[capacity] && takeCount < counts[capacity])) {
        values[capacity] = takeValue;
        counts[capacity] = takeCount;
        setDecision(index, capacity);
      }
    }
  });
  const fullActiveWeight = active.reduce((sum, item) => sum + item.weight, 0);
  return {
    items,
    maxCapacity: Math.max(limit, fullActiveWeight),
    values,
    decisions,
    columns,
    maxAvailable: available,
    pinnedWeight,
    pinnedIds: pinned.map(item => item.id),
    pinnedSize: pinned.reduce((sum, item) => sum + item.size, 0),
    pinnedImportance: pinned.reduce((sum, item) => sum + item.importance, 0),
  };
}

/** Reads a plan from the precomputed table without running the solver again. */
export function planForCapacity(table: CapacityTable, capacity: number): PlayPlan {
  const target = Math.max(0, Math.min(table.maxCapacity, Math.floor(capacity)));
  const available = Math.max(0, Math.min(table.maxAvailable, target - table.pinnedWeight));
  const kept = new Set(table.pinnedIds);
  let current = available;
  const regular = table.items.filter(item => !item.excluded && !item.pinned);
  for (let index = regular.length - 1; index >= 0; index--) {
    const bit = index * table.columns + current;
    if (table.decisions[bit >> 3] & (1 << (bit & 7))) {
      const item = regular[index];
      kept.add(item.id);
      current = Math.max(0, current - item.weight);
    }
  }
  const keptItems = table.items.filter(item => !item.excluded && kept.has(item.id));
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
  const total = table.items.filter(item => !item.excluded).reduce((sum, item) => sum + item.importance, 0);
  return Array.from({ length: table.maxCapacity + 1 }, (_, capacity) => {
    const available = Math.max(0, Math.min(table.maxAvailable, capacity - table.pinnedWeight));
    const importance = table.pinnedImportance + table.values[available];
    return { capacity, importance, percent: total ? importance / total * 100 : 0 };
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
  const pinned = active.filter(item => item.pinned);
  const kept: PlayItem[] = [...pinned];
  let remaining = Math.max(0, Math.floor(capacity) - pinned.reduce((sum, item) => sum + item.weight, 0));
  const sorted = active.filter(item => !item.pinned).sort((a, b) => b.importance / Math.max(1, b.weight) - a.importance / Math.max(1, a.weight));
  for (const item of sorted) {
    if (item.weight <= remaining) { kept.push(item); remaining -= item.weight; }
  }
  const ids = new Set(kept.map(item => item.id));
  return {
    keptIds: kept.map(item => item.id), movedIds: items.filter(item => !ids.has(item.id)).map(item => item.id),
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
  if (item.excluded) return { allowed: false, reason: 'This file is marked Never keep.' };
  if (item.pinned) return { allowed: false, reason: 'This file is marked Always keep.' };
  const remaining = Math.max(0, Math.floor(capacity)) - ids.reduce((sum, selectedId) => sum + (items.find(candidate => candidate.id === selectedId)?.weight ?? 0), 0);
  if (item.weight > remaining) return { allowed: false, reason: `Needs ${formatSize(item.weight * unitBytes)}, only ${formatSize(Math.max(0, remaining) * unitBytes)} left.` };
  return { allowed: true };
}
