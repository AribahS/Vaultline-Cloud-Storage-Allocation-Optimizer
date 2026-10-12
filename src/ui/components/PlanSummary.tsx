import React from 'react';
import { ResultsSummary, ResultsSummaryValues } from './ResultsSummary';

export type PlanSummaryValues = ResultsSummaryValues;
export const PlanSummary: React.FC<{ values: PlanSummaryValues }> = (props) => <ResultsSummary {...props} />;
