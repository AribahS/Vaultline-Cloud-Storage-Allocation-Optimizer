import React, { useState, useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FilesTable } from '../components/FilesTable';
import { FileDetailDrawer } from '../components/FileDetailDrawer';
import { SegmentedControl } from '../components/SegmentedControl';
import { FilePlus, FolderPlus, UploadCloud, Trash2, Download, ChevronDown } from 'lucide-react';
import { useAppStore, PresetType } from '../../store/useAppStore';
import { scanFileList, scanWithFileSystemAccess } from '../../engine/fileScanner';
import { FileMetadata } from '../../engine/types';

import { formatSize, pluralize } from '../../lib/format';

export const FilesPage: React.FC = () => {
  const { files, addFiles, isScanning, setIsScanning, scanProgress, clearFiles, loadPreset, knapsackResult } = useAppStore();
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [view, setView] = useState('Table');
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsScanning(true, { count: 0 });
    try {
      const { scanFileList } = await import('../../engine/fileScanner');
      const newFiles = await scanFileList(e.target.files, (p) => setIsScanning(true, p));
      const withPriority = newFiles.map(f => ({ ...f, priority: 5, prioritySource: 'edited' as const }));
      addFiles(withPriority);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false, null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsScanning(true, { count: 0 });
    try {
      const { scanFileList } = await import('../../engine/fileScanner');
      const newFiles = await scanFileList(e.target.files, (p) => setIsScanning(true, p));
      const withPriority = newFiles.map(f => ({ ...f, priority: 5, prioritySource: 'edited' as const }));
      addFiles(withPriority);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false, null);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleAddFolder = async () => {
    if ('showDirectoryPicker' in window) {
      setIsScanning(true, { count: 0 });
      try {
        const newFiles = await scanWithFileSystemAccess((p) => setIsScanning(true, p));
        const withPriority = newFiles.map(f => ({ ...f, priority: 5, prioritySource: 'edited' as const }));
        addFiles(withPriority);
      } catch (err) {
        console.warn('Folder scan cancelled or failed', err);
      } finally {
        setIsScanning(false, null);
      }
    } else {
      folderInputRef.current?.click();
    }
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const categories = new Map<string, number>();
  files.forEach(f => categories.set(f.category, (categories.get(f.category) || 0) + 1));
  const dupCount = files.filter(f => f.isDuplicate).length;

  // Get kept/moved status from knapsack result
  const keptIds = new Set(knapsackResult?.keptItems.map(i => i.id) || []);

  const alwaysKeepSize = files.filter(f => f.isPinned).reduce((acc, f) => acc + f.size, 0);
  const isOverQuota = alwaysKeepSize > useAppStore.getState().quotaBytes;
  
  const selectedIndex = selectedFile ? files.findIndex(f => f.id === selectedFile.id) : -1;

  return (
    <div className="page-container animate-page-enter">
      {/* Hidden inputs */}
      <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
      <input type="file" ref={folderInputRef} onChange={handleFolderSelect} style={{ display: 'none' }} {...{ webkitdirectory: '', directory: '' } as any} />

      {/* Warning */}
      {isOverQuota && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(179,57,81,0.1)', border: '1px solid var(--color-semantic-move)', borderRadius: '8px', color: 'var(--color-semantic-move)', marginBottom: '24px', fontWeight: 600 }}>
          Warning: Always keep files ({formatSize(alwaysKeepSize)}) exceed target capacity ({formatSize(useAppStore.getState().quotaBytes)}).
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          {files.length > 0 ? (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-forest)' }}>
                {pluralize(files.length, 'file')}, {formatSize(totalSize)}
              </span>
              {dupCount > 0 && (
                <span className="text-body-small" style={{ color: 'var(--color-semantic-warning)', marginTop: '6px' }}>
                  {dupCount} possible duplicates
                </span>
              )}
            </div>
          ) : (
            <h1 style={{ marginBottom: '4px' }}>Files</h1>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" icon={<FilePlus size={16} />} onClick={() => fileInputRef.current?.click()}>
            Add files
          </Button>
          <Button variant="secondary" size="sm" icon={<FolderPlus size={16} />} onClick={handleAddFolder}>
            Add folder
          </Button>
          {/* Sample dataset dropdown */}
          <div style={{ position: 'relative' }}>
            <Button variant="ghost" size="sm" icon={<Download size={16} />} onClick={() => setShowPresetMenu(!showPresetMenu)}>
              Sample data <ChevronDown size={14} />
            </Button>
            {showPresetMenu && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border-hairline)',
                borderRadius: '8px', boxShadow: 'var(--shadow-soft-lg)', zIndex: 100, minWidth: '200px',
                overflow: 'hidden'
              }}>
                {(['student', 'photographer', 'company'] as PresetType[]).map(preset => (
                  <button
                    key={preset}
                    onClick={() => { loadPreset(preset); setShowPresetMenu(false); }}
                    style={{
                      display: 'block', width: '100%', padding: '10px 16px',
                      border: 'none', background: 'none', textAlign: 'left',
                      fontSize: '14px', cursor: 'pointer', color: 'var(--color-ink)'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {preset === 'student' ? 'Student laptop (12 files)' :
                     preset === 'photographer' ? 'Photographer (60 files)' :
                     'Small office server (120 files)'}
                  </button>
                ))}
              </div>
            )}
          </div>
          {files.length > 0 && (
            <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={() => {
              if (window.confirm(`Remove all ${files.length} files?`)) {
                clearFiles();
              }
            }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Scanning progress */}
      {isScanning && scanProgress && (
        <Card style={{ marginBottom: '24px', backgroundColor: 'var(--color-surface-sunken)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="skeleton-shimmer" style={{ width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Scanning... {scanProgress.count.toLocaleString()} files found</div>
              {scanProgress.currentFolder && (
                <div className="text-caption text-ink-3" style={{ marginTop: '2px' }}>{scanProgress.currentFolder}</div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {files.length === 0 && !isScanning ? (
        <Card style={{ textAlign: 'center', padding: '80px 24px' }}>
          <UploadCloud size={48} color="var(--color-ink-3)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: '8px', fontSize: '24px' }}>No files scanned yet</h2>
          <p className="text-ink-2" style={{ margin: '0 auto 32px', maxWidth: '420px', lineHeight: 1.6 }}>
            Drop files or folders anywhere on this window, or use the buttons below to start a scan. Nothing leaves your device.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="secondary" icon={<FilePlus size={16} />} onClick={() => fileInputRef.current?.click()}>
              Add files
            </Button>
            <Button variant="ghost" icon={<Download size={16} />} onClick={() => loadPreset('student')}>
              Try sample data
            </Button>
          </div>
        </Card>
      ) : files.length > 0 && (
        <>
          {/* View switcher */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SegmentedControl
              options={['Table', 'Duplicates']}
              selected={view}
              onChange={setView}
            />
            <span className="text-caption text-ink-3">
              Click a row to view details
            </span>
          </div>

          {/* Table view */}
          {view === 'Table' && (
            <FilesTable files={files} onRowClick={(file) => setSelectedFile(file)} />
          )}

          {/* Duplicates view */}
          {view === 'Duplicates' && (
            <Card>
              {dupCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-ink-3)' }}>
                  <p style={{ fontWeight: 600 }}>No duplicates detected</p>
                  <p className="text-body-small" style={{ marginTop: '8px' }}>
                    Duplicates are matched by name and size.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '24px' }}>
                  {Object.entries(
                    files.filter(f => f.isDuplicate).reduce((acc, f) => {
                      if (!f.duplicateGroup) return acc;
                      if (!acc[f.duplicateGroup]) acc[f.duplicateGroup] = [];
                      acc[f.duplicateGroup].push(f);
                      return acc;
                    }, {} as Record<string, typeof files>)
                  ).map(([groupId, groupFiles]) => (
                    <div key={groupId} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border-hairline)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{groupFiles[0].name}</div>
                          <div className="text-caption text-ink-3">{formatSize(groupFiles[0].size)}</div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => {
                          const [keep, ...extras] = groupFiles;
                          useAppStore.getState().bulkSetPlacement(extras.map(e => e.id), 'never_keep');
                        }}>
                          Keep one
                        </Button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {groupFiles.map(f => (
                          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '6px' }}>
                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <div className="text-caption" style={{ fontFamily: 'var(--font-mono)' }}>{f.path}</div>
                            </div>
                            {f.isExcluded ? (
                              <span style={{ fontSize: '12px', color: 'var(--color-semantic-move)', fontWeight: 600 }}>Never keep</span>
                            ) : f.isPinned ? (
                              <span style={{ fontSize: '12px', color: 'var(--color-semantic-keep)', fontWeight: 600 }}>Always keep</span>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>Auto</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* File detail drawer */}
      <FileDetailDrawer
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        onPrevious={selectedIndex > 0 ? () => setSelectedFile(files[selectedIndex - 1]) : undefined}
        onNext={selectedIndex < files.length - 1 ? () => setSelectedFile(files[selectedIndex + 1]) : undefined}
      />
    </div>
  );
};

