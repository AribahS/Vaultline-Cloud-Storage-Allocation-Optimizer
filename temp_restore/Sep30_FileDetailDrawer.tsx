import React from 'react';
import { FileMetadata } from '../../engine/types';
import { Drawer } from './Drawer';
import { FileCode, Image, FileVideo, Music, Archive, FileText, Settings, File, Calendar, HardDrive, Tag, Pin, EyeOff } from 'lucide-react';

const formatBytesHuman = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileAge = (lastModified: number): string => {
  const diff = Date.now() - lastModified;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Today';
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
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
  if (!file) return null;

  const detailRows: { label: string; value: React.ReactNode; icon: React.ReactNode }[] = [
    { label: 'Full path', value: file.path, icon: <File size={16} color="var(--color-ink-3)" /> },
    { label: 'Size', value: `${formatBytesHuman(file.size)} (${file.size.toLocaleString()} bytes)`, icon: <HardDrive size={16} color="var(--color-ink-3)" /> },
    { label: 'Type', value: `${file.type} / ${file.category}`, icon: <Tag size={16} color={getCategoryColor(file.category)} /> },
    { label: 'Modified', value: `${new Date(file.lastModified).toLocaleDateString()} (${getFileAge(file.lastModified)})`, icon: <Calendar size={16} color="var(--color-ink-3)" /> },
  ];

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

      {/* Importance */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-hairline)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Importance</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--color-forest-500)'
          }}>{file.priority}/10</span>
        </div>
        <div style={{
          height: '6px',
          backgroundColor: 'var(--color-border-hairline)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${file.priority * 10}%`,
            backgroundColor: 'var(--color-forest-500)',
            borderRadius: '3px',
            transition: 'width var(--transition-color)'
          }} />
        </div>
        <div className="text-caption text-ink-3" style={{ marginTop: '6px' }}>
          Source: {file.prioritySource === 'auto' ? 'Automatically calculated' : 'Manually edited'}
        </div>
      </div>

      {/* Status badges */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {file.isPinned && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
            backgroundColor: 'var(--color-forest-50)',
            color: 'var(--color-semantic-keep)',
            borderRadius: '6px', border: '1px solid var(--color-forest-100)'
          }}>
            <Pin size={12} /> Always keep
          </span>
        )}
        {file.isExcluded && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
            backgroundColor: '#fdf2f1',
            color: 'var(--color-semantic-move)',
            borderRadius: '6px', border: '1px solid #e8c6c1'
          }}>
            <EyeOff size={12} /> Excluded
          </span>
        )}
        {file.isDuplicate && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
            backgroundColor: 'var(--color-brass-soft)',
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

