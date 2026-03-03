import { Transaction } from '@/contexts/DataContext';
import { Category } from '@/contexts/DataContext';
import { UltraIntelligenceResult, UltraStats } from '../types';
import { formatToMonthlyChartData } from './formatters';
import { analyzeBehavior } from '@/features/predictions/logic/BehavioralAnalyzer';

/**
 * Calcule les changements de montants par catégorie
 */
export const detectCategoryChanges = (transactions: Transaction[], categories: Category[]) => {
  const stats: Record<string, number[]> = {};
   
  // Grouper les montants par catégorie
  transactions.forEach(t => {
    if (!stats[t.category]) stats[t.category] = [];
    stats[t.category].push(Math.abs(t.amount));
  });

  // Calculer les moyennes et alertes simples
  return categories.map(cat => {
    const amounts = stats[cat.id] || [];
    const avg = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    return { categoryId: cat.id, name: cat.name, average: avg };
  });
};

export const runIntelligenceEngine = (
  transactions: Transaction[],
  categories: Category[]
): UltraIntelligenceResult => {
  
  // 1. Détection des anomalies comportementales via le nouveau BehavioralAnalyzer
  const behavioralInsights = transactions
    .map(t => analyzeBehavior(t, transactions))
    .filter(Boolean)
    .slice(0, 10); // On garde les 10 plus pertinents

  // 2. Transformation pour les graphiques
  const monthlyData = formatToMonthlyChartData(transactions, categories);

  // 3. Statistiques de maturité
  const distinctMonths = new Set(transactions.map(t => t.date.substring(0, 7)));
  const stats: UltraStats = {
    transactionCount: transactions.length,
    monthsCovered: distinctMonths.size,
    hasEnoughData: transactions.length >= 50 && distinctMonths.size >= 4
  };

  return {
    insights: behavioralInsights as any, // Mapping vers votre type Insight
    monthlyData,
    stats
  };
};