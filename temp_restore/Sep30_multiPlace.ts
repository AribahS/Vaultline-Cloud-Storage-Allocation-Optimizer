import { FileMetadata, KnapsackItem } from './types';
import { solveFullKnapsack } from './knapsack';
import { normaliseItemSize, normaliseQuota, resolveUnitBytes } from './normalizer';

export interface StoragePlace {
  id: string;
  name: string;
  quotaBytes: number;
  color: string;
}

export interface PlaceAllocation {
  place: StoragePlace;
  assignedFiles: FileMetadata[];
  usedBytes: number;
  totalImportance: number;
}

export interface MultiPlaceResult {
  allocations: PlaceAllocation[];
  unassignedFiles: FileMetadata[];
  totalImportanceAchieved: number;
  totalBytesKept: number;
  totalBytesAvailable: number;
  heuristicNote: string;
}

export function solveMultiPlace(
  files: FileMetadata[],
  places: StoragePlace[]
): MultiPlaceResult {
  let remainingCandidates = files.filter((f) => !f.isExcluded);
  const allocations: PlaceAllocation[] = [];
  let grandTotalImportance = 0;
  let totalBytesKept = 0;
  const totalBytesAvailable = places.reduce((sum, p) => sum + p.quotaBytes, 0);

  for (const place of places) {
    if (remainingCandidates.length === 0 || place.quotaBytes <= 0) {
      allocations.push({
        place,
        assignedFiles: [],
        usedBytes: 0,
        totalImportance: 0,
      });
      continue;
    }

    const unitBytes = resolveUnitBytes(place.quotaBytes, 'auto');
    const quotaUnits = normaliseQuota(place.quotaBytes, unitBytes);

    const items: KnapsackItem[] = remainingCandidates.map((f) => ({
      id: f.id,
      name: f.name,
      originalSize: f.size,
      normalizedSize: normaliseItemSize(f.size, unitBytes),
      value: f.priority,
      category: f.category,
      isPinned: f.isPinned,
      isExcluded: f.isExcluded,
    }));

    const result = solveFullKnapsack(items, {
      quotaUnits,
      quotaBytes: place.quotaBytes,
      unitBytes,
    });

    const assignedIds = new Set(result.keptItems.map((i) => i.id));
    const assignedFiles = remainingCandidates.filter((f) => assignedIds.has(f.id));
    remainingCandidates = remainingCandidates.filter((f) => !assignedIds.has(f.id));

    const usedBytes = assignedFiles.reduce((acc, f) => acc + f.size, 0);
    const imp = assignedFiles.reduce((acc, f) => acc + f.priority, 0);

    grandTotalImportance += imp;
    totalBytesKept += usedBytes;

    allocations.push({
      place,
      assignedFiles,
      usedBytes,
      totalImportance: imp,
    });
  }

  return {
    allocations,
    unassignedFiles: remainingCandidates,
    totalImportanceAchieved: grandTotalImportance,
    totalBytesKept,
    totalBytesAvailable,
    heuristicNote: 'With several places, Vaultline gives a very good split, not a guaranteed perfect one (sequential DP heuristic).',
  };
}

