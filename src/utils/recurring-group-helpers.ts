import { Transaction } from '@/utils/csv-parser';

/**
 * Groupe les transactions par recurringGroupId et retourne une liste dédupliquée
 * Chaque groupe est représenté par une seule transaction (la plus récente)
 */
export function deduplicateRecurringTransactions(transactions: Transaction[]): {
  transaction: Transaction;
  groupSize: number;
  allTransactions: Transaction[];
}[] {
  const grouped = new Map<string, Transaction[]>();
  const standalone: Transaction[] = [];

  // Grouper les transactions
  for (const txn of transactions) {
    if (txn.recurringGroupId) {
      const existing = grouped.get(txn.recurringGroupId) || [];
      existing.push(txn);
      grouped.set(txn.recurringGroupId, existing);
    } else {
      standalone.push(txn);
    }
  }

  // Créer la liste dédupliquée
  const result: {
    transaction: Transaction;
    groupSize: number;
    allTransactions: Transaction[];
  }[] = [];

  // Ajouter les groupes (représentés par la transaction la plus récente)
  for (const [groupId, groupTransactions] of grouped.entries()) {
    // Trier par date (plus récent en premier)
    const sorted = [...groupTransactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    result.push({
      transaction: sorted[0], // Transaction représentante (la plus récente)
      groupSize: groupTransactions.length,
      allTransactions: sorted,
    });
  }

  // Ajouter les transactions standalone
  for (const txn of standalone) {
    result.push({
      transaction: txn,
      groupSize: 1,
      allTransactions: [txn],
    });
  }

  return result;
}

/**
 * Vérifie si une transaction fait partie d'un groupe récurrent
 */
export function isInRecurringGroup(transaction: Transaction): boolean {
  return !!transaction.recurringGroupId;
}

/**
 * Obtient toutes les transactions d'un groupe récurrent
 */
export function getRecurringGroupTransactions(
  transactions: Transaction[],
  groupId: string
): Transaction[] {
  return transactions
    .filter(txn => txn.recurringGroupId === groupId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Calcule le montant total d'un groupe de transactions récurrentes
 */
export function calculateGroupTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, txn) => sum + txn.amount, 0);
}

/**
 * Obtient les statistiques d'un groupe récurrent
 */
export interface RecurringGroupStats {
  totalAmount: number;
  averageAmount: number;
  count: number;
  firstDate: string;
  lastDate: string;
  frequency: 'monthly' | 'quarterly' | 'yearly' | null;
}

export function getRecurringGroupStats(transactions: Transaction[]): RecurringGroupStats {
  if (transactions.length === 0) {
    return {
      totalAmount: 0,
      averageAmount: 0,
      count: 0,
      firstDate: '',
      lastDate: '',
      frequency: null,
    };
  }

  const sorted = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
  const averageAmount = totalAmount / transactions.length;

  return {
    totalAmount,
    averageAmount,
    count: transactions.length,
    firstDate: sorted[0].date,
    lastDate: sorted[sorted.length - 1].date,
    frequency: transactions[0].frequency || null,
  };
}

/**
 * Formate l'affichage de la période d'un groupe récurrent
 */
export function formatRecurringPeriod(firstDate: string, lastDate: string): string {
  const first = new Date(firstDate);
  const last = new Date(lastDate);
  
  const firstFormatted = first.toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  });
  
  const lastFormatted = last.toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  });
  
  if (firstFormatted === lastFormatted) {
    return firstFormatted;
  }
  
  return `${firstFormatted} - ${lastFormatted}`;
}
