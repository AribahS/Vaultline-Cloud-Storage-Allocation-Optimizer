import { FileMetadata, FolderItem, KnapsackItem } from './types';
import { normaliseItemSize } from './normalizer';

/**
 * Detect duplicates based on identical fileName + size (in bytes). No file content is read.
 */
export function markDuplicates(files: FileMetadata[]): FileMetadata[] {
  const groups = new Map<string, FileMetadata[]>();

  for (const file of files) {
    const key = `${file.name.toLowerCase()}___${file.size}`;
    const list = groups.get(key) || [];
    list.push(file);
    groups.set(key, list);
  }

  return files.map((file) => {
    const key = `${file.name.toLowerCase()}___${file.size}`;
    const group = groups.get(key);
    const isDuplicate = !!group && group.length > 1;
    return {
      ...file,
      isDuplicate,
      duplicateGroup: isDuplicate ? key : undefined,
    };
  });
}

/**
 * Deduplicate: for each duplicate group, keep the first one active and set isExcluded = true for the rest.
 */
export function resolveDuplicatesKeepOne(files: FileMetadata[]): FileMetadata[] {
  const seen = new Set<string>();

  return files.map((file) => {
    if (!file.isDuplicate || !file.duplicateGroup) {
      return file;
    }
    if (seen.has(file.duplicateGroup)) {
      return {
        ...file,
        isExcluded: true,
      };
    }
    seen.add(file.duplicateGroup);
    return file;
  });
}

/**
 * Group files into top-level folder items (or chosen depth folder items).
 * Each folder's priority is size-weighted average priority:
 * sum(file.size * file.priority) / sum(file.size).
 */
export function aggregateFolders(files: FileMetadata[], depth: number = 1): FolderItem[] {
  const folderMap = new Map<
    string,
    {
      files: FileMetadata[];
      totalSize: number;
      weightedPrioritySum: number;
    }
  >();

  for (const file of files) {
    if (file.isExcluded) continue;

    // Normalize path separators
    const cleanPath = file.path.replace(/\\/g, '/');
    const segments = cleanPath.split('/').filter(Boolean);

    let folderPath = 'Root Files';
    if (segments.length > 1) {
      const takeSegments = segments.slice(0, Math.min(depth, segments.length - 1));
      folderPath = '/' + takeSegments.join('/');
    }

    const current = folderMap.get(folderPath) || {
      files: [],
      totalSize: 0,
      weightedPrioritySum: 0,
    };

    current.files.push(file);
    current.totalSize += file.size;
    current.weightedPrioritySum += file.size * file.priority;
    folderMap.set(folderPath, current);
  }

  const result: FolderItem[] = [];
  folderMap.forEach((data, folderPath) => {
    const avgPriority =
      data.totalSize > 0
        ? Math.max(1, Math.min(10, Math.round(data.weightedPrioritySum / data.totalSize)))
        : 5;

    const folderName = folderPath === 'Root Files' ? 'Root Files' : folderPath.split('/').pop() || folderPath;
    const hasPinned = data.files.some((f) => f.isPinned);

    result.push({
      id: `folder-${folderPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: folderName,
      path: folderPath,
      size: data.totalSize,
      fileCount: data.files.length,
      priority: avgPriority,
      prioritySource: 'auto',
      isPinned: hasPinned,
      isExcluded: false,
      childFileIds: data.files.map((f) => f.id),
    });
  });

  return result.sort((a, b) => b.size - a.size);
}

/**
 * Handle >500 items cap in file mode.
 */
export type CapStrategy = 'largest_500' | 'folder_mode' | 'bundle_small_files';

export function applyCapStrategy(
  files: FileMetadata[],
  strategy: CapStrategy,
  unitBytes: number,
  smallThresholdBytes: number = 5 * 1024 * 1024 // 5 MB
): { items: KnapsackItem[]; strategyAppliedNote?: string } {
  const activeFiles = files.filter((f) => !f.isExcluded);

  if (activeFiles.length <= 500) {
    const items: KnapsackItem[] = activeFiles.map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      originalSize: f.size,
      normalizedSize: normaliseItemSize(f.size, unitBytes),
      value: f.priority,
      category: f.category,
      isPinned: f.isPinned,
      isExcluded: f.isExcluded,
    }));
    return { items };
  }

  if (strategy === 'largest_500') {
    // Sort descending by size, keep top 500
    const sorted = [...activeFiles].sort((a, b) => b.size - a.size);
    const top500 = sorted.slice(0, 500);
    const items: KnapsackItem[] = top500.map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      originalSize: f.size,
      normalizedSize: normaliseItemSize(f.size, unitBytes),
      value: f.priority,
      category: f.category,
      isPinned: f.isPinned,
      isExcluded: f.isExcluded,
    }));
    return {
      items,
      strategyAppliedNote: `Cap active: Limited to the 500 largest files out of ${files.length}.`,
    };
  }

  if (strategy === 'bundle_small_files') {
    const largeFiles = activeFiles.filter((f) => f.size >= smallThresholdBytes);
    const smallFiles = activeFiles.filter((f) => f.size < smallThresholdBytes);

    const items: KnapsackItem[] = largeFiles.map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      originalSize: f.size,
      normalizedSize: normaliseItemSize(f.size, unitBytes),
      value: f.priority,
      category: f.category,
      isPinned: f.isPinned,
      isExcluded: f.isExcluded,
    }));

    if (smallFiles.length > 0) {
      const bundleSize = smallFiles.reduce((acc, f) => acc + f.size, 0);
      const bundleWeightedVal =
        bundleSize > 0
          ? Math.round(smallFiles.reduce((acc, f) => acc + f.size * f.priority, 0) / bundleSize)
          : 6;

      items.push({
        id: 'bundle-small-files',
        name: `[Bundle: ${smallFiles.length} files under ${(smallThresholdBytes / 1024 / 1024).toFixed(0)} MB]`,
        originalSize: bundleSize,
        normalizedSize: normaliseItemSize(bundleSize, unitBytes),
        value: bundleWeightedVal,
        isPinned: smallFiles.some((f) => f.isPinned),
        isExcluded: false,
      });
    }

    return {
      items,
      strategyAppliedNote: `Cap active: Consolidated ${smallFiles.length} files under 5 MB into a single bundle item.`,
    };
  }

  // Fallback
  const items: KnapsackItem[] = activeFiles.slice(0, 500).map((f) => ({
    id: f.id,
    name: f.name,
    path: f.path,
    originalSize: f.size,
    normalizedSize: normaliseItemSize(f.size, unitBytes),
    value: f.priority,
    category: f.category,
    isPinned: f.isPinned,
    isExcluded: f.isExcluded,
  }));
  return { items };
}
