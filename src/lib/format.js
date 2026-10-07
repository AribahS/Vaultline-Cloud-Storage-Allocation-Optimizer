export function formatSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '0 B';
  const k = 1024;
  if (Math.abs(bytes) >= k * k * k) {
    return parseFloat((bytes / (k * k * k)).toFixed(2)) + ' GB';
  } else if (Math.abs(bytes) >= k * k) {
    return parseFloat((bytes / (k * k)).toFixed(2)) + ' MB';
  } else if (Math.abs(bytes) >= k) {
    return parseFloat((bytes / k).toFixed(2)) + ' KB';
  }
  return bytes + ' B';
}

export function pluralize(count, word) {
  return `${count} ${count === 1 ? word : word + 's'}`;
}
