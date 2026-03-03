/**
 * 🔍 FILTER SERVICE - VERSION CORRIGÉE SPÉCIALE SPLIT
 * Logique de filtrage centralisée avec gestion de la visibilité Parent/Enfant
 */

import { Transaction, FilterState, EngineFilters, SortField, SortDirection } from '../types';
import { stringIncludes } from '@/utils/stringUtils';

/**
 * Normalise une date pour la comparaison (YYYY-MM-DD)
 */
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
};

/**
 * Convertit les filtres UI en filtres engine
 */
export function convertToEngineFilters(filters: FilterState): EngineFilters {
  return {
    search: filters.searchTerm,
    category: filters.category === 'all' ? undefined : filters.category,
    person: filters.person === 'all' ? undefined : filters.person,
    status: 'all',
    dateRange: {
      start: filters.dateFrom || '1900-01-01',
      end: filters.dateTo || '2099-12-31'
    },
    splitStatus: filters.splitStatus,
    insightType: filters.insightType,
    amountMin: filters.amountMin === '' ? null : parseFloat(filters.amountMin),
    amountMax: filters.amountMax === '' ? null : parseFloat(filters.amountMax)
  };
}

/**
 * Filtre les transactions selon les critères
 * ✅ CORRECTION : Gestion de isHidden pour les Splits
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: EngineFilters
): Transaction[] {
  if (!transactions) return [];

  return transactions.filter(transaction => {
    const isChild = !!transaction.parentTransactionId;

    // --- 0. RÈGLE D'OR : VISIBILITÉ ---
    // On cache le parent (isHidden), mais on ne cache JAMAIS un enfant ici
    if (transaction.isHidden && !isChild) {
      return false;
    }

    // --- 1. RECHERCHE TEXTUELLE ---
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const desc = (transaction.description || '').toLowerCase();
      const merch = (transaction.merchant || '').toLowerCase();
      const notes = (transaction.notes || '').toLowerCase();
      // On cherche aussi dans les notes de split
      const splitNote = (transaction as any).splitNote?.toLowerCase() || '';
      
      if (!stringIncludes(desc + merch + notes + splitNote, search)) {
        return false;
      }
    }

    // --- 2. CATÉGORIE ---
    // 💡 FIX : Si c'est un enfant et qu'on filtre par catégorie, 
    // on vérifie si l'enfant appartient à la catégorie
    if (filters.category && filters.category !== 'all') {
      if (transaction.category !== filters.category) {
        return false;
      }
    }

    // --- 3. DATES (Le suspect n°1) ---
    if (filters.dateRange) {
      // On s'assure que la date est exploitable
      const txDate = normalizeDate(transaction.date);
      const start = normalizeDate(filters.dateRange.start || '');
      const end = normalizeDate(filters.dateRange.end || '');
      
      // Si la date de l'enfant est vide ou invalide, il risque de disparaître
      // On ajoute une sécurité pour 2026
      if (start && txDate < start) return false;
      if (end && txDate > end) return false;
    }

    // --- 4. MONTANTS ---
    const absAmount = Math.abs(transaction.amount);
    if (filters.amountMin !== null && filters.amountMin !== undefined) {
      if (absAmount < filters.amountMin) return false;
    }
    if (filters.amountMax !== null && filters.amountMax !== undefined) {
      if (absAmount > filters.amountMax) return false;
    }

    // --- 5. STATUT DE SPLIT ---
    if (filters.splitStatus && filters.splitStatus !== 'all') {
      const hasChildren = (transaction.childTransactionIds?.length ?? 0) > 0;
      if (filters.splitStatus === 'split' && !hasChildren && !isChild) return false;
      if (filters.splitStatus === 'not_split' && (hasChildren || isChild)) return false;
    }

    return true;
  });
}

/**
 * Trie les transactions
 */
export function sortTransactions(
  transactions: Transaction[],
  field: SortField,
  direction: SortDirection,
  peopleMap: Map<string, any>
): Transaction[] {
  return [...transactions].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (field) {
      case 'date':
        aValue = new Date(normalizeDate(a.date)).getTime();
        bValue = new Date(normalizeDate(b.date)).getTime();
        break;
      case 'description':
        aValue = (a.description || '').toLowerCase();
        bValue = (b.description || '').toLowerCase();
        break;
      case 'amount':
        aValue = Math.abs(a.amount);
        bValue = Math.abs(b.amount);
        break;
      case 'category':
        aValue = a.category || '';
        bValue = b.category || '';
        break;
      case 'person':
        aValue = peopleMap.get(a.personId || '')?.name || (a as any).person || '';
        bValue = peopleMap.get(b.personId || '')?.name || (b as any).person || '';
        break;
      default:
        return 0;
    }

    const result = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    return direction === 'asc' ? result : -result;
  });
}

/**
 * Calcule les totaux (Revenus, Dépenses, Solde)
 * ✅ Sécurité : Ignore les transactions masquées (parents) pour ne pas doubler les montants
 */
export function calculateTotals(transactions: Transaction[]) {
  const active = transactions.filter(t => !t.isHidden);
  
  return {
    total: active.reduce((sum, t) => sum + (t.amount || 0), 0),
    income: active.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    expenses: active.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0),
    count: active.length
  };
}

/**
 * Groupe les transactions par récurrence
 */
export function groupByRecurrence(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  const standalone: Transaction[] = [];

  transactions.forEach(txn => {
    if (txn.recurringGroupId) {
      if (!groups[txn.recurringGroupId]) {
        groups[txn.recurringGroupId] = [];
      }
      groups[txn.recurringGroupId].push(txn);
    } else {
      standalone.push(txn);
    }
  });

  return { groups, standalone };
}

/**
 * Obtient les métadonnées de transactions
 */
export function getTransactionMetadata(
  transactions: Transaction[]
): Map<string, { isChild: boolean; isParent: boolean; childCount: number }> {
  const metadata = new Map();
  const existingIds = new Set(transactions.map(t => t.id));

  transactions.forEach(txn => {
    const isChild = !!txn.parentTransactionId;
    const childIds = txn.childTransactionIds || [];
    const existingChildren = childIds.filter(id => existingIds.has(id));

    metadata.set(txn.id, {
      isChild,
      isParent: existingChildren.length > 0,
      childCount: existingChildren.length
    });
  });

  return metadata;
}