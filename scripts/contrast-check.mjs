import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const token = name => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})\\s*;`, 'i'));
  if (!match) throw new Error(`Missing CSS color token --${name}`);
  return match[1].toUpperCase();
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

const ink = token('ink'); const paper = token('paper'); const card = token('card');
const cream = token('vault-text'); const vault = token('vault-bg'); const gold = token('gold'); const rust = token('moved');
const dangerSurface = token('color-danger-surface');
for (const [name, actual, expected] of [
  ['ink', ink, '#14231B'], ['paper', paper, '#FBFAF6'], ['card', card, '#FFFFFF'],
  ['card-border', token('card-border'), '#E6E1D3'], ['vault-bg', vault, '#0F2A1E'],
  ['vault-text', cream, '#F4EBD3'], ['gold', gold, '#E3D081'],
]) if (actual !== expected) throw new Error(`--${name} is ${actual}; expected ${expected}`);
const fileTokenNames = ['docs','photos','videos','audio','archives','code','system','other'];
const fileTokens = fileTokenNames.map(name => token(`color-file-${name}`));
const fileText = ['#FFFFFF', ink, ink, '#FFFFFF', ink, '#FFFFFF', '#FFFFFF', '#FFFFFF'];
const textPairs = [
  ['body ink on paper', ink, paper, 4.5], ['body ink on white cards', ink, card, 4.5],
  ['cream stage text on vault green', cream, vault, 4.5], ['primary button label on forest', cream, vault, 4.5],
  ['ink on lightest heat fill', ink, token('color-forest-100'), 4.5],
  ['cream text on medium heat fill', cream, token('color-forest-500'), 4.5],
  ['cream text on darker heat fill', cream, token('color-forest-700'), 4.5],
  ['cream on darkest heat fill', cream, vault, 4.5],
  ['kept block label on deep green', cream, token('kept'), 4.5], ['moved block label on rust', cream, rust, 4.5],
  ['Play kept tile label', cream, vault, 4.5], ['Play moved tile label', cream, rust, 4.5],
  ['gold highlight text on vault', gold, vault, 4.5],
  ['danger text on paper', rust, paper, 4.5], ['danger text on alert surface', rust, dangerSurface, 4.5],
  ...fileTokens.map((background, index) => [`${fileTokenNames[index]} label on category colour`, fileText[index], background, 4.5]),
];
for (const [label, foreground, background, minimum] of textPairs) {
  const value = ratio(foreground, background);
  console.log(`${label}: ${value.toFixed(2)}:1 (minimum ${minimum}:1)`);
  if (value < minimum) throw new Error(`${label} fails contrast: ${value.toFixed(2)}:1 < ${minimum}:1`);
}
console.log(`Contrast check passed: ${textPairs.length} text/background token pairs.`);
