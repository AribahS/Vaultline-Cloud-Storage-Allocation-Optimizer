import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hierarchy, treemap as d3Treemap } from 'd3-hierarchy';
import { FileMetadata, KnapsackResult } from '../../engine/types';
import { formatBytes } from '../../engine/normalizer';
import { CategoryIcon } from '../common/CategoryIcon';

interface VaultTreemapProps {
  files: FileMetadata[];
  result: KnapsackResult | null;
  quotaBytes: number;
}

interface TileData {
  id: string;
  name: string;
  size: number;
  priority: number;
  category: any;
  isKept: boolean;
  isPinned: boolean;
  isExcluded: boolean;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  reason: string;
}

export const VaultTreemap: React.FC<VaultTreemapProps> = ({
  files,
  result,
  quotaBytes,
}) => {
  const [hoveredTile, setHoveredTile] = useState<TileData | null>(null);

  const activeFiles = useMemo(() => files.filter((f) => !f.isExcluded), [files]);

  const keptIdSet = useMemo(() => {
    if (!result) return new Set<string>();
    return new Set(result.keptItems.map((i) => i.id));
  }, [result]);

  // Compute treemap layout using d3-hierarchy
  const tiles: TileData[] = useMemo(() => {
    if (activeFiles.length === 0) return [];

    const rootData = {
      name: 'root',
      children: activeFiles.map((file) => ({
        ...file,
        value: Math.max(1, file.size),
      })),
    };

    const root = hierarchy(rootData)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const width = 600;
    const height = 360;

    const layout = d3Treemap<any>()
      .size([width, height])
      .paddingInner(3)
      .round(true);

    layout(root);

    return (root.leaves() as any[]).map((leaf) => {
      const file: FileMetadata = leaf.data;
      const isKept = keptIdSet.has(file.id);

      // Generate reason for decision
      let reason = '';
      if (file.isPinned) {
        reason = 'Kept: Manually pinned as non-negotiable';
      } else if (isKept) {
        const ratio = (file.priority / (file.size / (1024 * 1024 * 1024))).toFixed(1);
        reason = `Kept in quota: High priority efficiency (~${ratio} pts/GB)`;
      } else {
        const pctOfQuota = Math.round((file.size / Math.max(1, quotaBytes)) * 100);
        reason = `Excluded: Would consume ${pctOfQuota}% of quota for lower priority`;
      }

      return {
        id: file.id,
        name: file.name,
        size: file.size,
        priority: file.priority,
        category: file.category,
        isKept,
        isPinned: file.isPinned,
        isExcluded: file.isExcluded,
        x0: leaf.x0,
        y0: leaf.y0,
        x1: leaf.x1,
        y1: leaf.y1,
        reason,
      };
    });
  }, [activeFiles, keptIdSet, quotaBytes]);

  if (activeFiles.length === 0) {
    return (
      <div
        style={{
          height: '360px',
          border: '2px dashed var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-dim)',
          gap: '8px',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <p>No active files selected to optimize</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Vault Boundary Frame */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '600 / 360',
          backgroundColor: 'var(--color-bg-base)',
          border: '2px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        <svg
          viewBox="0 0 600 360"
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Striped pattern for dropped files (non-color cue) */}
            <pattern id="dropped-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2.5" />
            </pattern>
          </defs>

          {tiles.map((tile) => {
            const w = Math.max(0, tile.x1 - tile.x0);
            const h = Math.max(0, tile.y1 - tile.y0);

            const fillColor = tile.isKept
              ? 'var(--color-accent-lime)'
              : 'var(--color-bg-elevated)';

            const fillOpacity = tile.isKept ? 0.85 : 0.6;
            const strokeColor = tile.isKept
              ? '#10b981'
              : 'rgba(255, 255, 255, 0.1)';

            return (
              <g
                key={tile.id}
                onMouseEnter={() => setHoveredTile(tile)}
                onMouseLeave={() => setHoveredTile(null)}
                style={{ cursor: 'pointer' }}
              >
                <motion.rect
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1, x: tile.x0, y: tile.y0, width: w, height: h }}
                  transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                  rx={4}
                  fill={fillColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={tile.isKept ? 1.5 : 1}
                />

                {/* Overlaid hatch pattern if dropped */}
                {!tile.isKept && (
                  <rect
                    x={tile.x0}
                    y={tile.y0}
                    width={w}
                    height={h}
                    rx={4}
                    fill="url(#dropped-hatch)"
                    pointerEvents="none"
                  />
                )}

                {/* Text Labels inside tiles if big enough */}
                {w > 40 && h > 28 && (
                  <text
                    x={tile.x0 + 6}
                    y={tile.y0 + 16}
                    fill={tile.isKept ? '#032014' : 'var(--color-text-muted)'}
                    fontSize={Math.min(11, Math.max(9, w / 8))}
                    fontWeight={600}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {tile.name.length > Math.floor(w / 7)
                      ? tile.name.slice(0, Math.floor(w / 7) - 1) + '…'
                      : tile.name}
                  </text>
                )}

                {w > 50 && h > 42 && (
                  <text
                    x={tile.x0 + 6}
                    y={tile.y0 + 30}
                    fill={tile.isKept ? '#05472a' : 'var(--color-text-dim)'}
                    fontSize="9.5"
                    className="font-mono"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {formatBytes(tile.size)} • P{tile.priority}
                  </text>
                )}

                {/* Pinned star badge indicator */}
                {tile.isPinned && w > 20 && h > 20 && (
                  <circle
                    cx={tile.x1 - 10}
                    cy={tile.y0 + 10}
                    r="4"
                    fill="var(--color-amber)"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Card */}
        <AnimatePresence>
          {hoveredTile && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                boxShadow: 'var(--shadow-elevation)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 20,
                pointerEvents: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CategoryIcon category={hoveredTile.category} size={18} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-main)' }}>
                    {hoveredTile.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {hoveredTile.reason}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div>
                  <div className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>
                    {formatBytes(hoveredTile.size)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
                    Priority: {hoveredTile.priority}/10
                  </div>
                </div>
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    backgroundColor: hoveredTile.isKept
                      ? 'var(--color-accent-lime-surface)'
                      : 'var(--color-slate-surface)',
                    color: hoveredTile.isKept
                      ? 'var(--color-accent-lime)'
                      : 'var(--color-text-muted)',
                    border: `1px solid ${hoveredTile.isKept ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  {hoveredTile.isKept ? 'Kept in Quota' : 'Dropped / Archive'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend below treemap */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--color-accent-lime)' }} />
            <span style={{ color: 'var(--color-text-main)' }}>Kept in Paid Storage</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 2px, transparent 2px, transparent 4px)',
              }}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>Move to Archive (Hatched)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-amber)' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>Pinned File</span>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
          Area proportional to file size
        </div>
      </div>
    </div>
  );
};

