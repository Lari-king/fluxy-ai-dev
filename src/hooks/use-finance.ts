import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { formatCurrency, formatPercentage } from '@/utils/format';

export const useFinance = (monthsBack: number = 3) => {
  const { accounts, transactions, loading } = useData();

  const metrics = useMemo(() => {
    if (loading || !accounts || !transactions) return { isLoading: true };

    const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    // Filtrage intelligent (Ancien useFinance intégré)
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsBack);
    const recent = transactions.filter(t => new Date(t.date) >= cutoff);

    // Calculs des KPIs
    const income = recent.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = Math.abs(recent.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
    const cashFlow = income - expenses;
    const savingsRate = income > 0 ? Math.min(100, (cashFlow / income) * 100) : 0;

    return {
      netWorth,
      netWorthFormatted: formatCurrency(netWorth, 'fr-FR', 0),
      income,
      expenses,
      cashFlow,
      cashFlowFormatted: formatCurrency(cashFlow, 'fr-FR', 0),
      savingsRate,
      savingsRateFormatted: formatPercentage(savingsRate),
      recentTransactions: recent,
      isLoading: false
    };
  }, [accounts, transactions, loading, monthsBack]);

  return metrics;
};