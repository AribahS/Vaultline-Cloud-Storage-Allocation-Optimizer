import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ToolsPage from './src/ui/pages/ToolsPage';
import { useAppStore } from './src/store/useAppStore';
import { FileMetadata } from './src/engine/types';

vi.mock('./src/store/useAppStore', () => ({
  useAppStore: vi.fn()
}));

const mockFiles: FileMetadata[] = [
  { id: '1', name: 'test.mp4', path: '/test.mp4', size: 1024 * 1024 * 1024, type: 'video/mp4', lastModified: Date.now(), category: 'video', priority: 5, prioritySource: 'auto', isPinned: false, isExcluded: false },
];

const generateFiles = (count: number): FileMetadata[] => {
  const arr = [];
  for(let i=0; i<count; i++) {
    arr.push({ id: `${i}`, name: `file_${i}.txt`, path: `/file_${i}.txt`, size: 1024, type: 'text/plain', lastModified: Date.now(), category: 'document' as any, priority: 5, prioritySource: 'auto' as any, isPinned: false, isExcluded: false });
  }
  return arr;
};

const renderWithRouter = (ui: React.ReactElement, { route = '/tools' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
};

const subTools = ['split', 'transfer', 'compression', 'what-if', 'approximate', 'cleanup'];

describe('ToolsPage smoke test', () => {
  it('renders gallery with no files', () => {
    (useAppStore as any).mockReturnValue({ files: [] });
    renderWithRouter(<ToolsPage />);
    expect(screen.getByText('Extra tools')).toBeDefined();
  });

  subTools.forEach(tool => {
    it(`renders ${tool} with no files`, () => {
      (useAppStore as any).mockReturnValue({ files: [] });
      renderWithRouter(<ToolsPage />, { route: `/tools/${tool}` });
      expect(screen.getByText('No files available')).toBeDefined();
    });

    it(`renders ${tool} with sample data`, () => {
      (useAppStore as any).mockReturnValue({ files: mockFiles, quotaBytes: 1024 * 1024 * 1024 * 10 });
      renderWithRouter(<ToolsPage />, { route: `/tools/${tool}` });
      // should not throw, empty state should not be there (except what-if which is just coming soon)
      if (tool !== 'what-if') {
        expect(screen.queryByText('No files available')).toBeNull();
      }
    });

    it(`renders ${tool} with 5000 files`, () => {
      (useAppStore as any).mockReturnValue({ files: generateFiles(5000), quotaBytes: 1024 * 1024 * 1024 * 10 });
      renderWithRouter(<ToolsPage />, { route: `/tools/${tool}` });
      if (tool !== 'what-if') {
        expect(screen.queryByText('No files available')).toBeNull();
      }
    });
  });
});

