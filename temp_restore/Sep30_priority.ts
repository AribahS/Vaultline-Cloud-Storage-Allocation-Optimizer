import { FileCategory, FileMetadata } from './types';

export interface PriorityRuleConfig {
  categoryBase: Record<FileCategory, number>;
  recencyBonusDays: number;
  recencyBonusPoints: number;
  agePenaltyDays: number;
  agePenaltyPoints: number;
}

export const DEFAULT_PRIORITY_RULES: PriorityRuleConfig = {
  categoryBase: {
    database: 9,
    document: 9,
    code: 8,
    photo: 7,
    video: 6,
    archive: 4,
    audio: 5,
    log_temp: 2,
    other: 5,
  },
  recencyBonusDays: 30,
  recencyBonusPoints: 2,
  agePenaltyDays: 730, // 2 years
  agePenaltyPoints: 2,
};

const EXTENSION_MAP: Record<string, FileCategory> = {
  // Database
  sql: 'database',
  db: 'database',
  sqlite: 'database',
  sqlite3: 'database',
  mdb: 'database',
  accdb: 'database',
  dump: 'database',

  // Documents
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  xls: 'document',
  xlsx: 'document',
  ppt: 'document',
  pptx: 'document',
  txt: 'document',
  md: 'document',
  rtf: 'document',
  odt: 'document',
  csv: 'document',

  // Code
  ts: 'code',
  tsx: 'code',
  js: 'code',
  jsx: 'code',
  py: 'code',
  java: 'code',
  c: 'code',
  cpp: 'code',
  cs: 'code',
  go: 'code',
  rs: 'code',
  php: 'code',
  rb: 'code',
  html: 'code',
  css: 'code',
  json: 'code',
  yaml: 'code',
  yml: 'code',
  xml: 'code',
  sh: 'code',

  // Photos
  jpg: 'photo',
  jpeg: 'photo',
  png: 'photo',
  gif: 'photo',
  webp: 'photo',
  svg: 'photo',
  raw: 'photo',
  cr2: 'photo',
  nef: 'photo',
  arw: 'photo',
  dng: 'photo',
  heic: 'photo',

  // Videos
  mp4: 'video',
  mov: 'video',
  avi: 'video',
  mkv: 'video',
  wmv: 'video',
  webm: 'video',
  m4v: 'video',
  flv: 'video',

  // Archives
  zip: 'archive',
  tar: 'archive',
  gz: 'archive',
  '7z': 'archive',
  rar: 'archive',
  bz2: 'archive',
  xz: 'archive',

  // Audio
  mp3: 'audio',
  wav: 'audio',
  flac: 'audio',
  aac: 'audio',
  ogg: 'audio',
  m4a: 'audio',

  // Logs & Temp
  log: 'log_temp',
  tmp: 'log_temp',
  temp: 'log_temp',
  bak: 'log_temp',
  cache: 'log_temp',
  ds_store: 'log_temp',
};

export function detectCategory(fileName: string, mimeType?: string): FileCategory {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext && EXTENSION_MAP[ext]) {
    return EXTENSION_MAP[ext];
  }

  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text/plain')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('compressed')) return 'archive';
  }

  return 'other';
}

export function suggestPriority(
  category: FileCategory,
  lastModified: number,
  nowMs: number = Date.now(),
  rules: PriorityRuleConfig = DEFAULT_PRIORITY_RULES
): { priority: number; reason: string } {
  let score = rules.categoryBase[category] ?? 5;
  const ageDays = (nowMs - lastModified) / (1000 * 60 * 60 * 24);

  let modifierNote = '';
  if (ageDays <= rules.recencyBonusDays) {
    score += rules.recencyBonusPoints;
    modifierNote = ` (+${rules.recencyBonusPoints} recency bonus)`;
  } else if (ageDays >= rules.agePenaltyDays) {
    score -= rules.agePenaltyPoints;
    modifierNote = ` (-${rules.agePenaltyPoints} inactive penalty)`;
  }

  // Clamp priority between 1 and 10
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  const reason = `Base priority for ${category}: ${rules.categoryBase[category]}${modifierNote}`;

  return { priority: clamped, reason };
}

export function recalculateFilePriorities(
  files: FileMetadata[],
  rules: PriorityRuleConfig = DEFAULT_PRIORITY_RULES,
  forceAll: boolean = false
): FileMetadata[] {
  const now = Date.now();
  return files.map((file) => {
    if (file.prioritySource === 'edited' && !forceAll) {
      return file;
    }
    const { priority } = suggestPriority(file.category, file.lastModified, now, rules);
    return {
      ...file,
      priority,
      prioritySource: 'auto',
    };
  });
}

