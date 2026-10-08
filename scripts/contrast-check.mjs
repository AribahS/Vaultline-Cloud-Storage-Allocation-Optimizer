import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const token = (name, seen = new Set()) => {
  if (seen.has(name)) throw new Error(`Circular CSS token reference: ${name}`);
  seen.add(name);
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6}|var\\(--[a-z0-9-]+\\))`, 'i'));
  if (!match) throw new Error(`Missing CSS color token --${name}`);
  return match[1].startsWith('var(') ? token(match[1].slice(6, -1), seen) : match[1].toUpperCase();
};
const luminance = hex => {
  const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (foreground, background) => {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
};

for (const [name, expected] of [
  ['ink', '#2B1A4A'], ['vault', '#2B1A4A'], ['paper', '#F1F7ED'], ['card', '#FFFFFF'],
  ['kept', '#91C7B1'], ['moved', '#B33951'], ['highlight', '#E3D081'], ['danger', '#B33951'],
]) if (token(name) !== expected) throw new Error(`--${name} is ${token(name)}; expected ${expected}`);

const pairs = [
  ['ink on paper', 'ink', 'paper'], ['ink on card', 'ink', 'card'],
  ['paper on vault', 'paper', 'vault'], ['paper on primary ink button', 'paper', 'ink'],
  ['ink on kept mint', 'ink', 'kept'], ['paper on moved crimson', 'paper', 'moved'],
  ['highlight on vault', 'highlight', 'vault'], ['danger on paper', 'danger', 'paper'],
  ['danger on alert surface', 'danger', 'alert-surface'],
  ['muted on paper', 'text-muted', 'paper'], ['muted on card', 'text-muted', 'card'],
  ['muted on vault', 'text-muted-on-dark', 'vault'],
  ...['docs', 'photos', 'videos', 'audio', 'archives', 'code', 'system', 'other']
    .map(name => [`${name} category label`, `color-file-${name}-label`, `color-file-${name}`]),
  ...[
    [0, 'ink'], [1, 'ink'], [2, 'ink'], [3, 'paper'], [4, 'paper'],
  ].map(([step, foreground]) => [`DP heat-map step ${step}`, foreground, `heat-${step}`]),
];

for (const [label, foregroundToken, backgroundToken] of pairs) {
  const foreground = token(foregroundToken);
  const background = token(backgroundToken);
  const value = ratio(foreground, background);
  const minimum = 4.5;
  console.log(`${label}: ${value.toFixed(2)}:1 (minimum ${minimum}:1)`);
  if (value < minimum) throw new Error(`${label} fails contrast: ${value.toFixed(2)}:1 < ${minimum}:1`);
}
console.log(`Contrast check passed: ${pairs.length} text/background token pairs.`);
