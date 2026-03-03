/**
 * 🏷️ ULTRA INTELLIGENCE - TYPES
 * Emplacement : src/features/ultra-intelligence/types/index.ts
 */

import { Transaction } from '@/contexts/DataContext';

export interface GeneratedInsight {
  id: string;
  type: 'change' | 'pattern' | 'anomaly' | 'trend';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
  data?: any;
}

export interface UltraStats {
  transactionCount: number;
  monthsCovered: number;
  hasEnoughData: boolean;
}

export interface ChartDataPoint {
  month: string;
  fullMonth: string;
  [categoryName: string]: number | string;
}

export interface UltraIntelligenceResult {
  insights: GeneratedInsight[];
  monthlyData: ChartDataPoint[];
  stats: UltraStats;
  changes?: any[];
}