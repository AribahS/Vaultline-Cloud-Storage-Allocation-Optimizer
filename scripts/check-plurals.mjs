#!/usr/bin/env node
/**
 * scripts/check-plurals.mjs
 * Detects hard-coded singular/plural patterns that should use pluralize().
 * Exits 1 if any are found (so CI can catch regressions).
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const PATTERNS = [
  // e.g.  `${n} file${n !== 1 ? 's' : ''}`
  /`\$\{[^}]+\}\s*(file|item|duplicate|result|error|row|record)\$\{[^}]+\}/g,
  // e.g.  {count} files  (raw JSX text — catches strings not using pluralize)
  /\{[a-zA-Z_]+\s*\}\s*files\b/g,
  /\{[a-zA-Z_]+\s*\}\s*items\b/g,
];

const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js']);
const SKIP_DIRS  = new Set(['node_modules', 'dist', '.git', 'scripts']);

function walk(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, results);
    else if (EXTENSIONS.has(extname(full))) results.push(full);
  }
  return results;
}

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const files = walk(root);
let found = 0;

for (const file of files) {
  if (file.includes('pluralize.ts')) continue; // skip the helper itself
  const src = readFileSync(file, 'utf-8');
  for (const pat of PATTERNS) {
    pat.lastIndex = 0;
    let m;
    while ((m = pat.exec(src)) !== null) {
      const line = src.slice(0, m.index).split('\n').length;
      console.warn(`[pluralize] ${file}:${line} → "${m[0].trim()}"`);
      found++;
    }
  }
}

if (found > 0) {
  console.error(`\n✖ ${found} manual plural pattern(s) found. Use pluralize() instead.`);
  process.exit(1);
} else {
  console.log('✔ No unpluralized count strings found.');
}
