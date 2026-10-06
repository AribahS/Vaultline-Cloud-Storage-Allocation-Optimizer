import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const token = (name) => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})\\s*;`, 'i'));
  if (!match) throw new Error(`Missing CSS color token --${name}`);
  return match[1].toUpperCase();
};

const colors = {
  ink: '#54494B', deep: '#3B3335', paper: '#F1F7ED', card: '#FFFFFF',
  border: '#D3DDD0', kept: '#91C7B1', keptStroke: '#4F8B74',
  moved: '#B33951', gold: '#E3D081',
};
const tokenNames = {
  ink: 'ink', deep: 'ink-deep', paper: 'paper', card: 'card',
  border: 'card-border', kept: 'kept', keptStroke: 'kept-stroke', moved: 'moved', gold: 'gold',
};

for (const [key, name] of Object.entries(tokenNames)) {
  const actual = token(name);
  if (actual !== colors[key]) throw new Error(`--${name} is ${actual}, expected ${colors[key]}`);
}

function luminance(hex) {
  const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map((value) => parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const textPairs = [
  ['ink on paper', colors.ink, colors.paper], ['deep on paper', colors.deep, colors.paper],
  ['ink on card', colors.ink, colors.card], ['deep on card', colors.deep, colors.card],
  ['primary button label', colors.paper, colors.ink], ['stage label', colors.paper, colors.deep],
  ['kept block label', colors.deep, colors.kept], ['gold fill label', colors.deep, colors.gold],
  ['moved block label', colors.paper, colors.moved], ['gold text on dark stage', colors.gold, colors.deep],
];
for (const [label, foreground, background] of textPairs) {
  const actual = ratio(foreground, background);
  if (actual < 4.5) throw new Error(`${label}: ${actual.toFixed(2)}:1 is below 4.5:1`);
}

for (const background of [colors.paper, colors.card]) {
  const actual = ratio(colors.keptStroke, background);
  if (actual < 3) throw new Error(`kept stroke on ${background}: ${actual.toFixed(2)}:1 is below 3:1`);
}

console.log('Contrast check passed: 10 text pairs at 4.5:1 and kept stroke on paper/card at 3:1.');
