import { FileCategory, FileMetadata } from './types';

export type ProfileId =
  | 'balanced'
  | 'work_first'
  | 'student'
  | 'photos_first'
  | 'videos_first'
  | 'free_space';

export interface ProfileToggles {
  newerFilesMatterMore: boolean;
  rareBigFilesMatterLess: boolean;
  documentsMatterMore: boolean;
}

export interface ImportanceProfile {
  id: ProfileId;
  name: string;
  description: string;
  categoryScores: Record<FileCategory, number>; // 1-10 (Important: 9, Normal: 5, Can go: 2)
}

export const IMPORTANCE_PROFILES: Record<ProfileId, ImportanceProfile> = {
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    description: 'Values documents and photos highest, keeps a fair balance across other formats.',
    categoryScores: {
      document: 9, // Important
      photo: 8,    // Important
      video: 5,    // Normal
      audio: 5,    // Normal
      code: 7,     // Normal
      archive: 5,  // Normal
      database: 9, // Important
      log_temp: 2, // Can go
      other: 5,    // Normal
    },
  },
  work_first: {
    id: 'work_first',
    name: 'Work first',
    description: 'Prioritizes work assets, spreadsheets, databases and business docs over leisure media.',
    categoryScores: {
      document: 9,
      database: 10,
      code: 8,
      archive: 6,
      photo: 5,
      video: 3,
      audio: 2,
      log_temp: 1,
      other: 4,
    },
  },
  student: {
    id: 'student',
    name: 'Student',
    description: 'Protects assignments, lecture PDFs, project code and notes while deprioritizing large recordings.',
    categoryScores: {
      document: 10,
      code: 9,
      photo: 6,
      archive: 5,
      database: 7,
      video: 3,
      audio: 4,
      log_temp: 1,
      other: 4,
    },
  },
  photos_first: {
    id: 'photos_first',
    name: 'Photos and memories first',
    description: 'Puts personal memories, photo libraries, and camera RAWs above temporary files and software.',
    categoryScores: {
      photo: 10,
      video: 8,
      document: 6,
      audio: 5,
      archive: 4,
      code: 3,
      database: 4,
      log_temp: 1,
      other: 3,
    },
  },
  videos_first: {
    id: 'videos_first',
    name: 'Videos first',
    description: 'Maximizes retention of movie clips, tutorials and high-res video captures.',
    categoryScores: {
      video: 10,
      audio: 7,
      photo: 7,
      document: 5,
      archive: 4,
      code: 4,
      database: 5,
      log_temp: 1,
      other: 3,
    },
  },
  free_space: {
    id: 'free_space',
    name: 'Free up the most space',
    description: 'Favors compact, high-value files and marks heavy media for relocation to archive.',
    categoryScores: {
      document: 9,
      code: 9,
      database: 8,
      archive: 5,
      photo: 4,
      audio: 3,
      video: 2,
      log_temp: 1,
      other: 3,
    },
  },
};

export function calculateFileImportance(
  file: FileMetadata,
  profileId: ProfileId,
  toggles: ProfileToggles,
  now: number = Date.now()
): number {
  const profile = IMPORTANCE_PROFILES[profileId] || IMPORTANCE_PROFILES.balanced;
  let score = profile.categoryScores[file.category] ?? 5;

  // Toggle 1: Documents matter more
  if (toggles.documentsMatterMore && (file.category === 'document' || file.category === 'code')) {
    score += 2;
  }

  // Toggle 2: Newer files matter more
  if (toggles.newerFilesMatterMore) {
    const ageDays = (now - file.lastModified) / (1000 * 60 * 60 * 24);
    if (ageDays <= 30) {
      score += 2;
    } else if (ageDays <= 90) {
      score += 1;
    } else if (ageDays > 365) {
      score -= 1;
    }
  }

  // Toggle 3: Big files I rarely open matter less (> 500 MB & older than 180 days)
  if (toggles.rareBigFilesMatterLess) {
    const ageDays = (now - file.lastModified) / (1000 * 60 * 60 * 24);
    if (file.size > 500 * 1024 * 1024 && ageDays > 180) {
      score -= 3;
    }
  }

  return Math.max(1, Math.min(10, score));
}

export function applyProfileToFiles(
  files: FileMetadata[],
  profileId: ProfileId,
  toggles: ProfileToggles,
  overrideEdited: boolean = false
): FileMetadata[] {
  const now = Date.now();
  return files.map((file) => {
    // Only recalculate if auto, unless explicitly forced
    if (file.prioritySource === 'edited' && !overrideEdited) {
      return file;
    }
    const newPriority = calculateFileImportance(file, profileId, toggles, now);
    return {
      ...file,
      priority: newPriority,
      prioritySource: 'auto',
    };
  });
}
