import { FileMetadata } from './types';
import { detectCategory, suggestPriority } from './priority';

export interface ScanProgress {
  count: number;
  currentFolder?: string;
}

export function createFileMetadata(
  name: string,
  path: string,
  size: number,
  lastModified: number,
  type: string
): FileMetadata {
  const category = detectCategory(name, type);
  const { priority } = suggestPriority(category, lastModified);

  return {
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    path: path || `/${name}`,
    size,
    type: type || name.split('.').pop() || 'unknown',
    lastModified: lastModified || Date.now(),
    category,
    priority,
    prioritySource: 'auto',
    isPinned: false,
    isExcluded: false,
  };
}

/**
 * Scan standard HTML FileList (from <input type="file" multiple> or webkitdirectory)
 */
export async function scanFileList(
  files: FileList | File[],
  onProgress?: (p: ScanProgress) => void
): Promise<FileMetadata[]> {
  const results: FileMetadata[] = [];
  const fileArray = Array.from(files);
  const total = fileArray.length;

  for (let i = 0; i < total; i++) {
    const file = fileArray[i];
    const relativePath = (file as any).webkitRelativePath || `/${file.name}`;
    results.push(
      createFileMetadata(file.name, relativePath, file.size, file.lastModified, file.type)
    );

    if (i % 250 === 0) {
      onProgress?.({ count: results.length, currentFolder: relativePath });
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onProgress?.({ count: results.length });
  return results;
}

/**
 * Recursively walk DataTransferItem.webkitGetAsEntry() for dropped folders & files
 */
export async function scanDroppedItems(
  items: DataTransferItemList,
  onProgress?: (p: ScanProgress) => void
): Promise<FileMetadata[]> {
  const results: FileMetadata[] = [];

  const queue: { entry: any; path: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file') {
      const entry = (item as any).webkitGetAsEntry?.();
      if (entry) {
        queue.push({ entry, path: '' });
      } else {
        const file = item.getAsFile();
        if (file) {
          results.push(createFileMetadata(file.name, `/${file.name}`, file.size, file.lastModified, file.type));
        }
      }
    }
  }

  let counter = 0;

  async function processDirectoryEntry(dirEntry: any, currentPath: string): Promise<void> {
    const reader = dirEntry.createReader();
    const readEntries = (): Promise<any[]> =>
      new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });

    let batch = await readEntries();
    while (batch.length > 0) {
      for (const child of batch) {
        queue.push({ entry: child, path: `${currentPath}/${child.name}` });
      }
      batch = await readEntries();
    }
  }

  async function processFileEntry(fileEntry: any, fullPath: string): Promise<void> {
    return new Promise((resolve) => {
      fileEntry.file(
        (file: File) => {
          results.push(
            createFileMetadata(
              file.name,
              fullPath || `/${file.name}`,
              file.size,
              file.lastModified,
              file.type
            )
          );
          counter++;
          resolve();
        },
        () => resolve()
      );
    });
  }

  while (queue.length > 0) {
    const { entry, path } = queue.shift()!;
    if (entry.isFile) {
      await processFileEntry(entry, path);
    } else if (entry.isDirectory) {
      await processDirectoryEntry(entry, path);
    }

    if (counter % 200 === 0) {
      onProgress?.({ count: results.length, currentFolder: path });
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onProgress?.({ count: results.length });
  return results;
}

/**
 * Scan folder using the File System Access API (showDirectoryPicker) if available
 */
export async function scanWithFileSystemAccess(
  onProgress?: (p: ScanProgress) => void
): Promise<FileMetadata[]> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API is not supported in this browser.');
  }

  const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
  const results: FileMetadata[] = [];
  let counter = 0;

  async function traverse(handle: any, currentPath: string): Promise<void> {
    for await (const entry of handle.values()) {
      const entryPath = `${currentPath}/${entry.name}`;
      if (entry.kind === 'file') {
        try {
          const file = await entry.getFile();
          results.push(createFileMetadata(file.name, entryPath, file.size, file.lastModified, file.type));
          counter++;
          if (counter % 200 === 0) {
            onProgress?.({ count: results.length, currentFolder: currentPath });
            await new Promise((r) => setTimeout(r, 0));
          }
        } catch {
          // Skip unreadable files without failing the scan
        }
      } else if (entry.kind === 'directory') {
        await traverse(entry, entryPath);
      }
    }
  }

  await traverse(dirHandle, `/${dirHandle.name}`);
  onProgress?.({ count: results.length });
  return results;
}
