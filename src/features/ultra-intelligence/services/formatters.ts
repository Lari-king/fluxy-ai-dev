/**
 * 🛠️ ULTRA INTELLIGENCE - FORMATTERS
 * Emplacement : src/features/ultra-intelligence/services/formatters.ts
 */

import { Transaction, Category } from '@/contexts/DataContext';
import { ChartDataPoint } from '../types';

/**
 * Transforme une liste de transactions en points de données pour AreaChart
 * (montants cumulés par catégorie et par mois – focus sur les dépenses)
 */
export const formatToMonthlyChartData = (
  transactions: Transaction[],
  categories: Category[]
): ChartDataPoint[] => {
  const months: Record<string, ChartDataPoint> = {};

  // Trier par date pour garantir l'ordre chronologique
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedTransactions.forEach(t => {
    // Sécurité sur la date
    if (!t.date) return;
    const monthKey = t.date.substring(0, 7); // Format "YYYY-MM"

    if (!months[monthKey]) {
      months[monthKey] = {
        month: formatMonthLabel(monthKey),
        fullMonth: monthKey,
      };
      // Initialiser chaque catégorie à 0
      categories.forEach(cat => {
        months[monthKey][cat.name] = 0;
      });
    }

    // Recherche de la catégorie (par id ou par nom – robuste)
    const category = categories.find(c => c.id === t.category || c.name === t.category);

    if (category) {
      // On ajoute le montant absolu → on cumule les dépenses (et éventuellement revenus si présents)
      // Si tu veux UNIQUEMENT les dépenses → ajoute une condition valide ici
      const currentVal = (months[monthKey][category.name] as number) || 0;
      months[monthKey][category.name] = currentVal + Math.abs(t.amount);
    }
  });

  return Object.values(months);
};

/**
 * Transforme "2023-05" en "Mai 2023"
 */
export const formatMonthLabel = (monthStr: string): string => {
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const label = new Intl.DateTimeFormat('fr-FR', {
      month: 'short',
      year: 'numeric'
    }).format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch (e) {
    return monthStr;
  }
};

/**
 * Calcule l'intensité pour la Heatmap (0 à 1) avec racine carrée pour meilleure répartition visuelle
 */
export const calculateHeatmapIntensity = (amount: number, maxAmount: number): number => {
  if (maxAmount <= 0) return 0;
  return Math.min(Math.sqrt(amount / maxAmount), 1);
};