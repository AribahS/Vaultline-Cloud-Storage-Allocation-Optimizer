import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { LabFractional } from '../components/lab/LabFractional';
import { LabMultiBucket } from '../components/lab/LabMultiBucket';
import { LabTwoConstraints } from '../components/lab/LabTwoConstraints';
import { LabFptas } from '../components/lab/LabFptas';
import { LabBenchmark } from '../components/lab/LabBenchmark';
import { formatBytes } from '../engine/normalizer';
import {
  HardDrive,
  Timer,
  TrendingUp,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Layers,
  Scissors,
  Gauge,
  BarChart3,
} from 'lucide-react';

type UserCard = 'split' | 'time' | 'more_space';
type CourseCard = 'fractional' | 'fptas' | 'benchmark';

export const LabRoute: React.FC = () => {
  const files = useAppStore((s) => s.files);
  const complexityMode = useAppStore((s) => s.complexityMode);

  const [activeUserCard, setActiveUserCard] = useState<UserCard | null>(null);
  const [activeCourseCard, setActiveCourseCard] = useState<CourseCard | null>(null);
  const [showCourseSection, setShowCourseSection] = useState(false);

  const totalBytes = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2" style={{ color: 'var(--ink)' }}>
          Experiments
        </h1>
        <p className="text-sm max-w-xl leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
          Go beyond the basic plan. Split files across multiple devices, factor in copy time,
          or explore what extra space would unlock.
        </p>
      </div>

      {/* ========== 3 LARGE USER-FACING CARDS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Card 1: Split across places */}
        <ExperimentCard
          isActive={activeUserCard === 'split'}
          onClick={() => setActiveUserCard(activeUserCard === 'split' ? null : 'split')}
          icon={<Layers size={22} />}
          color="#6C47FF"
          title="Split across places"
          description="Fit your files across a phone, a pen drive and a laptop. Vaultline figures out which files go where."
          stat={files.length > 0 ? `${files.length} files, ${formatBytes(totalBytes)}` : 'Add files first'}
        />

        {/* Card 2: Limited time to copy */}
        <ExperimentCard
          isActive={activeUserCard === 'time'}
          onClick={() => setActiveUserCard(activeUserCard === 'time' ? null : 'time')}
          icon={<Timer size={22} />}
          color="#FF6B6B"
          title="Limited time to copy"
          description="You only have 30 minutes before your flight. Which files should you copy first?"
          stat="Space + time constraint"
        />

        {/* Card 3: What if I had more space */}
        <ExperimentCard
          isActive={activeUserCard === 'more_space'}
          onClick={() => setActiveUserCard(activeUserCard === 'more_space' ? null : 'more_space')}
          icon={<TrendingUp size={22} />}
          color="#10B981"
          title="What if I had more space?"
          description="See how the kept files change as the limit grows. Find the sweet spot where adding space stops helping."
          stat="Quota curve analysis"
        />
      </div>

      {/* Active User Card Content */}
      {activeUserCard === 'split' && (
        <div className="animate-fade-in bento-card p-6 rounded-2xl mb-8" style={{ background: 'var(--surface-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}>
          <LabMultiBucket />
        </div>
      )}
      {activeUserCard === 'time' && (
        <div className="animate-fade-in bento-card p-6 rounded-2xl mb-8" style={{ background: 'var(--surface-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}>
          <LabTwoConstraints />
        </div>
      )}
      {activeUserCard === 'more_space' && (
        <div className="animate-fade-in bento-card p-6 rounded-2xl mb-8" style={{ background: 'var(--surface-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}>
          <div className="text-center py-8">
            <TrendingUp size={32} className="mx-auto mb-3 text-emerald-500" />
            <h3 className="text-lg font-bold font-heading mb-2" style={{ color: 'var(--ink)' }}>Quota Curve</h3>
            <p className="text-sm text-muted max-w-md mx-auto mb-4">
              Use the "What if" slider on the main page to explore how changing your space limit affects which files are kept.
              The chart shows the diminishing returns as you add more space.
            </p>
            <a href="/" className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--brand-primary)' }}>
              Go to your plan <ChevronRight size={14} />
            </a>
          </div>
        </div>
      )}

      {/* ========== FOR THE ALGORITHMS COURSE (Detailed mode only) ========== */}
      {complexityMode === 'detailed' && (
        <div className="border-t pt-6" style={{ borderColor: 'rgba(20, 17, 43, 0.08)' }}>
          <button
            type="button"
            onClick={() => setShowCourseSection(!showCourseSection)}
            className="flex items-center gap-2 mb-5 text-sm font-bold font-heading"
            style={{ color: 'var(--brand-primary)' }}
          >
            <GraduationCap size={18} />
            <span>For the algorithms course</span>
            {showCourseSection ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {showCourseSection && (
            <div className="animate-fade-in space-y-6">
              <p className="text-xs text-muted max-w-lg mb-4">
                These experiments explore theoretical algorithm variants you'd study in an analysis of algorithms course.
              </p>

              {/* Course experiment cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveCourseCard(activeCourseCard === 'fractional' ? null : 'fractional')}
                  className="p-5 rounded-2xl text-left border transition-all"
                  style={{
                    background: activeCourseCard === 'fractional' ? 'rgba(108, 71, 255, 0.06)' : 'var(--surface-card)',
                    borderColor: activeCourseCard === 'fractional' ? 'var(--brand-primary)' : 'var(--border-glass)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Scissors size={20} className="mb-2" style={{ color: '#8B5CF6' }} />
                  <div className="text-sm font-bold mb-1" style={{ color: 'var(--ink)' }}>
                    If files could be split
                  </div>
                  <div className="text-[11px] text-muted leading-snug">
                    Fractional knapsack: take fractions of files. Solved greedily in O(n log n).
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCourseCard(activeCourseCard === 'fptas' ? null : 'fptas')}
                  className="p-5 rounded-2xl text-left border transition-all"
                  style={{
                    background: activeCourseCard === 'fptas' ? 'rgba(108, 71, 255, 0.06)' : 'var(--surface-card)',
                    borderColor: activeCourseCard === 'fptas' ? 'var(--brand-primary)' : 'var(--border-glass)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Gauge size={20} className="mb-2" style={{ color: '#14B8A6' }} />
                  <div className="text-sm font-bold mb-1" style={{ color: 'var(--ink)' }}>
                    Fast estimate mode
                  </div>
                  <div className="text-[11px] text-muted leading-snug">
                    FPTAS approximation: trade a tiny bit of accuracy for polynomial time.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCourseCard(activeCourseCard === 'benchmark' ? null : 'benchmark')}
                  className="p-5 rounded-2xl text-left border transition-all"
                  style={{
                    background: activeCourseCard === 'benchmark' ? 'rgba(108, 71, 255, 0.06)' : 'var(--surface-card)',
                    borderColor: activeCourseCard === 'benchmark' ? 'var(--brand-primary)' : 'var(--border-glass)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <BarChart3 size={20} className="mb-2" style={{ color: '#F5A524' }} />
                  <div className="text-sm font-bold mb-1" style={{ color: 'var(--ink)' }}>
                    Speed test
                  </div>
                  <div className="text-[11px] text-muted leading-snug">
                    Benchmark O(nW) table-building vs 2ⁿ brute force at different scales.
                  </div>
                </button>
              </div>

              {/* Active course card content */}
              {activeCourseCard === 'fractional' && (
                <div className="animate-fade-in bento-card p-6 rounded-2xl"
                  style={{ background: 'var(--surface-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}>
                  <LabFractional />
                </div>
              )}
              {activeCourseCard === 'fptas' && (
                <div className="animate-fade-in bento-card p-6 rounded-2xl"
                  style={{ background: 'var(--surface-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}>
                  <LabFptas />
                </div>
              )}
              {activeCourseCard === 'benchmark' && (
                <div className="animate-fade-in bento-card p-6 rounded-2xl"
                  style={{ background: 'var(--surface-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}>
                  <LabBenchmark />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

/* Reusable experiment card */
interface ExperimentCardProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  stat: string;
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({ isActive, onClick, icon, color, title, description, stat }) => (
  <button
    type="button"
    onClick={onClick}
    className="p-6 rounded-2xl text-left border transition-all hover:shadow-md"
    style={{
      background: isActive ? 'var(--surface-card)' : 'rgba(255,255,255,0.7)',
      borderColor: isActive ? color : 'rgba(20, 17, 43, 0.08)',
      boxShadow: isActive ? `0 2px 16px ${color}20, 0 0 0 1px ${color}` : 'none',
      backdropFilter: 'blur(12px)',
    }}
  >
    <span
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
      style={{ background: `${color}15`, color }}
    >
      {icon}
    </span>
    <div className="text-base font-bold font-heading mb-1.5" style={{ color: isActive ? color : 'var(--ink)' }}>
      {title}
    </div>
    <p className="text-xs leading-snug mb-3" style={{ color: 'var(--ink-muted)' }}>
      {description}
    </p>
    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isActive ? color : 'var(--ink-muted)' }}>
      {stat}
    </span>
  </button>
);

