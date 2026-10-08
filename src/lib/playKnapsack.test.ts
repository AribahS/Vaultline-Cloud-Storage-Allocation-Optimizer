import { describe, expect, it } from 'vitest';
import { solveFullKnapsack } from '../engine/knapsack';
import { normaliseItemSize } from '../engine/normalizer';
import { GREEDY_COUNTEREXAMPLE_DATASET } from '../engine/greedy';
import { STUDENT_LAPTOP_DATASET } from '../data/sampleDatasets';
import { checkContrastPairs } from './contrast';
import { buildCapacityTable, canAdd, findKnee, greedyPlan, importanceCurve, kneeSentence, planForCapacity, scoreSelection, type PlayItem } from './playKnapsack';
import { createTightPlayDataset } from './tightPlayDataset';

const MB = 1024 ** 2;
const asPlayItems = (files: typeof STUDENT_LAPTOP_DATASET): PlayItem[] => files.map(file => ({ id: file.id, name: file.name, size: file.size, importance: file.priority, weight: normaliseItemSize(file.size, MB) }));

describe('Play DP helpers', () => {
  it('matches the public engine at five or more capacities for existing and tight sample data', () => {
    const files = [
      ...asPlayItems(STUDENT_LAPTOP_DATASET),
      ...createTightPlayDataset(),
    ];
    const datasets = [asPlayItems(STUDENT_LAPTOP_DATASET), createTightPlayDataset()];
    for (const items of datasets) {
      const max = Math.floor(items.reduce((sum, item) => sum + item.size, 0) / MB);
      const table = buildCapacityTable(items, max);
      const capacities = [0, Math.floor(max * .15), Math.floor(max * .35), Math.floor(max * .6), Math.floor(max * .8), max];
      for (const capacity of capacities) {
        const actual = solveFullKnapsack(items.map(item => ({ id: item.id, name: item.name, originalSize: item.size, normalizedSize: item.weight, value: item.importance })), { quotaUnits: capacity, quotaBytes: capacity * MB, unitBytes: MB });
        const expected = planForCapacity(table, capacity);
        expect(expected.keptIds.sort()).toEqual(actual.keptItems.map(item => item.id).sort());
        expect(expected.totalImportance).toBe(actual.totalValue);
      }
    }
    expect(files.length).toBeGreaterThan(20);
  });

  it('keeps importance monotone and every plan within capacity', () => {
    const items = createTightPlayDataset();
    const max = Math.floor(items.reduce((sum, item) => sum + item.size, 0) / MB);
    const table = buildCapacityTable(items, max);
    const curve = importanceCurve(table);
    for (let index = 1; index < curve.length; index++) expect(curve[index].importance).toBeGreaterThanOrEqual(curve[index - 1].importance);
    for (const capacity of [0, 10, 5000, Math.floor(max / 2), max]) {
      const plan = planForCapacity(table, capacity);
      const weight = plan.keptIds.reduce((sum, id) => sum + items.find(item => item.id === id)!.weight, 0);
      expect(weight).toBeLessThanOrEqual(capacity);
    }
  });

  it('uses a documented knee and computes capacity-specific language', () => {
    const items = createTightPlayDataset();
    const max = Math.floor(items.reduce((sum, item) => sum + item.size, 0) / MB);
    const curve = importanceCurve(buildCapacityTable(items, max));
    const knee = findKnee(curve);
    expect(knee.importance).toBeGreaterThanOrEqual(curve.at(-1)!.importance * .9);
    expect(knee.capacity).toBeLessThanOrEqual(max);
    expect(kneeSentence(curve, 0, MB)).not.toBe(kneeSentence(curve, knee.capacity, MB));
  });

  it('reproduces the classic greedy counterexample and makes tight greedy strictly worse', () => {
    const classic = GREEDY_COUNTEREXAMPLE_DATASET.items.map(item => ({ id: item.id, name: item.name, size: item.originalSize, weight: item.normalizedSize, importance: item.value }));
    expect(greedyPlan(classic, 10).totalImportance).toBe(30);
    expect(planForCapacity(buildCapacityTable(classic, 10), 10).totalImportance).toBe(48);
    const tight = createTightPlayDataset();
    const capacity = Math.floor(15 * 1024 ** 3 / MB);
    expect(greedyPlan(tight, capacity).totalImportance).toBeLessThan(planForCapacity(buildCapacityTable(tight, capacity), capacity).totalImportance);
  });

  it('blocks overflow with a reason and scores selected files', () => {
    const items: PlayItem[] = [{ id: 'a', name: 'A', size: 8, weight: 8, importance: 7 }, { id: 'b', name: 'B', size: 5, weight: 5, importance: 4 }];
    expect(canAdd(items, ['a'], 'b', 10, 1024 ** 3)).toEqual({ allowed: false, reason: 'Needs 5 GB, only 2 GB left.' });
    expect(scoreSelection(items, ['a', 'b'])).toEqual({ totalImportance: 11, totalSize: 13, count: 2 });
  });

  it('keeps vault, kept and moved text contrast above 4.5:1', () => {
    const pairs = checkContrastPairs([
      { label: 'cream on vault', foreground: '#F4EBD3', background: '#0F2A1E', minimum: 4.5 },
      { label: 'gold line on vault', foreground: '#E3D081', background: '#0F2A1E', minimum: 4.5 },
      { label: 'kept block label', foreground: '#F4EBD3', background: '#0F2A1E', minimum: 4.5 },
      { label: 'moved block label', foreground: '#F4EBD3', background: '#9C3D2F', minimum: 4.5 },
    ]);
    expect(pairs.every(pair => pair.ratio >= pair.minimum)).toBe(true);
  });
});
