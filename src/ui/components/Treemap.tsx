import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Move } from 'lucide-react';
import { formatSize } from '../../lib/format';
import { groupSmallTreemapFiles, truncateTreemapLabel } from '../../lib/treemapLabels';

export interface TreemapFile {
  id: string;
  name: string;
  category: string;
  size: number;
  priority?: number;
}

interface TreemapTile {
  file: TreemapFile;
  x: number;
  y: number;
  w: number;
  h: number;
  kept: boolean;
}

// C2: Ingot tile — category colors using CSS tokens for theme awareness
function squarify(
  items: (TreemapFile & { kept: boolean })[],
  x: number, y: number, w: number, h: number
): TreemapTile[] {
  if (items.length === 0) return [];
  const total = items.reduce((s, i) => s + i.size, 0);
  if (total === 0) return [];

  const tiles: TreemapTile[] = [];
  let cx = x, cy = y, cw = w, ch = h;
  let remaining = [...items];
  let remainingTotal = total;

  while (remaining.length > 0) {
    const isWide = cw >= ch;
    const sideLen = isWide ? ch : cw;
    let row: typeof remaining = [];
    let rowArea = 0;
    let worstRatio = Infinity;

    for (const item of remaining) {
      const testRow = [...row, item];
      const testArea = rowArea + (item.size / remainingTotal) * cw * ch;
      const testSide = testArea / sideLen;

      let testWorst = 0;
      for (const r of testRow) {
        const rArea = (r.size / remainingTotal) * cw * ch;
        const rLen = rArea / testSide;
        const ratio = Math.max(testSide / rLen, rLen / testSide);
        testWorst = Math.max(testWorst, ratio);
      }

      if (testRow.length === 1 || testWorst <= worstRatio) {
        row = testRow;
        rowArea = testArea;
        worstRatio = testWorst;
      } else {
        break;
      }
    }

    // Lay out the row
    const rowSide = rowArea / sideLen;
    let offset = 0;
    for (const item of row) {
      const itemArea = (item.size / remainingTotal) * cw * ch;
      const itemLen = itemArea / rowSide;

      if (isWide) {
        tiles.push({ file: item, x: cx, y: cy + offset, w: rowSide, h: itemLen, kept: item.kept });
      } else {
        tiles.push({ file: item, x: cx + offset, y: cy, w: itemLen, h: rowSide, kept: item.kept });
      }
      offset += itemLen;
    }

    // Update remaining space
    if (isWide) {
      cx += rowSide;
      cw -= rowSide;
    } else {
      cy += rowSide;
      ch -= rowSide;
    }

    remaining = remaining.slice(row.length);
    remainingTotal = remaining.reduce((s, i) => s + i.size, 0);
    if (remainingTotal === 0) break;
  }

  return tiles;
}

interface TreemapProps {
  files: TreemapFile[];
  keptIds: Set<string>;
  width?: number;
  height?: number;
  onTileClick?: (file: TreemapFile) => void;
}

export const Treemap: React.FC<TreemapProps> = ({
  files,
  keptIds,
  width = 760,
  height = 380,
  onTileClick
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredTile, setHoveredTile] = useState<{ tile: TreemapTile; mouseX: number; mouseY: number } | null>(null);
  const [focusedCategory, setFocusedCategory] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Increase tile cap dynamically based on zoom level so small files reveal themselves
  const maxDisplayFiles = useMemo(() => {
    if (zoomLevel >= 3) return 800;
    if (zoomLevel >= 2) return 500;
    return 300;
  }, [zoomLevel]);

  const displayFiles = useMemo(() => {
    let filtered = files.filter(f => f.size > 0);
    if (focusedCategory) {
      filtered = filtered.filter(f => f.category === focusedCategory);
    }
    const visible = filtered
      .sort((a, b) => b.size - a.size)
      .slice(0, maxDisplayFiles)
      .map(f => ({ ...f, kept: keptIds.has(f.id) }));
    return groupSmallTreemapFiles(visible, width * height, 1800);
  }, [files, keptIds, maxDisplayFiles, focusedCategory, width, height]);

  const tiles = useMemo(() => {
    return squarify(displayFiles, 0, 0, width, height);
  }, [displayFiles, width, height]);

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.4, 8));
  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev / 1.4, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setFocusedCategory(null);
  };

  // Drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel(prev => Math.min(prev * 1.15, 8));
    } else {
      setZoomLevel(prev => {
        const next = Math.max(prev / 1.15, 1);
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  }, []);

  // Category counts for filter bar
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    files.forEach(f => map.set(f.category, (map.get(f.category) || 0) + 1));
    return Array.from(map.entries());
  }, [files]);

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      {/* Top Toolbar: Zoom Controls & Category filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-ink-2)' }}>Zoom:</span>
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="vault-btn btn-ghost btn-sm"
            style={{ padding: '4px 8px' }}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '42px', textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 8}
            className="vault-btn btn-ghost btn-sm"
            style={{ padding: '4px 8px' }}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleResetZoom}
            className="vault-btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', marginLeft: '4px' }}
            title="Reset Zoom"
          >
            <RotateCcw size={14} /> Reset
          </button>
          {zoomLevel > 1 && (
            <span className="text-caption text-ink-3" style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Move size={12} /> Drag to pan map
            </span>
          )}
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFocusedCategory(null)}
            style={{
              padding: '3px 8px',
              borderRadius: '12px',
              border: focusedCategory === null ? '1px solid var(--color-forest)' : '1px solid var(--color-border-hairline)',
              backgroundColor: focusedCategory === null ? 'var(--color-forest-50)' : 'transparent',
              color: focusedCategory === null ? 'var(--color-forest)' : 'var(--color-ink-2)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 500
            }}
          >
            All ({files.length})
          </button>
          {categories.slice(0, 5).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFocusedCategory(focusedCategory === cat ? null : cat)}
              style={{
                padding: '3px 8px',
                borderRadius: '12px',
                border: focusedCategory === cat ? '1px solid var(--color-forest)' : '1px solid var(--color-border-hairline)',
                backgroundColor: focusedCategory === cat ? 'var(--color-forest-50)' : 'transparent',
                color: focusedCategory === cat ? 'var(--color-forest)' : 'var(--color-ink-2)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500
              }}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Container with Viewport clipping */}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          overflow: 'hidden',
          borderRadius: '8px',
          border: '1px solid var(--color-border-hairline)',
          backgroundColor: 'var(--color-surface-sunken)',
          position: 'relative',
          cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: 'block' }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoomLevel})`}>
            {tiles.map((tile) => {
              const isKept = tile.kept;
              // Scaled width and height for label visibility
              const scaledW = tile.w * zoomLevel;
              const scaledH = tile.h * zoomLevel;
              const showLabel = scaledW >= 58 && scaledH >= 26;
              const showSizeLabel = scaledW > 90 && scaledH > 38;
              const patternId = `hatch-${tile.file.id}`;

              return (
                <g
                  key={tile.file.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTileClick) onTileClick(tile.file);
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredTile({ tile, mouseX: rect.left + rect.width / 2, mouseY: rect.top });
                  }}
                  onMouseLeave={() => setHoveredTile(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {!isKept && (
                    <defs>
                      <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <rect width="6" height="6" fill="var(--moved)" />
                        <line x1="0" y1="0" x2="0" y2="6" stroke="var(--moved-stripe)" strokeWidth="2" />
                      </pattern>
                    </defs>
                  )}
                  <rect
                    x={tile.x + 0.5}
                    y={tile.y + 0.5}
                    width={Math.max(0, tile.w - 1)}
                    height={Math.max(0, tile.h - 1)}
                    rx={Math.min(4, tile.w / 4)}
                    fill={isKept ? 'var(--vault-bg)' : `url(#${patternId})`}
                    opacity={1}
                    stroke={isKept ? 'var(--vault-text)' : 'var(--moved-stripe)'}
                    strokeWidth={isKept ? 1.5 / zoomLevel : 2 / zoomLevel}
                    strokeOpacity={1}
                  />
                  {showLabel && (
                    <>
                    <rect
                      x={tile.x + (tile.w - Math.min(tile.w - 4, truncateTreemapLabel(tile.file.name, Math.floor((tile.w - 12) / 7)).length * 7 + 8)) / 2}
                      y={tile.y + tile.h / 2 - (showSizeLabel ? 6 : 0) - 9}
                      width={Math.min(tile.w - 4, truncateTreemapLabel(tile.file.name, Math.floor((tile.w - 12) / 7)).length * 7 + 8)}
                      height={18}
                      rx={4}
                      fill="var(--vault-bg)"
                    />
                    <text
                      x={tile.x + tile.w / 2}
                      y={tile.y + tile.h / 2 - (showSizeLabel ? 6 : 0)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="var(--vault-text)"
                      fontSize={Math.max(8, Math.min(12 / zoomLevel, tile.w / 6))}
                      fontFamily="var(--font-interface)"
                      fontWeight={600}
                      style={{ pointerEvents: 'none' }}
                    >
                      {truncateTreemapLabel(tile.file.name, Math.floor((tile.w - 12) / 7))}
                    </text>
                    </>
                  )}
                  {showSizeLabel && (
                    <text
                      x={tile.x + tile.w / 2}
                      y={tile.y + tile.h / 2 + 8}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="var(--vault-text)"
                      fontSize={Math.max(7, Math.min(10 / zoomLevel, tile.w / 8))}
                      fontFamily="var(--font-mono)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {formatSize(tile.file.size)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredTile && (
          <div
            style={{
              position: 'fixed',
              left: `${hoveredTile.mouseX}px`,
              top: `${hoveredTile.mouseY - 8}px`,
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'var(--color-surface-raised, var(--card))',
              color: 'var(--color-ink, var(--ink))',
              padding: '8px 12px',
              borderRadius: '6px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              border: '1px solid var(--color-border-strong, var(--color-semantic-keep-stroke))',
              fontSize: '12px',
              pointerEvents: 'none',
              zIndex: 1000,
              minWidth: '160px'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
              {hoveredTile.tile.file.name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', color: 'var(--color-ink-2)' }}>
              <span>Size:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatSize(hoveredTile.tile.file.size)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', color: 'var(--color-ink-2)' }}>
              <span>Category:</span>
              <span style={{ textTransform: 'capitalize' }}>{hoveredTile.tile.file.category}</span>
            </div>
            {hoveredTile.tile.file.priority !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', color: 'var(--color-ink-2)' }}>
                <span>Importance:</span>
                <strong style={{ color: 'var(--color-ink)' }}>{hoveredTile.tile.file.priority}/10</strong>
              </div>
            )}
            <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid var(--color-border-hairline)' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: hoveredTile.tile.kept ? 'var(--color-forest-50)' : 'var(--paper)',
                  color: hoveredTile.tile.kept ? 'var(--color-semantic-keep)' : 'var(--color-semantic-move)'
                }}
              >
                {hoveredTile.tile.kept ? '✓ Kept in Vault Plan' : '→ Move to External Storage'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer info line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--color-ink-3)' }}>
        <span>Showing {displayFiles.length} of {files.length} files (Zoom in to see smaller files)</span>
        <span>Scroll wheel or zoom buttons to zoom & pan</span>
      </div>
    </div>
  );
};
