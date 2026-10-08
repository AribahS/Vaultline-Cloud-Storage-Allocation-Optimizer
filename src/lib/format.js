export function formatSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '0 B';
  const k = 1024;
  if (Math.abs(bytes) >= k * k * k) {
    let gb = bytes / (k * k * k);
    if (Math.abs(Math.round(gb) - gb) < 0.0001) {
       return Math.round(gb) + ' GB';
    }
    return gb.toFixed(2) + ' GB';
  } else if (Math.abs(bytes) >= k * k) {
    let mb = bytes / (k * k);
    if (Math.abs(Math.round(mb) - mb) < 0.0001) {
       return Math.round(mb) + ' MB';
    }
    return mb.toFixed(1) + ' MB';
  } else if (Math.abs(bytes) >= k) {
    return Math.round(bytes / k) + ' KB';
  }
  return bytes + ' B';
}

export function pluralize(count, word) {
  return `${count} ${count === 1 ? word : word + 's'}`;
}
