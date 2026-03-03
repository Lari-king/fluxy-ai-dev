import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useRecurring } from '@/features/recurring/hooks/use-recurring';
import { useRules } from '@/contexts/RulesContext';
import { calculateMonthEndProjection } from '@/features/predictions/services/projection';

export function useGlobalIntelligence() {
  const { transactions, loading: dataLoading } = useData();
  const balance = 0; // Solde par défaut

  // On récupère le résultat brut du hook
  const recurringData = useRecurring(transactions);
  const { violations } = useRules();

  // Calcul du résumé des violations
  const intelSummary = useMemo(() => {
    return {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'error').length,
      warning: violations.filter(v => v.severity === 'warning').length,
      hasViolations: violations.length > 0
    };
  }, [violations]);

  // ✅ CORRECTION : Extraction sécurisée avec valeurs par défaut
  // Cela garantit que chaque propriété existe, même si useRecurring renvoie un objet vide
  const recurring = useMemo(() => {
    return {
      patterns: recurringData?.patterns || [],
      monthlyRecurringAmount: recurringData?.monthlyRecurringAmount || 0,
      totalRecurringTransactions: (recurringData as any)?.totalRecurringTransactions || 0,
      summary: recurringData?.summary || ""
    };
  }, [recurringData]);

  const projection = useMemo(() => {
    if (dataLoading || !transactions.length) return null;
    return calculateMonthEndProjection(transactions, balance);
  }, [transactions, balance, dataLoading]);

  return {
    isSyncing: dataLoading,
    projection,
    transactions,
    recurring,
    alerts: {
      violations,
      summary: intelSummary
    },
    isEmpty: !transactions || transactions.length === 0
  };
}
