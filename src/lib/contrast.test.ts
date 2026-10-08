import { describe, expect, it } from 'vitest';
import { checkContrastPairs } from './contrast';
import { readFileSync, readdirSync } from 'node:fs';

const css = readFileSync('src/index.css', 'utf8');
const token = (name: string): string => {
  const value = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6}|var\\(--[a-z0-9-]+\\))`, 'i'))?.[1];
  if (!value) throw new Error(`Missing CSS color token --${name}`);
  return value.startsWith('var(') ? token(value.slice(6, -1)) : value.toUpperCase();
};

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => {
    const target = `${directory}/${entry.name}`;
    return entry.isDirectory() ? sourceFiles(target) : [target];
  });

describe('design token contrast', () => {
  it('checks all requested palette text/background pairs at 4.5:1 or higher', () => {
    expect({ ink: token('ink'), paper: token('paper'), card: token('card'), vault: token('vault'), kept: token('kept'), moved: token('moved'), highlight: token('highlight') })
      .toEqual({ ink: '#2B1A4A', paper: '#F1F7ED', card: '#FFFFFF', vault: '#2B1A4A', kept: '#91C7B1', moved: '#B33951', highlight: '#E3D081' });
    const pairs = [
      { label: 'ink on paper', foreground: token('ink'), background: token('paper'), minimum: 4.5 },
      { label: 'ink on card', foreground: token('ink'), background: token('card'), minimum: 4.5 },
      { label: 'paper on vault', foreground: token('paper'), background: token('vault'), minimum: 4.5 },
      { label: 'paper on primary ink button', foreground: token('paper'), background: token('ink'), minimum: 4.5 },
      { label: 'ink on kept mint', foreground: token('ink'), background: token('kept'), minimum: 4.5 },
      { label: 'paper on moved crimson', foreground: token('paper'), background: token('moved'), minimum: 4.5 },
      { label: 'highlight on vault', foreground: token('highlight'), background: token('vault'), minimum: 4.5 },
      { label: 'danger on paper', foreground: token('danger'), background: token('paper'), minimum: 4.5 },
      { label: 'danger on alert surface', foreground: token('danger'), background: token('alert-surface'), minimum: 4.5 },
      { label: 'muted on paper', foreground: token('text-muted'), background: token('paper'), minimum: 4.5 },
      { label: 'muted on card', foreground: token('text-muted'), background: token('card'), minimum: 4.5 },
      { label: 'muted on vault', foreground: token('text-muted-on-dark'), background: token('vault'), minimum: 4.5 },
      ...['docs', 'photos', 'videos', 'audio', 'archives', 'code', 'system', 'other'].map(name => ({
        label: `${name} category label`, foreground: token(`color-file-${name}-label`), background: token(`color-file-${name}`), minimum: 4.5,
      })),
      ...[
        { step: 0, foreground: 'ink' }, { step: 1, foreground: 'ink' }, { step: 2, foreground: 'ink' },
        { step: 3, foreground: 'paper' }, { step: 4, foreground: 'paper' },
      ].map(({ step, foreground }) => ({ label: `DP heat-map step ${step}`, foreground: token(foreground), background: token(`heat-${step}`), minimum: 4.5 })),
    ];
    const checked = checkContrastPairs(pairs);
    for (const pair of checked) console.log(`${pair.label}: ${pair.ratio.toFixed(2)}:1 (minimum ${pair.minimum}:1)`);
    expect(checked.filter(pair => pair.ratio < pair.minimum).map(pair => pair.label)).toEqual([]);
  });

  it('contains no exact hex values from the retired palette anywhere in src', () => {
    const oldHexes = [
      ['EDE2', 'C5'], ['F9F1', 'DC'], ['0F2A', '1E'], ['F4EB', 'D3'], ['1423', '1B'],
      ['9C3D', '2F'], ['1B49', '33'], ['2F68', '49'], ['DCE9', 'D9'], ['FDF2', 'F1'],
      ['E8C6', 'C1'], ['4880', '6A'], ['C8A0', '3A'], ['7A6E', '9A'], ['BB78', '39'],
      ['2B65', '72'], ['7356', '33'], ['8E24', '3D'], ['B889', '3C'],
    ].map(([first, second]) => `#${first}${second}`.toLowerCase());
    const hits: string[] = [];
    for (const file of sourceFiles('src')) {
      let content = readFileSync(file, 'utf8');
      if (file.endsWith('contrast.test.ts')) content = content.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, '');
      for (const hex of oldHexes) if (content.toLowerCase().includes(hex)) hits.push(`${file}: ${hex}`);
    }
    expect(hits).toEqual([]);
  });

  it('keeps literal colors in the token file (engine and bundled logo assets are immutable)', () => {
    const hits: string[] = [];
    const productionFiles = sourceFiles('src').filter(file =>
      file !== 'src/index.css' && !file.startsWith('src/engine/') && !file.startsWith('src/assets/') &&
      !/\.(test|spec)\.[jt]sx?$/.test(file) && !file.endsWith('.d.ts')
    );
    for (const file of productionFiles) {
      const content = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, '');
      if (/(#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\()/i.test(content)) hits.push(file);
    }
    expect(hits).toEqual([]);
  });

  it('does not use mint, gold or crimson as light-surface text in CSS', () => {
    const violations = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(([, selector, body]) =>
      [...body.matchAll(/(?:^|;)\s*color\s*:\s*var\(--(kept|highlight|moved)\)\s*!?important?\s*(?=;|$)/gim)]
        .filter(([, tokenName]) => !(tokenName.toLowerCase() === 'highlight' && /play-eyebrow/.test(selector)))
        .map(([, tokenName]) => `${selector.trim()}: ${tokenName}`)
    );
    expect(violations).toEqual([]);
  });
});
