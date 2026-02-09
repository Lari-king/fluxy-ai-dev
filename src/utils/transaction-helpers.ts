import { Transaction } from '@/utils/csv-parser';

/**
 * Check if a transaction is upcoming (date is in the future)
 */
export function isUpcomingTransaction(transaction: Transaction): boolean {
  const txnDate = new Date(transaction.date);
  const today = new Date();
  // Reset time part for accurate date comparison
  today.setHours(0, 0, 0, 0);
  txnDate.setHours(0, 0, 0, 0);
  
  return txnDate > today;
}

/**
 * Filter out upcoming transactions from calculations
 */
export function filterCompletedTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(txn => !isUpcomingTransaction(txn));
}

/**
 * Get only upcoming transactions
 */
export function getUpcomingTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(txn => isUpcomingTransaction(txn));
}

/**
 * Check if a transaction is recurring
 */
export function isRecurringTransaction(transaction: Transaction): boolean {
  return transaction.isRecurring === true || transaction.frequency === 'monthly' || transaction.frequency === 'yearly';
}
