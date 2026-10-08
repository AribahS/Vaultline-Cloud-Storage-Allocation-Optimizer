export interface ContrastPair { label: string; foreground: string; background: string; minimum: number }

export const contrastRatio = (foreground: string, background: string): number => {
  const luminance = (hex: string) => {
    const [r, g, b] = hex.match(/[0-9a-f]{2}/gi)!.map(value => parseInt(value, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
};

export const checkContrastPairs = (pairs: ContrastPair[]) => pairs.map(pair => ({ ...pair, ratio: contrastRatio(pair.foreground, pair.background) }));
