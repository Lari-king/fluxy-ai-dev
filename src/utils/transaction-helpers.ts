/**
 * 🛠️ TRANSACTION HELPERS
 * Fusion de la logique métier historique et des nouveaux utilitaires UI
 */

import { Transaction } from '@/features/transactions/types';

/**
 * ✅ Vérifie si une transaction est à venir (date dans le futur)
 */
export function isUpcomingTransaction(transaction: Transaction): boolean {
  if (!transaction.date) return false;
  const txnDate = new Date(transaction.date);
  const today = new Date();
  
  // Reset des heures pour une comparaison de date pure
  today.setHours(0, 0, 0, 0);
  txnDate.setHours(0, 0, 0, 0);
  
  return txnDate > today;
}

/**
 * ✅ Filtre pour exclure les transactions futures des calculs actuels
 */
export function filterCompletedTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(txn => !isUpcomingTransaction(txn));
}

/**
 * ✅ Récupère uniquement les transactions futures
 */
export function getUpcomingTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(txn => isUpcomingTransaction(txn));
}

/**
 * ✅ Détection intelligente des récurrences (Fusion de l'ancien et du nouveau)
 * Supporte le champ isRecurring, le groupId, et les fréquences textuelles.
 */
export function isRecurringTransaction(transaction: Transaction): boolean {
  return (
    transaction.isRecurring === true || 
    !!(transaction as any).recurringGroupId || 
    !!(transaction as any).frequency // Support de l'ancienne version
  );
}

/**
 * 🆕 Calcule le nombre de jours écoulés depuis une date
 */
export function daysAgo(date: string | Date): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 0;
  
  const diffTime = Date.now() - dateObj.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 🆕 Formate le temps de manière relative (ex: "Il y a 2 jours")
 */
export function relativeTime(days: number): string {
  if (days < 0) return "Dans le futur";
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `Il y a ${months} mois`;
  }
  const years = Math.floor(days / 365);
  return `Il y a ${years} an${years > 1 ? 's' : ''}`;
}

/**
 * 🆕 Utilitaire indispensable pour fusionner les classes Tailwind proprement
 * Utilisé massivement dans les nouveaux composants UI
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 🆕 Génère un ID unique robuste
 * Utilisé lors de la création de transactions manuelles ou split
 */
export function generateId(prefix = 'txn'): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/**
 * 🆕 Normalise les montants (Gestion des virgules françaises et points)
 * Crucial pour éviter le PC qui ventile à cause de NaN
 */
export function parseSafeAmount(amount: string | number): number {
  if (typeof amount === 'number') return amount;
  const cleaned = amount.replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}