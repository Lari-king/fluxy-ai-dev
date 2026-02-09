import { useMemo } from 'react';
import { useFinance } from './use-finance';

/**
 * 📊 HOOK DE PRÉPARATION DES DONNÉES GRAPHIQUES
 * Transforme les transactions brutes en séries temporelles pour Recharts.
 */

export interface TimeSeriesData {
  date: string; // Format: "janv. 24"
  value: number;
}

interface ChartData {
  netWorthHistory: TimeSeriesData[];
  cashFlowHistory: TimeSeriesData[];
  isLoading: boolean;
}

export const useCharts = (): ChartData => {
  // On récupère les données via le hook pilote (Architecture centralisée)
  // On demande 12 mois pour avoir un historique significatif
  const { recentTransactions, netWorth: currentBalance, isLoading } = useFinance(12);

  return useMemo(() => {
    if (isLoading || !recentTransactions) {
      return { netWorthHistory: [], cashFlowHistory: [], isLoading: true };
    }

    const today = new Date();
    
    // --- 1. Historique du Flux de Trésorerie Mensuel ---
    const cashFlowByMonth = new Map<string, number>();

    recentTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const currentFlow = cashFlowByMonth.get(yearMonth) || 0;
      cashFlowByMonth.set(yearMonth, currentFlow + tx.amount);
    });

    const cashFlowHistory: TimeSeriesData[] = Array.from(cashFlowByMonth.entries())
      .map(([yearMonth, value]) => ({
        date: new Date(yearMonth).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        value: value,
      }))
      .sort((a, b) => {
        // Tri chronologique basé sur la date brute pour éviter les erreurs de tri alphabétique
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

    // --- 2. Historique de la Valeur Nette (Simulation Inverse) ---
    // On part du solde actuel et on remonte le temps (O(n))
    let rollingNetWorth = currentBalance;
    const netWorthPoints: TimeSeriesData[] = [];
    
    // On travaille sur une copie triée par date décroissante
    const reversedTxs = [...recentTransactions].sort((a, b) => b.date.localeCompare(a.date));

    let currentMonthYear = '';

    reversedTxs.forEach(tx => {
      const date = new Date(tx.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthYear !== currentMonthYear) {
        if (currentMonthYear) {
          netWorthPoints.unshift({
            date: new Date(currentMonthYear).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
            value: Math.round(rollingNetWorth),
          });
        }
        currentMonthYear = monthYear;
      }
      rollingNetWorth -= tx.amount;
    });

    // Ajout du point actuel (le plus récent)
    const currentPoint: TimeSeriesData = {
      date: today.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      value: Math.round(currentBalance),
    };

    const finalNetWorthHistory = [
      ...netWorthPoints.filter(p => p.date !== currentPoint.date), 
      currentPoint
    ].slice(-12);

    return {
      netWorthHistory: finalNetWorthHistory,
      cashFlowHistory: cashFlowHistory.slice(-12),
      isLoading: false,
    };
  }, [recentTransactions, currentBalance, isLoading]);
};