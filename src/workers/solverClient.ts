import { KnapsackItem, KnapsackResult } from '../engine/types';
import { SolveFullKnapsackOptions, solveFullKnapsack } from '../engine/knapsack';
import { SolverWorkerRequest, SolverWorkerResponse } from './solver.worker';

let workerInstance: Worker | null = null;
let currentRequestId = 0;
const pendingResolvers = new Map<number, (res: KnapsackResult) => void>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null;
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('./solver.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerInstance.onmessage = (e: MessageEvent<SolverWorkerResponse>) => {
        const { id, result } = e.data;
        const resolver = pendingResolvers.get(id);
        if (resolver) {
          resolver(result);
          pendingResolvers.delete(id);
        }
      };
      workerInstance.onerror = (err) => {
        console.error('Worker error:', err);
      };
    } catch (err) {
      console.warn('Worker creation failed, falling back to main thread solver:', err);
      workerInstance = null;
    }
  }
  return workerInstance;
}

export function runFullKnapsackAsync(
  items: KnapsackItem[],
  options: SolveFullKnapsackOptions
): Promise<KnapsackResult> {
  const worker = getWorker();
  if (!worker) {
    return Promise.resolve(solveFullKnapsack(items, options));
  }

  const id = ++currentRequestId;
  return new Promise<KnapsackResult>((resolve) => {
    pendingResolvers.set(id, resolve);
    const req: SolverWorkerRequest = { id, items, options };
    worker.postMessage(req);
  });
}
