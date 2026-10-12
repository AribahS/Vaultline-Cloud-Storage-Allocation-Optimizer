import React from 'react';
import { FileMetadata } from '../../engine/types';
import { Drawer } from './Drawer';
import { useAppStore } from '../../store/useAppStore';
import { File, Calendar, HardDrive, Tag, Pin, EyeOff } from 'lucide-react';

import { formatDateDmy, formatSize, pluralize } from '../../lib/format';
import { suggestFileScore } from '../../lib/scoring';

const getFileAge = (lastModified: number): string => {
  const diff = Date.now() - lastModified;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Today';
  if (days < 30) return `${pluralize(days, 'day')} ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${pluralize(months, 'month')} ago`;
  }
  const years = Math.floor(days / 365);
  return `${pluralize(years, 'year')} ago`;
};

const getCategoryColor = (category: string): string => {
  const map: Record<string, string> = {
    code: 'var(--color-file-code)',
    photo: 'var(--color-file-photos)',
    video: 'var(--color-file-videos)',
    audio: 'var(--color-file-audio)',
    archive: 'var(--color-file-archives)',
    document: 'var(--color-file-docs)',
    system: 'var(--color-file-system)',
  };
  return map[category] || 'var(--color-file-other)';
};

interface FileDetailDrawerProps {
  file: FileMetadata | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const FileDetailDrawer: React.FC<FileDetailDrawerProps> = ({ file, onClose, onPrevious, onNext }) => {
  const updatePriority = useAppStore((state) => state.updatePriority);
  const resetPrioritySuggestion = useAppStore((state) => state.resetPrioritySuggestion);
  const knapsackResult = useAppStore((state) => state.knapsackResult);
  if (!file) return null;
  const suggested = suggestFileScore(file, !!file.isDuplicate, Date.now());

  const detailRows: { label: string; value: React.ReactNode; icon: React.ReactNode }[] = [
    { label: 'Full path', value: file.path, icon: <File size={16} color="var(--color-ink-3)" /> },
    { label: 'Size', value: `${formatSize(file.size)} (${file.size.toLocaleString()} bytes)`, icon: <HardDrive size={16} color="var(--color-ink-3)" /> },
    { label: 'Type', value: `${file.type} / ${file.category}`, icon: <Tag size={16} color={getCategoryColor(file.category)} /> },
    { label: 'Modified', value: `${formatDateDmy(file.lastModified)} (${getFileAge(file.lastModified)})`, icon: <Calendar size={16} color="var(--color-ink-3)" /> },
  ];

  detailRows.push({
    label: 'Constraint',
    value: file.isPinned ? 'Always keep' : file.isExcluded ? 'Never keep' : 'Auto',
    icon: file.isPinned ? <Pin size={16} color="var(--color-semantic-keep)" /> : file.isExcluded ? <EyeOff size={16} color="var(--color-semantic-move)" /> : <Tag size={16} color="var(--color-ink-3)" />
  });

  if (file.isDuplicate && file.duplicateGroup) {
    detailRows.push({
      label: 'Duplicate group',
      value: file.duplicateGroup,
      icon: <File size={16} color="var(--color-semantic-warning)" />
    });
  }

  return (
    <Drawer isOpen={!!file} onClose={onClose} title="File details" width="420px">
      {/* Header with file name */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: 'var(--color-surface-sunken)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border-hairline)'
        }}>
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '8px',
            backgroundColor: getCategoryColor(file.category),
            opacity: 0.15,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>{file.name}</div>
            <div className="text-caption text-ink-3">{file.category}</div>
          </div>
        </div>
      </div>

      {/* Detail rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {detailRows.map((row) => (
          <div key={row.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ paddingTop: '2px' }}>{row.icon}</div>
            <div>
              <div className="text-caption text-ink-3" style={{ marginBottom: '2px' }}>{row.label}</div>
              <div style={{ fontSize: '14px', wordBreak: 'break-all' }}>{row.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Importance Score Section */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-hairline)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: '14px', display: 'block' }}>Importance Score</span>
            <span className="text-caption text-ink-3">
              {file.prioritySource === 'edited' ? <span className="score-edited-mark">Edited</span> : <>Suggested {suggested.score}/10</>}
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--ink)'
          }}>{file.priority}/10</span>
        </div>

        {/* Slider input */}
        <input
          type="range"
          aria-label={`Importance score for ${file.name}`}
          min={1}
          max={10}
          value={file.priority}
          onChange={(e) => updatePriority(file.id, parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            accentColor: 'var(--ink)',
            cursor: 'pointer',
            marginTop: '8px',
            marginBottom: '12px'
          }}
        />

        {/* Quick preset buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { label: 'Low (2)', val: 2 },
            { label: 'Normal (5)', val: 5 },
            { label: 'High (8)', val: 8 },
            { label: 'Critical (10)', val: 10 },
          ].map(p => (
            <button
              key={p.val}
              onClick={() => updatePriority(file.id, p.val)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                border: file.priority === p.val ? '1px solid var(--ink)' : '1px solid var(--color-border-strong)',
                backgroundColor: file.priority === p.val ? 'var(--paper)' : 'var(--color-surface-raised)',
                color: file.priority === p.val ? 'var(--ink)' : 'var(--color-ink)',
                cursor: 'pointer'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '12px' }}>
          <div className="text-caption text-ink-3">Suggested scores, a heuristic, not ground truth</div>
          <div className="score-reasons" style={{ marginTop: '6px' }}>
            {suggested.reasons.length ? suggested.reasons.map((reason) => <span className="score-reason-chip" key={reason}>{reason}</span>) : <span className="score-reason-chip">Suggested</span>}
          </div>
          {file.prioritySource === 'edited' && (
            <button type="button" onClick={() => resetPrioritySuggestion(file.id, suggested.score)} title="Reset to suggested" style={{ marginTop: '8px', border: 0, padding: 0, background: 'transparent', color: 'var(--color-ink-2)', fontSize: 12, cursor: 'pointer' }}>
              Reset to suggested
            </button>
          )}
        </div>
      </div>

      {/* Placement */}
      <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-hairline)' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Placement</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!knapsackResult ? <span className="text-caption text-ink-3">Not evaluated</span> : (() => {
            const isKept = knapsackResult.keptItems.some(i => i.id === file.id);
            return (
              <span style={{
                display: 'inline-flex', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                backgroundColor: isKept ? 'color-mix(in srgb,var(--kept) 20%,transparent)' : 'color-mix(in srgb,var(--moved) 10%,transparent)',
                color: isKept ? 'var(--color-semantic-keep-stroke)' : 'var(--color-semantic-move)',
                border: `1px solid ${isKept ? 'var(--color-semantic-keep-stroke)' : 'var(--color-semantic-move)'}`
              }}>
                {isKept ? 'Kept' : 'Moved'}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Status badges */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {file.isPinned && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
            backgroundColor: 'var(--paper)',
            color: 'var(--color-semantic-keep)',
            borderRadius: '6px', border: '1px solid var(--heat-1)'
          }}>
            <Pin size={12} /> Always keep
          </span>
        )}
        {file.isExcluded && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
            backgroundColor: 'var(--paper)',
            color: 'var(--color-semantic-move)',
            borderRadius: '6px', border: '1px solid var(--card-border)'
          }}>
            <EyeOff size={12} /> Excluded
          </span>
        )}
        {file.isDuplicate && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
            backgroundColor: 'var(--paper)',
            color: 'var(--color-semantic-warning)',
            borderRadius: '6px', border: '1px solid var(--color-border-strong)'
          }}>
            Duplicate
          </span>
        )}
      </div>

      {/* Prev / Next */}
      {(onPrevious || onNext) && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-hairline)', paddingTop: '16px' }}>
          <button
            onClick={onPrevious}
            disabled={!onPrevious}
            className="vault-btn btn-ghost btn-sm"
          >
            Previous file
          </button>
          <button
            onClick={onNext}
            disabled={!onNext}
            className="vault-btn btn-ghost btn-sm"
          >
            Next file
          </button>
        </div>
      )}
    </Drawer>
  );
};
