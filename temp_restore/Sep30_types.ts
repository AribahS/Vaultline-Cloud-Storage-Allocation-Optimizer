export type FileCategory =
  | 'document'
  | 'code'
  | 'photo'
  | 'video'
  | 'archive'
  | 'audio'
  | 'database'
  | 'log_temp'
  | 'other';

export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  size: number; // in bytes
  type: string;
  lastModified: number;
  category: FileCategory;
  priority: number; // 1-10
  prioritySource: 'auto' | 'edited';
  isPinned: boolean; // Must keep
  isExcluded: boolean; // Must not keep
  isDuplicate?: boolean;
  duplicateGroup?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  path: string;
  size: number;
  fileCount: number;
  priority: number; // size-weighted average
  prioritySource: 'auto' | 'edited';
  isPinned: boolean;
  isExcluded: boolean;
  childFileIds: string[];
}

export interface KnapsackItem {
  id: string;
  name: string;
  path?: string;
  originalSize: number; // in bytes
  normalizedSize: number; // rounded up in capacity units
  value: number; // priority (1-10 or scaled)
  category?: FileCategory;
  isPinned?: boolean;
  isExcluded?: boolean;
}

export interface KnapsackResult {
  keptItems: KnapsackItem[];
  droppedItems: KnapsackItem[];
  totalValue: number;
  maxPossibleValue: number;
  totalSizeKept: number; // in bytes
  totalSizeDropped: number; // in bytes
  normalizedSizeKept: number;
  quotaUnits: number;
  quotaBytes: number;
  unitBytes: number;
  quotaCurve: { quotaUnits: number; quotaBytes: number; totalValue: number }[];
  cellsComputed: number;
  executionTimeMs: number;
  greedyResult?: {
    keptItems: KnapsackItem[];
    droppedItems: KnapsackItem[];
    totalValue: number;
    totalSizeKept: number;
  };
  error?: string;
}

export type CellDecision = 'take' | 'skip' | 'fit_skip';

export interface TableStep {
  stepIndex: number;
  type: 'cell';
  i: number; // row 1..n
  w: number; // col 0..W
  item: KnapsackItem;
  cellValue: number;
  prevCellValue: number; // dp[i-1][w]
  takeRemainingValue: number | null; // dp[i-1][w - size]
  candidateTakeValue: number | null; // value + dp[i-1][w - size]
  decision: CellDecision;
  isTie: boolean;
  prevItemsCount: number;
  takeItemsCount: number;
  explanation: string;
  recurrenceFormula: string;
}

export interface TracebackStep {
  stepIndex: number;
  type: 'traceback';
  i: number;
  w: number;
  item: KnapsackItem;
  taken: boolean;
  reason: string;
  chosenIds: string[];
  remainingQuota: number;
}

export type TeachingStep = TableStep | TracebackStep;

export interface TeachingEngineResult {
  items: KnapsackItem[];
  W: number;
  table: number[][]; // (n+1) x (W+1)
  steps: TeachingStep[];
  keptItemIds: string[];
  totalValue: number;
  isTruncated: boolean;
}

