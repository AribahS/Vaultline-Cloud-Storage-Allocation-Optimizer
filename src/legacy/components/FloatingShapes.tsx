/**
 * Slow-floating background shapes in candy colours.
 * Uses CSS transforms only, no JS animation loops.
 */
import React from 'react';

const shapes = [
  { type: 'circle', color: 'var(--ink)', size: 80, top: '10%', left: '5%', delay: '0s', duration: '18s' },
  { type: 'square', color: 'var(--kept)', size: 60, top: '70%', left: '85%', delay: '2s', duration: '22s' },
  { type: 'triangle', color: 'var(--highlight)', size: 50, top: '30%', left: '90%', delay: '4s', duration: '20s' },
  { type: 'circle', color: 'var(--moved)', size: 45, top: '80%', left: '15%', delay: '6s', duration: '25s' },
  { type: 'square', color: 'var(--paper)', size: 70, top: '15%', left: '75%', delay: '1s', duration: '19s' },
  { type: 'triangle', color: 'var(--highlight)', size: 55, top: '55%', left: '40%', delay: '3s', duration: '23s' },
  { type: 'circle', color: 'var(--color-file-other)', size: 35, top: '45%', left: '60%', delay: '5s', duration: '21s' },
];

function ShapeEl({ type, color, size }: { type: string; color: string; size: number }) {
  if (type === 'circle') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
        }}
      />
    );
  }
  if (type === 'square') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.2,
          background: color,
          transform: 'rotate(15deg)',
        }}
      />
    );
  }
  // triangle
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`,
      }}
    />
  );
}

export const FloatingShapes: React.FC = () => {
  return (
    <div className="floating-shapes" aria-hidden="true">
      {shapes.map((s, i) => (
        <div
          key={i}
          className="floating-shape"
          style={{
            top: s.top,
            left: s.left,
            animation: `float-${(i % 3) + 1} ${s.duration} ${s.delay} ease-in-out infinite`,
          }}
        >
          <ShapeEl type={s.type} color={s.color} size={s.size} />
        </div>
      ))}
    </div>
  );
};

export default FloatingShapes;
