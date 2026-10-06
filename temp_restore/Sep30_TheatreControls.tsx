import React, { useEffect } from 'react';

interface TheatreControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSkipToEnd: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  fillRowByRow: boolean;
  onToggleFillRowByRow: () => void;
  currentStepIndex: number;
  totalSteps: number;
}

export const TheatreControls: React.FC<TheatreControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
  onSkipToEnd,
  speed,
  onSpeedChange,
  fillRowByRow,
  onToggleFillRowByRow,
  currentStepIndex,
  totalSteps,
}) => {
  // Keyboard navigation: Space = play/pause, ArrowRight = step forward, ArrowLeft = step backward
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onStepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onStepBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onStepForward, onStepBackward]);

  const progressPercent = totalSteps > 0 ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) : 0;

  return (
    <div
      className="card"
      style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
      }}
    >
      {/* Primary Playback Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onReset}
          title="Reset to beginning"
          aria-label="Reset execution to beginning"
          className="btn btn-secondary btn-sm"
        >
          Reset
        </button>

        <button
          onClick={onStepBackward}
          disabled={currentStepIndex <= 0}
          title="Step backward (Left Arrow)"
          aria-label="Step backward one cell"
          className="btn btn-secondary btn-sm"
          style={{ opacity: currentStepIndex <= 0 ? 0.45 : 1 }}
        >
          ◀ Step Back
        </button>

        <button
          onClick={onTogglePlay}
          title="Play / Pause (Spacebar)"
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          className={isPlaying ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
          style={{
            minWidth: '85px',
            boxShadow: isPlaying ? 'none' : 'var(--shadow-glow-primary)',
          }}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={onStepForward}
          disabled={currentStepIndex >= totalSteps - 1}
          title="Step forward (Right Arrow)"
          aria-label="Step forward one cell"
          className="btn btn-secondary btn-sm"
          style={{ opacity: currentStepIndex >= totalSteps - 1 ? 0.45 : 1 }}
        >
          Step Next ▶
        </button>

        <button
          onClick={onSkipToEnd}
          title="Skip to tracebacked end"
          aria-label="Skip to final traceback"
          className="btn btn-ghost btn-sm"
        >
          Skip to End ⏭
        </button>
      </div>

      {/* Speed & Mode Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>Speed:</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            style={{ padding: '3px 8px', fontSize: 'var(--text-xs)' }}
            aria-label="Animation playback speed"
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="2">2.0x</option>
            <option value="4">4.0x</option>
          </select>
        </div>

        {/* Fill row-by-row toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-muted)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={fillRowByRow}
            onChange={onToggleFillRowByRow}
            style={{ accentColor: 'var(--color-primary)' }}
          />
          Row-by-Row Mode
        </label>

        {/* Step indicator */}
        <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
          Step {currentStepIndex + 1} / {totalSteps} ({progressPercent}%)
        </div>
      </div>
    </div>
  );
};

