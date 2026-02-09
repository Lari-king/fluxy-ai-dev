import { Budget, BudgetRule } from '../../types/budget';
import { Transaction } from '@/utils/csv-parser';

/**
 * Check if a transaction matches a budget rule
 */
export function transactionMatchesRule(transaction: Transaction, rule: BudgetRule): boolean {
  switch (rule.type) {
    case 'category':
      return transaction.category === rule.value;
    
    case 'person':
      return transaction.personId === rule.value;
    
    case 'keyword':
      const keyword = (rule.value as string).toLowerCase();
      const description = transaction.description.toLowerCase();
      
      if (rule.operator === 'contains' || !rule.operator) {
        return description.includes(keyword);
      } else if (rule.operator === 'equals') {
        return description === keyword;
      }
      return false;
    
    case 'amount':
      const amount = Math.abs(transaction.amount);
      const threshold = rule.value as number;
      
      if (rule.operator === 'greaterThan') {
        return amount > threshold;
      } else if (rule.operator === 'lessThan') {
        return amount < threshold;
      } else if (rule.operator === 'equals') {
        return amount === threshold;
      }
      return false;
    
    default:
      return false;
  }
}

/**
 * Check if a transaction matches any rule in a budget
 */
export function transactionMatchesBudget(transaction: Transaction, budget: Budget): boolean {
  if (!budget.rules || budget.rules.length === 0) {
    // Fallback to category matching if no rules defined
    return transaction.category === budget.category;
  }
  
  // Transaction matches if it satisfies at least one rule
  return budget.rules.some(rule => transactionMatchesRule(transaction, rule));
}

/**
 * Calculate spent amount for a budget based on transactions
 */
export function calculateBudgetSpent(budget: Budget, transactions: Transaction[]): number {
  return transactions
    .filter(txn => txn.amount < 0) // Only count expenses (negative amounts)
    .filter(txn => {
      // Filter by budget month if specified
      if (budget.month) {
        const txnDate = new Date(txn.date);
        const txnMonth = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;
        if (txnMonth !== budget.month) {
          return false;
        }
      }
      return transactionMatchesBudget(txn, budget);
    })
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
}

/**
 * Get all transactions that match a budget's rules (with optional month filtering)
 */
export function getTransactionsForBudget(budget: Budget, transactions: Transaction[]): Transaction[] {
  return transactions.filter(txn => {
    // Filter by budget month if specified
    if (budget.month) {
      const txnDate = new Date(txn.date);
      const txnMonth = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;
      if (txnMonth !== budget.month) {
        return false;
      }
    }
    return transactionMatchesBudget(txn, budget);
  });
}

/**
 * Find budgets that apply to a transaction
 */
export function getBudgetsForTransaction(transaction: Transaction, budgets: Budget[]): Budget[] {
  return budgets.filter(budget => transactionMatchesBudget(transaction, budget));
}
