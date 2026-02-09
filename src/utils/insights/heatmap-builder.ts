/**
 * HEATMAP BUILDER
 * Construction de la grille thermique des habitudes (jour du mois)
 */

import type { Transaction } from '@/utils/csv-parser';

export interface HeatmapCell {
  day: number; // 1-31
  amount: number;
  transactionCount: number;
}

export interface CategoryHeatmap {
  categoryId: string;
  categoryName: string;
  cells: HeatmapCell[];
  totalAmount: number;
  avgPerDay: number;
}

/**
 * Construit la heatmap pour une catégorie donnée
 */
export function buildCategoryHeatmap(
  transactions: Transaction[],
  categoryId: string,
  categoryName: string
): CategoryHeatmap {
  // Grille de 31 jours initialisée à 0
  const cells: HeatmapCell[] = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    amount: 0,
    transactionCount: 0,
  }));

  let totalAmount = 0;

  transactions.forEach(transaction => {
    if (transaction.category !== categoryId) return;

    const date = new Date(transaction.date);
    const day = date.getDate(); // 1-31
    const dayIndex = day - 1;

    if (dayIndex >= 0 && dayIndex < 31) {
      cells[dayIndex].amount += Math.abs(transaction.amount);
      cells[dayIndex].transactionCount++;
      totalAmount += Math.abs(transaction.amount);
    }
  });

  const avgPerDay = totalAmount / 31;

  return {
    categoryId,
    categoryName,
    cells,
    totalAmount,
    avgPerDay,
  };
}

/**
 * Construit la heatmap pour toutes les catégories
 */
export function buildAllHeatmaps(
  transactions: Transaction[],
  categories: Array<{ id: string; name: string }>
): CategoryHeatmap[] {
  return categories
    .map(cat => buildCategoryHeatmap(transactions, cat.id, cat.name))
    .filter(heatmap => heatmap.totalAmount > 0) // Exclure les catégories sans transactions
    .sort((a, b) => b.totalAmount - a.totalAmount); // Trier par montant total décroissant
}

/**
 * Analyse les patterns de concentration temporelle
 */
export interface ConcentrationPattern {
  categoryName: string;
  pattern: 'début-de-mois' | 'milieu-de-mois' | 'fin-de-mois' | 'uniforme';
  concentration: number; // Pourcentage dans la période principale
  mainPeriod: string; // Description textuelle
}

export function analyzeConcentrationPatterns(
  heatmaps: CategoryHeatmap[]
): ConcentrationPattern[] {
  return heatmaps.map(heatmap => {
    // Calculer les montants par période
    const debutMois = heatmap.cells.slice(0, 10).reduce((sum, cell) => sum + cell.amount, 0);
    const milieuMois = heatmap.cells.slice(10, 20).reduce((sum, cell) => sum + cell.amount, 0);
    const finMois = heatmap.cells.slice(20, 31).reduce((sum, cell) => sum + cell.amount, 0);

    const total = heatmap.totalAmount;

    const debutPct = (debutMois / total) * 100;
    const milieuPct = (milieuMois / total) * 100;
    const finPct = (finMois / total) * 100;

    // Déterminer le pattern
    let pattern: ConcentrationPattern['pattern'];
    let concentration: number;
    let mainPeriod: string;

    if (debutPct > 50) {
      pattern = 'début-de-mois';
      concentration = debutPct;
      mainPeriod = '1-10 du mois';
    } else if (milieuPct > 50) {
      pattern = 'milieu-de-mois';
      concentration = milieuPct;
      mainPeriod = '11-20 du mois';
    } else if (finPct > 50) {
      pattern = 'fin-de-mois';
      concentration = finPct;
      mainPeriod = '21-31 du mois';
    } else {
      pattern = 'uniforme';
      concentration = Math.max(debutPct, milieuPct, finPct);
      mainPeriod = 'tout le mois';
    }

    return {
      categoryName: heatmap.categoryName,
      pattern,
      concentration: Math.round(concentration),
      mainPeriod,
    };
  });
}

/**
 * Normalise les valeurs pour l'affichage de la heatmap (0-1)
 */
export function normalizeHeatmapValues(heatmap: CategoryHeatmap): HeatmapCell[] {
  const maxAmount = Math.max(...heatmap.cells.map(cell => cell.amount));
  
  if (maxAmount === 0) return heatmap.cells;

  return heatmap.cells.map(cell => ({
    ...cell,
    // Ajouter une propriété normalisée (0-1) pour le rendu
    normalized: cell.amount / maxAmount,
  })) as any;
}