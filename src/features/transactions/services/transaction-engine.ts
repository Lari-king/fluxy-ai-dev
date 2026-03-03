import { Transaction } from '../types';
import { stringIncludes } from '@/utils/stringUtils';

// --- TYPES ---
export interface TransactionAudit {
  isChild: boolean;
  isParent: boolean;
  parentId?: string;
  childCount: number;
  siblingCount: number;
}

// --- 1. MOTEUR DE FILTRAGE ---
export const filterTransactions = (transactions: Transaction[], filters: any): Transaction[] => {
  if (!transactions) return [];
  return transactions.filter(t => {
    const merchant = (t as any).merchant || '';
    const notes = t.notes || '';
    const description = t.description || '';

    if (filters.search && !stringIncludes(description + merchant + notes, filters.search)) return false;
    if (filters.category && filters.category !== 'all' && t.category !== filters.category) return false;
    if (filters.person && filters.person !== 'all' && t.person !== filters.person) return false;
    
    // Filtre Insight (Doublons, Sans catégorie, etc.)
    if (filters.insightType === 'uncategorized' && t.category && t.category !== 'Non classé') return false;
    
    // Dates : Assurez-vous que filters.dateRange.end est bien à 2026+ pour voir le futur
    if (filters.dateRange?.start && t.date < filters.dateRange.start) return false;
    if (filters.dateRange?.end && t.date > filters.dateRange.end) return false;

    return true;
  });
};

// --- 2. LOGIQUE DE GROUPEMENT (Transférée de la Table) ---
export const groupTransactionsByRecurrence = (transactions: Transaction[]) => {
  const groups: Record<string, Transaction[]> = {};
  const standalone: Transaction[] = [];

  transactions.forEach(txn => {
    if (txn.recurringGroupId) {
      if (!groups[txn.recurringGroupId]) groups[txn.recurringGroupId] = [];
      groups[txn.recurringGroupId].push(txn);
    } else {
      standalone.push(txn);
    }
  });
  return { groups, standalone };
};

// --- 3. MÉTADONNÉES DE SPLIT (Transférée de la Table) ---
export const getTransactionsMetadata = (transactions: Transaction[]) => {
  const metadata = new Map<string, { isChild: boolean; isParent: boolean; childCount: number }>();
  const existingIds = new Set(transactions.map(t => t.id));

  transactions.forEach(txn => {
    const isChild = !!(txn as any).parentTransactionId;
    const childIds = (txn as any).childTransactionIds || [];
    const existingChildren = childIds.filter((id: string) => existingIds.has(id));
    
    metadata.set(txn.id, {
      isChild,
      isParent: existingChildren.length > 0,
      childCount: existingChildren.length
    });
  });
  return metadata;
};

// --- 4. PRÉPARATION DU SPLIT ---
export const prepareSplitTransactions = (
  original: Transaction,
  subData: any[],
  note?: string
): Transaction[] => {
  return subData.map(sub => ({
    ...original,
    id: crypto.randomUUID(),
    description: sub.description || original.description,
    amount: sub.amount || 0,
    category: sub.category || original.category,
    subCategory: (sub as any).subCategory,
    parentTransactionId: original.id,
    notes: note || sub.notes || '',
    createdAt: new Date().toISOString()
  } as Transaction));
};

// --- 5. AUDIT ---
export const getTransactionAuditInfo = (transaction: Transaction, all: Transaction[]): TransactionAudit => {
  const children = all.filter(t => (t as any).parentTransactionId === transaction.id);
  const parentId = (transaction as any).parentTransactionId;
  return {
    isChild: !!parentId,
    isParent: children.length > 0,
    parentId,
    childCount: children.length,
    siblingCount: parentId ? all.filter(t => (t as any).parentTransactionId === parentId).length : 0
  };
};

export const calculateTotals = (transactions: Transaction[]) => {
  const active = transactions.filter(t => !t.isHidden);
  return {
    total: active.reduce((s, t) => s + t.amount, 0),
    income: active.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    expenses: active.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)
  };
};
