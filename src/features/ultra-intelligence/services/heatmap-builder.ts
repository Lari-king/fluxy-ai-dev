/**
 * 🧠 HEATMAP BUILDER
 * Emplacement : src/features/ultra-intelligence/services/heatmap-builder.ts
 * Construction de la grille thermique des habitudes (jour du mois)
 */

import type { Transaction } from '@/contexts/DataContext';

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

export interface ConcentrationPattern {
  categoryName: string;
  pattern: 'début-de-mois' | 'milieu-de-mois' | 'fin-de-mois' | 'uniforme';
  concentration: number;
  mainPeriod: string;
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
    // Vérification de la catégorie (ID ou nom selon votre système)
    if (transaction.category !== categoryId) return;

    const date = new Date(transaction.date);
    const day = date.getDate(); // 1-31
    const dayIndex = day - 1;

    if (dayIndex >= 0 && dayIndex < 31) {
      const absAmount = Math.abs(transaction.amount);
      cells[dayIndex].amount += absAmount;
      cells[dayIndex].transactionCount++;
      totalAmount += absAmount;
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
 * Analyse les heatmaps pour détecter des patterns de concentration
 */
export function analyzeConcentrationPatterns(
  heatmaps: CategoryHeatmap[]
): ConcentrationPattern[] {
  return heatmaps.map(heatmap => {
    if (heatmap.totalAmount === 0) {
      return {
        categoryName: heatmap.categoryName,
        pattern: 'uniforme',
        concentration: 0,
        mainPeriod: 'aucune donnée',
      };
    }

    // Calcul de la concentration par tiers de mois
    const debutMois = heatmap.cells.slice(0, 10).reduce((sum, cell) => sum + cell.amount, 0);
    const milieuMois = heatmap.cells.slice(10, 20).reduce((sum, cell) => sum + cell.amount, 0);
    const finMois = heatmap.cells.slice(20, 31).reduce((sum, cell) => sum + cell.amount, 0);

    const total = heatmap.totalAmount;

    const debutPct = (debutMois / total) * 100;
    const milieuPct = (milieuMois / total) * 100;
    const finPct = (finMois / total) * 100;

    // Déterminer le pattern prédominant
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
 * Normalise les valeurs pour l'affichage (0 à 1)
 * Utile pour l'opacité des cellules dans le composant HabitsHeatmap.tsx
 */
export function normalizeHeatmapValues(heatmap: CategoryHeatmap): number[] {
  const maxAmount = Math.max(...heatmap.cells.map(c => c.amount));
  if (maxAmount === 0) return heatmap.cells.map(() => 0);
  return heatmap.cells.map(c => c.amount / maxAmount);
}