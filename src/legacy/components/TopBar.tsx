/**
 * TopBar: slim solid bar with logo, progress trail, theme toggle, and teacher mode toggle.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, GraduationCap, Volume2, VolumeX } from 'lucide-react';
import { useFlowStore, type SceneId } from '../store/useFlowStore';
import { springs } from '../motion';
import { isSoundEnabled, toggleSound, playSound } from '../utils/sound';

const scenes: { id: SceneId; label: string }[] = [
  { id: 'drop', label: 'Drop files' },
  { id: 'room', label: 'Pick space' },
  { id: 'swipe', label: 'Set importance' },
  { id: 'pack', label: 'Pack' },
  { id: 'result', label: 'Result' },
];

function BoxyLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 72 72" fill="none">
      <rect x="4" y="8" width="64" height="56" rx="14" fill="var(--primary)" stroke="var(--outline-color)" strokeWidth="2.5" />
      <line x1="4" y1="28" x2="68" y2="28" stroke="var(--outline-color)" strokeWidth="2" />
      <circle cx="26" cy="19" r="3" fill="var(--surface)" />
      <circle cx="46" cy="19" r="3" fill="var(--surface)" />
      <path d="M30 43 Q36 49 42 43" stroke="var(--surface)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export const TopBar: React.FC = () => {
  const { currentScene, setScene, canNavigate, theme, toggleTheme, teacherMode, toggleTeacherMode } =
    useFlowStore();
  const [soundState, setSoundState] = useState(isSoundEnabled());

  const currentIdx = scenes.findIndex((s) => s.id === currentScene);

  const navigateToScene = (scene: SceneId) => {
    if (canNavigate(scene)) {
      setScene(scene);
      window.location.hash = `#/${scene}`;
    }
  };

  return (
    <header className="top-bar">
      {/* Logo */}
      <a
        href="#/drop"
        className="logo"
        onClick={(e) => {
          e.preventDefault();
          navigateToScene('drop');
        }}
      >
        <BoxyLogo />
        <span>Vaultline</span>
      </a>

      {/* Progress Trail */}
      <nav className="progress-trail" aria-label="Progress">
        {scenes.map((scene, i) => (
          <React.Fragment key={scene.id}>
            {i > 0 && (
              <div
                className={`progress-connector${i <= currentIdx ? ' filled' : ''}`}
              />
            )}
            <motion.button
              className={`progress-dot${
                i < currentIdx ? ' filled' : ''
              }${i === currentIdx ? ' current' : ''}`}
              onClick={() => navigateToScene(scene.id)}
              disabled={!canNavigate(scene.id)}
              aria-label={`Go to ${scene.label}`}
              title={scene.label}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={springs.snappy}
              style={{
                opacity: canNavigate(scene.id) ? 1 : 0.4,
                cursor: canNavigate(scene.id) ? 'pointer' : 'not-allowed',
              }}
            />
          </React.Fragment>
        ))}
      </nav>

      {/* Controls */}
      <div className="controls">
        {/* Teacher mode */}
        <button
          className={`sticker-chip${teacherMode ? ' active' : ''}`}
          onClick={toggleTeacherMode}
          title="Shows how the packing works behind the scenes"
          aria-pressed={teacherMode}
        >
          <GraduationCap size={16} />
          <span style={{ fontSize: 'var(--text-xs)' }}>Teacher mode</span>
        </button>

        {/* Sound toggle */}
        <button
          className="sticker-chip"
          onClick={() => {
            const next = toggleSound();
            setSoundState(next);
            if (next) playSound('pop');
          }}
          aria-label={soundState ? 'Disable sounds' : 'Enable sounds'}
          title={soundState ? 'Mute sound effects' : 'Enable sound effects'}
        >
          {soundState ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Theme toggle */}
        <button
          className="sticker-chip"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
