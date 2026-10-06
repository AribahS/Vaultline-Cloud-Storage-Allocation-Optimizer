/**
 * SCENE 2: ROOM (#/room)
 * Title: "Where do these need to fit?"
 * 5 chunky sticker cards: Phone (32 GB), Pen drive (16 GB), Google account (15 GB), Email (25 MB), Custom.
 * Box on the right stretches/shrinks with size, ticking numbers.
 * Reacting sentence: "Your files add up to X. You have Y, so a little has to go." vs "Everything fits with room to spare."
 * Optional "Add another place" dashed button.
 * Next: "What matters most?"
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  HardDrive,
  Cloud,
  Mail,
  Sliders,
  Plus,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useFlowStore } from '../store/useFlowStore';
import { Boxy, BoxyMood } from '../components/Boxy';
import { springs } from '../motion';
import { formatBytes } from '../utils/fileHelpers';
import { playSound } from '../utils/sound';
import { BYTE_UNITS } from '../../engine/normalizer';

interface TargetOption {
  id: string;
  name: string;
  sizeBytes: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

const PRESET_TARGETS: TargetOption[] = [
  { id: 'phone', name: 'Phone', sizeBytes: 32 * BYTE_UNITS.GB, icon: Smartphone, color: 'var(--grape)' },
  { id: 'pendrive', name: 'Pen drive', sizeBytes: 16 * BYTE_UNITS.GB, icon: HardDrive, color: 'var(--mint)' },
  { id: 'google', name: 'Google account', sizeBytes: 15 * BYTE_UNITS.GB, icon: Cloud, color: 'var(--sky)' },
  { id: 'email', name: 'Email', sizeBytes: 25 * BYTE_UNITS.MB, icon: Mail, color: 'var(--tangerine)' },
  { id: 'custom', name: 'Custom', sizeBytes: 10 * BYTE_UNITS.GB, icon: Sliders, color: 'var(--lemon)' },
];

export const RoomScene: React.FC = () => {
  const { files, quotaBytes, setQuotaBytes, places, addPlace, removePlace } = useAppStore();
  const {
    setScene,
    selectedTarget,
    setSelectedTarget,
    setRoomPicked,
    showTips,
    setShowTips,
  } = useFlowStore();

  const [activeTargetId, setActiveTargetId] = useState<string>(selectedTarget || 'google');
  const [customValue, setCustomValue] = useState<number>(10);
  const [customUnit, setCustomUnit] = useState<'MB' | 'GB' | 'TB'>('GB');

  // Compute total files size
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);

  // Set initial quota if not yet configured
  useEffect(() => {
    if (!selectedTarget) {
      setSelectedTarget('google');
      setQuotaBytes(15 * BYTE_UNITS.GB);
    }
    setRoomPicked(true);
  }, [selectedTarget, setSelectedTarget, setQuotaBytes, setRoomPicked]);

  const handleSelectTarget = (target: TargetOption) => {
    setActiveTargetId(target.id);
    setSelectedTarget(target.id);
    playSound('pop');

    if (target.id !== 'custom') {
      setQuotaBytes(target.sizeBytes);
    } else {
      const multiplier =
        customUnit === 'MB'
          ? BYTE_UNITS.MB
          : customUnit === 'TB'
          ? BYTE_UNITS.TB
          : BYTE_UNITS.GB;
      setQuotaBytes(customValue * multiplier);
    }
  };

  const handleCustomValueChange = (val: number) => {
    const safeVal = Math.max(1, isNaN(val) ? 1 : val);
    setCustomValue(safeVal);
    const multiplier =
      customUnit === 'MB'
        ? BYTE_UNITS.MB
        : customUnit === 'TB'
        ? BYTE_UNITS.TB
        : BYTE_UNITS.GB;
    setQuotaBytes(safeVal * multiplier);
  };

  const handleCustomUnitChange = (unit: 'MB' | 'GB' | 'TB') => {
    setCustomUnit(unit);
    const multiplier =
      unit === 'MB' ? BYTE_UNITS.MB : unit === 'TB' ? BYTE_UNITS.TB : BYTE_UNITS.GB;
    setQuotaBytes(customValue * multiplier);
    playSound('pop');
  };

  // Determine state of fit
  const isOverQuota = totalSizeBytes > quotaBytes;
  const isClose = totalSizeBytes > 0 && quotaBytes > 0 && totalSizeBytes / quotaBytes >= 0.85;

  const boxyMood: BoxyMood = isOverQuota
    ? 'squished'
    : isClose
    ? 'curious'
    : 'cheer';

  const tipSentence = isOverQuota
    ? `Your files add up to ${formatBytes(totalSizeBytes)}. You have ${formatBytes(
        quotaBytes
      )}, so a little has to go.`
    : `Everything fits with room to spare (${formatBytes(quotaBytes - totalSizeBytes)} left).`;

  // Visual scaling of the box width based on relative size
  // Clamped between 260px and 420px
  const baseWidth = 320;
  const scaleRatio =
    totalSizeBytes > 0
      ? Math.max(0.7, Math.min(1.4, quotaBytes / totalSizeBytes))
      : 1;
  const boxWidth = Math.round(baseWidth * scaleRatio);

  const handleAddSecondPlace = () => {
    playSound('pop');
    addPlace({
      id: `place-${Date.now()}`,
      name: 'Backup Drive',
      capacityBytes: 20 * BYTE_UNITS.GB,
      color: '#2FD3A0',
    });
  };

  const handleProceed = () => {
    playSound('click');
    setRoomPicked(true);
    setScene('swipe');
    window.location.hash = '#/swipe';
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
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        <h2
          style={{
            fontSize: 'var(--text-scene-title)',
            color: 'var(--ink)',
            marginBottom: 'var(--space-xs)',
          }}
        >
          Where do these need to fit?
        </h2>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--ink-muted)' }}>
          Pick a destination or enter a custom size.
        </p>
      </div>

      {/* Row of 5 Chunky Sticker Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-2xl)',
        }}
      >
        {PRESET_TARGETS.map((target) => {
          const Icon = target.icon;
          const isSelected = activeTargetId === target.id;
          return (
            <motion.button
              key={target.id}
              className={`sticker-card ${isSelected ? 'active' : ''}`}
              onClick={() => handleSelectTarget(target)}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={springs.snappy}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 'var(--space-sm)',
                cursor: 'pointer',
                background: isSelected ? 'var(--surface)' : 'var(--canvas)',
                borderColor: isSelected ? 'var(--ink)' : 'var(--outline-color)',
                boxShadow: isSelected ? '5px 5px 0 var(--ink)' : '2px 2px 0 var(--ink)',
                borderWidth: isSelected ? '3px' : '2.5px',
                padding: 'var(--space-lg) var(--space-md)',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: target.color,
                  border: '2px solid var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={24} color="#1B1533" />
              </div>
              <span style={{ fontSize: 'var(--text-body)', fontWeight: 800 }}>
                {target.name}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: isSelected ? 'var(--grape)' : 'var(--ink-muted)',
                  fontWeight: 700,
                }}
              >
                {target.id === 'custom' ? 'Any size' : formatBytes(target.sizeBytes)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Size Form Drawer (revealed when Custom is selected) */}
      <AnimatePresence>
        {activeTargetId === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sticker-card"
            style={{
              maxWidth: 540,
              margin: '0 auto var(--space-xl) auto',
              background: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                max="5000"
                value={customValue}
                onChange={(e) => handleCustomValueChange(parseInt(e.target.value) || 1)}
                className="mono"
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-card)',
                  border: '2.5px solid var(--ink)',
                  boxShadow: '3px 3px 0 var(--ink)',
                  width: 140,
                  background: 'var(--canvas)',
                  color: 'var(--ink)',
                }}
              />

              {/* MB / GB / TB chips */}
              <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                {(['MB', 'GB', 'TB'] as const).map((unit) => (
                  <button
                    key={unit}
                    className={`sticker-chip ${customUnit === unit ? 'active' : ''}`}
                    onClick={() => handleCustomUnitChange(unit)}
                    style={{
                      fontWeight: 800,
                      background: customUnit === unit ? 'var(--lemon)' : 'var(--canvas)',
                    }}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="1"
              max="200"
              value={customValue}
              onChange={(e) => handleCustomValueChange(parseInt(e.target.value))}
              style={{
                accentColor: 'var(--grape)',
                cursor: 'pointer',
                height: 8,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Box Illustration and Multi-place preview */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xl)', justifyContent: 'center', alignItems: 'center' }}>
          {/* Main Destination Box */}
          <motion.div
            layout
            animate={{ width: boxWidth }}
            transition={springs.soft}
            className="sticker-card"
            style={{
              height: 180,
              background: 'var(--surface)',
              borderRadius: 22,
              border: '3px solid var(--ink)',
              boxShadow: '6px 6px 0 var(--ink)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 'var(--space-lg)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Box Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                {PRESET_TARGETS.find((t) => t.id === activeTargetId)?.name || 'Box'}
              </span>
              <span className="mono" style={{ fontWeight: 800, color: 'var(--grape)' }}>
                {formatBytes(quotaBytes)}
              </span>
            </div>

            {/* Fill Bar Visual */}
            <div>
              <div
                style={{
                  height: 28,
                  width: '100%',
                  background: 'var(--canvas)',
                  borderRadius: 10,
                  border: '2px solid var(--ink)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{
                    width: `${Math.min(100, (totalSizeBytes / Math.max(1, quotaBytes)) * 100)}%`,
                    backgroundColor: isOverQuota ? 'var(--bubblegum)' : 'var(--mint)',
                  }}
                  transition={springs.snappy}
                  style={{
                    height: '100%',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  color: 'var(--ink-muted)',
                }}
              >
                <span>Files: {formatBytes(totalSizeBytes)}</span>
                <span>Room: {formatBytes(quotaBytes)}</span>
              </div>
            </div>
          </motion.div>

          {/* Secondary Storage Places (Multi-place split) */}
          {places && places.map((place) => (
            <motion.div
              key={place.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="sticker-card"
              style={{
                width: 220,
                height: 180,
                background: 'var(--surface)',
                borderRadius: 22,
                border: '3px solid var(--ink)',
                boxShadow: '6px 6px 0 var(--mint)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--space-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800 }}>{place.name}</span>
                <button
                  onClick={() => removePlace(place.id)}
                  aria-label="Remove storage place"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bubblegum)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <span className="mono" style={{ fontWeight: 800, fontSize: 18, color: 'var(--mint)' }}>
                {formatBytes(place.capacityBytes)}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                Extra destination
              </span>
            </motion.div>
          ))}
        </div>

        {/* ONE reacting sentence below the box */}
        <motion.p
          key={tipSentence}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 800,
            color: isOverQuota ? 'var(--bubblegum)' : 'var(--ink)',
            textAlign: 'center',
            maxWidth: 600,
          }}
        >
          {tipSentence}
        </motion.p>

        {/* "Add another place" small dashed sticker button */}
        {(!places || places.length === 0) && (
          <motion.button
            className="sticker-chip"
            onClick={handleAddSecondPlace}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              borderStyle: 'dashed',
              background: 'transparent',
              fontSize: 'var(--text-xs)',
              gap: 4,
            }}
          >
            <Plus size={14} />
            <span>Add another place</span>
          </motion.button>
        )}
      </div>

      {/* Next Step Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
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
          <span>What matters most?</span>
          <ArrowRight size={22} />
        </motion.button>
      </div>

      {/* Mascot bottom-left */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 100,
        }}
      >
        <Boxy
          mood={boxyMood}
          tip={
            isOverQuota
              ? 'A little tight! We will find the best mix to keep.'
              : 'Plenty of space! Let us make sure your top files get priority.'
          }
          showTips={showTips}
          onHideTips={() => setShowTips(false)}
        />
      </div>
    </div>
  );
};
export default RoomScene;

