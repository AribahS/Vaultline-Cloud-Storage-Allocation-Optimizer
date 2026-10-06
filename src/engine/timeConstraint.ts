import { FileMetadata } from './types';

export interface TimeConstraintResult {
  keptFiles: FileMetadata[];
  droppedFiles: FileMetadata[];
  totalImportance: number;
  totalBytes: number;
  totalTimeSeconds: number;
  spaceOnlyViolatesTime: boolean;
  spaceOnlyTimeSeconds: number;
  slice2D: number[][]; // [spaceUnit][timeUnit]
  maxSpaceUnits: number;
  maxTimeUnits: number;
}

/**
 * 2-Constraint Knapsack: Maximize importance subject to:
 * 1. Total Space <= spaceLimitBytes
 * 2. Total Copy Time <= timeLimitSeconds (where time = fileSize / speedBytesPerSec)
 */
export function solveSpaceAndTime(
  files: FileMetadata[],
  spaceLimitBytes: number,
  timeLimitSeconds: number,
  speedBytesPerSec: number = 25 * 1024 * 1024 // 25 MB/s default
): TimeConstraintResult {
  const activeFiles = files.filter((f) => !f.isExcluded).slice(0, 15); // Cap to 15 items for 3D state
  const n = activeFiles.length;

  // Scale down into discrete units: Space in 1..20 units, Time in 1..20 units
  const maxSpaceUnits = 16;
  const maxTimeUnits = 16;

  const spaceUnitSize = Math.max(1, spaceLimitBytes / maxSpaceUnits);
  const timeUnitSize = Math.max(1, timeLimitSeconds / maxTimeUnits);

  // Compute file requirements in units
  const fileUnits = activeFiles.map((f) => {
    const timeSec = f.size / speedBytesPerSec;
    return {
      file: f,
      sUnits: Math.max(1, Math.ceil(f.size / spaceUnitSize)),
      tUnits: Math.max(1, Math.ceil(timeSec / timeUnitSize)),
      timeSec,
      value: f.priority,
    };
  });

  // dp[i][s][t]
  const dp: number[][][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: maxSpaceUnits + 1 }, () => new Array(maxTimeUnits + 1).fill(0))
  );

  for (let i = 1; i <= n; i++) {
    const item = fileUnits[i - 1];
    for (let s = 0; s <= maxSpaceUnits; s++) {
      for (let t = 0; t <= maxTimeUnits; t++) {
        const skip = dp[i - 1][s][t];
        if (item.sUnits <= s && item.tUnits <= t) {
          const take = item.value + dp[i - 1][s - item.sUnits][t - item.tUnits];
          dp[i][s][t] = Math.max(skip, take);
        } else {
          dp[i][s][t] = skip;
        }
      }
    }
  }

  // Traceback
  const keptFiles: FileMetadata[] = [];
  const droppedFiles: FileMetadata[] = [];
  let curS = maxSpaceUnits;
  let curT = maxTimeUnits;

  for (let i = n; i >= 1; i--) {
    const item = fileUnits[i - 1];
    if (dp[i][curS][curT] !== dp[i - 1][curS][curT]) {
      keptFiles.push(item.file);
      curS -= item.sUnits;
      curT -= item.tUnits;
    } else {
      droppedFiles.push(item.file);
    }
  }

  keptFiles.reverse();
  droppedFiles.reverse();

  const totalBytes = keptFiles.reduce((acc, f) => acc + f.size, 0);
  const totalImportance = keptFiles.reduce((acc, f) => acc + f.priority, 0);
  const totalTimeSeconds = totalBytes / speedBytesPerSec;

  // Space-only baseline test: What if we only solved for space without time constraint?
  // Check if greedy or 1-constraint would have violated time
  const spaceOnlyCandidates = [...activeFiles].sort((a, b) => (b.priority / b.size) - (a.priority / a.size));
  let spaceOnlyBytes = 0;
  for (const f of spaceOnlyCandidates) {
    if (spaceOnlyBytes + f.size <= spaceLimitBytes) {
      spaceOnlyBytes += f.size;
    }
  }
  const spaceOnlyTimeSeconds = spaceOnlyBytes / speedBytesPerSec;
  const spaceOnlyViolatesTime = spaceOnlyTimeSeconds > timeLimitSeconds;

  // 2D slice at last item
  const slice2D = dp[n];

  return {
    keptFiles,
    droppedFiles,
    totalImportance,
    totalBytes,
    totalTimeSeconds,
    spaceOnlyViolatesTime,
    spaceOnlyTimeSeconds,
    slice2D,
    maxSpaceUnits,
    maxTimeUnits,
  };
}
