/**
 * formatBytes – human-readable byte formatting used everywhere in the UI.
 * Always returns values like "15.34 GB", "320 MB", "1.1 KB".
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  // Use 2 decimals for < 10, 1 for < 100, 0 for >= 100
  const decimals = val < 10 ? 2 : val < 100 ? 1 : 0;
  return val.toFixed(decimals) + ' ' + sizes[i];
}

