/**
 * 💼 HOOK PRINCIPAL TRANSACTIONS - VERSION COMPLÈTE & RÉPARÉE
 * Correction : Passage des catégories au filtre pour mapping ID/Nom
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Transaction } from '../types';
import { toast } from 'sonner';
import { useTransactionFilters } from './useTransactionFilters';
import { useTransactionSelection } from './useTransactionSelection';

export function useTransactions() {
  const context = useData();
  
  // 🛡️ Extraction sécurisée des données et méthodes du contexte
  const { 
    transactions = [], 
    categories = [], 
    people = [], 
    handleImport,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateTransactions 
  } = context;

  // États locaux pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Hooks de logique métier (Filtrage et Sélection)
  // 🔥 FIX : On passe 'categories' ici pour que le filtrage par sous-catégorie fonctionne !
  const filterLogic = useTransactionFilters(transactions, categories);
  const selectionLogic = useTransactionSelection();

  // 🔄 SYNCHRONISATION : On force le retour à la page 1 si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filterLogic.filters, transactions.length]);

  // ============================================================================
  // 🧠 LOGIQUE D'AFFICHAGE ET TRI
  // ============================================================================
  
  const processedTransactions = useMemo(() => {
    const filtered = filterLogic.filteredTransactions || [];
    
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      // Tri par date descendante
      if (dateB !== dateA) return dateB - dateA;
      
      // Maintien de la hiérarchie Parent/Enfant pour les transactions divisées
      if (a.parentTransactionId === b.id) return 1;
      if (b.parentTransactionId === a.id) return -1;
      return 0;
    });
  }, [filterLogic.filteredTransactions]);

  // Calcul de la pagination
  const totalPages = useMemo(() => {
    const count = processedTransactions.length;
    return count === 0 ? 1 : Math.ceil(count / itemsPerPage);
  }, [processedTransactions.length, itemsPerPage]);
  
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedTransactions.slice(start, start + itemsPerPage);
  }, [processedTransactions, currentPage, itemsPerPage]);

  // ============================================================================
  // ⚡ ACTIONS UNITAIRES
  // ============================================================================

  const handleDelete = useCallback(async (id: string) => {
    if (deleteTransaction) {
      await deleteTransaction(id);
      toast.success("Transaction supprimée");
    }
  }, [deleteTransaction]);

  const handleUpdate = useCallback(async (id: string, updates: Partial<Transaction>) => {
    if (updateTransaction) {
      await updateTransaction(id, updates);
    }
  }, [updateTransaction]);

  // ============================================================================
  // 🚀 ACTIONS GROUPÉES (BULK)
  // ============================================================================

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    if (deleteTransaction && ids.length > 0) {
      try {
        await Promise.all(ids.map(id => deleteTransaction(id)));
        selectionLogic.clearSelection();
        toast.success(`${ids.length} transactions supprimées`);
      } catch (error) {
        toast.error("Erreur lors de la suppression groupée");
      }
    }
  }, [deleteTransaction, selectionLogic]);

  const handleBulkCategorize = useCallback(async (ids: string[], category: string) => {
    if (updateTransaction && ids.length > 0) {
      await Promise.all(ids.map(id => updateTransaction(id, { category })));
      selectionLogic.clearSelection();
      toast.success(`${ids.length} transactions catégorisées`);
    }
  }, [updateTransaction, selectionLogic]);

  const handleBulkCategorizeSubCategory = useCallback(async (ids: string[], subCategory: string) => {
    if (updateTransaction && ids.length > 0) {
      await Promise.all(ids.map(id => updateTransaction(id, { subCategory } as any)));
      selectionLogic.clearSelection();
      toast.success(`${ids.length} sous-catégories mises à jour`);
    }
  }, [updateTransaction, selectionLogic]);

  const handleBulkAssignPerson = useCallback(async (ids: string[], personId: string) => {
    if (updateTransaction && ids.length > 0) {
      await Promise.all(ids.map(id => updateTransaction(id, { personId })));
      selectionLogic.clearSelection();
      toast.success(`${ids.length} relations assignées`);
    }
  }, [updateTransaction, selectionLogic]);

  const handleBulkSetStatus = useCallback(async (ids: string[], status: string) => {
    if (updateTransaction && ids.length > 0) {
      await Promise.all(ids.map(id => updateTransaction(id, { status })));
      selectionLogic.clearSelection();
      toast.success(`Statuts mis à jour pour ${ids.length} opérations`);
    }
  }, [updateTransaction, selectionLogic]);

  // ============================================================================
  // 🔀 SPLIT TRANSACTION (LOGIQUE ATOMIQUE)
  // ============================================================================

  const handleSplit = useCallback(async (
    originalId: string, 
    newSubTransactions: Transaction[], 
    hideOriginal: boolean
  ) => {
    try {
      const original = transactions.find(t => t.id === originalId);
      if (!original) throw new Error("Transaction originale introuvable");

      const childIds = newSubTransactions.map(t => t.id || crypto.randomUUID());
      
      const children = newSubTransactions.map((sub, index) => ({
        ...original,
        ...sub,
        id: childIds[index],
        parentTransactionId: originalId,
        childTransactionIds: [],
        isHidden: false,
        lastModified: new Date().toISOString()
      }));

      if (updateTransactions) {
        const updatedOriginals = transactions.map(t => 
          t.id === originalId 
            ? { ...t, isHidden: hideOriginal, childTransactionIds: childIds, lastModified: new Date().toISOString() } 
            : t
        );
        await updateTransactions([...children, ...updatedOriginals]);
        toast.success(`${children.length} sous-opérations créées`);
      }
    } catch (error) {
      console.error("Split Error:", error);
      toast.error("Erreur lors de la division");
    }
  }, [transactions, updateTransactions]);

  // ============================================================================
  // 📦 RETOUR
  // ============================================================================

  return {
    transactions: paginatedTransactions, 
    allTransactions: transactions,       
    categories,
    people,
    
    filters: filterLogic.filters,
    setFilters: filterLogic.setFilters,
    resetFilters: filterLogic.resetFilters,
    
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    totalCount: processedTransactions.length,
    
    totalAmount: filterLogic.totals?.total || 0,
    stats: filterLogic.totals,
    
    selectedIds: selectionLogic.selectedIds,
    setSelectedIds: selectionLogic.selectMultiple,
    toggleSelection: selectionLogic.toggleSelection,
    toggleSelectAll: selectionLogic.toggleSelectAll,
    clearSelection: selectionLogic.clearSelection,
    selectedCount: selectionLogic.selectedCount,
    
    handleDelete,
    handleBulkDelete,
    handleUpdate,
    handleSplit,
    handleBulkCategorize,
    handleBulkCategorizeSubCategory,
    handleBulkAssignPerson,
    handleBulkSetStatus,
    handleManualAdd: addTransaction,
    handleImport: handleImport
  };
}