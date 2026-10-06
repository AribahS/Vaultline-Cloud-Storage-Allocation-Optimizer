import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { IMPORTANCE_PROFILES, ProfileId } from '../../engine/profiles';
import { Sparkles } from 'lucide-react';

export const ImportanceProfilesCard: React.FC = () => {
  const profileId = useAppStore((s) => s.profileId);
  const profileToggles = useAppStore((s) => s.profileToggles);
  const setProfile = useAppStore((s) => s.setProfile);
  const setProfileToggle = useAppStore((s) => s.setProfileToggle);

  const activeProfileDef = IMPORTANCE_PROFILES[profileId] || IMPORTANCE_PROFILES.balanced;

  return (
    <div
      className="bento-card p-5 flex flex-col justify-between"
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        background: 'var(--surface-card)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg"
              style={{ background: 'rgba(108, 71, 255, 0.1)', color: 'var(--brand-primary)' }}
            >
              <Sparkles size={16} />
            </span>
            <h2 className="text-base font-bold font-heading" style={{ color: 'var(--ink)' }}>
              How much does each file matter?
            </h2>
          </div>
        </div>

        {/* Profile chips with instant effect */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {(Object.keys(IMPORTANCE_PROFILES) as ProfileId[]).map((key) => {
            const def = IMPORTANCE_PROFILES[key];
            const isSelected = profileId === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setProfile(key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: isSelected ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.85)',
                  color: isSelected ? '#FFFFFF' : 'var(--ink)',
                  border: isSelected ? '1px solid var(--brand-primary)' : '1px solid rgba(20, 17, 43, 0.1)',
                  boxShadow: isSelected ? '0 2px 8px rgba(108, 71, 255, 0.25)' : 'none',
                }}
              >
                {def.name}
              </button>
            );
          })}
        </div>

        {/* Friendly explanation */}
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--ink-muted)' }}>
          {activeProfileDef.description}
        </p>
      </div>

      {/* 3 Friendly toggles */}
      <div
        className="pt-3 border-t flex flex-col gap-2"
        style={{ borderColor: 'rgba(20, 17, 43, 0.08)' }}
      >
        {([
          { key: 'newerFilesMatterMore' as const, label: 'Newer files matter more' },
          { key: 'rareBigFilesMatterLess' as const, label: 'Big files I rarely open matter less' },
          { key: 'documentsMatterMore' as const, label: 'Documents matter more' },
        ]).map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>
              {label}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={profileToggles[key]}
              onClick={() => setProfileToggle(key, !profileToggles[key])}
              className="w-9 h-5 rounded-full transition-colors relative"
              style={{
                background: profileToggles[key] ? 'var(--brand-primary)' : 'rgba(20, 17, 43, 0.15)',
              }}
            >
              <span
                className="block w-3.5 h-3.5 rounded-full bg-white transition-transform"
                style={{
                  transform: profileToggles[key] ? 'translateX(18px)' : 'translateX(3px)',
                  marginTop: '3px',
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

