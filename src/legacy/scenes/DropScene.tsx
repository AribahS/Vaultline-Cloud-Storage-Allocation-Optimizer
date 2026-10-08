/**
 * SCENE 1: DROP (#/drop)
 * Full-height hero.
 * Left: headline, subline, live counter, "Pick your space" button.
 * Right: Lunchbox illustration, buttons ("Choose files", "Choose folder", "Try an example").
 * Window-wide drop target with mint glow, Boxy curious/munching moods, and folder scanning progress.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FolderOpen, Sparkles, ArrowRight, Laptop, Camera, Building2, Check } from 'lucide-react';
import { useAppStore, PresetType } from '../../store/useAppStore';
import { useFlowStore } from '../store/useFlowStore';
import { LunchboxIllustration } from '../components/LunchboxIllustration';
import { Boxy, BoxyMood } from '../components/Boxy';
import { springs } from '../motion';
import { formatBytes } from '../utils/fileHelpers';
import { playSound } from '../utils/sound';
import { scanFileList, scanDroppedItems } from '../../engine/fileScanner';

export const DropScene: React.FC = () => {
  const { files, addFiles, loadPreset, isScanning, setIsScanning, scanProgress } = useAppStore();
  const { setScene, setFilesDropped, showTips, setShowTips } = useFlowStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [activeMood, setActiveMood] = useState<BoxyMood>('idle');
  const [tipMessage, setTipMessage] = useState('Drop files or a folder anywhere onto me!');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);

  // Sync flow store completion flag
  useEffect(() => {
    if (totalFiles > 0) {
      setFilesDropped(true);
    }
  }, [totalFiles, setFilesDropped]);

  // Handle window drag & drop
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
      setActiveMood('curious');
      setTipMessage('Ooh, what do we have here? Drop it right in!');
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set false if left window
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDragOver(false);
        setActiveMood('idle');
        setTipMessage('Drop files or a folder anywhere onto me!');
      }
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!e.dataTransfer || !e.dataTransfer.items || e.dataTransfer.items.length === 0) {
        setActiveMood('idle');
        return;
      }

      setActiveMood('munching');
      playSound('drop');
      setIsScanning(true);

      try {
        const scanned = await scanDroppedItems(e.dataTransfer.items, (p) => {
          setIsScanning(true, p);
        });
        if (scanned.length > 0) {
          addFiles(scanned);
          playSound('cheer');
          setActiveMood('cheer');
          setTipMessage(`Yum! Added ${scanned.length} items to the box.`);
          setTimeout(() => setActiveMood('idle'), 1800);
        } else {
          setActiveMood('idle');
        }
      } catch (err) {
        console.error('Drop scan error:', err);
        setActiveMood('oops');
        setTipMessage('Could not read those files. Try selecting them with Choose files.');
      } finally {
        setIsScanning(false, null);
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [addFiles, setIsScanning]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsScanning(true);
    setActiveMood('munching');
    playSound('drop');

    try {
      const scanned = await scanFileList(e.target.files, (p) => {
        setIsScanning(true, p);
      });
      if (scanned.length > 0) {
        addFiles(scanned);
        playSound('cheer');
        setActiveMood('cheer');
        setTipMessage(`Great! Packed in ${scanned.length} files.`);
        setTimeout(() => setActiveMood('idle'), 1800);
      }
    } catch (err) {
      console.error('File scan error:', err);
      setActiveMood('oops');
    } finally {
      setIsScanning(false, null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (preset: PresetType) => {
    loadPreset(preset);
    setShowExamples(false);
    playSound('pop');
    setActiveMood('cheer');
    setTipMessage('Loaded example! Now let us pick how much room we have.');
    setTimeout(() => setActiveMood('idle'), 1800);
  };

  const handleProceed = () => {
    playSound('click');
    setScene('room');
    window.location.hash = '#/room';
  };

  return (
    <div
      className="scene-container"
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-xl) var(--space-lg)',
        position: 'relative',
        maxWidth: 1280,
        margin: '0 auto',
      }}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFilesSelected}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: '', directory: '' } as any)}
        style={{ display: 'none' }}
        onChange={handleFilesSelected}
      />

      {/* Hero Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-2xl)',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Headline & Primary Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div>
            <h1
              style={{
                fontSize: 'var(--text-hero)',
                color: 'var(--ink)',
                lineHeight: 1.1,
                marginBottom: 'var(--space-sm)',
              }}
            >
              Fit the right files into the space you have.
            </h1>
            <p
              style={{
                fontSize: 'var(--text-lg)',
                color: 'var(--color-ink-2)',
                fontWeight: 600,
              }}
            >
              Nothing leaves your device.
            </p>
          </div>

          {/* Live File Counter Badge */}
          {totalFiles > 0 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springs.bouncy}
              className="sticker-card"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                background: 'var(--card)',
                border: '2.5px solid var(--ink)',
                boxShadow: '4px 4px 0 var(--ink)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-md) var(--space-lg)',
                width: 'fit-content',
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: 'var(--kept)',
                  boxShadow: '0 0 0 3px var(--paper)',
                }}
              />
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }} className="mono">
                {totalFiles} {totalFiles === 1 ? 'file' : 'files'}, {formatBytes(totalSizeBytes)}
              </span>
            </motion.div>
          ) : (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
              Drop files anywhere on the screen, or use the buttons below.
            </p>
          )}

          {/* Next Button: "Pick your space" with a bounce once files exist */}
          <AnimatePresence>
            {totalFiles > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={springs.bouncy}
              >
                <motion.button
                  className="sticker-button sticker-button-primary"
                  onClick={handleProceed}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    fontSize: 'var(--text-lg)',
                    padding: 'var(--space-md) var(--space-xl)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                  }}
                >
                  <span>Pick your space</span>
                  <ArrowRight size={22} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Lunchbox Illustration & Input Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-xl)',
          }}
        >
          {/* Lunchbox visual */}
          <LunchboxIllustration
            isDraggingOver={isDragOver}
            files={files}
            scale={1}
          />

          {/* Action Buttons under the box */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 'var(--space-md)',
            }}
          >
            <motion.button
              className="sticker-button sticker-button-surface"
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
            >
              <Upload size={18} />
              <span>Choose files</span>
            </motion.button>

            <motion.button
              className="sticker-button sticker-button-surface"
              onClick={() => folderInputRef.current?.click()}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
            >
              <FolderOpen size={18} />
              <span>Choose folder</span>
            </motion.button>

            <motion.button
              className="sticker-button"
              onClick={() => setShowExamples(!showExamples)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                background: 'var(--highlight)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
              }}
            >
              <Sparkles size={18} />
              <span>Try an example</span>
            </motion.button>
          </div>

          {/* Preset Sticker Cards Picker */}
          <AnimatePresence>
            {showExamples && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={springs.snappy}
                className="sticker-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 'var(--space-sm)',
                  width: '100%',
                  maxWidth: 440,
                  padding: 'var(--space-md)',
                  background: 'var(--card)',
                }}
              >
                <motion.button
                  className="sticker-chip"
                  onClick={() => handleSelectPreset('student')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: 'var(--space-sm)',
                    flexDirection: 'column',
                    height: 'auto',
                    gap: 6,
                    background: 'var(--paper)',
                  }}
                >
                  <Laptop size={20} color="var(--ink)" />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800 }}>Student laptop</span>
                  <span style={{ fontSize: 11, color: 'var(--color-ink-2)' }}>14 files · 15 GB</span>
                </motion.button>

                <motion.button
                  className="sticker-chip"
                  onClick={() => handleSelectPreset('photographer')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: 'var(--space-sm)',
                    flexDirection: 'column',
                    height: 'auto',
                    gap: 6,
                    background: 'var(--paper)',
                  }}
                >
                  <Camera size={20} color="var(--moved)" />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800 }}>Photographer</span>
                  <span style={{ fontSize: 11, color: 'var(--color-ink-2)' }}>15 files · 24 GB</span>
                </motion.button>

                <motion.button
                  className="sticker-chip"
                  onClick={() => handleSelectPreset('company')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: 'var(--space-sm)',
                    flexDirection: 'column',
                    height: 'auto',
                    gap: 6,
                    background: 'var(--paper)',
                  }}
                >
                  <Building2 size={20} color="var(--kept)" />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800 }}>Small office</span>
                  <span style={{ fontSize: 11, color: 'var(--color-ink-2)' }}>13 files · 40 GB</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Streaming Progress Bar */}
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticker-card"
              style={{
                width: '100%',
                maxWidth: 400,
                padding: 'var(--space-sm) var(--space-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                background: 'var(--card)',
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid var(--ink)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                Looking through your folder... {scanProgress?.count ?? 0} files
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Boxy mascot bottom-left */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 100,
        }}
      >
        <Boxy
          mood={activeMood}
          tip={tipMessage}
          showTips={showTips}
          onHideTips={() => setShowTips(false)}
        />
      </div>
    </div>
  );
};
export default DropScene;
