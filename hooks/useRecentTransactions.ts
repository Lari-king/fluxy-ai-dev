/**
 * 🎯 FILTRE INTELLIGENT - TRANSACTIONS RÉCENTES
 * 
 * Limite les calculs d'insights aux N derniers mois
 * Gain estimé : 90% de réduction du temps de calcul
 */

import { useMemo } from 'react';
import { Transaction } from '@/contexts/DataContext';

export function useRecentTransactions(
  transactions: Transaction[], 
  monthsBack: number = 3
): { recent: Transaction[], total: Transaction[] } {
  return useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
    
    const recent = transactions.filter(t => {
      const txnDate = new Date(t.date);
      return txnDate >= cutoffDate;
    });
    
    console.log('📊 [PERF] Transactions filtrées pour insights', {
      total: transactions.length,
      récentes: recent.length,
      périodeAnalysée: `${monthsBack} derniers mois`,
      réduction: `${Math.round((1 - recent.length / transactions.length) * 100)}%`
    });
    
    return { recent, total: transactions };
  }, [transactions, monthsBack]);
}
