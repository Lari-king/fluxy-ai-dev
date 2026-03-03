import { Budget, BudgetRule } from '../types';
import { Transaction } from '@/contexts/DataContext';

/**
 * Détermine si une transaction appartient à un budget selon ses règles
 */
export const isTransactionInBudget = (budget: Budget, transaction: Transaction): boolean => {
  if (!budget.rules || budget.rules.length === 0) {
    return transaction.category === budget.category;
  }

  return budget.rules.some(rule => {
    switch (rule.type) {
      case 'category':
        return transaction.category === rule.value;
      case 'person':
        return transaction.personId === rule.value;
      case 'keyword':
        const desc = transaction.description.toLowerCase();
        const val = String(rule.value).toLowerCase();
        return desc.includes(val);
      case 'amount':
        const amount = Math.abs(transaction.amount);
        const threshold = Number(rule.value);
        if (rule.operator === 'greaterThan') return amount > threshold;
        if (rule.operator === 'lessThan') return amount < threshold;
        return amount === threshold;
      default:
        return false;
    }
  });
};

/**
 * Calcule le montant total dépensé pour un budget donné
 */
export const calculateSpentAmount = (budget: Budget, transactions: Transaction[]): number => {
  return transactions
    .filter(t => t.amount < 0 && isTransactionInBudget(budget, t))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
};