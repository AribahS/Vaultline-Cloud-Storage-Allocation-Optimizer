import type { FileMetadata } from '../engine/types';

export interface SuggestedFileScore {
  score: number;
  reasons: string[];
}

export function suggestFileScore(
  file: Pick<FileMetadata, 'name' | 'path' | 'category' | 'lastModified'>,
  isDuplicate?: boolean,
  now?: number,
): SuggestedFileScore;

export function scoreIncomingFiles(existingFiles: FileMetadata[], incomingFiles: FileMetadata[], now?: number): FileMetadata[];
export function resetScoresToSuggested(files: FileMetadata[], now?: number): FileMetadata[];
