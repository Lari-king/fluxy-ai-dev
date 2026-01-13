/**
 * 🔀 SPLIT TRANSACTION HELPERS
 * 
 * Utilitaires pour gérer les transactions divisées
 */

import { Transaction } from '../../contexts/DataContext';

/**
 * Divise une transaction en plusieurs sous-transactions
 */
export function splitTransaction(
  originalTransaction: Transaction,
  subTransactions: Partial<Transaction>[],
  hideOriginal: boolean,
  note?: string
): Transaction[] {
  const childIds = subTransactions.map(() => crypto.randomUUID());
  
  // Créer les sous-transactions
  const children: Transaction[] = subTransactions.map((subTxn, index) => ({
    ...originalTransaction,
    ...subTxn,
    id: childIds[index],
    parentTransactionId: originalTransaction.id,
  } as Transaction));
  
  // Mettre à jour la transaction originale
  const updatedOriginal: Transaction = {
    ...originalTransaction,
    childTransactionIds: childIds,
    isHidden: hideOriginal,
    splitNote: note,
  };
  
  return [updatedOriginal, ...children];
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
