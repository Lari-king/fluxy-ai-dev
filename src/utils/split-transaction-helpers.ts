/**
 * 🔀 SPLIT TRANSACTION HELPERS
 * 
 * Utilitaires pour gérer les transactions divisées
 */

import { Transaction } from '@/contexts/DataContext';

/**
 * Divise une transaction en plusieurs sous-transactions
 */
export function splitTransaction(
  originalTransaction: Transaction,
  subTransactions: Partial<Transaction>[],
  hideOriginal: boolean,
  note?: string
): { updatedOriginal: Transaction, children: Transaction[] } { // Retour structuré plus clair
  
  const children: Transaction[] = subTransactions.map((subTxn) => ({
    ...originalTransaction, // On garde tout (date, compte, etc.)
    ...subTxn,             // On écrase avec les nouvelles valeurs (montant, cat)
    id: crypto.randomUUID(),
    parentTransactionId: originalTransaction.id,
    childTransactionIds: [], // Un enfant n'a pas d'enfants
    isHidden: false,         // Un enfant doit être visible
  } as Transaction));
  
  const updatedOriginal: Transaction = {
    ...originalTransaction,
    childTransactionIds: children.map(c => c.id),
    isHidden: hideOriginal,
    splitNote: note,
  };
  
  return { updatedOriginal, children };
}

/**
 * Filtre les transactions masquées
 */
export function filterVisibleTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(t => !t.isHidden);
}

/**
 * Récupère toutes les sous-transactions d'une transaction parente
 */
export function getChildTransactions(
  parentId: string,
  allTransactions: Transaction[]
): Transaction[] {
  return allTransactions.filter(t => t.parentTransactionId === parentId);
}

/**
 * Récupère la transaction parente d'une sous-transaction
 */
export function getParentTransaction(
  childTransaction: Transaction,
  allTransactions: Transaction[]
): Transaction | null {
  if (!childTransaction.parentTransactionId) return null;
  return allTransactions.find(t => t.id === childTransaction.parentTransactionId) || null;
}

/**
 * Vérifie si une transaction est une sous-transaction
 */
export function isChildTransaction(transaction: Transaction): boolean {
  return !!transaction.parentTransactionId;
}

/**
 * Vérifie si une transaction est une transaction parente (divisée)
 */
export function isParentTransaction(transaction: Transaction): boolean {
  return !!transaction.childTransactionIds && transaction.childTransactionIds.length > 0;
}
