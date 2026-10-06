/**
 * LunchboxIllustration: Big bento-box with three compartments and an animated lid.
 * Supports drag-over open lid, mint glow, and mini preview tiles inside compartments.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { springs } from '../motion';
import { CATEGORY_STYLES, getFileCategory } from '../utils/fileHelpers';
import { FileMetadata } from '../../engine/types';

interface LunchboxProps {
  isDraggingOver?: boolean;
  files?: FileMetadata[];
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const LunchboxIllustration: React.FC<LunchboxProps> = ({
  isDraggingOver = false,
  files = [],
  scale = 1,
  className = '',
  style = {},
}) => {
  const sampleItems = files.slice(0, 12);
  const leftItems = sampleItems.filter((_, i) => i % 3 === 0);
  const topItems = sampleItems.filter((_, i) => i % 3 === 1);
  const botItems = sampleItems.filter((_, i) => i % 3 === 2);

  return (
    <div
      className={`lunchbox-container ${className}`}
      style={{
        position: 'relative',
        width: 380 * scale,
        height: 290 * scale,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* Bobbing Box Wrapper */}
      <motion.div
        animate={isDraggingOver ? { scale: 1.04, y: -6 } : { y: [0, -6, 0] }}
        transition={
          isDraggingOver
            ? springs.bouncy
            : { repeat: Infinity, duration: 4, ease: 'easeInOut' }
        }
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Open Lid (Above the box) */}
        <motion.div
          animate={
            isDraggingOver
              ? { rotate: -22, y: -18, scale: 1.05 }
              : { rotate: -12, y: -8 }
          }
          transition={springs.bouncy}
          style={{
            position: 'absolute',
            top: 2,
            left: 20 * scale,
            width: 320 * scale,
            height: 48 * scale,
            borderRadius: 14 * scale,
            background: 'var(--grape)',
            border: '2.5px solid var(--ink)',
            boxShadow: '4px 4px 0 var(--ink)',
            transformOrigin: 'top left',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 20 * scale,
          }}
        >
          {/* Lid handle */}
          <div
            style={{
              width: 60 * scale,
              height: 12 * scale,
              borderRadius: 999,
              background: 'var(--lemon)',
              border: '2px solid var(--ink)',
            }}
          />
        </motion.div>

        {/* Bento Main Body */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 240 * scale,
            background: 'var(--surface)',
            borderRadius: 22 * scale,
            border: '2.5px solid var(--ink)',
            boxShadow: isDraggingOver
              ? '6px 6px 0 var(--mint)'
              : '4px 4px 0 var(--ink)',
            padding: 16 * scale,
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 12 * scale,
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
            zIndex: 2,
          }}
        >
          {/* Left Large Compartment */}
          <div
            style={{
              background: isDraggingOver ? 'var(--mint-light)' : 'var(--canvas)',
              borderRadius: 14 * scale,
              border: `2px ${isDraggingOver ? 'solid var(--mint)' : 'dashed var(--outline-color)'}`,
              padding: 10 * scale,
              overflow: 'hidden',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6 * scale,
              alignContent: 'flex-start',
              transition: 'background-color 0.2s ease, border-color 0.2s ease',
            }}
          >
            {leftItems.map((f, i) => {
              const cat = getFileCategory(f.name, f.mimeType);
              const style = CATEGORY_STYLES[cat];
              const Icon = style.icon;
              return (
                <motion.div
                  key={f.id || i}
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ ...springs.bouncy, delay: i * 0.05 }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 8 * scale,
                    background: style.colorVar,
                    border: '1.5px solid var(--ink)',
                    fontSize: 11 * scale,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    maxWidth: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={f.name}
                >
                  <Icon size={12} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.name}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Right Two Stacked Compartments */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: '1fr 1fr',
              gap: 12 * scale,
            }}
          >
            {/* Top Compartment */}
            <div
              style={{
                background: isDraggingOver ? 'var(--mint-light)' : 'var(--canvas)',
                borderRadius: 14 * scale,
                border: `2px ${isDraggingOver ? 'solid var(--mint)' : 'dashed var(--outline-color)'}`,
                padding: 8 * scale,
                overflow: 'hidden',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6 * scale,
                alignContent: 'flex-start',
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
              }}
            >
              {topItems.map((f, i) => {
                const cat = getFileCategory(f.name, f.mimeType);
                const style = CATEGORY_STYLES[cat];
                const Icon = style.icon;
                return (
                  <motion.div
                    key={f.id || i}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ ...springs.bouncy, delay: (i + 1) * 0.05 }}
                    style={{
                      padding: '3px 6px',
                      borderRadius: 6 * scale,
                      background: style.colorVar,
                      border: '1.5px solid var(--ink)',
                      fontSize: 10 * scale,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      maxWidth: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={f.name}
                  >
                    <Icon size={10} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Compartment */}
            <div
              style={{
                background: isDraggingOver ? 'var(--mint-light)' : 'var(--canvas)',
                borderRadius: 14 * scale,
                border: `2px ${isDraggingOver ? 'solid var(--mint)' : 'dashed var(--outline-color)'}`,
                padding: 8 * scale,
                overflow: 'hidden',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6 * scale,
                alignContent: 'flex-start',
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
              }}
            >
              {botItems.map((f, i) => {
                const cat = getFileCategory(f.name, f.mimeType);
                const style = CATEGORY_STYLES[cat];
                const Icon = style.icon;
                return (
                  <motion.div
                    key={f.id || i}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ ...springs.bouncy, delay: (i + 2) * 0.05 }}
                    style={{
                      padding: '3px 6px',
                      borderRadius: 6 * scale,
                      background: style.colorVar,
                      border: '1.5px solid var(--ink)',
                      fontSize: 10 * scale,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      maxWidth: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={f.name}
                  >
                    <Icon size={10} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default LunchboxIllustration;

