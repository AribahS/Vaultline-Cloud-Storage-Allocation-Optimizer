import type { PlayItem } from './playKnapsack';
import { BYTE_UNITS } from '../engine/normalizer';

const entries: [string, number, number][] = [
  ['Design_Archive.zip', 9, 10], ['Family_Video_2024.mp4', 7, 7], ['Research_Dataset.db', 7, 7],
  ['Photo_Library.tar', 8, 1], ['Old_Backups.bin', 1.2, 0.4], ['Music_Collection.flac', 1.1, 0.3],
  ['Work_Presentation.pptx', 1, 0.2], ['Tax_Records.pdf', 0.9, 0.1], ['App_Cache.dat', 0.8, 0.1],
  ['Course_Notes.pdf', 0.7, 0.1], ['Game_Install.iso', 0.7, 0.1], ['Project_Source.zip', 0.6, 0.1],
];

export function createTightPlayDataset(): PlayItem[] {
  const unitBytes = BYTE_UNITS.MB;
  return entries.map(([name, gb, importance], index) => {
    const size = gb * BYTE_UNITS.GB;
    return { id: `tight-${index + 1}`, name, size, importance, weight: Math.ceil(size / unitBytes) };
  });
}
