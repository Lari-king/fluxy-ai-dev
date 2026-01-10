/**
 * 💰 TRANSACTIONS - VERSION ULTRA-OPTIMISÉE 2026
 * 
 * Fonctionnalités :
 * - Calcul dynamique du total (Pagination)
 * - Actions de masse complètes
 * - Filtres contextuels intelligents (Insights)
 * - Panel insights avec toggle
 * - Design system harmonisé
 * - 🆕 Analyse prédictive des récurrences
 * 
 * ⚡ OPTIMISATIONS PERFORMANCE :
 * - useDeferredValue pour recherche sans lag
 * - Comparaisons ISO string au lieu de new Date()
 * - Set pour lookups O(1)
 * - Pré-calculs hors boucles
 * - useCallback strict sur tous les handlers
 */

import { useState, useMemo, useEffect, useCallback, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Upload, Plus, Repeat, X, Sparkles, CheckCircle, 
  Trash2, Tag, User, Globe, CreditCard, AlertTriangle, TrendingUp
} from 'lucide-react';

// Contextes & Utils
import { useAuth } from '../../contexts/AuthContext';
import { useData, Transaction as DataTransaction } from '../../contexts/DataContext';
import { Transaction as CsvTransaction } from '../../src/utils/csv-parser';
import { applyRules, defaultRules } from '../../src/utils/categorization';
import { extractCategoriesFromTransactions } from '../../src/utils/categories';
import { stringEquals, stringIncludes } from '../../src/utils/stringUtils';
import { AppEvents, emitEvent } from '../../src/utils/events';
import { calculateMonthEndProjection } from '../../src/utils/insights/projection';

// Composants
import { LeftPanelInsights } from '../transactions/insights/LeftPanelInsights';
import { RightPanelDetails } from '../transactions/RightPanelDetails';
import { CommandBarNew } from '../transactions/CommandBar';
import { TransactionImport } from '../transactions/modals/ImportModal';
import { TransactionFormDialog } from '../transactions/modals/TransactionFormDialog';
import { TransactionTable } from '../transactions/view/TransactionTable';
import { PaginationControls } from '../transactions/components/PaginationControls';

// Type Alias
type Transaction = DataTransaction;

interface FilterState {
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
  completion?: 'all' | 'full' | 'partial' | 'none';
}

export function Transactions() {
  const { accessToken } = useAuth();
  const { 
    transactions, 
    categories, 
    people, 
    loading,
    updateTransactions,
    updateCategories
  } = useData();

  // ========================================
  // 1. ÉTATS UI
  // ========================================
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [viewMode, setViewMode] = useState<'table'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Pagination & Sélection
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtres contextuels (Insights)
  const [selectedRecurringIds, setSelectedRecurringIds] = useState<string[] | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [anomalyFilter, setAnomalyFilter] = useState<string | null>(null);

  // Filtres standards
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    category: 'all',
    subCategory: 'all',
    type: 'all',
    country: 'all',
    person: 'all',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: '',
    recurring: 'all',
  });

  // ⚡ PERFORMANCE : Différer la recherche pour ne pas bloquer la frappe
  const deferredSearchTerm = useDeferredValue(filters.searchTerm);

  // ========================================
  // 2. LOGIQUE MÉMOISÉE
  // ========================================

  const currentDatabaseBalance = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const activeFilterType = useMemo(() => {
    if (selectedRecurringIds && selectedRecurringIds.length > 0) return 'recurring';
    if (selectedTransactionId) return 'transaction';
    if (anomalyFilter) return 'anomaly';
    return null;
  }, [selectedRecurringIds, selectedTransactionId, anomalyFilter]);

  const clearContextualFilters = useCallback(() => {
    setSelectedRecurringIds(null);
    setSelectedTransactionId(null);
    setAnomalyFilter(null);
    setSelectedTransaction(null);
  }, []);

  /**
   * ⚡ FILTRAGE ULTRA-OPTIMISÉ
   */
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];

    let result = transactions;

    // 1. Filtres contextuels prioritaires (avec Set pour performance)
    if (selectedRecurringIds && selectedRecurringIds.length > 0) {
      const recurringSet = new Set(selectedRecurringIds);
      return result
        .filter(t => recurringSet.has(t.id))
        .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    }

    if (selectedTransactionId) {
      return result.filter(t => t.id === selectedTransactionId);
    }

    if (anomalyFilter) {
      const lowerAnomaly = anomalyFilter.toLowerCase();
      result = result.filter(t => t.description.toLowerCase().includes(lowerAnomaly));
    }

    // 2. Pré-calculs pour éviter répétitions dans la boucle
    const term = deferredSearchTerm.toLowerCase().trim();
    const hasSearch = term.length > 0;
    
    const filterCat = filters.category !== 'all' && filters.category !== 'Toutes les catégories' ? filters.category : null;
    const filterSubCat = (filters.subCategory && filters.subCategory !== 'all' && filters.subCategory !== '' && filters.subCategory !== 'Toutes les sous-cat.') ? filters.subCategory : null;
    const filterType = filters.type !== 'all' ? filters.type : null;
    const filterCountry = filters.country !== 'all' ? filters.country.toLowerCase() : null;
    const filterPerson = filters.person !== 'all' && filters.person !== 'Toutes les personnes' ? filters.person : null;
    const minAmt = filters.amountMin ? parseFloat(filters.amountMin) : null;
    const maxAmt = filters.amountMax ? parseFloat(filters.amountMax) : null;
    const dFrom = filters.dateFrom || null;
    const dTo = filters.dateTo || null;

    // 3. Filtrage principal
    result = result.filter(txn => {
      // Recherche textuelle (Deferred)
      if (hasSearch) {
        const matchDesc = txn.description.toLowerCase().includes(term);
        const matchCat = txn.category?.toLowerCase().includes(term);
        const matchAmount = txn.amount.toString().includes(term);
        if (!matchDesc && !matchCat && !matchAmount) return false;
      }

      // Filtre Complétion
      if (filters.completion && filters.completion !== 'all') {
        const hasCategory = txn.category && txn.category !== 'Non classifié';
        const hasSubCategory = (txn as any).subCategory && (txn as any).subCategory !== '';

        if (filters.completion === 'full' && (!hasCategory || !hasSubCategory)) return false;
        if (filters.completion === 'partial' && (!hasCategory || hasSubCategory)) return false;
        if (filters.completion === 'none' && hasCategory) return false;
      }

      // Comparaisons directes (très rapides)
      if (filterCat && !stringEquals(txn.category, filterCat)) return false;
      if (filterSubCat && !stringEquals((txn as any).subCategory, filterSubCat)) return false;
      if (filterType && !stringEquals(txn.type, filterType)) return false;
      if (filterPerson && !stringEquals(txn.personId, filterPerson)) return false;
      if (filterCountry && !stringEquals(txn.country?.toLowerCase(), filterCountry)) return false;

      // Montants
      if (minAmt !== null && Math.abs(txn.amount) < minAmt) return false;
      if (maxAmt !== null && Math.abs(txn.amount) > maxAmt) return false;

      // Dates (Comparaison ISO string - plus rapide que Date)
      if (dFrom && txn.date < dFrom) return false;
      if (dTo && txn.date > dTo) return false;

      // Récurrence
      if (filters.recurring !== 'all') {
        if (filters.recurring === 'recurring' && !txn.isRecurring) return false;
        if (filters.recurring === 'one-time' && txn.isRecurring) return false;
      }

      return true;
    });

    // Tri final optimisé
    return result.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [
    transactions, 
    deferredSearchTerm,
    filters.category, filters.subCategory, filters.type, filters.country, filters.person, 
    filters.amountMin, filters.amountMax, filters.dateFrom, filters.dateTo, filters.recurring, filters.completion,
    selectedRecurringIds, selectedTransactionId, anomalyFilter
  ]);

  const totalAmountFiltered = useMemo(() => {
    if (selectedIds.length > 0) {
      const selectedSet = new Set(selectedIds);
      return transactions
        .filter(t => selectedSet.has(t.id))
        .reduce((sum, t) => sum + t.amount, 0);
    }
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions, selectedIds, transactions]);

  const displayedTransactionsSlice = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  const filtersActive = useMemo(() => {
    return Object.values(filters).some(val => val !== '' && val !== 'all');
  }, [filters]);

  // 🆕 CALCUL DES PRÉDICTIONS (optimisé avec dépendance sur length)
  const recurringPredictions = useMemo(() => {
    if (!transactions.length) return [];
    
    try {
      const projection = calculateMonthEndProjection(transactions, currentDatabaseBalance);
      return projection.details.recurringPredictions || [];
    } catch (error) {
      console.error('Erreur calcul prédictions:', error);
      return [];
    }
  }, [transactions.length, currentDatabaseBalance]);

  const selectedTransactionPrediction = useMemo(() => {
    if (!selectedTransaction || recurringPredictions.length === 0) return null;
    
    return recurringPredictions.find((p: any) => 
      p.description.toLowerCase() === selectedTransaction.description.toLowerCase()
    ) || null;
  }, [selectedTransaction, recurringPredictions]);

  // ========================================
  // 3. HANDLERS ACTIONS (tous avec useCallback)
  // ========================================

  const handleUpdateDatabase = useCallback(async (newTransactionsList: Transaction[]) => {
    if (!accessToken) return;
    try {
      await updateTransactions(newTransactionsList);
      emitEvent(AppEvents.TRANSACTIONS_UPDATED);
    } catch (error) {
      console.error(error);
      toast.error("Erreur de synchronisation");
    }
  }, [accessToken, updateTransactions]);

  const handleManualAdd = useCallback(async (id: string, newTransactionData: Partial<Transaction>) => {
    const newTransaction: Transaction = {
      ...newTransactionData,
      id,
      status: 'completed',
    } as Transaction;
    
    await handleUpdateDatabase([...transactions, newTransaction]);
    setShowManualEntry(false);
    toast.success("Transaction ajoutée");
  }, [transactions, handleUpdateDatabase]);

  const handleUpdate = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const updated = transactions.map(t => t.id === id ? { ...t, ...updates } : t);
    await handleUpdateDatabase(updated);
    toast.success("Modification enregistrée");
    setEditingTransaction(null);
  }, [transactions, handleUpdateDatabase]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer cette transaction définitivement ?")) return;
    const updated = transactions.filter(t => t.id !== id);
    await handleUpdateDatabase(updated);
    toast.success("Transaction supprimée");
    setSelectedTransaction(prev => prev?.id === id ? null : prev);
  }, [transactions, handleUpdateDatabase]);

  const handleImport = useCallback(async (newTransactionsRaw: CsvTransaction[]) => {
    const newTransactions: Transaction[] = newTransactionsRaw.map(txn => ({
      ...txn,
      category: txn.category || 'Non classifié',
      status: 'completed',
    }));
    
    const categorized = applyRules(newTransactions, defaultRules);
    const merged = [...transactions, ...categorized];
    
    const syncedCategories = extractCategoriesFromTransactions(merged, categories);
    await updateCategories(syncedCategories);
    
    await handleUpdateDatabase(merged);
    toast.success(`${newTransactions.length} transactions importées`);
    setShowImport(false);
  }, [transactions, categories, updateCategories, handleUpdateDatabase]);

  const handleBulkAction = useCallback((actionType: string, payload?: any) => {
    if (selectedIds.length === 0) return;

    const selectedSet = new Set(selectedIds); // O(1) lookup
    let updatedList = [...transactions];
    let message = "";

    switch (actionType) {
      case 'delete':
        if (!confirm(`Supprimer ${selectedIds.length} éléments ?`)) return;
        updatedList = transactions.filter(t => !selectedSet.has(t.id));
        message = `${selectedIds.length} transactions supprimées`;
        break;

      case 'categorize':
        if (!payload) return;
        const isSubCategory = categories.some(c => c.name === payload && c.parentId);
        
        updatedList = transactions.map(t => {
          if (selectedSet.has(t.id)) {
            return isSubCategory 
              ? { ...t, subCategory: payload }
              : { ...t, category: payload, subCategory: '' };
          }
          return t;
        });
        message = "Catégories mises à jour";
        break;

      case 'categorizeSubCategory':
        if (!payload) return;
        
        const subCategory = categories.find(c => c.name === payload && c.parentId);
        if (!subCategory) {
          toast.error('Sous-catégorie introuvable');
          return;
        }
        
        const parentCategory = categories.find(c => c.id === subCategory.parentId);
        if (!parentCategory) {
          toast.error('Catégorie parente introuvable');
          return;
        }
        
        updatedList = transactions.map(t => {
          if (selectedSet.has(t.id)) {
            return { 
              ...t, 
              category: parentCategory.name,
              subCategory: subCategory.name 
            };
          }
          return t;
        });
        
        message = `Sous-catégorie "${payload}" appliquée (catégorie: ${parentCategory.name})`;
        break;

      case 'assign': 
        if (!payload) return;
        updatedList = transactions.map(t => selectedSet.has(t.id) ? { ...t, personId: payload } : t);
        message = "Relations mises à jour";
        break;

      case 'setStatus':
        if (!payload) return;
        updatedList = transactions.map(t => selectedSet.has(t.id) ? { ...t, status: payload } : t);
        message = "États mis à jour";
        break;

      case 'setType':
        if (!payload) return;
        updatedList = transactions.map(t => selectedSet.has(t.id) ? { ...t, type: payload } : t);
        message = "Types mis à jour";
        break;

      case 'markRecurring':
        updatedList = transactions.map(t => selectedSet.has(t.id) ? { ...t, isRecurring: payload } : t);
        message = payload ? "Marquées comme récurrentes" : "Marquées comme ponctuelles";
        break;
    }

    handleUpdateDatabase(updatedList);
    toast.success(message);
    setSelectedIds([]);
  }, [selectedIds, transactions, categories, handleUpdateDatabase]);

  // ========================================
  // 4. RENDER
  // ========================================

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
          <p className="text-white/60 animate-pulse">Chargement de vos finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      
      {/* COMMAND BAR */}
      <CommandBarNew
        filters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        categories={categories}
        transactions={transactions}
        people={people}
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onImport={() => setShowImport(true)}
        onAddManual={() => setShowManualEntry(true)}
        onBulkCategorize={(cat: string) => handleBulkAction('categorize', cat)}
        onBulkCategorizeSubCategory={(subCat: string) => handleBulkAction('categorizeSubCategory', subCat)}
        onBulkAssignPerson={(pid: string) => handleBulkAction('assign', pid)}
        onBulkSetType={(type: string) => handleBulkAction('setType', type)}
        onBulkSetStatus={(status: string) => handleBulkAction('setStatus', status)}
        onBulkDelete={() => handleBulkAction('delete')}
      />

      {/* BANDEAUX FILTRES CONTEXTUELS */}
      <AnimatePresence>
        {activeFilterType === 'recurring' && selectedRecurringIds && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-purple-500/10 border-b border-purple-500/20 px-6 py-3 flex justify-between items-center"
          >
            <div className="flex items-center gap-3 text-sm text-purple-300">
              <Repeat className="w-4 h-4" />
              <span className="font-medium">Série récurrente</span>
              <span className="text-white/60">({selectedRecurringIds.length} transactions)</span>
            </div>
            <button 
              onClick={clearContextualFilters}
              className="px-3 py-1.5 text-xs rounded-lg bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-colors text-white font-medium"
            >
              Voir tout
            </button>
          </motion.div>
        )}

        {activeFilterType === 'anomaly' && anomalyFilter && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-3 flex justify-between items-center"
          >
            <div className="flex items-center gap-3 text-sm text-orange-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Anomalie détectée</span>
              <span className="text-white/60 truncate max-w-md">"{anomalyFilter}"</span>
            </div>
            <button 
              onClick={clearContextualFilters}
              className="px-3 py-1.5 text-xs rounded-lg bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30 transition-colors text-white font-medium"
            >
              Voir tout
            </button>
          </motion.div>
        )}

        {activeFilterType === 'transaction' && selectedTransactionId && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-cyan-500/10 border-b border-cyan-500/20 px-6 py-3 flex justify-between items-center"
          >
            <div className="flex items-center gap-3 text-sm text-cyan-300">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Focus sur une transaction</span>
            </div>
            <button 
              onClick={clearContextualFilters}
              className="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors text-white font-medium"
            >
              Voir tout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANEL INSIGHTS (GAUCHE) */}
        {!showInsights ? (
          <motion.button 
            onClick={() => setShowInsights(true)}
            className="hidden md:flex flex-col items-center justify-center p-4 border-r border-white/10 hover:bg-white/5 transition-colors group"
            style={{ width: '60px' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            title="Ouvrir les Insights"
          >
            <Sparkles className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          </motion.button>
        ) : (
          <LeftPanelInsights 
            transactions={transactions}
            currentBalance={currentDatabaseBalance}
            onToggle={() => setShowInsights(false)}
            onFilterByAnomaly={(desc) => {
              clearContextualFilters();
              setAnomalyFilter(desc);
              setCurrentPage(1);
            }}
            onFilterByRecurring={(ids) => {
              clearContextualFilters();
              setSelectedRecurringIds(ids);
              setCurrentPage(1);
            }}
            onFilterByTransaction={(id) => {
              clearContextualFilters();
              setSelectedTransactionId(id);
              const t = transactions.find(x => x.id === id);
              if (t) setSelectedTransaction(t);
              setCurrentPage(1);
            }}
          />
        )}

        {/* PANEL TABLE (CENTRE) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            
            {showImport ? (
              <motion.div 
                key="import"
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 z-20 bg-black p-6 overflow-y-auto"
              >
                <button onClick={() => setShowImport(false)} className="mb-4 flex items-center gap-2 text-sm text-white/60 hover:text-white">
                  <X className="w-4 h-4" /> Annuler l'import
                </button>
                <TransactionImport 
                  onImport={handleImport} 
                  currentDatabaseBalance={currentDatabaseBalance} 
                />
              </motion.div>
            ) : (
              
              <div className="flex-1 flex flex-col h-full">
                {filteredTransactions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/60">
                    <p className="text-lg">Aucune transaction trouvée</p>
                    <button 
                      onClick={() => {
                        clearContextualFilters();
                        setFilters(prev => ({ ...prev, searchTerm: '', category: 'all' }));
                      }}
                      className="mt-2 text-sm text-cyan-400 hover:underline"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden">
                    <TransactionTable
                      transactions={displayedTransactionsSlice}
                      selectedIds={selectedIds}
                      setSelectedIds={setSelectedIds}
                      onTransactionClick={setSelectedTransaction}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      categories={categories}
                      people={people}
                      selectedTransactionId={selectedTransactionId}
                      tableConfig={{
                        dateFormat: 'DD/MM/YYYY',
                        descLimit: 60,
                        relationLabel: 'Relation',
                        statusOptions: [
                          { id: 'completed', label: 'Réalisé', color: 'text-emerald-500' },
                          { id: 'pending', label: 'En attente', color: 'text-amber-500' }
                        ]
                      }}
                    />
                  </div>
                )}

                <div className="border-t border-white/10 bg-black p-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredTransactions.length}
                    itemsPerPage={pageSize}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(v) => { setPageSize(v); setCurrentPage(1); }}
                    totalAmount={totalAmountFiltered} 
                  />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* PANEL DETAILS (DROITE) */}
        <RightPanelDetails
          transaction={selectedTransaction}
          prediction={selectedTransactionPrediction}
          onClose={() => setSelectedTransaction(null)}
          onEdit={(txn) => {
            setEditingTransaction(txn);
            setSelectedTransaction(null);
          }}
          onDelete={handleDelete}
          categories={categories}
          people={people}
        />

      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showManualEntry && (
          <TransactionFormDialog
            onClose={() => setShowManualEntry(false)}
            onSave={handleManualAdd}
            categories={categories}
            people={people}
          />
        )}
        {editingTransaction && (
          <TransactionFormDialog
            transaction={editingTransaction}
            onClose={() => setEditingTransaction(null)}
            onSave={handleUpdate}
            categories={categories}
            people={people}
            allTransactions={transactions}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
