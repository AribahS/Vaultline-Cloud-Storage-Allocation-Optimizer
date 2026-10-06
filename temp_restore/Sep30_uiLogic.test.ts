import { describe, it, expect } from 'vitest';
import { formatBytes, formatAge, getFileCategory } from '../utils/fileHelpers';

describe('UI Logic & Helpers', () => {
  describe('Swipe to importance mapping', () => {
    it('maps verdict tiers to correct numerical priorities', () => {
      const getPriorityForVerdict = (verdict: 'must_keep' | 'important' | 'normal' | 'can_go') => {
        switch (verdict) {
          case 'must_keep': return 10;
          case 'important': return 9;
          case 'normal': return 5;
          case 'can_go': return 2;
        }
      };

      expect(getPriorityForVerdict('must_keep')).toBe(10);
      expect(getPriorityForVerdict('important')).toBe(9);
      expect(getPriorityForVerdict('normal')).toBe(5);
      expect(getPriorityForVerdict('can_go')).toBe(2);
    });
  });

  describe('Formatters & Pluralization', () => {
    it('formats bytes correctly for small and large sizes', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024 * 15)).toBe('15 MB');
      expect(formatBytes(1024 * 1024 * 1024 * 1.5)).toBe('1.5 GB');
    });

    it('formats file category accurately from extension and mime', () => {
      expect(getFileCategory('report.pdf')).toBe('document');
      expect(getFileCategory('photo.png')).toBe('photo');
      expect(getFileCategory('movie.mp4')).toBe('video');
      expect(getFileCategory('song.mp3')).toBe('audio');
      expect(getFileCategory('archive.zip')).toBe('archive');
      expect(getFileCategory('app.tsx')).toBe('code');
      expect(getFileCategory('setup.exe')).toBe('installer');
    });

    it('formats file ages gracefully', () => {
      const now = Date.now();
      expect(formatAge(now)).toBe('Today');
      expect(formatAge(now - 24 * 60 * 60 * 1000)).toBe('Yesterday');
      expect(formatAge(now - 5 * 24 * 60 * 60 * 1000)).toBe('5 days ago');
      expect(formatAge(now - 60 * 24 * 60 * 60 * 1000)).toBe('2 months ago');
      expect(formatAge(now - 400 * 24 * 60 * 60 * 1000)).toBe('1 year ago');
    });
  });

  describe('Pack-it-yourself scoring & comparison', () => {
    it('calculates efficiency percentage compared to optimal', () => {
      const calculateEfficiency = (userScore: number, optimalScore: number) => {
        if (optimalScore <= 0) return 100;
        return Math.min(100, Math.round((userScore / optimalScore) * 100));
      };

      expect(calculateEfficiency(72, 100)).toBe(72);
      expect(calculateEfficiency(100, 100)).toBe(100);
      expect(calculateEfficiency(120, 100)).toBe(100); // capped at 100
      expect(calculateEfficiency(0, 50)).toBe(0);
    });
  });

  describe('Change-point calculation for What-If room', () => {
    it('sorts unlock candidates by value density', () => {
      const candidates = [
        { id: '1', name: 'File A', originalSize: 1000, value: 5 }, // density 0.005
        { id: '2', name: 'File B', originalSize: 500, value: 5 },  // density 0.01
        { id: '3', name: 'File C', originalSize: 200, value: 4 },  // density 0.02
      ];

      const sorted = [...candidates].sort(
        (a, b) => b.value / b.originalSize - a.value / a.originalSize
      );

      expect(sorted[0].id).toBe('3');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('1');
    });
  });
});

