import { describe, expect, it } from 'vitest';
import { HERO_DEMO_CAPACITY_KB, HERO_DEMO_SETS, nextHeroDemoSetIndex, solveHeroDemo } from './heroDemo';

describe('landing hero demo', () => {
  it('uses unique file sets and cycles to a different set each loop', () => {
    expect(new Set(HERO_DEMO_SETS.map(set => set.id)).size).toBe(HERO_DEMO_SETS.length);
    for (let index = 0; index < HERO_DEMO_SETS.length; index++) {
      expect(nextHeroDemoSetIndex(index)).not.toBe(index);
    }
    expect(nextHeroDemoSetIndex(HERO_DEMO_SETS.length - 1)).toBe(0);
  });

  it('shows the exact solver selection and final score in the teaching DP table', () => {
    for (const set of HERO_DEMO_SETS) {
      const plan = solveHeroDemo(set);
      const keptIds = plan.result.keptItems.map(item => item.id).sort();
      expect(plan.result.totalSizeKept).toBeLessThanOrEqual(HERO_DEMO_CAPACITY_KB * 1024);
      expect(keptIds).toEqual(plan.teaching.keptItemIds.slice().sort());
      expect(plan.result.totalValue).toBe(plan.teaching.table.at(-1)?.at(-1));
      expect(plan.teaching.table).toHaveLength(set.files.length + 1);
      expect(plan.teaching.table.at(-1)).toHaveLength(6);
    }
    const featuredPlan = solveHeroDemo(HERO_DEMO_SETS[0]);
    expect(Math.round(featuredPlan.result.totalSizeKept / 1024)).toBe(78);
    expect(Math.round(featuredPlan.result.totalValue / featuredPlan.result.maxPossibleValue * 100)).toBe(84);
  });
});
