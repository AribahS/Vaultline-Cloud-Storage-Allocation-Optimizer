import React from 'react';
import { Card } from './Card';
import { formatSize, pluralize } from '../../lib/format';

export interface ResultsSummaryValues {
  keptCount: number;
  movedCount: number;
  keptBytes: number;
  movedBytes: number;
  importanceKept: number;
  importancePossible: number;
}

export const ResultsSummary: React.FC<{ values: ResultsSummaryValues }> = ({ values }) => {
  const percent = values.importancePossible > 0 ? Math.round(values.importanceKept / values.importancePossible * 100) : 0;
  return <section className="plan-kpis" aria-label="Results summary">
    <SummaryCard label="Files kept" value={pluralize(values.keptCount, 'file')} />
    <SummaryCard label="Files moved" value={pluralize(values.movedCount, 'file')} moved />
    <SummaryCard label="Space kept" value={formatSize(values.keptBytes)} />
    <SummaryCard label="Space moved" value={formatSize(values.movedBytes)} moved />
    <SummaryCard label="Importance retained" value={`${percent}% (${values.importanceKept} of ${values.importancePossible})`} />
  </section>;
};

const SummaryCard: React.FC<{ label: string; value: string; moved?: boolean }> = ({ label, value, moved = false }) => (
  <Card className={`plan-kpi ${moved ? 'plan-kpi-moved' : ''}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    <i aria-hidden="true" />
  </Card>
);
