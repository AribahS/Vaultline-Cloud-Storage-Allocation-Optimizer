import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FileCategory } from '../../engine/types';

export const PriorityRulePanel: React.FC = () => {
  const { priorityRules, setPriorityRules, recalculatePrioritiesAction } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const categories: { key: FileCategory; label: string }[] = [
    { key: 'database', label: 'Databases & Dumps' },
    { key: 'document', label: 'Documents & PDFs' },
    { key: 'code', label: 'Source Code' },
    { key: 'photo', label: 'Photos & RAW Images' },
    { key: 'video', label: 'Videos & Movies' },
    { key: 'audio', label: 'Audio & Music' },
    { key: 'archive', label: 'Archives (Zip/Tar)' },
    { key: 'log_temp', label: 'Logs & Temp Files' },
  ];

  const handleBaseChange = (cat: FileCategory, val: number) => {
    setPriorityRules({
      ...priorityRules,
      categoryBase: {
        ...priorityRules.categoryBase,
        [cat]: val,
      },
    });
  };

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>
            Importance Scoring Rules
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
            {isExpanded ? 'Hide table' : 'Customize weights'}
          </span>
        </div>
        <button
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-primary)',
            padding: '2px 6px',
            fontWeight: 600,
          }}
          aria-label={isExpanded ? 'Collapse rules' : 'Expand rules'}
        >
          {isExpanded ? '▲ Close' : '▼ View'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
            Importance scores (1–10) help determine which files to keep first. Base scores are based on file category, modified by recency:
          </div>

          {/* Rules Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--text-xs)',
              backgroundColor: 'var(--color-surface-sunken)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-dim)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Category</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Base Score (1–10)</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.key} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--color-ink)' }}>{c.label}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={priorityRules.categoryBase[c.key]}
                      onChange={(e) => handleBaseChange(c.key, parseInt(e.target.value) || 1)}
                      style={{ width: '45px', textAlign: 'center', padding: '2px 4px', fontSize: 'var(--text-xs)' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Recency & Age Bonus/Penalty */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: 'var(--text-xs)',
              backgroundColor: 'var(--color-surface-sunken)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Recency Bonus: </span>
              +{priorityRules.recencyBonusPoints} pts if modified within {priorityRules.recencyBonusDays} days
            </div>
            <div>
              <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Staleness Adjustment: </span>
              -{priorityRules.agePenaltyPoints} pts if untouched for &gt;2 years
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={recalculatePrioritiesAction}
            >
              Recalculate Suggested Scores
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

