import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hierarchy, treemap as d3Treemap } from 'd3-hierarchy';
import { useAppStore } from '../../store/useAppStore';
import { FileMetadata } from '../../engine/types';
import { formatBytes } from '../../engine/normalizer';
import { getCategoryColor, getCategoryLabel } from '../../engine/categoryMeta';
import { CategoryIcon } from '../common/CategoryIcon';

interface BentoTile {
  id: string;
  name: string;
  path: string;
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

export const BentoBoxHero: React.FC = () => {
  const {
    files,
    quotaBytes,
    knapsackResult,
    packingMode,
    setPackingMode,
    manualKeptIds,
    toggleManualKept,
    triggerRecompute,
  } = useAppStore();

  const [hoveredTile, setHoveredTile] = useState<BentoTile | null>(null);
  const [selectedTile, setSelectedTile] = useState<BentoTile | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const activeFiles = useMemo(() => files.filter((f) => !f.isExcluded), [files]);

  // Determine which files are kept based on mode
  const keptIdSet = useMemo(() => {
    if (packingMode === 'manual') {
      return new Set(manualKeptIds);
    }
    if (!knapsackResult) return new Set<string>();
    return new Set(knapsackResult.keptItems.map((i) => i.id));
  }, [packingMode, manualKeptIds, knapsackResult]);

  // Partition into Box (Kept) files and Shelf (Moved) files
  const { boxFiles, shelfFiles } = useMemo(() => {
    const box: FileMetadata[] = [];
    const shelf: FileMetadata[] = [];
    for (const f of activeFiles) {
      if (keptIdSet.has(f.id)) {
        box.push(f);
      } else {
        shelf.push(f);
      }
    }
    return { boxFiles: box, shelfFiles: shelf };
  }, [activeFiles, keptIdSet]);

  const boxBytes = useMemo(() => boxFiles.reduce((acc, f) => acc + f.size, 0), [boxFiles]);
  const shelfBytes = useMemo(() => shelfFiles.reduce((acc, f) => acc + f.size, 0), [shelfFiles]);
  const boxImportance = useMemo(() => boxFiles.reduce((acc, f) => acc + f.priority, 0), [boxFiles]);
  const maxPossibleImportance = knapsackResult?.totalValue || 1;

  const isOverFilled = boxBytes > quotaBytes;
  const fillPercentage = Math.min(100, Math.round((boxBytes / Math.max(1, quotaBytes)) * 100));

  // Compute treemap layout for files in the box
  const tiles: BentoTile[] = useMemo(() => {
    if (boxFiles.length === 0) return [];

    const rootData = {
      name: 'root',
      children: boxFiles.map((file) => ({
        ...file,
        value: Math.max(1, file.size),
      })),
    };

    const root = hierarchy(rootData)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const width = 560;
    const height = 340;

    const layout = d3Treemap<any>()
      .size([width, height])
      .paddingInner(4)
      .round(true);

    layout(root);

    return (root.leaves() as any[]).map((leaf) => {
      const file: FileMetadata = leaf.data;
      let reason = '';
      if (file.isPinned) {
        reason = 'Kept: marked as Always keep.';
      } else {
        const ratio = (file.priority / Math.max(1, file.size / (1024 * 1024 * 1024))).toFixed(1);
        reason = `Kept: high importance for its size (~${ratio} pts/GB).`;
      }

      return {
        id: file.id,
        name: file.name,
        path: file.path,
        size: file.size,
        priority: file.priority,
        category: file.category,
        isKept: true,
        isPinned: file.isPinned,
        isExcluded: file.isExcluded,
        x0: leaf.x0,
        y0: leaf.y0,
        x1: leaf.x1,
        y1: leaf.y1,
        reason,
      };
    });
  }, [boxFiles, quotaBytes]);

  // Celebratory banner when >= 95% full and not overfilled
  const isOptimalFull = !isOverFilled && fillPercentage >= 95 && activeFiles.every((f) => !f.isPinned || keptIdSet.has(f.id));

  const handleTileClick = (fileId: string) => {
    if (packingMode === 'manual') {
      toggleManualKept(fileId);
    } else {
      const tile = tiles.find((t) => t.id === fileId);
      if (tile) setSelectedTile(tile);
    }
  };

  const handleRevealPlan = () => {
    setShowComparisonModal(true);
  };

  const applyOptimalPlan = () => {
    setPackingMode('auto');
    setShowComparisonModal(false);
  };

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header bar: Plain words summary + Mode Switch */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🍱</span>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-ink)' }}>
              The Bento Box
            </h2>
            {isOptimalFull && (
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--color-keep-surface)',
                  color: 'var(--color-keep)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>✨</span> Snug {fillPercentage}% packed!
              </span>
            )}
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', marginTop: '2px' }}>
            Keep <strong>{boxFiles.length} files</strong> ({formatBytes(boxBytes)} of {formatBytes(quotaBytes)}). Move <strong>{shelfFiles.length} files</strong> ({formatBytes(shelfBytes)}).
          </p>
        </div>

        {/* Mode Switch: Let Vaultline pack vs Pack it yourself */}
        <div className="segmented-control">
          <button
            className={packingMode === 'auto' ? 'active' : ''}
            onClick={() => setPackingMode('auto')}
          >
            Let Vaultline pack
          </button>
          <button
            className={packingMode === 'manual' ? 'active' : ''}
            onClick={() => setPackingMode('manual')}
          >
            Pack it yourself
          </button>
        </div>
      </div>

      {/* Manual Packing Header Score & Fill Bar */}
      {packingMode === 'manual' && (
        <div
          className="card-sunken"
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
              Tap files in the box or on the shelf to move them:
            </span>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: isOverFilled ? 'var(--color-danger)' : 'var(--color-ink)' }}>
              Your importance: {boxImportance} of best possible {maxPossibleImportance}
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '8px' }}>
                ({Math.round((boxImportance / Math.max(1, maxPossibleImportance)) * 100)}% score)
              </span>
            </div>
          </div>

          <button
            onClick={handleRevealPlan}
            className="btn btn-primary btn-sm"
          >
            Reveal Vaultline's plan →
          </button>
        </div>
      )}

      {/* Main Container: Bento Box (Left) + Move Shelf (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(240px, 1fr)', gap: '16px' }}>
        {/* LEFT: Bento Box Treemap */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-sunken)',
            borderRadius: 'var(--radius-lg)',
            border: isOverFilled ? '2px solid var(--color-danger)' : '2px solid var(--color-border)',
            padding: '12px',
            position: 'relative',
            minHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {boxFiles.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-dim)', gap: '8px' }}>
              <span style={{ fontSize: '32px' }}>🍱</span>
              <p style={{ fontSize: 'var(--text-sm)' }}>The box is empty. Tap files from the shelf to pack.</p>
            </div>
          ) : (
            <svg viewBox="0 0 560 340" style={{ width: '100%', height: '100%', display: 'block', overflow: 'hidden' }}>
              {tiles.map((tile) => {
                const w = Math.max(0, tile.x1 - tile.x0);
                const h = Math.max(0, tile.y1 - tile.y0);
                const color = getCategoryColor(tile.category);

                return (
                  <g
                    key={tile.id}
                    onClick={() => handleTileClick(tile.id)}
                    onMouseEnter={() => setHoveredTile(tile)}
                    onMouseLeave={() => setHoveredTile(null)}
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Kept file: ${tile.name}, ${formatBytes(tile.size)}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTileClick(tile.id);
                      }
                    }}
                  >
                    <motion.rect
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1, x: tile.x0, y: tile.y0, width: w, height: h }}
                      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                      rx={8}
                      fill={color}
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                      style={{ filter: 'drop-shadow(0 2px 6px rgba(20, 17, 43, 0.12))' }}
                    />

                    {/* Check icon badge */}
                    {w > 26 && h > 26 && (
                      <circle
                        cx={tile.x0 + 14}
                        cy={tile.y0 + 14}
                        r="6"
                        fill="rgba(255, 255, 255, 0.3)"
                      />
                    )}
                    {w > 26 && h > 26 && (
                      <text
                        x={tile.x0 + 14}
                        y={tile.y0 + 17}
                        fill="#FFFFFF"
                        fontSize="9"
                        fontWeight={700}
                        textAnchor="middle"
                        style={{ pointerEvents: 'none' }}
                      >
                        ✓
                      </text>
                    )}

                    {/* Pinned badge */}
                    {tile.isPinned && w > 48 && h > 24 && (
                      <rect
                        x={tile.x1 - 22}
                        y={tile.y0 + 6}
                        width="16"
                        height="16"
                        rx="4"
                        fill="rgba(0, 0, 0, 0.2)"
                      />
                    )}

                    {/* File Name Label (never truncated if room) */}
                    {w > 44 && h > 34 && (
                      <text
                        x={tile.x0 + 10}
                        y={tile.y0 + (h > 50 ? 34 : 28)}
                        fill="#FFFFFF"
                        fontSize={Math.min(13, Math.max(10, w / 9))}
                        fontWeight={700}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {tile.name.length > Math.floor(w / 7.5)
                          ? tile.name.slice(0, Math.floor(w / 7.5) - 1) + '…'
                          : tile.name}
                      </text>
                    )}

                    {/* File Size */}
                    {w > 54 && h > 52 && (
                      <text
                        x={tile.x0 + 10}
                        y={tile.y0 + 48}
                        fill="rgba(255, 255, 255, 0.9)"
                        fontSize="10"
                        className="font-mono"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {formatBytes(tile.size)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Floating Hover Card */}
          <AnimatePresence>
            {hoveredTile && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  backgroundColor: 'var(--color-surface-solid)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  boxShadow: 'var(--shadow-elevation)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 25,
                  pointerEvents: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CategoryIcon category={hoveredTile.category} size={20} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-ink)' }}>
                      {hoveredTile.name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: '1px' }}>
                      {hoveredTile.reason}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="font-mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {formatBytes(hoveredTile.size)}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: 'var(--color-keep-surface)',
                      color: 'var(--color-keep)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                    }}
                  >
                    IN BOX
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Move Shelf (Pale blush shelf with diagonal hatch) */}
        <div
          style={{
            backgroundColor: 'rgba(249, 168, 184, 0.08)',
            border: '1.5px dashed var(--color-move-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '380px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px' }}>📦</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-ink)' }}>
                Move Shelf ({shelfFiles.length})
              </span>
            </div>
            <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
              {formatBytes(shelfBytes)}
            </span>
          </div>

          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-muted)',
              lineHeight: 1.4,
            }}
          >
            These files cannot fit into this space. Relocate to archive or external disk:
          </div>

          <div
            style={{
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              flex: 1,
            }}
          >
            {shelfFiles.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-keep)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                ✓ No files left on shelf. Everything fits!
              </div>
            ) : (
              shelfFiles.map((file) => {
                const color = getCategoryColor(file.category);
                const pctOfQuota = Math.round((file.size / Math.max(1, quotaBytes)) * 100);

                return (
                  <div
                    key={file.id}
                    onClick={() => handleTileClick(file.id)}
                    className="hatch-move"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-move-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: packingMode === 'manual' ? 'pointer' : 'default',
                      transition: 'all var(--transition-fast)',
                    }}
                    title={packingMode === 'manual' ? 'Tap to pack into box' : file.path}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-ink)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-dim)' }}>
                          Takes {pctOfQuota}% of space
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                        {formatBytes(file.size)}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#C04562',
                          backgroundColor: 'var(--color-move-surface)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        MOVE
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Fill Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: 'var(--text-xs)' }}>
          <span style={{ color: 'var(--color-muted)' }}>
            Space used: <strong>{formatBytes(boxBytes)}</strong> of {formatBytes(quotaBytes)}
          </span>
          <span className="font-mono" style={{ fontWeight: 700, color: isOverFilled ? 'var(--color-danger)' : 'var(--color-keep)' }}>
            {fillPercentage}%
          </span>
        </div>

        <div style={{ height: '8px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, fillPercentage)}%` }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              height: '100%',
              backgroundColor: isOverFilled ? 'var(--color-danger)' : fillPercentage > 90 ? 'var(--color-keep)' : 'var(--color-primary)',
            }}
          />
        </div>
      </div>

      {/* Comparison Modal when user reveals Vaultline's plan */}
      {showComparisonModal && knapsackResult && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 17, 43, 0.45)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => setShowComparisonModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              backgroundColor: 'var(--color-surface-solid)',
              boxShadow: 'var(--shadow-elevation)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Your Plan vs Vaultline's Plan
              </h3>
              <button onClick={() => setShowComparisonModal(false)} style={{ color: 'var(--color-dim)', fontSize: '18px' }}>
                ✕
              </button>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-sunken)',
                marginBottom: '20px',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '4px' }}>
                You got {Math.round((boxImportance / Math.max(1, maxPossibleImportance)) * 100)}%. Vaultline found {maxPossibleImportance} points.
              </div>
              <p style={{ color: 'var(--color-muted)' }}>
                {boxImportance >= maxPossibleImportance
                  ? 'Incredible! You found the exact global optimal solution by intuition.'
                  : `Vaultline tested thousands of file combinations and saved +${maxPossibleImportance - boxImportance} more priority points by fitting complementary sizes.`}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowComparisonModal(false)}
              >
                Keep my plan
              </button>
              <button
                className="btn btn-primary"
                onClick={applyOptimalPlan}
              >
                Use Vaultline's plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

