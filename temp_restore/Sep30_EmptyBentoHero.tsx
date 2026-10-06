import React, { useRef, useState } from 'react';
import { useAppStore, PresetType } from '../../store/useAppStore';
import { scanFileList, scanDroppedItems, scanWithFileSystemAccess } from '../../engine/fileScanner';
import { BYTE_UNITS } from '../../engine/normalizer';

export const EmptyBentoHero: React.FC = () => {
  const { addFiles, loadPreset, setQuotaBytes, setIsScanning } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [exampleDropdownOpen, setExampleDropdownOpen] = useState(false);

  const handleFilesChosen = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsScanning(true, { count: files.length });
    const scanned = scanFileList(files);
    addFiles(scanned);
    setIsScanning(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer) return;

    setIsScanning(true);
    const scanned = await scanDroppedItems(e.dataTransfer);
    addFiles(scanned);
    setIsScanning(false);
  };

  const handleChooseFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        setIsScanning(true);
        const scanned = await scanWithFileSystemAccess((progress) => {
          setIsScanning(true, progress);
        });
        addFiles(scanned);
        setIsScanning(false);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Directory Picker fallback:', err);
        } else {
          setIsScanning(false);
          return;
        }
      }
    }
    folderInputRef.current?.click();
  };

  const handleSelectPreset = (preset: PresetType) => {
    loadPreset(preset);
    setExampleDropdownOpen(false);
  };

  const handleQuickDestination = (bytes: number, preset: PresetType) => {
    loadPreset(preset);
    setQuotaBytes(bytes);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        padding: '40px 0 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '48px',
        position: 'relative',
      }}
    >
      {/* Full screen drop overlay */}
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(108, 71, 255, 0.25)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            border: '4px dashed var(--color-primary)',
          }}
        >
          <div
            className="card"
            style={{
              padding: '36px 48px',
              textAlign: 'center',
              backgroundColor: 'var(--color-surface-solid)',
              boxShadow: 'var(--shadow-elevation)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍱</div>
            <h2 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-ink)' }}>Drop to pack into your box</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)', marginTop: '6px' }}>
              Files stay private on your device.
            </p>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFilesChosen(e.target.files)}
        style={{ display: 'none' }}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={(e) => handleFilesChosen(e.target.files)}
        style={{ display: 'none' }}
      />

      {/* Top Hero Section: Headline left, Bento Box Illustration right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'center' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-surface)',
              color: 'var(--color-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              marginBottom: '18px',
              border: '1px solid rgba(108, 71, 255, 0.15)',
            }}
          >
            <span>🍱</span> The Bento Box Storage Optimizer
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 54px)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: 'var(--color-ink)',
              letterSpacing: '-0.03em',
              marginBottom: '18px',
            }}
          >
            Fit the right files into the space you have.
          </h1>

          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--color-muted)',
              lineHeight: 1.6,
              maxWidth: '520px',
              marginBottom: '32px',
            }}
          >
            Drop a folder. Tell us your limit. Get the best mix to keep. Nothing leaves your device.
          </p>

          {/* 3 Main Action Cards */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-primary btn-lg"
            >
              Choose files
            </button>

            <button
              onClick={handleChooseFolder}
              className="btn btn-secondary btn-lg"
            >
              Choose folder
            </button>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setExampleDropdownOpen(!exampleDropdownOpen)}
                className="btn btn-secondary btn-lg"
                style={{ borderColor: 'var(--color-primary)' }}
              >
                Try an example ▾
              </button>

              {exampleDropdownOpen && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '240px',
                    padding: '8px',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    backgroundColor: 'var(--color-surface-solid)',
                    boxShadow: 'var(--shadow-elevation)',
                  }}
                >
                  <button
                    onClick={() => handleSelectPreset('student')}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-ink)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-surface)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <strong>Student laptop</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-dim)' }}>Assignments, notes & code (15 GB)</div>
                  </button>

                  <button
                    onClick={() => handleSelectPreset('photographer')}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-ink)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-surface)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <strong>Photographer</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-dim)' }}>RAW images, presets & video (64 GB)</div>
                  </button>

                  <button
                    onClick={() => handleSelectPreset('company')}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-ink)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-surface)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <strong>Small office</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-dim)' }}>Databases, archives & docs (128 GB)</div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Right: Bento Box Graphic */}
        <div
          className="card"
          style={{
            padding: '28px',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid rgba(108, 71, 255, 0.16)',
            boxShadow: 'var(--shadow-elevation)',
            background: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              The Bento Container
            </span>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                backgroundColor: 'var(--color-keep-surface)',
                color: 'var(--color-keep)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
              }}
            >
              Snug 100% Fit
            </span>
          </div>

          {/* Visual Bento Compartments */}
          <div
            style={{
              height: '240px',
              backgroundColor: 'var(--color-surface-sunken)',
              borderRadius: 'var(--radius-lg)',
              padding: '10px',
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.9fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '8px',
              border: '1.5px solid var(--color-border)',
            }}
          >
            {/* Tile 1: Documents */}
            <div
              style={{
                gridRow: 'span 2',
                backgroundColor: 'var(--color-type-doc)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 14px rgba(79, 91, 213, 0.35)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Documents</span>
                <div style={{ fontWeight: 700, fontSize: '15px', marginTop: '2px' }}>Thesis_Final.pdf</div>
              </div>
              <div className="font-mono" style={{ fontSize: '12px', opacity: 0.9 }}>
                4.2 GB • Important
              </div>
            </div>

            {/* Tile 2: Photos */}
            <div
              style={{
                backgroundColor: 'var(--color-type-photo)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 14px rgba(255, 107, 107, 0.35)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '13px' }}>Trip_2024.raw</div>
              <div className="font-mono" style={{ fontSize: '11px', opacity: 0.9 }}>3.8 GB</div>
            </div>

            {/* Tile 3: Code */}
            <div
              style={{
                backgroundColor: 'var(--color-type-code)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '13px' }}>Workspace.zip</div>
              <div className="font-mono" style={{ fontSize: '11px', opacity: 0.9 }}>2.4 GB</div>
            </div>

            {/* Tile 4: Archives */}
            <div
              style={{
                gridColumn: 'span 2',
                backgroundColor: 'var(--color-type-archive)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', opacity: 0.85, textTransform: 'uppercase' }}>Archives</span>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Backup_Archive.tar</div>
              </div>
              <div className="font-mono" style={{ fontSize: '12px' }}>4.6 GB</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
            <span>✓ Every file kept intact (0/1 choice)</span>
            <span>Zero wasted bytes</span>
          </div>
        </div>
      </div>

      {/* Where do you need to fit them? Preview cards */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-ink)' }}>
            Where do you need to fit them?
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Pick a destination or test with a sample file set in one click:
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          <button
            onClick={() => handleQuickDestination(64 * BYTE_UNITS.GB, 'photographer')}
            className="card"
            style={{
              padding: '22px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '28px' }}>📱</div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-ink)' }}>
              Phone storage (64 GB)
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Free up room for a long trip or photo shoot without deleting precious memories.
            </div>
          </button>

          <button
            onClick={() => handleQuickDestination(32 * BYTE_UNITS.GB, 'student')}
            className="card"
            style={{
              padding: '22px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '28px' }}>💾</div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-ink)' }}>
              Pen drive or USB (32 GB)
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Pack an essential offline toolkit or backup to take anywhere.
            </div>
          </button>

          <button
            onClick={() => handleQuickDestination(15 * BYTE_UNITS.GB, 'student')}
            className="card"
            style={{
              padding: '22px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '28px' }}>☁️</div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-ink)' }}>
              Free cloud quota (15 GB)
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Stay under Google Drive (15 GB) or iCloud (5 GB) limits forever.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

