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

export function pluralize(count, singular, plural, formatter = (value) => value.toLocaleString()) {
  const pluralForm = plural ?? `${singular}s`;
  return `${formatter(count)} ${count === 1 ? singular : pluralForm}`;
}

export function formatDateDmy(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
