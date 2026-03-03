// src/features/wealth-strategist/hooks/useWealthAnalysis.ts
import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';

export function useWealthAnalysis() {
  const { accounts, transactions, goals } = useData();

  const analysis = useMemo(() => {
    // 1. Calcul du Net Worth Actuel (Patrimoine)
    const currentNetWorth = accounts.reduce((sum, acc) => sum + (acc.value || 0), 0);

    // 2. Calcul du Cash-Flow Mensuel Réel (Dépenses vs Revenus)
    const now = new Date();
    const currentMonthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const monthlyIncome = currentMonthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const monthlyExpenses = currentMonthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const netSavings = monthlyIncome - monthlyExpenses;

    // 3. Indicateur de Capacité d'Investissement (ICI)
    // On considère 20% du cash dormant + 100% du net savings
    const liquidAssets = accounts.filter(a => a.category === 'Épargne' || a.category === 'Banque').reduce((s, a) => s + a.value, 0);
    const investmentCapacity = netSavings + (liquidAssets * 0.05); // Exemple : on peut réallouer 5% de l'épargne dormante par mois

    return {
      currentNetWorth,
      netSavings,
      investmentCapacity,
      savingsRate: monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0,
      liquidAssets
    };
  }, [accounts, transactions]);

  return analysis;
}