// src/features/people/engine/aggregators.ts
import { Transaction } from '@/contexts/DataContext';

export interface TransactionStats {
  income: number;
  expenses: number;
  totalImpact: number;
  transactionCount: number;
  averageTransaction: number;
  lastTransactionDate?: string;
  lastTransactionAmount?: number;
}

export function aggregateTransactions(personId: string, transactions: Transaction[]): TransactionStats {
  // Filtrage
  const personTransactions = transactions.filter(t => t.personId === personId && !t.isHidden);
  
  let income = 0;
  let expenses = 0;
  
  // On initialise lastTx à undefined pour éviter les conflits avec null/never
  let lastTx: Transaction | undefined;

  personTransactions.forEach(t => {
    const amount = t.amount || 0;
    
    // Calculs financiers
    if (amount > 0) {
      income += amount;
    } else {
      expenses += Math.abs(amount);
    }
    
    // Recherche de la dernière transaction
    if (!lastTx || (t.date && lastTx.date && new Date(t.date) > new Date(lastTx.date))) {
      lastTx = t;
    }
  });

  // Pour éviter l'erreur "never", on extrait les valeurs dans des constantes avant le return
  const finalDate = lastTx ? lastTx.date : undefined;
  const finalAmount = lastTx ? lastTx.amount : undefined;

  return {
    income,
    expenses,
    totalImpact: income - expenses,
    transactionCount: personTransactions.length,
    averageTransaction: personTransactions.length > 0 
      ? (income + expenses) / personTransactions.length 
      : 0,
    lastTransactionDate: finalDate,
    lastTransactionAmount: finalAmount
  };
}