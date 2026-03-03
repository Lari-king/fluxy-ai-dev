import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { calculateSpentAmount } from '../services/budget-engine';
import { Budget } from '../types';

export function useBudgets() {
  const { budgets: rawBudgets, transactions, categories, people, updateBudgets } = useData();

  const budgets = useMemo(() => {
    const list = (rawBudgets || []) as Budget[];
    return list.map(b => ({
      ...b,
      spent: calculateSpentAmount(b, transactions || [])
    }));
  }, [rawBudgets, transactions]);

  const saveBudget = async (budget: Budget) => {
    const currentBudgets = (rawBudgets || []) as Budget[];
    const exists = currentBudgets.find(b => b.id === budget.id);
    const updated = exists 
      ? currentBudgets.map(b => b.id === budget.id ? budget : b)
      : [...currentBudgets, budget];
    return updateBudgets(updated);
  };

  const removeBudget = async (id: string) => {
    const updated = (rawBudgets || []).filter(b => b.id !== id);
    return updateBudgets(updated as Budget[]);
  };

  return {
    budgets,
    categories,
    people,
    saveBudget,
    removeBudget,
    totalAllocated: budgets.reduce((sum, b) => sum + (b.allocated || 0), 0),
    totalSpent: budgets.reduce((sum, b) => sum + (b.spent || 0), 0)
  };
}