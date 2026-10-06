import { FileMetadata } from './types';

export interface FileInsights {
  biggestSpaceHogs: {
    files: FileMetadata[];
    totalBytes: number;
  };
  staleFilesOverYear: {
    files: FileMetadata[];
    count: number;
    totalBytes: number;
  };
  duplicates: {
    files: FileMetadata[];
    duplicateGroups: Record<string, FileMetadata[]>;
    count: number;
    wastedBytes: number; // sum of duplicate copies except one per group
  };
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function detectInsights(files: FileMetadata[], now: number = Date.now()): FileInsights {
  const activeFiles = files.filter((f) => !f.isExcluded);

  // 1. Biggest space hogs (top 3 by size)
  const sortedBySize = [...activeFiles].sort((a, b) => b.size - a.size);
  const topHogs = sortedBySize.slice(0, 3);
  const totalHogsBytes = topHogs.reduce((acc, f) => acc + f.size, 0);

  // 2. Not touched in over a year
  const stale = activeFiles.filter((f) => now - f.lastModified > ONE_YEAR_MS);
  const staleBytes = stale.reduce((acc, f) => acc + f.size, 0);

  // 3. Possible duplicates by (name.toLowerCase() + size)
  const groups: Record<string, FileMetadata[]> = {};
  for (const f of activeFiles) {
    const key = `${f.name.toLowerCase()}___${f.size}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }

  let dupCount = 0;
  let wastedBytes = 0;
  const dupFiles: FileMetadata[] = [];
  const dupGroups: Record<string, FileMetadata[]> = {};

  for (const [key, group] of Object.entries(groups)) {
    if (group.length > 1) {
      dupGroups[key] = group;
      dupCount += group.length;
      dupFiles.push(...group);
      wastedBytes += group[0].size * (group.length - 1);
    }
  }

  return {
    biggestSpaceHogs: {
      files: topHogs,
      totalBytes: totalHogsBytes,
    },
    staleFilesOverYear: {
      files: stale,
      count: stale.length,
      totalBytes: staleBytes,
    },
    duplicates: {
      files: dupFiles,
      duplicateGroups: dupGroups,
      count: dupCount,
      wastedBytes,
    },
  };
}
