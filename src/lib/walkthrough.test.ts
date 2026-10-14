import { describe, expect, it } from 'vitest';
import { solveTeachingKnapsack } from '../engine/knapsack';
import { BYTE_UNITS } from '../engine/normalizer';
import { STUDENT_LAPTOP_DATASET } from '../data/sampleDatasets';
import { buildYourPlanDataset, buildTeachingWalkthrough, cellSentences, yourPlanWeight } from './walkthrough';
import { GREEDY_COUNTER_ITEMS, TUTORIAL_ITEMS } from './walkthroughDatasets';

describe('Algorithm walkthrough data', () => {
  it('keeps the tutorial and counterexample fill/traceback steps aligned with the teaching solver', () => {
    for (const [items, capacity, expectedValue] of [[TUTORIAL_ITEMS, 5, 7], [GREEDY_COUNTER_ITEMS, 10, 48]] as const) {
      const actual = solveTeachingKnapsack(items, capacity);
      const walk = buildTeachingWalkthrough(items, capacity);
      const trace = walk.steps.filter(step => step.phase === 'traceback');
      expect(walk.result.totalValue).toBe(actual.totalValue);
      expect(walk.result.totalValue).toBe(expectedValue);
      expect(walk.fillCount).toBe(items.length * (capacity + 1));
      expect(trace.map(step => step.item.id)).toHaveLength(items.length);
      expect(trace.at(-1)?.chosenIds.slice().sort()).toEqual(actual.keptItemIds.slice().sort());
      expect(walk.steps.map(step => step.phase)).toEqual([
        ...Array(walk.fillCount).fill('fill'), ...Array(items.length).fill('traceback'),
      ]);
    }
    const counter = buildTeachingWalkthrough(GREEDY_COUNTER_ITEMS, 10);
    expect(counter.result.keptItemIds.slice().sort()).toEqual(['counter-b', 'counter-c']);
  });

  it('builds all sample files across twelve columns and rounds 3.4 GB up to three', () => {
    const quota = 15 * BYTE_UNITS.GB;
    const your = buildYourPlanDataset(STUDENT_LAPTOP_DATASET, quota);
    const walk = buildTeachingWalkthrough(your.items, your.capacity);
    expect(your.items).toHaveLength(12);
    expect(your.capacity).toBe(12);
    expect(your.columnBytes).toBe(1.25 * BYTE_UNITS.GB);
    expect(yourPlanWeight(3.4 * BYTE_UNITS.GB, your.columnBytes)).toBe(3);
    expect(walk.result.table.at(-1)?.at(-1)).toBeGreaterThan(0);
    expect(buildYourPlanDataset([], quota).hint).toMatch(/add files/i);
  });

  it('fills skip, take, winner, and does-not-fit sentences with real values', () => {
    const items = [
      { id: 'high', name: 'High score file', originalSize: BYTE_UNITS.GB, normalizedSize: 1, value: 9 },
      { id: 'low', name: 'Low score file', originalSize: 2 * BYTE_UNITS.GB, normalizedSize: 1, value: 1 },
    ];
    const walk = buildTeachingWalkthrough(items, 1);
    const fill = walk.steps.filter(step => step.phase === 'fill');
    const noFit = fill.find(step => step.phase === 'fill' && step.row === 1 && step.column === 0)!;
    const takingWins = fill.find(step => step.phase === 'fill' && step.row === 1 && step.column === 1)!;
    const skippingWins = fill.find(step => step.phase === 'fill' && step.row === 2 && step.column === 1)!;
    const cases = [
      cellSentences(noFit, BYTE_UNITS.GB), cellSentences(takingWins, BYTE_UNITS.GB), cellSentences(skippingWins, BYTE_UNITS.GB),
    ].flat();
    expect(cases.some(sentence => sentence.includes('High score file does not fit here, so the score stays 0.'))).toBe(true);
    expect(cases.some(sentence => sentence.includes('Skipping High score file leaves a best score of 0.'))).toBe(true);
    expect(cases.some(sentence => sentence.includes('Taking wins, 9 beats 0.'))).toBe(true);
    expect(cases.some(sentence => sentence.includes('Skipping wins, 9 is at least 1.'))).toBe(true);
    expect(cases.some(sentence => sentence.includes('size 1 GB') && sentence.includes('with 0 B left, giving 9.'))).toBe(true);
    expect(cases.every(sentence => !/[{}]/.test(sentence))).toBe(true);
  });
});
