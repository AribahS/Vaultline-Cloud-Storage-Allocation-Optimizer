import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FileMetadata, FileCategory } from '../../engine/types';
import { CATEGORY_META, getCategoryColor, getCategoryLabel } from '../../engine/categoryMeta';
import { formatBytes } from '../../engine/normalizer';
import {
  LayoutGrid,
  List,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FolderTree,
  ArrowUpDown,
  Trash2,
} from 'lucide-react';

type ImportanceTier = 'important' | 'normal' | 'can_go';

/** Map a numeric priority 1-10 to a tier label */
function priorityToTier(p: number): ImportanceTier {
  if (p >= 7) return 'important';
  if (p >= 4) return 'normal';
  return 'can_go';
}

/** Map a placement state from isPinned/isExcluded to a label */
function placementOf(f: FileMetadata): 'always_keep' | 'auto' | 'never_keep' {
  if (f.isPinned) return 'always_keep';
  if (f.isExcluded) return 'never_keep';
  return 'auto';
}

export const YourFilesSection: React.FC = () => {
  const files = useAppStore((s) => s.files);
  const knapsackResult = useAppStore((s) => s.knapsackResult);
  const complexityMode = useAppStore((s) => s.complexityMode);
  const folderMode = useAppStore((s) => s.folderMode);
  const setFolderMode = useAppStore((s) => s.setFolderMode);
  const setFileImportanceTier = useAppStore((s) => s.setFileImportanceTier);
  const updatePriority = useAppStore((s) => s.updatePriority);
  const setFilePlacement = useAppStore((s) => s.setFilePlacement);
  const removeFile = useAppStore((s) => s.removeFile);
  const bulkSetImportance = useAppStore((s) => s.bulkSetImportance);
  const bulkSetPlacement = useAppStore((s) => s.bulkSetPlacement);

  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'size' | 'priority' | 'date' | 'name'>('size');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const keptItemIds = useMemo(() => {
    if (!knapsackResult) return new Set<string>();
    return new Set(knapsackResult.keptItems.map((i) => i.id));
  }, [knapsackResult]);

  // Filter & sort
  const filteredFiles = useMemo(() => {
    let result = [...files];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) => f.name.toLowerCase().includes(q) || (f.path && f.path.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter((f) => f.category === selectedCategory);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'size') cmp = a.size - b.size;
      else if (sortBy === 'priority') cmp = a.priority - b.priority;
      else if (sortBy === 'date') cmp = (a.lastModified || 0) - (b.lastModified || 0);
      else if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [files, searchQuery, selectedCategory, sortBy, sortAsc]);

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const bulkRemove = () => {
    for (const id of selectedIds) {
      removeFile(id);
    }
    setSelectedIds(new Set());
  };

  return (
    <div
      className="bento-card p-6 mt-6"
      style={{
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-glass)',
        background: 'var(--surface-card)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold font-heading" style={{ color: 'var(--ink)' }}>
            Your files
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {files.length} files, {formatBytes(totalBytes)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFolderMode(!folderMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={{
              background: folderMode ? 'rgba(108, 71, 255, 0.1)' : 'white',
              borderColor: folderMode ? 'var(--brand-primary)' : 'rgba(20, 17, 43, 0.12)',
              color: folderMode ? 'var(--brand-primary)' : 'var(--ink)',
            }}
          >
            <FolderTree size={14} />
            <span>Group by folder</span>
          </button>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-semibold transition-all ${
                viewMode === 'cards' ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-slate-600'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-slate-600'
              }`}
            >
              <List size={14} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-xl bg-white/60 border border-slate-200/60">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search files or paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-700">Clear</button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedCategory && (
            <button type="button" onClick={() => setSelectedCategory(null)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-100 text-[var(--brand-primary)] flex items-center gap-1">
              <span>{getCategoryLabel(selectedCategory as FileCategory)}</span>
              <span className="text-[10px]">&times;</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown size={13} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="size">Size</option>
              <option value="priority">Importance</option>
              <option value="date">Date modified</option>
              <option value="name">Name</option>
            </select>
            <button type="button" onClick={() => setSortAsc(!sortAsc)}
              className="p-1 rounded text-slate-500 hover:text-slate-800" title={sortAsc ? 'Ascending' : 'Descending'}>
              {sortAsc ? '↑' : '↓'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectMode ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            {selectMode ? 'Done' : 'Select'}
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-violet-50/80 border border-violet-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button type="button" onClick={toggleSelectAll} className="font-semibold text-[var(--brand-primary)] hover:underline">
              {selectedIds.size === filteredFiles.length ? 'Deselect all' : 'Select all'}
            </button>
            <span className="text-slate-600">{selectedIds.size} selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted">Set importance:</span>
            {(['important', 'normal', 'can_go'] as ImportanceTier[]).map((tier) => {
              const val = tier === 'important' ? 9 : tier === 'normal' ? 5 : 2;
              const label = tier === 'important' ? 'Important' : tier === 'normal' ? 'Normal' : 'Can go';
              return (
                <button key={tier} type="button"
                  onClick={() => bulkSetImportance(Array.from(selectedIds), val)}
                  className="px-2 py-0.5 rounded bg-white font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100">
                  {label}
                </button>
              );
            })}
            <span className="text-muted ml-2">Placement:</span>
            <button type="button" onClick={() => bulkSetPlacement(Array.from(selectedIds), 'always_keep')}
              className="px-2 py-0.5 rounded bg-emerald-100 font-semibold text-emerald-800 hover:bg-emerald-200">Always</button>
            <button type="button" onClick={() => bulkSetPlacement(Array.from(selectedIds), 'auto')}
              className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200">Auto</button>
            <button type="button" onClick={() => bulkSetPlacement(Array.from(selectedIds), 'never_keep')}
              className="px-2 py-0.5 rounded bg-rose-100 font-semibold text-rose-800 hover:bg-rose-200">Never</button>
            <button type="button" onClick={bulkRemove} className="p-1 text-red-500 hover:text-red-700 ml-2" title="Remove selected">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredFiles.map((file) => {
            const isKept = keptItemIds.has(file.id);
            const color = getCategoryColor(file.category);
            const isSelected = selectedIds.has(file.id);
            const tier = priorityToTier(file.priority);
            const placement = placementOf(file);

            return (
              <div
                key={file.id}
                className="relative rounded-2xl p-4 flex flex-col justify-between transition-all bg-white/80 hover:bg-white border hover:shadow-md"
                style={{
                  borderColor: isSelected ? 'var(--brand-primary)' : isKept ? 'rgba(16, 185, 129, 0.4)' : 'rgba(20, 17, 43, 0.08)',
                  boxShadow: isSelected ? '0 0 0 2px var(--brand-primary)' : undefined,
                }}
              >
                <div className="absolute top-0 left-4 right-4 h-1 rounded-b" style={{ background: color }} />

                <div>
                  <div className="flex items-center justify-between mb-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: `${color}18`, color }}>
                      {getCategoryLabel(file.category)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-medium text-slate-600">{formatBytes(file.size)}</span>
                      {selectMode && (
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectOne(file.id)}
                          className="w-4 h-4 cursor-pointer accent-[var(--brand-primary)]" />
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold leading-snug line-clamp-2 mb-3" style={{ color: 'var(--ink)' }}
                    title={file.path ? `${file.path}/${file.name}` : file.name}>
                    {file.name}
                  </h3>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Importance 3-chip */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted">Importance</span>
                    <div className="flex items-center gap-1">
                      {(['important', 'normal', 'can_go'] as ImportanceTier[]).map((t) => {
                        const active = tier === t;
                        const label = t === 'important' ? 'Important' : t === 'normal' ? 'Normal' : 'Can go';
                        return (
                          <button key={t} type="button"
                            onClick={() => setFileImportanceTier(file.id, t)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1 ${
                              active ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}>
                            <span>{label}</span>
                            {active && file.prioritySource === 'auto' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-300" title="Set by profile" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed: numeric slider */}
                  {complexityMode === 'detailed' && (
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <span className="font-mono text-muted">Value: {file.priority}/10</span>
                      <input type="range" min={1} max={10} value={file.priority}
                        onChange={(e) => updatePriority(file.id, Number(e.target.value))}
                        className="flex-1 h-1.5 accent-[var(--brand-primary)] cursor-pointer" />
                    </div>
                  )}

                  {/* Placement 3-state */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] uppercase font-bold text-muted">Placement</span>
                    <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                      <button type="button" onClick={() => setFilePlacement(file.id, 'always_keep')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all ${
                          placement === 'always_keep' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                        }`}>
                        <CheckCircle size={10} /><span>Always</span>
                      </button>
                      <button type="button" onClick={() => setFilePlacement(file.id, 'auto')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                          placement === 'auto' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}>
                        <span>Auto</span>
                      </button>
                      <button type="button" onClick={() => setFilePlacement(file.id, 'never_keep')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all ${
                          placement === 'never_keep' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
                        }`}>
                        <XCircle size={10} /><span>Never</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                {selectMode && <th className="p-3 w-10"></th>}
                <th className="p-3">File Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Size</th>
                <th className="p-3">Importance</th>
                <th className="p-3">Placement</th>
                <th className="p-3 text-right">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFiles.map((file) => {
                const isKept = keptItemIds.has(file.id);
                const color = getCategoryColor(file.category);
                const isSelected = selectedIds.has(file.id);
                const tier = priorityToTier(file.priority);
                const placement = placementOf(file);

                return (
                  <tr key={file.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-violet-50/50' : ''}`}>
                    {selectMode && (
                      <td className="p-3 text-center">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectOne(file.id)}
                          className="w-4 h-4 cursor-pointer accent-[var(--brand-primary)]" />
                      </td>
                    )}
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 max-w-xs truncate" title={file.name}>{file.name}</div>
                      {file.path && <div className="text-[10px] text-muted truncate max-w-xs">{file.path}</div>}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: `${color}18`, color }}>
                        {getCategoryLabel(file.category)}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-700">{formatBytes(file.size)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {(['important', 'normal', 'can_go'] as ImportanceTier[]).map((t) => {
                          const active = tier === t;
                          const label = t === 'important' ? 'Important' : t === 'normal' ? 'Normal' : 'Can go';
                          return (
                            <button key={t} type="button" onClick={() => setFileImportanceTier(file.id, t)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}>{label}</button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 w-fit">
                        <button type="button" onClick={() => setFilePlacement(file.id, 'always_keep')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            placement === 'always_keep' ? 'bg-emerald-500 text-white' : 'text-slate-600'
                          }`}>Always</button>
                        <button type="button" onClick={() => setFilePlacement(file.id, 'auto')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            placement === 'auto' ? 'bg-white text-slate-800' : 'text-slate-500'
                          }`}>Auto</button>
                        <button type="button" onClick={() => setFilePlacement(file.id, 'never_keep')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            placement === 'never_keep' ? 'bg-rose-500 text-white' : 'text-slate-600'
                          }`}>Never</button>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1"
                        style={{
                          background: isKept ? 'rgba(16, 185, 129, 0.12)' : 'rgba(249, 168, 184, 0.25)',
                          color: isKept ? '#10B981' : '#E11D48',
                        }}>
                        {isKept ? 'Keep' : 'Move'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

