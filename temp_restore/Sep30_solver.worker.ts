import { solveFullKnapsack, SolveFullKnapsackOptions } from '../engine/knapsack';
import { KnapsackItem, KnapsackResult } from '../engine/types';

export interface SolverWorkerRequest {
  id: number;
  items: KnapsackItem[];
  options: SolveFullKnapsackOptions;
}

export interface SolverWorkerResponse {
  id: number;
  result: KnapsackResult;
}

self.onmessage = (e: MessageEvent<SolverWorkerRequest>) => {
  const { id, items, options } = e.data;
  const result = solveFullKnapsack(items, options);
  self.postMessage({ id, result } as SolverWorkerResponse);
};

