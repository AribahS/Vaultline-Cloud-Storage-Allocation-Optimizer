import { BYTE_UNITS } from '../engine/normalizer';
import { solveFullKnapsack } from '../engine/knapsack';
import { solveTeachingKnapsack } from '../engine/knapsack';
import type { KnapsackItem, KnapsackResult, TeachingEngineResult } from '../engine/types';

export interface HeroDemoFile {
  id: string;
  name: string;
  sizeKb: number;
  importance: number;
}

export interface HeroDemoSet {
  id: string;
  files: HeroDemoFile[];
}

export interface HeroDemoPlan {
  items: KnapsackItem[];
  result: KnapsackResult;
  teaching: TeachingEngineResult;
  capacityBytes: number;
  capacityUnits: number;
}

const KB = BYTE_UNITS.KB;
const UNIT_BYTES = 20 * KB;
export const HERO_DEMO_CAPACITY_KB = 100;

export const HERO_DEMO_SETS: HeroDemoSet[] = [
  {
    id: 'field-notes',
    files: [
      { id: 'report', name: 'report.pdf', sizeKb: 23, importance: 26 },
      { id: 'video', name: 'video.mp4', sizeKb: 66, importance: 5 },
      { id: 'notes', name: 'notes.docx', sizeKb: 12, importance: 6 },
      { id: 'archive', name: 'archive.zip', sizeKb: 30, importance: 4 },
      { id: 'slides', name: 'slides.pptx', sizeKb: 40, importance: 30 },
      { id: 'photo', name: 'photo.raw', sizeKb: 15, importance: 20 },
    ],
  },
  {
    id: 'studio-files',
    files: [
      { id: 'audio', name: 'audio.wav', sizeKb: 14, importance: 14 },
      { id: 'backup', name: 'backup.tar', sizeKb: 52, importance: 34 },
      { id: 'deck', name: 'deck.key', sizeKb: 38, importance: 27 },
      { id: 'code', name: 'project.ts', sizeKb: 21, importance: 22 },
      { id: 'clip', name: 'clip.mov', sizeKb: 68, importance: 40 },
      { id: 'memo', name: 'memo.txt', sizeKb: 12, importance: 11 },
    ],
  },
  {
    id: 'archive-files',
    files: [
      { id: 'invoice', name: 'invoice.pdf', sizeKb: 12, importance: 12 },
      { id: 'recording', name: 'recording.mp4', sizeKb: 60, importance: 36 },
      { id: 'design', name: 'design.psd', sizeKb: 42, importance: 33 },
      { id: 'memo', name: 'meeting.docx', sizeKb: 18, importance: 18 },
      { id: 'archive', name: 'old-files.zip', sizeKb: 32, importance: 23 },
      { id: 'photos', name: 'photos.raw', sizeKb: 24, importance: 19 },
    ],
  },
];

export function nextHeroDemoSetIndex(currentIndex: number, setCount = HERO_DEMO_SETS.length): number {
  if (setCount <= 0) return 0;
  return ((currentIndex + 1) % setCount + setCount) % setCount;
}

export function solveHeroDemo(set: HeroDemoSet): HeroDemoPlan {
  const items: KnapsackItem[] = set.files.map(file => ({
    id: file.id,
    name: file.name,
    originalSize: file.sizeKb * KB,
    normalizedSize: Math.ceil(file.sizeKb * KB / UNIT_BYTES),
    value: file.importance,
    isPinned: false,
    isExcluded: false,
  }));
  const capacityBytes = HERO_DEMO_CAPACITY_KB * KB;
  const capacityUnits = Math.floor(capacityBytes / UNIT_BYTES);
  const options = { quotaUnits: capacityUnits, quotaBytes: capacityBytes, unitBytes: UNIT_BYTES };
  return {
    items,
    result: solveFullKnapsack(items, options),
    teaching: solveTeachingKnapsack(items, capacityUnits),
    capacityBytes,
    capacityUnits,
  };
}
