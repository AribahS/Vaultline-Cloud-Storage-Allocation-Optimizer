import { KnapsackItem, KnapsackResult, TeachingEngineResult, TeachingStep, TableStep, TracebackStep } from './types';
import { solveGreedy } from './greedy';

export interface SolveFullKnapsackOptions {
  quotaUnits: number;
  quotaBytes: number;
  unitBytes: number;
}

/**
 * Solves 0/1 Knapsack using memory-efficient rolling rows + bit-packed decision array.
 * Space: 2 * (W + 1) numbers + (n * (W + 1) / 8) bytes for bit-packed decisions.
 * For n=500, W=20,000, bit array is ~1.25 MB.
 */
export function solveFullKnapsack(
  items: KnapsackItem[],
  options: SolveFullKnapsackOptions
): KnapsackResult {
  const startTime = performance.now();
  const { quotaUnits: W, quotaBytes, unitBytes } = options;

  // Filter excluded items
  const activeCandidates = items.filter((item) => !item.isExcluded);

  // Separate pinned items
  const pinnedItems: KnapsackItem[] = [];
  const regularItems: KnapsackItem[] = [];

  let pinnedUnits = 0;
  let pinnedValue = 0;
  let pinnedBytes = 0;

  for (const item of activeCandidates) {
    if (item.isPinned) {
      pinnedItems.push(item);
      pinnedUnits += item.normalizedSize;
      pinnedValue += item.value;
      pinnedBytes += item.originalSize;
    } else {
      regularItems.push(item);
    }
  }

  const maxPossibleValue = activeCandidates.reduce((acc, it) => acc + it.value, 0);

  // Check if pinned items exceed quota
  if (pinnedUnits > W) {
    const errorMsg = `Pinned files (${pinnedUnits} units / ${(pinnedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB) exceed the selected quota (${W} units). Please unpin some files or increase quota.`;
    return {
      keptItems: pinnedItems,
      droppedItems: regularItems,
      totalValue: pinnedValue,
      maxPossibleValue,
      totalSizeKept: pinnedBytes,
      totalSizeDropped: regularItems.reduce((acc, it) => acc + it.originalSize, 0),
      normalizedSizeKept: pinnedUnits,
      quotaUnits: W,
      quotaBytes,
      unitBytes,
      quotaCurve: [],
      cellsComputed: 0,
      executionTimeMs: performance.now() - startTime,
      error: errorMsg,
    };
  }

  const remainingQuota = W - pinnedUnits;
  const n = regularItems.length;

  if (n === 0 || remainingQuota <= 0) {
    const kept = [...pinnedItems];
    const dropped = [...regularItems];
    const totalBytesKept = kept.reduce((a, b) => a + b.originalSize, 0);
    const totalBytesDropped = dropped.reduce((a, b) => a + b.originalSize, 0);

    return {
      keptItems: kept,
      droppedItems: dropped,
      totalValue: pinnedValue,
      maxPossibleValue,
      totalSizeKept: totalBytesKept,
      totalSizeDropped: totalBytesDropped,
      normalizedSizeKept: pinnedUnits,
      quotaUnits: W,
      quotaBytes,
      unitBytes,
      quotaCurve: [{ quotaUnits: W, quotaBytes, totalValue: pinnedValue }],
      cellsComputed: 0,
      executionTimeMs: performance.now() - startTime,
    };
  }

  // Bit-packed decision matrix: n rows x (remainingQuota + 1) columns
  // Bit = 1 if item i was TAKEN at quota w, 0 if SKIPPED
  const cols = remainingQuota + 1;
  const totalBits = n * cols;
  const decisionBytes = Math.ceil(totalBits / 8);
  const decisions = new Uint8Array(decisionBytes);

  const setDecision = (itemIdx: number, w: number, taken: boolean) => {
    if (!taken) return;
    const bitPos = itemIdx * cols + w;
    const byteIdx = bitPos >> 3; // Math.floor(bitPos / 8)
    const bitOffset = bitPos & 7; // bitPos % 8
    decisions[byteIdx] |= 1 << bitOffset;
  };

  const getDecision = (itemIdx: number, w: number): boolean => {
    const bitPos = itemIdx * cols + w;
    const byteIdx = bitPos >> 3;
    const bitOffset = bitPos & 7;
    return (decisions[byteIdx] & (1 << bitOffset)) !== 0;
  };

  // Two rolling value rows of Float64Array
  let prevRow = new Float64Array(cols);
  let currRow = new Float64Array(cols);

  // We also track item count for tie breaking (prefer fewer items)
  let prevCount = new Uint16Array(cols);
  let currCount = new Uint16Array(cols);

  let cellsComputed = 0;

  for (let i = 0; i < n; i++) {
    const item = regularItems[i];
    const itemSize = item.normalizedSize;
    const itemVal = item.value;

    for (let w = 0; w <= remainingQuota; w++) {
      cellsComputed++;
      const skipVal = prevRow[w];
      const skipCount = prevCount[w];

      if (itemSize > w) {
        currRow[w] = skipVal;
        currCount[w] = skipCount;
        setDecision(i, w, false);
      } else {
        const takeVal = itemVal + prevRow[w - itemSize];
        const takeCount = 1 + prevCount[w - itemSize];

        if (takeVal > skipVal) {
          currRow[w] = takeVal;
          currCount[w] = takeCount;
          setDecision(i, w, true);
        } else if (takeVal < skipVal) {
          currRow[w] = skipVal;
          currCount[w] = skipCount;
          setDecision(i, w, false);
        } else {
          // Tie-break: prefer fewer items
          if (takeCount < skipCount) {
            currRow[w] = takeVal;
            currCount[w] = takeCount;
            setDecision(i, w, true);
          } else {
            currRow[w] = skipVal;
            currCount[w] = skipCount;
            setDecision(i, w, false);
          }
        }
      }
    }

    // Swap rows
    prevRow.set(currRow);
    prevCount.set(currCount);
  }

  // Traceback to find kept items from regularItems
  const keptRegular: KnapsackItem[] = [];
  const droppedRegular: KnapsackItem[] = [];

  let curW = remainingQuota;
  for (let i = n - 1; i >= 0; i--) {
    const taken = getDecision(i, curW);
    const item = regularItems[i];
    if (taken) {
      keptRegular.push(item);
      curW -= item.normalizedSize;
    } else {
      droppedRegular.push(item);
    }
  }

  // Reverse keptRegular to preserve original ordering
  keptRegular.reverse();
  droppedRegular.reverse();

  const keptItems = [...pinnedItems, ...keptRegular];
  const droppedItems = [...droppedRegular];

  const totalValue = keptItems.reduce((acc, it) => acc + it.value, 0);
  const totalSizeKept = keptItems.reduce((acc, it) => acc + it.originalSize, 0);
  const totalSizeDropped = droppedItems.reduce((acc, it) => acc + it.originalSize, 0);
  const normalizedSizeKept = keptItems.reduce((acc, it) => acc + it.normalizedSize, 0);

  // Generate quota curve: best priority vs quota
  // Sample up to 100 points
  const quotaCurve: { quotaUnits: number; quotaBytes: number; totalValue: number }[] = [];
  const step = Math.max(1, Math.floor(remainingQuota / 100));

  for (let w = 0; w <= remainingQuota; w += step) {
    const actualUnits = pinnedUnits + w;
    quotaCurve.push({
      quotaUnits: actualUnits,
      quotaBytes: actualUnits * unitBytes,
      totalValue: Math.round(pinnedValue + prevRow[w]),
    });
  }
  // Ensure end point is included
  if (quotaCurve.length === 0 || quotaCurve[quotaCurve.length - 1].quotaUnits !== W) {
    quotaCurve.push({
      quotaUnits: W,
      quotaBytes: W * unitBytes,
      totalValue: Math.round(pinnedValue + prevRow[remainingQuota]),
    });
  }

  // Compute Greedy for comparison chip
  const greedy = solveGreedy(items, options);

  return {
    keptItems,
    droppedItems,
    totalValue,
    maxPossibleValue,
    totalSizeKept,
    totalSizeDropped,
    normalizedSizeKept,
    quotaUnits: W,
    quotaBytes,
    unitBytes,
    quotaCurve,
    cellsComputed,
    executionTimeMs: performance.now() - startTime,
    greedyResult: {
      keptItems: greedy.keptItems,
      droppedItems: greedy.droppedItems,
      totalValue: greedy.totalValue,
      totalSizeKept: greedy.totalSizeKept,
    },
  };
}

/**
 * Teaching mode: runs on main thread for small n and W (up to 8 items, 15 columns).
 * Records every cell computation and traceback step with plain-English narration,
 * ties explanation, and substitution formula.
 */
export function solveTeachingKnapsack(
  items: KnapsackItem[],
  quotaUnits: number
): TeachingEngineResult {
  const n = items.length;
  const W = Math.max(0, Math.min(25, quotaUnits));

  // 2D DP table: (n+1) x (W+1)
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  const counts: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  const steps: TeachingStep[] = [];

  let stepCounter = 0;

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    const itemSize = item.normalizedSize;
    const itemVal = item.value;

    for (let w = 0; w <= W; w++) {
      const prevVal = dp[i - 1][w];
      const prevCount = counts[i - 1][w];

      let cellVal: number;
      let cellCount: number;
      let decision: 'take' | 'skip' | 'fit_skip';
      let isTie = false;
      let explanation = '';
      let recurrenceFormula = '';
      let takeRemainingVal: number | null = null;
      let candidateTakeVal: number | null = null;

      if (itemSize > w) {
        // Does not fit
        cellVal = prevVal;
        cellCount = prevCount;
        decision = 'fit_skip';
        explanation = `"${item.name}" needs ${itemSize} quota units, but only ${w} are available in this sub-problem. It cannot fit, so we inherit the best value from the row above (${prevVal}).`;
        recurrenceFormula = `dp[${i}][${w}] = dp[${i - 1}][${w}] = ${prevVal}`;
      } else {
        takeRemainingVal = dp[i - 1][w - itemSize];
        candidateTakeVal = itemVal + takeRemainingVal;
        const takeCount = 1 + counts[i - 1][w - itemSize];

        if (candidateTakeVal > prevVal) {
          cellVal = candidateTakeVal;
          cellCount = takeCount;
          decision = 'take';
          explanation = `"${item.name}" (size ${itemSize}, priority ${itemVal}) fits in quota ${w}. Skip value is ${prevVal}. Take value is ${itemVal} + dp[${i - 1}][${w - itemSize}] (${takeRemainingVal}) = ${candidateTakeVal}. Taking it is strictly better (${candidateTakeVal} > ${prevVal}).`;
          recurrenceFormula = `dp[${i}][${w}] = max(${prevVal}, ${itemVal} + dp[${i - 1}][${w - itemSize}]) = max(${prevVal}, ${candidateTakeVal}) = ${cellVal}`;
        } else if (candidateTakeVal < prevVal) {
          cellVal = prevVal;
          cellCount = prevCount;
          decision = 'skip';
          explanation = `"${item.name}" (size ${itemSize}, priority ${itemVal}) fits in quota ${w}, but skipping gives ${prevVal}, whereas taking it gives ${candidateTakeVal}. Skipping is better (${prevVal} > ${candidateTakeVal}).`;
          recurrenceFormula = `dp[${i}][${w}] = max(${prevVal}, ${itemVal} + dp[${i - 1}][${w - itemSize}]) = max(${prevVal}, ${candidateTakeVal}) = ${cellVal}`;
        } else {
          // Tie
          isTie = true;
          if (takeCount < prevCount) {
            cellVal = candidateTakeVal;
            cellCount = takeCount;
            decision = 'take';
            explanation = `Tie at priority ${prevVal}! Both skipping and taking yield ${prevVal}. Tie-breaking rule prefers fewer files to reduce storage clutter: taking requires ${takeCount} file(s) vs skipping's ${prevCount}, so we TAKE.`;
          } else {
            cellVal = prevVal;
            cellCount = prevCount;
            decision = 'skip';
            explanation = `Tie at priority ${prevVal}! Both skipping and taking yield ${prevVal}. Tie-breaking rule prefers fewer files: skipping needs ${prevCount} file(s) vs taking's ${takeCount}, so we SKIP.`;
          }
          recurrenceFormula = `dp[${i}][${w}] = max(${prevVal}, ${candidateTakeVal}) = ${cellVal} [Tie broken: ${cellCount} files preferred]`;
        }
      }

      dp[i][w] = cellVal;
      counts[i][w] = cellCount;

      const step: TableStep = {
        stepIndex: stepCounter++,
        type: 'cell',
        i,
        w,
        item,
        cellValue: cellVal,
        prevCellValue: prevVal,
        takeRemainingValue: takeRemainingVal,
        candidateTakeValue: candidateTakeVal,
        decision,
        isTie,
        prevItemsCount: prevCount,
        takeItemsCount: decision === 'take' ? cellCount : prevCount,
        explanation,
        recurrenceFormula,
      };
      steps.push(step);
    }
  }

  // Traceback phase from bottom-right (n, W) to (0, 0)
  let curW = W;
  const keptIds: string[] = [];
  const chosenListLive: string[] = [];

  for (let i = n; i >= 1; i--) {
    const item = items[i - 1];
    const valCurr = dp[i][curW];
    const valAbove = dp[i - 1][curW];

    let taken = false;
    let reason = '';

    if (item.normalizedSize <= curW && valCurr === item.value + dp[i - 1][curW - item.normalizedSize]) {
      // Check if value actually differed or if tie-break chose take
      if (valCurr !== valAbove || counts[i][curW] !== counts[i - 1][curW]) {
        taken = true;
      }
    }

    if (taken) {
      keptIds.push(item.id);
      chosenListLive.push(item.id);
      reason = `At row ${i} (quota ${curW}), value is ${valCurr} which came from taking "${item.name}" (value ${item.value} + cell dp[${i - 1}][${curW - item.normalizedSize}] = ${dp[i - 1][curW - item.normalizedSize]}). TAKEN. Remaining quota decreases from ${curW} to ${curW - item.normalizedSize}.`;
      curW -= item.normalizedSize;
    } else {
      reason = `At row ${i} (quota ${curW}), cell value ${valCurr} matches cell directly above dp[${i - 1}][${curW}] (${valAbove}). "${item.name}" was SKIPPED. Quota remains ${curW}.`;
    }

    const tbStep: TracebackStep = {
      stepIndex: stepCounter++,
      type: 'traceback',
      i,
      w: curW,
      item,
      taken,
      reason,
      chosenIds: [...chosenListLive],
      remainingQuota: curW,
    };
    steps.push(tbStep);
  }

  keptIds.reverse();

  return {
    items,
    W,
    table: dp,
    steps,
    keptItemIds: keptIds,
    totalValue: dp[n][W],
    isTruncated: false,
  };
}

