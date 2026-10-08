import { describe, expect, it } from 'vitest';
import { checkContrastPairs } from './contrast';
import { readFileSync } from 'node:fs';
const css = readFileSync('src/index.css', 'utf8');

const token = (name: string) => {
  const value = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})\\s*;`, 'i'))?.[1];
  if (!value) throw new Error(`Missing color token --${name}`);
  return value.toUpperCase();
};

describe('design token contrast', () => {
  it('keeps all text token pairs at their required contrast ratios', () => {
    const ink = token('ink'); const paper = token('paper'); const card = token('card');
    const cream = token('vault-text'); const vault = token('vault-bg'); const gold = token('gold'); const rust = token('moved');
    const dangerSurface = token('color-danger-surface');
    const fileColors = ['docs','photos','videos','audio','archives','code','system','other'].map(name => token(`color-file-${name}`));
    const fileText = ['#FFFFFF', ink, ink, '#FFFFFF', ink, '#FFFFFF', '#FFFFFF', '#FFFFFF'];
    expect({ ink, paper, card, cream, vault }).toEqual({ ink: '#14231B', paper: '#FBFAF6', card: '#FFFFFF', cream: '#F4EBD3', vault: '#0F2A1E' });
    const pairs = [
      { label: 'ink on paper', foreground: ink, background: paper, minimum: 4.5 },
      { label: 'ink on card', foreground: ink, background: card, minimum: 4.5 },
      { label: 'cream on vault', foreground: cream, background: vault, minimum: 4.5 },
      { label: 'primary label on forest', foreground: cream, background: vault, minimum: 4.5 },
      { label: 'kept label on deep green', foreground: cream, background: vault, minimum: 4.5 },
      { label: 'moved label on rust', foreground: cream, background: rust, minimum: 4.5 },
      { label: 'gold accent text on vault', foreground: gold, background: vault, minimum: 4.5 },
      { label: 'danger text on paper', foreground: rust, background: paper, minimum: 4.5 },
      { label: 'danger text on alert surface', foreground: rust, background: dangerSurface, minimum: 4.5 },
      ...fileColors.map((background, index) => ({ label: `file type ${index + 1} label`, foreground: fileText[index], background, minimum: 4.5 })),
    ];
    const checked = checkContrastPairs(pairs);
    expect(checked.filter(pair => pair.ratio < pair.minimum).map(pair => pair.label)).toEqual([]);
  });
});
