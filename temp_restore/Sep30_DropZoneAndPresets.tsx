import React, { useRef, useState } from 'react';
import { useAppStore, PresetType } from '../../store/useAppStore';
import { scanFileList, scanDroppedItems, scanWithFileSystemAccess } from '../../engine/fileScanner';

export const DropZoneAndPresets: React.FC = () => {
  const { addFiles, loadPreset, isScanning, setIsScanning, scanProgress } = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!e.dataTransfer.items || e.dataTransfer.items.length === 0) return;

    setIsScanning(true);
    try {
      const scanned = await scanDroppedItems(e.dataTransfer.items, (p) => {
        setIsScanning(true, p);
      });
      if (scanned.length > 0) {
        addFiles(scanned);
      }
    } catch (err) {
      console.error('Drop scan failed:', err);
    } finally {
      setIsScanning(false, null);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsScanning(true);
    try {
      const scanned = await scanFileList(e.target.files, (p) => {
        setIsScanning(true, p);
      });
      if (scanned.length > 0) {
        addFiles(scanned);
      }
    } catch (err) {
      console.error('File scan failed:', err);
    } finally {
      setIsScanning(false, null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleFSAccessPicker = async () => {
    setIsScanning(true);
    try {
      const scanned = await scanWithFileSystemAccess((p) => {
        setIsScanning(true, p);
      });
      if (scanned.length > 0) {
        addFiles(scanned);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native folder scan fell back:', err);
        folderInputRef.current?.click();
      }
    } finally {
      setIsScanning(false, null);
    }
  };

  const hasFileSystemAccess = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const presets: { type: PresetType; label: string; desc: string; count: string }[] = [
    { type: 'student', label: 'Student laptop', desc: 'Mixed coursework, photos & projects', count: '12 files' },
    { type: 'photographer', label: 'Photographer', desc: 'Large RAW photos & edited exports', count: '40 files' },
    { type: 'company', label: 'Company server', desc: 'Backups, databases & archives', count: '60 files' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <input
        type="file"
        ref={folderInputRef}
        {...({ webkitdirectory: '', directory: '' } as any)}
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Main Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
          backgroundColor: isDragOver ? 'var(--color-primary-surface)' : 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 24px',
          textAlign: 'center',
          transition: 'all var(--transition-normal)',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {/* Icon */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-primary-surface), var(--color-success-surface))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-ink)' }}>
              Drop files or folders here
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', marginTop: '4px' }}>
              We only read names, sizes & dates. Nothing leaves your device.
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{ display: 'flex', gap: '10px', marginTop: '4px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose files
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={hasFileSystemAccess ? handleFSAccessPicker : () => folderInputRef.current?.click()}
            >
              {hasFileSystemAccess ? 'Scan folder' : 'Choose folder'}
            </button>
          </div>
        </div>

        {/* Scanning Progress */}
        {isScanning && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', marginBottom: '6px', fontWeight: 500 }}>
              Reading files… {scanProgress ? `${scanProgress.count} found` : 'Starting…'}
            </div>
            <div style={{ height: '3px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '2px', overflow: 'hidden', maxWidth: '240px', margin: '0 auto' }}>
              <div
                style={{
                  height: '100%',
                  width: '65%',
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: '2px',
                  animation: 'pulse-soft 1.2s infinite',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sample Scenarios */}
      <div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', fontWeight: 500, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Or try a sample
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {presets.map((p) => (
            <button
              key={p.type}
              onClick={() => loadPreset(p.type)}
              className="card-flat"
              style={{
                padding: '14px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-glow-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-ink)', marginBottom: '2px' }}>
                {p.label}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', lineHeight: 1.4 }}>
                {p.desc}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginTop: '6px' }}>
                {p.count}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

