export interface SizedFile { id: string; name: string; size: number; category: string; kept?: boolean }

export const truncateTreemapLabel = (name: string, maxCharacters: number): string => {
  const limit = Math.max(0, Math.floor(maxCharacters));
  if (name.length <= limit) return name;
  if (limit <= 1) return limit === 1 ? '…' : '';
  return `${name.slice(0, limit - 1)}…`;
};

export const groupSmallTreemapFiles = <T extends SizedFile>(files: T[], totalArea: number, minArea = 1800): T[] => {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize <= 0 || files.length === 0) return files;
  const small = files.filter(file => file.size / totalSize * totalArea < minArea);
  if (small.length < 2) return files;
  const smallIds = new Set(small.map(file => file.id));
  const groups = [...new Set(small.map(file => Boolean(file.kept)))].map(kept => {
    const members = small.filter(file => Boolean(file.kept) === kept);
    return { ...members[0], id: `small-files-group-${kept ? 'kept' : 'moved'}`, name: `+${members.length} small files`, category: 'other', size: members.reduce((sum, file) => sum + file.size, 0), kept } as T;
  });
  return [...files.filter(file => !smallIds.has(file.id)), ...groups];
};
