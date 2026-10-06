import { KnapsackItem } from './types';

export const BYTE_UNITS = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024,
};

export type RoundingUnitOption = 'auto' | '1MB' | '10MB' | '100MB' | '1GB';

export const ROUNDING_UNIT_BYTES: Record<Exclude<RoundingUnitOption, 'auto'>, number> = {
  '1MB': 1 * BYTE_UNITS.MB,
  '10MB': 10 * BYTE_UNITS.MB,
  '100MB': 100 * BYTE_UNITS.MB,
  '1GB': 1 * BYTE_UNITS.GB,
};

/**
 * Determine optimal unit size (in bytes) if auto is selected.
 * Keeps W = quotaBytes / unitBytes around 1,000 - 2,000.
 */
export function getAutoUnitBytes(quotaBytes: number): number {
  if (quotaBytes <= 0) return BYTE_UNITS.MB;
  const targetColumns = 2000;
  const idealUnit = quotaBytes / targetColumns;

  if (idealUnit <= BYTE_UNITS.MB) return BYTE_UNITS.MB;
  if (idealUnit <= 10 * BYTE_UNITS.MB) return 10 * BYTE_UNITS.MB;
  if (idealUnit <= 100 * BYTE_UNITS.MB) return 100 * BYTE_UNITS.MB;
  if (idealUnit <= BYTE_UNITS.GB) return BYTE_UNITS.GB;
  if (idealUnit <= 5 * BYTE_UNITS.GB) return 5 * BYTE_UNITS.GB;
  return 10 * BYTE_UNITS.GB;
}

export function resolveUnitBytes(quotaBytes: number, option: RoundingUnitOption): number {
  if (option === 'auto') {
    return getAutoUnitBytes(quotaBytes);
  }
  return ROUNDING_UNIT_BYTES[option] ?? BYTE_UNITS.MB;
}

/**
 * Sizes are rounded UP to the unit so the answer never exceeds the real quota.
 * Ceil(fileSize / unitBytes), minimum 1 unit (unless size is 0).
 */
export function normaliseItemSize(sizeBytes: number, unitBytes: number): number {
  if (sizeBytes <= 0) return 0;
  return Math.max(1, Math.ceil(sizeBytes / unitBytes));
}

/**
 * Normalise quota to integer units: floor(quotaBytes / unitBytes)
 */
export function normaliseQuota(quotaBytes: number, unitBytes: number): number {
  if (quotaBytes <= 0) return 0;
  return Math.floor(quotaBytes / unitBytes);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  if (!isFinite(bytes)) return '—';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  const formatted = parseFloat((bytes / Math.pow(k, idx)).toFixed(dm));
  return `${formatted} ${sizes[idx]}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}
