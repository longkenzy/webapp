'use client';

import React from 'react';
import { EvaluationProvider } from '@/contexts/EvaluationContext';
import KPIContent from './KPIContent';

export default function KPIPage() {
  return (
    <EvaluationProvider>
      <KPIContent />
    </EvaluationProvider>
  );
}