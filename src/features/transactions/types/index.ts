/**
 * 📋 TYPES CENTRALISÉS - MODULE TRANSACTIONS
 * Tous les types utilisés dans le module transactions
 */

import { Transaction as BaseTransaction } from '@/utils/csv-parser';

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface Transaction extends BaseTransaction {
  personId?: string;
  isPending?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  lastModified?: string;
  isHidden?: boolean;
  parentTransactionId?: string;
  childTransactionIds?: string[];
  subCategory?: string;
  splitNote?: string;
  emoji?: string; // ✅ Ajouté pour les composants intelligence/recurring
  createdAt?: string; // ✅ Déjà dans BaseTransaction mais explicite ici
  type?: 'online' | 'physical'; // ✅ Ajouté pour TransactionFormDialog
  auditInfo?: {
    wasChildOf?: {
      description: string;
      amount: number;
      date: string;
      deletedAt: string;
    };
  };
}

export interface TransactionMetadata {
  isChild: boolean;
  isParent: boolean;
  childCount: number;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface FilterState {
  searchTerm: string;
  category: string;
  subCategory: string;
  type: string;
  country: string;
  person: string;
  amountMin: string;
  amountMax: string;
  dateFrom: string;
  dateTo: string;
  recurring: string;
  splitStatus: 'all' | 'split' | 'not_split';
  insightType?: string;
  transactionIds?: string[];
}

export interface EngineFilters {
  search?: string;
  category?: string;
  person?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  amountMin?: number | null; // 🆕 Filtre montant minimum
  amountMax?: number | null; // 🆕 Filtre montant maximum
  splitStatus?: 'all' | 'split' | 'not_split';
  insightType?: string;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface TransactionTotals {
  total: number;
  income: number;
  expenses: number;
}

// ============================================================================
// TABLE TYPES
// ============================================================================

export type SortField = 'date' | 'description' | 'amount' | 'category' | 'subCategory' | 'person';
export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  field: SortField;
  direction: SortDirection;
}

// ============================================================================
// IMPORT TYPES
// ============================================================================

export interface DuplicateResult {
  transaction: Transaction;
  isDuplicate: boolean;
  confidence: 'high' | 'medium' | 'none';
  reason?: string;
}

export interface ImportPreviewData {
  results: DuplicateResult[];
  rawData: {
    headers: string[];
    rows: string[][];
  };
}

// ============================================================================
// SPLIT TRANSACTION TYPES
// ============================================================================

export interface SubTransaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  subCategory?: string;
}
