import { BYTE_UNITS } from '../engine/normalizer';
import { GREEDY_COUNTEREXAMPLE_DATASET } from '../engine/greedy';
import type { KnapsackItem } from '../engine/types';

export const TUTORIAL_ITEMS: KnapsackItem[] = [
  { id: 'teach-a', name: 'A', originalSize: 2 * BYTE_UNITS.GB, normalizedSize: 2, value: 3 },
  { id: 'teach-b', name: 'B', originalSize: 3 * BYTE_UNITS.GB, normalizedSize: 3, value: 4 },
  { id: 'teach-c', name: 'C', originalSize: 4 * BYTE_UNITS.GB, normalizedSize: 4, value: 5 },
];

export const GREEDY_COUNTER_ITEMS: KnapsackItem[] = GREEDY_COUNTEREXAMPLE_DATASET.items.map(item => ({
  ...item, originalSize: item.normalizedSize * BYTE_UNITS.GB,
}));
