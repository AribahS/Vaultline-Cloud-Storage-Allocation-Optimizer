import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { solveFullKnapsack } from '../engine/knapsack';
import { normaliseItemSize } from '../engine/normalizer';
import { GREEDY_COUNTEREXAMPLE_DATASET } from '../engine/greedy';
import { STUDENT_LAPTOP_DATASET } from '../data/sampleDatasets';
import { checkContrastPairs } from './contrast';
import { buildCapacityTable, buildUserPlayItems, canAdd, choosePlayScale, findKnee, greedyPlan, importanceCurve, kneeSentence, mapCapacityToUnits, planForCapacity, scoreSelection, selectChallengeItems, type PlayItem } from './playKnapsack';
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

  it('builds the interactive table from user metadata and maps the full slider range', () => {
    const files = STUDENT_LAPTOP_DATASET.slice(0, 2).map(file => ({ ...file, isPinned: file.id === STUDENT_LAPTOP_DATASET[0].id, isExcluded: file.id === STUDENT_LAPTOP_DATASET[1].id }));
    const total = files.reduce((sum, file) => sum + file.size, 0);
    const scale = choosePlayScale(total, files.length);
    const items = buildUserPlayItems(files, scale.unitBytes);
    expect(items.map(item => item.id)).toEqual(files.map(file => file.id));
    expect(items[0].pinned).toBe(true);
    expect(items[1].excluded).toBe(true);
    expect(mapCapacityToUnits(total, total, items.reduce((sum, item) => sum + item.weight, 0))).toBe(items.reduce((sum, item) => sum + item.weight, 0));
  });

  it('keeps all small files at the target and returns the full sample size at the slider maximum', () => {
    const file = { ...STUDENT_LAPTOP_DATASET[0], size: 1.4 * MB };
    const items = buildUserPlayItems([file], choosePlayScale(file.size, 1).unitBytes);
    const table = buildCapacityTable(items, items.reduce((sum, item) => sum + item.weight, 0));
    const max = items[0].weight;
    expect(planForCapacity(table, max).keptIds).toEqual([file.id]);
    expect(planForCapacity(table, max).totalSize).toBe(file.size);
  });

  it('selects no more than fourteen challenge files deterministically by importance, size, then id', () => {
    const files = Array.from({ length: 20 }, (_, index) => ({ id: `id-${index}`, name: `File ${index}`, size: index + 1, weight: index + 1, importance: index % 3 }));
    const first = selectChallengeItems(files);
    expect(first).toHaveLength(14);
    expect(first).toEqual(selectChallengeItems(files));
    expect(first.map(item => item.id)).toContain('id-19');
    expect(first.map(item => item.id)).not.toContain('id-0');
  });

  it('challenge greedy and optimal totals agree with the exact solver on the challenge set', () => {
    const challenge = selectChallengeItems(createTightPlayDataset(), 14);
    const capacity = Math.floor(challenge.reduce((sum, item) => sum + item.weight, 0) * .4);
    const optimal = planForCapacity(buildCapacityTable(challenge, capacity), capacity);
    const greedy = greedyPlan(challenge, capacity);
    const exact = solveFullKnapsack(challenge.map(item => ({ id: item.id, name: item.name, originalSize: item.size, normalizedSize: item.weight, value: item.importance })), { quotaUnits: capacity, quotaBytes: capacity * MB, unitBytes: MB });
    expect(optimal.totalImportance).toBe(exact.totalValue);
    expect(greedy.totalImportance).toBeLessThanOrEqual(optimal.totalImportance);
  });

  it('keeps the new violet, mint, crimson and gold text contrast above 4.5:1', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const token = (name: string): string => {
      const value = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6}|var\\(--[a-z0-9-]+\\))`, 'i'))?.[1];
      if (!value) throw new Error(`Missing token --${name}`);
      return value.startsWith('var(') ? token(value.slice(6, -1)) : value;
    };
    const pairs = checkContrastPairs([
      { label: 'paper on vault', foreground: token('paper'), background: token('vault'), minimum: 4.5 },
      { label: 'gold highlight on vault', foreground: token('highlight'), background: token('vault'), minimum: 4.5 },
      { label: 'ink on kept', foreground: token('ink'), background: token('kept'), minimum: 4.5 },
      { label: 'paper on moved', foreground: token('paper'), background: token('moved'), minimum: 4.5 },
    ]);
    expect(pairs.every(pair => pair.ratio >= pair.minimum)).toBe(true);
  });
});
