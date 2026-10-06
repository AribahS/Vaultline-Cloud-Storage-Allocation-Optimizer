/**
 * pluralize – return "{count} {singular}" or "{count} {plural}" as needed.
 * Works for the most common English patterns.
 *
 * Usage:
 *   pluralize(1, 'file')          → "1 file"
 *   pluralize(5, 'file')          → "5 files"
 *   pluralize(2, 'duplicate', 'duplicates') → "2 duplicates"
 *   pluralize(0, 'result')        → "0 results"
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
  formatter: (n: number) => string = (n) => n.toLocaleString(),
): string {
  const p = plural ?? singular + 's';
  return `${formatter(count)} ${count === 1 ? singular : p}`;
}
