/**
 * 💰 TRANSACTIONS VIEW - Container Principal
 * Version Corrigée : Anti-Boucle IA & Fix Types
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTransactions } from "../hooks/useTransactions";
import { Transaction, ImportPreviewData } from "../types";

// Composants
import { CommandBar } from "../components/CommandBar";
import { PaginationControls } from "../components/PaginationControls";
import { TransactionTable } from "../components/TransactionTable";
import { RightPanelDetails } from "../components/RightPanelDetails";
import { LeftPanel } from "../components/LeftPanel";

// Modales
import { ImportModal } from "../modals/ImportModal";
import { TransactionFormDialog } from "../modals/TransactionFormDialog";
import { SplitTransactionDialog } from "../modals/SplitTransactionDialog";
import { CSVPreviewDialog } from "../modals/CSVPreviewDialog"; // ✅ Import rétabli

export function TransactionsView() {
  const hooks = useTransactions();
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🛠️ PONT DE DÉBOGAGE GLOBAL
  useEffect(() => {
    if (hooks.allTransactions?.length > 0) {
      (window as any).debugData = {
        all: hooks.allTransactions,
        filtered: hooks.transactions,
        filters: hooks.filters,
        currentPage: hooks.currentPage
      };
    }
  }, [hooks.allTransactions, hooks.transactions, hooks.filters, hooks.currentPage]);

  // États des modales et panneaux
  const [showImport, setShowImport] = useState(false);
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState<ImportPreviewData | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTxForPanel, setSelectedTxForPanel] = useState<Transaction | null>(null);
  const [splittingTransaction, setSplittingTransaction] = useState<Transaction | null>(null);

  // 🆕 Synchronisation du panneau de détails (Fix updatedAt)
  useEffect(() => {
    if (selectedTxForPanel) {
      const freshTx = hooks.allTransactions.find(t => t.id === selectedTxForPanel.id);
      // On compare les contenus si updatedAt n'existe pas
      if (freshTx && JSON.stringify(freshTx) !== JSON.stringify(selectedTxForPanel)) {
        setSelectedTxForPanel(freshTx);
      }
    }
  }, [hooks.allTransactions, selectedTxForPanel]);

  // Calcul du solde actuel mémoïsé
  const currentDatabaseBalance = useMemo(() => {
    return hooks.allTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [hooks.allTransactions]);

  // Handlers stables
  const closeDetails = useCallback(() => setSelectedTxForPanel(null), []);
  const closeForm = useCallback(() => setEditingTransaction(null), []);
  const closeSplit = useCallback(() => setSplittingTransaction(null), []);

  const handleNavigateToTx = useCallback((txId: string) => {
    const targetTx = hooks.allTransactions.find(t => t.id === txId);
    if (targetTx) {
      hooks.setFilters({ ...hooks.filters, searchTerm: "" });
      setSelectedTxForPanel(targetTx);
      setTimeout(() => {
        const element = document.querySelector(`[data-transaction-id="${txId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-cyan-500/20');
          setTimeout(() => element.classList.remove('bg-cyan-500/20'), 2000);
        }
      }, 150);
    }
  }, [hooks.allTransactions, hooks.filters, hooks.setFilters]);

  /**
   * 🛡️ HANDLERS FILTRES IA - AVEC DEBOUNCE ANTI-VENTILATION
   */
  const onFilterByRecurring = useCallback((ids: string[]) => {
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);

    filterTimeoutRef.current = setTimeout(() => {
      console.log("🎯 [IA] Injection filtrée (Debounced 800ms)");
      hooks.setFilters({ 
        ...hooks.filters, 
        searchTerm: "", 
        category: "all", 
        // @ts-ignore
        transactionIds: ids 
      });
    }, 800);
  }, [hooks.filters, hooks.setFilters]);

  const onFilterByAnomaly = useCallback((value: any) => {
    hooks.setFilters({ ...hooks.filters, searchTerm: value as string });
  }, [hooks.filters, hooks.setFilters]);

  const handleSplitWrapper = useCallback(
    async (original: Transaction, subTransactions: Transaction[], hideOriginal: boolean) => {
      const preparedSubTransactions = subTransactions.map(sub => ({
        ...sub,
        date: sub.date || original.date,
        id: sub.id || crypto.randomUUID()
      }));
      try {
        await hooks.handleSplit(original.id, preparedSubTransactions, hideOriginal);
      } catch (error) {
        console.error("❌ Erreur lors du split:", error);
      }
    },
    [hooks]
  );

  const handleShowPreview = useCallback((data: ImportPreviewData) => {
    setCsvPreviewData(data);
    setShowCSVPreview(true);
    setShowImport(false);
  }, []);

  const handleConfirmImport = useCallback(async (transactions: Transaction[]) => {
    const normalized = transactions.map(tx => ({
      ...tx,
      description: tx.description || (tx as any).merchant || 'Sans description',
      category: typeof tx.category === 'string' ? tx.category : (tx.category as any)?.name || 'Non catégorisé',
      amount: Number(tx.amount) || 0,
      isHidden: tx.isHidden ?? false
    }));

    try {
      await hooks.handleImport(normalized);
      setShowCSVPreview(false);
      setCsvPreviewData(null);
    } catch (error) {
      console.error("❌ ÉCHEC IMPORT :", error);
    }
  }, [hooks]);

  const handleCancelPreview = useCallback(() => {
    setShowCSVPreview(false);
    setCsvPreviewData(null);
  }, []);

  return (
    <div className="relative flex flex-col h-screen w-full overflow-hidden bg-[#050505] text-white">
      <div className="z-50 border-b border-white/5 bg-[#050505]">
        <CommandBar
          filters={hooks.filters}
          onFilterChange={hooks.setFilters}
          onAddManual={() => setEditingTransaction({} as Transaction)}
          onImport={() => setShowImport(true)}
          categories={hooks.categories}
          people={hooks.people}
          transactions={hooks.allTransactions}
          selectedCount={hooks.selectedCount}
          onClearSelection={hooks.clearSelection}
          onBulkDelete={() => hooks.handleBulkDelete(hooks.selectedIds)}
          onBulkCategorize={(cat) => hooks.handleBulkCategorize(hooks.selectedIds, cat)}
          onBulkCategorizeSubCategory={(subCat) => hooks.handleBulkCategorizeSubCategory(hooks.selectedIds, subCat)}
          onBulkAssignPerson={(personId) => hooks.handleBulkAssignPerson(hooks.selectedIds, personId)}
          onBulkSetStatus={(status) => hooks.handleBulkSetStatus(hooks.selectedIds, status)}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <LeftPanel
          onFilterByTransaction={handleNavigateToTx}
          onFilterByRecurring={onFilterByRecurring}
          onFilterByAnomaly={onFilterByAnomaly}
        />

        <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden">
          {showCSVPreview && csvPreviewData ? (
            <CSVPreviewDialog
              data={csvPreviewData}
              onConfirm={handleConfirmImport}
              onClose={handleCancelPreview}
              currentDatabaseBalance={currentDatabaseBalance}
            />
          ) : (
            <>
              <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                <TransactionTable
                  transactions={hooks.transactions}
                  selectedIds={hooks.selectedIds}
                  onToggleSelection={hooks.toggleSelection}
                  onToggleSelectAll={hooks.toggleSelectAll}
                  onEdit={setEditingTransaction}
                  onDelete={hooks.handleDelete}
                  onSplit={setSplittingTransaction}
                  onView={setSelectedTxForPanel}
                  categories={hooks.categories}
                  people={hooks.people}
                />
              </div>

              <div className="z-20 border-t border-white/5 bg-[#080808] p-4">
                <PaginationControls
                  currentPage={hooks.currentPage}
                  totalPages={hooks.totalPages}
                  totalItems={hooks.totalCount}
                  itemsPerPage={hooks.itemsPerPage}
                  totalAmount={hooks.totalAmount}
                  onPageChange={hooks.setCurrentPage}
                  onItemsPerPageChange={hooks.setItemsPerPage}
                />
              </div>
            </>
          )}
        </div>

        <AnimatePresence>
          {selectedTxForPanel && (
            <motion.div
              initial={{ x: 450 }} animate={{ x: 0 }} exit={{ x: 450 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-40 w-[450px] border-l border-white/10 bg-[#0A0A0A] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <RightPanelDetails
                transaction={selectedTxForPanel}
                onClose={closeDetails}
                onEdit={setEditingTransaction}
                onDelete={hooks.handleDelete}
                onSplit={setSplittingTransaction}
                onNavigateToParent={handleNavigateToTx}
                onNavigateToChildren={(_parentId, childIds) => {
                  if (childIds.length > 0) handleNavigateToTx(childIds[0]);
                }}
                onToggleHidden={async (id, currentStatus) => {
                  const newStatus = !currentStatus;
                  await hooks.handleUpdate(id, { isHidden: newStatus });
                  setSelectedTxForPanel(prev => prev ? { ...prev, isHidden: newStatus } : null);
                }}
                categories={hooks.categories}
                people={hooks.people}
                allTransactions={hooks.allTransactions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onShowPreview={handleShowPreview}
        currentDatabaseBalance={currentDatabaseBalance}
      />

      <TransactionFormDialog
        key={editingTransaction?.id || 'new-transaction-form'}
        open={!!editingTransaction}
        onClose={closeForm}
        transaction={editingTransaction}
        onSave={() => {}} 
      />

      <SplitTransactionDialog
        open={!!splittingTransaction}
        onClose={closeSplit}
        transaction={splittingTransaction}
        onSplit={handleSplitWrapper}
      />
    </div>
  );
}