const DAY_MS = 24 * 60 * 60 * 1000;

/** Suggest an explainable 1–10 importance score from file metadata only. */
export function suggestFileScore(file, isDuplicate = false, now) {
  let score = 5;
  const reasons = [];
  const name = String(file.name ?? '').toLowerCase();
  const path = String(file.path ?? '').toLowerCase().replace(/\\/g, '/');
  const category = String(file.category ?? '').toLowerCase();

  if (['document', 'code'].includes(category) || /\.(pdf|docx?|xlsx?|pptx?|txt|md|js|jsx|ts|tsx|py|java|c|cpp|rs|go)$/.test(name)) {
    score += 2;
    reasons.push(category === 'code' || /\.(js|jsx|ts|tsx|py|java|c|cpp|rs|go)$/.test(name) ? 'Source file' : 'Document');
  } else if (/\.(iso|dmg|pkg|msi|exe|deb|rpm)$/.test(name)) {
    score -= 2;
    reasons.push('Installer');
  } else if (/(cache|\.tmp$|\.temp$|node_modules)/.test(`${name} ${path}`)) {
    score -= 3;
    reasons.push('Cache file');
  }

  if (/(\/documents?\/|\/school\/|\/code\/)/.test(path)) {
    score += 2;
    reasons.push(path.includes('/code/') ? 'Code folder' : path.includes('/school/') ? 'School folder' : 'Documents folder');
  } else if (/(\/downloads?\/|\/cache\/|\/backups?\/)/.test(path)) {
    score -= 2;
    reasons.push(path.includes('/downloads/') ? 'Downloads folder' : path.includes('/cache/') ? 'Cache folder' : 'Backups folder');
  }

  if (Number.isFinite(now) && Number.isFinite(file.lastModified)) {
    const age = Math.max(0, now - file.lastModified);
    if (age <= 30 * DAY_MS) {
      score += 1;
      reasons.push('Recent');
    } else if (age >= 365 * DAY_MS) {
      score -= 1;
      reasons.push('Old');
    }
  }

  // Keep the original at least 2 so a duplicate can always rank strictly lower.
  score = Math.max(2, Math.min(10, Math.round(score)));
  if (isDuplicate) {
    score = Math.max(1, score - 2);
    reasons.unshift('Duplicate');
  }
  return { score, reasons: reasons.slice(0, 3) };
}
