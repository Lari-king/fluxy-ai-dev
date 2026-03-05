/**
 * 💰 TRANSACTIONS VIEW - VERSION FINALE (FIX TYPES SPLIT)
 */

import { useState, useCallback, useMemo, useEffect, useRef, startTransition } from "react";
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
import { CSVPreviewDialog } from "../modals/CSVPreviewDialog";

export function TransactionsView() {
  const hooks = useTransactions();
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState<ImportPreviewData | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTxForPanel, setSelectedTxForPanel] = useState<Transaction | null>(null);
  const [splittingTransaction, setSplittingTransaction] = useState<Transaction | null>(null);

  const hasActiveFilters = useMemo(() => {
    const txIds = (hooks.filters as any).transactionIds;
    return hooks.filters.searchTerm !== "" || (Array.isArray(txIds) && txIds.length > 0);
  }, [hooks.filters]);

  const currentDatabaseBalance = useMemo(() => {
    return hooks.allTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [hooks.allTransactions]);

  const closeDetails = useCallback(() => setSelectedTxForPanel(null), []);
  const closeForm = useCallback(() => setEditingTransaction(null), []);
  const closeSplit = useCallback(() => setSplittingTransaction(null), []);

  /**
   * 🛠️ HANDLER SPLIT CORRIGÉ (Résout les erreurs 2554 et 2322)
   * On adapte la signature pour correspondre à SplitTransactionDialog
   */
  const handleSplitWrapper = useCallback((
    original: Transaction, 
    subTransactions: Transaction[], 
    hideOriginal: boolean = true // Valeur par défaut pour le 3ème argument
  ) => {
    // On appelle le hook avec les 3 arguments attendus
    hooks.handleSplit(original.id, subTransactions, hideOriginal);
    closeSplit();
  }, [hooks, closeSplit]);

  const handleClearFilters = useCallback(() => {
    startTransition(() => {
      hooks.setFilters({ 
        ...hooks.filters, 
        searchTerm: "", 
        category: "all", 
        // @ts-ignore
        transactionIds: [] 
      });
      hooks.setCurrentPage(1);
    });
  }, [hooks]);

  const onFilterByRecurring = useCallback((ids: string[]) => {
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        hooks.setFilters({ ...hooks.filters, searchTerm: "", transactionIds: ids } as any);
        hooks.setCurrentPage(1);
      });
    }, 150);
  }, [hooks]);

  const handleNavigateToTx = useCallback((txId: string) => {
    const targetTx = hooks.allTransactions.find(t => t.id === txId);
    if (targetTx) {
      handleClearFilters();
      setSelectedTxForPanel(targetTx);
      setTimeout(() => {
        const element = document.querySelector(`[data-txid="${txId}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [hooks.allTransactions, handleClearFilters]);

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
          onBulkAssignPerson={(personId) => hooks.handleBulkAssignPerson(hooks.selectedIds, personId)}
          onBulkSetStatus={(status) => hooks.handleBulkSetStatus(hooks.selectedIds, status)}
          onToggleIntelligence={() => setIsLeftPanelOpen(prev => !prev)}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {isLeftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="border-r border-white/5 bg-[#050505] overflow-hidden flex-shrink-0"
            >
              <div className="w-[340px]">
                <LeftPanel
                  onFilterByTransaction={handleNavigateToTx}
                  onFilterByRecurring={onFilterByRecurring}
                  onFilterByAnomaly={(val) => startTransition(() => hooks.setFilters({...hooks.filters, searchTerm: val as string}))}
                  onToggleCollapse={() => setIsLeftPanelOpen(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden">
          {showCSVPreview && csvPreviewData ? (
            <CSVPreviewDialog
              data={csvPreviewData}
              onConfirm={async (txs) => { await hooks.handleImport(txs); setShowCSVPreview(false); }}
              onClose={() => setShowCSVPreview(false)}
              currentDatabaseBalance={currentDatabaseBalance}
            />
          ) : (
            <>
              <div className="flex-1 overflow-hidden">
                <TransactionTable
                  transactions={hooks.transactions}
                  selectedIds={hooks.selectedIds}
                  onToggleSelection={hooks.toggleSelection}
                  onToggleSelectAll={hooks.toggleSelectAll}
                  onEdit={setEditingTransaction}
                  onDelete={hooks.handleDelete}
                  onSplit={setSplittingTransaction}
                  onView={setSelectedTxForPanel}
                  onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
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

        <AnimatePresence mode="wait">
          {selectedTxForPanel && (
            <motion.div
              initial={{ x: 450 }} animate={{ x: 0 }} exit={{ x: 450 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-40 w-[450px] border-l border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden"
            >
              <RightPanelDetails
                transaction={selectedTxForPanel}
                onClose={closeDetails}
                onEdit={setEditingTransaction}
                onDelete={hooks.handleDelete}
                onSplit={setSplittingTransaction}
                onNavigateToParent={handleNavigateToTx}
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
        onShowPreview={(data) => { setCsvPreviewData(data); setShowCSVPreview(true); setShowImport(false); }}
        currentDatabaseBalance={currentDatabaseBalance}
      />

      <TransactionFormDialog
        key={editingTransaction?.id || 'new'}
        open={!!editingTransaction}
        onClose={closeForm}
        transaction={editingTransaction || {} as Transaction}
        onSave={async (updatedTx: Transaction) => { 
          await hooks.handleUpdate(updatedTx.id, updatedTx); 
          closeForm(); 
        }}
      />

      {/* ✅ La modale utilise maintenant le wrapper corrigé */}
      {splittingTransaction && (
        <SplitTransactionDialog
          open={!!splittingTransaction}
          onClose={closeSplit}
          transaction={splittingTransaction}
          onSplit={handleSplitWrapper}
        />
      )}
    </div>
  );
}