/**
 * File helpers for Sticker Playground UI:
 * File categorization, styling tokens, age formatting, and size display.
 */
import React from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code2,
  HardDrive,
  FileQuestion,
} from 'lucide-react';

export type FileCategoryKey =
  | 'document'
  | 'photo'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'installer'
  | 'other';

export interface CategoryStyle {
  label: string;
  colorVar: string;
  colorHex: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

export const CATEGORY_STYLES: Record<FileCategoryKey, CategoryStyle> = {
  document: {
    label: 'Document',
    colorVar: 'var(--file-document)',
    colorHex: '#4CC9FF',
    icon: FileText,
  },
  photo: {
    label: 'Photo',
    colorVar: 'var(--file-photo)',
    colorHex: '#FF6FA5',
    icon: Image,
  },
  video: {
    label: 'Video',
    colorVar: 'var(--file-video)',
    colorHex: '#FF9F43',
    icon: Video,
  },
  audio: {
    label: 'Audio',
    colorVar: 'var(--file-audio)',
    colorHex: '#FFD84D',
    icon: Music,
  },
  archive: {
    label: 'Archive',
    colorVar: 'var(--file-archive)',
    colorHex: '#2FD3A0',
    icon: Archive,
  },
  code: {
    label: 'Code',
    colorVar: 'var(--file-code)',
    colorHex: '#7B5CFF',
    icon: Code2,
  },
  installer: {
    label: 'System/App',
    colorVar: 'var(--file-installer)',
    colorHex: '#9AA3C7',
    icon: HardDrive,
  },
  other: {
    label: 'Other',
    colorVar: 'var(--file-other)',
    colorHex: '#D9CBA0',
    icon: FileQuestion,
  },
};

export function getFileCategory(name: string, mime?: string): FileCategoryKey {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'md', 'xlsx', 'xls', 'csv', 'pptx', 'ppt', 'key'].includes(ext)) {
    return 'document';
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'heic', 'raw', 'cr2', 'nef'].includes(ext)) {
    return 'photo';
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'm4v', 'flv'].includes(ext)) {
    return 'video';
  }
  if (['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma', 'aiff'].includes(ext)) {
    return 'audio';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'].includes(ext)) {
    return 'archive';
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'html', 'css', 'json', 'sql', 'sh'].includes(ext)) {
    return 'code';
  }
  if (['exe', 'dmg', 'pkg', 'deb', 'rpm', 'apk', 'msi', 'bin'].includes(ext)) {
    return 'installer';
  }

  if (mime) {
    if (mime.startsWith('image/')) return 'photo';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.includes('pdf') || mime.includes('document') || mime.includes('text/')) return 'document';
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('compressed')) return 'archive';
  }

  return 'other';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val >= 10 || i === 0 ? val.toFixed(0) : val.toFixed(1)} ${sizes[i]}`;
}

export function formatAge(lastModified?: number | string | Date): string {
  if (!lastModified) return 'Unknown age';
  const date = new Date(lastModified);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

