export const CAPACITY_UNITS: Record<string, number> = {
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

/** Converts the editable decimal amount to the nearest whole byte. */
export function capacityToBytes(value: number, unit: string): number {
  const unitBytes = CAPACITY_UNITS[unit] ?? CAPACITY_UNITS.GB;
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * unitBytes);
}
