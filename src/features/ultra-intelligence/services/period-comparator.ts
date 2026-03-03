/**
 * PERIOD COMPARATOR
 * Comparaison de périodes pour identifier les changements de comportement
 */

import type { Transaction } from '@/utils/csv-parser';

export interface PeriodComparison {
  categoryId: string;
  categoryName: string;
  before: number;
  after: number;
  change: number; // Pourcentage de changement
  changeAbsolute: number; // Changement en euros
  transactionsBefore: number;
  transactionsAfter: number;
}

/**
 * Compare deux périodes de transactions
 */
export function comparePeriods(
  transactions: Transaction[],
  splitDate: Date,
  categories: Array<{ id: string; name: string }>
): PeriodComparison[] {
  const before = transactions.filter(t => new Date(t.date) < splitDate);
  const after = transactions.filter(t => new Date(t.date) >= splitDate);

  return categories.map(cat => {
    const beforeTxns = before.filter(t => t.category === cat.id);
    const afterTxns = after.filter(t => t.category === cat.id);

    const beforeAmount = beforeTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const afterAmount = afterTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const change = beforeAmount > 0 ? ((afterAmount - beforeAmount) / beforeAmount) * 100 : 0;
    const changeAbsolute = afterAmount - beforeAmount;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      before: beforeAmount,
      after: afterAmount,
      change: Math.round(change),
      changeAbsolute: Math.round(changeAbsolute),
      transactionsBefore: beforeTxns.length,
      transactionsAfter: afterTxns.length,
    };
  }).filter(comp => comp.before > 0 || comp.after > 0); // Exclure les catégories vides
}

/**
 * Compare deux années complètes
 */
export function compareYears(
  transactions: Transaction[],
  year1: number,
  year2: number,
  categories: Array<{ id: string; name: string }>
): PeriodComparison[] {
  const year1Txns = transactions.filter(t => new Date(t.date).getFullYear() === year1);
  const year2Txns = transactions.filter(t => new Date(t.date).getFullYear() === year2);

  return categories.map(cat => {
    const year1CatTxns = year1Txns.filter(t => t.category === cat.id);
    const year2CatTxns = year2Txns.filter(t => t.category === cat.id);

    const year1Amount = year1CatTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const year2Amount = year2CatTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const change = year1Amount > 0 ? ((year2Amount - year1Amount) / year1Amount) * 100 : 0;
    const changeAbsolute = year2Amount - year1Amount;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      before: year1Amount,
      after: year2Amount,
      change: Math.round(change),
      changeAbsolute: Math.round(changeAbsolute),
      transactionsBefore: year1CatTxns.length,
      transactionsAfter: year2CatTxns.length,
    };
  }).filter(comp => comp.before > 0 || comp.after > 0);
}

/**
 * Identifie les changements les plus significatifs
 */
export function getTopChanges(
  comparisons: PeriodComparison[],
  limit: number = 10
): PeriodComparison[] {
  return comparisons
    .filter(c => Math.abs(c.change) > 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, limit);
}

/**
 * Calcule les statistiques globales de la comparaison
 */
export interface PeriodStats {
  totalBefore: number;
  totalAfter: number;
  totalChange: number;
  categoriesIncreased: number;
  categoriesDecreased: number;
  categoriesStable: number;
  biggestIncrease: PeriodComparison | null;
  biggestDecrease: PeriodComparison | null;
}

export function calculatePeriodStats(comparisons: PeriodComparison[]): PeriodStats {
  const totalBefore = comparisons.reduce((sum, c) => sum + c.before, 0);
  const totalAfter = comparisons.reduce((sum, c) => sum + c.after, 0);
  const totalChange = totalBefore > 0 ? ((totalAfter - totalBefore) / totalBefore) * 100 : 0;

  const categoriesIncreased = comparisons.filter(c => c.change > 5).length;
  const categoriesDecreased = comparisons.filter(c => c.change < -5).length;
  const categoriesStable = comparisons.filter(c => Math.abs(c.change) <= 5).length;

  const increases = comparisons.filter(c => c.change > 0).sort((a, b) => b.change - a.change);
  const decreases = comparisons.filter(c => c.change < 0).sort((a, b) => a.change - b.change);

  return {
    totalBefore: Math.round(totalBefore),
    totalAfter: Math.round(totalAfter),
    totalChange: Math.round(totalChange),
    categoriesIncreased,
    categoriesDecreased,
    categoriesStable,
    biggestIncrease: increases[0] || null,
    biggestDecrease: decreases[0] || null,
  };
}