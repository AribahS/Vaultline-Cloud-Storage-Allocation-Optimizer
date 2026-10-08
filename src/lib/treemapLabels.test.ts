import { describe, expect, it } from 'vitest';
import { groupSmallTreemapFiles, truncateTreemapLabel } from './treemapLabels';

describe('treemap labels', () => {
  it('truncates labels with an ellipsis and preserves short labels', () => {
    expect(truncateTreemapLabel('annual-report.pdf', 10)).toBe('annual-re…');
    expect(truncateTreemapLabel('short', 10)).toBe('short');
  });
  it('groups multiple low-area files as +N small files', () => {
    const files = [
      { id: 'big', name: 'large.bin', size: 900, category: 'other' },
      { id: 'a', name: 'a.tmp', size: 1, category: 'other', kept: false },
      { id: 'b', name: 'b.tmp', size: 1, category: 'other', kept: false },
    ];
    expect(groupSmallTreemapFiles(files, 10000, 100).map(file => file.name)).toEqual(['large.bin', '+2 small files']);
  });
});
