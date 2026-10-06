import { FileCategory } from './types';

export interface CategoryInfo {
  label: string;
  color: string;
  bgLight: string;
}

export const CATEGORY_META: Record<FileCategory, CategoryInfo> = {
  document: {
    label: 'Documents',
    color: '#4F5BD5',
    bgLight: 'rgba(79, 91, 213, 0.12)',
  },
  photo: {
    label: 'Photos',
    color: '#FF6B6B',
    bgLight: 'rgba(255, 107, 107, 0.12)',
  },
  video: {
    label: 'Videos',
    color: '#FFB020',
    bgLight: 'rgba(255, 176, 32, 0.14)',
  },
  audio: {
    label: 'Audio',
    color: '#F472B6',
    bgLight: 'rgba(244, 114, 182, 0.14)',
  },
  archive: {
    label: 'Archives',
    color: '#14B8A6',
    bgLight: 'rgba(20, 184, 166, 0.14)',
  },
  code: {
    label: 'Code',
    color: '#8B5CF6',
    bgLight: 'rgba(139, 92, 246, 0.14)',
  },
  database: {
    label: 'System & Data',
    color: '#64748B',
    bgLight: 'rgba(100, 116, 139, 0.14)',
  },
  log_temp: {
    label: 'Logs & Temp',
    color: '#64748B',
    bgLight: 'rgba(100, 116, 139, 0.14)',
  },
  other: {
    label: 'Other',
    color: '#C7B99A',
    bgLight: 'rgba(199, 185, 154, 0.18)',
  },
};

export function getCategoryColor(category: FileCategory): string {
  return CATEGORY_META[category]?.color || '#C7B99A';
}

export function getCategoryLabel(category: FileCategory): string {
  return CATEGORY_META[category]?.label || 'File';
}

