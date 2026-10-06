import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { EmptyBentoHero } from '../components/workspace/EmptyBentoHero';
import { WhereFittingCard } from '../components/workspace/WhereFittingCard';
import { BentoBoxHero } from '../components/workspace/BentoBoxHero';
import { FilesGlanceCard } from '../components/workspace/FilesGlanceCard';
import { ImportanceProfilesCard } from '../components/workspace/ImportanceProfilesCard';
import { WhatIfCard } from '../components/workspace/WhatIfCard';
import { PlanActionsCard } from '../components/workspace/PlanActionsCard';
import { YourFilesSection } from '../components/workspace/YourFilesSection';

export const WorkspaceRoute: React.FC = () => {
  const files = useAppStore((s) => s.files);
  const knapsackResult = useAppStore((s) => s.knapsackResult);
  const triggerRecompute = useAppStore((s) => s.triggerRecompute);

  useEffect(() => {
    if (files.length > 0 && !knapsackResult) {
      triggerRecompute();
    }
  }, [files.length, knapsackResult, triggerRecompute]);

  // If no files yet, render the Empty State
  if (files.length === 0) {
    return (
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <EmptyBentoHero />
      </main>
    );
  }

  // After files are added: Bento Dashboard
  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Card 1: Where are you fitting these? */}
        <div className="lg:col-span-4 flex flex-col">
          <WhereFittingCard />
        </div>

        {/* Card 2: The box (Hero card) */}
        <div className="lg:col-span-8 flex flex-col">
          <BentoBoxHero />
        </div>

        {/* Card 3: Your files at a glance */}
        <div className="lg:col-span-6 flex flex-col">
          <FilesGlanceCard />
        </div>

        {/* Card 4: How much does each file matter? */}
        <div className="lg:col-span-6 flex flex-col">
          <ImportanceProfilesCard />
        </div>

        {/* Card 5: What if I had more (or less) space? */}
        <div className="lg:col-span-6 flex flex-col">
          <WhatIfCard />
        </div>

        {/* Card 6: Your plan actions */}
        <div className="lg:col-span-6 flex flex-col">
          <PlanActionsCard />
        </div>

        {/* Card 7: Your files (Full-width) */}
        <div className="col-span-1 lg:col-span-12">
          <YourFilesSection />
        </div>
      </div>
    </main>
  );
};

