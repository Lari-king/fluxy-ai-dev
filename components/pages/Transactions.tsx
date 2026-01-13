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
  Trash2, Tag, User, Globe, CreditCard, AlertTriangle, TrendingUp, Split
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
import { SplitTransactionDialog } from '../transactions/modals/SplitTransactionDialog';
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
  splitStatus?: 'all' | 'split' | 'not_split'; // 🆕 Filtre opérations divisées
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
  
  // 🆕 État pour la division de transaction
  const [splittingTransaction, setSplittingTransaction] = useState<Transaction | null>(null);

  // Filtres contextuels (Insights)
  const [selectedRecurringIds, setSelectedRecurringIds] = useState<string[] | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [anomalyFilter, setAnomalyFilter] = useState<string | null>(null);
  // 🆕 Filtre pour afficher une famille complète (mère + enfants + petits-enfants)
  const [splitFamilyFilter, setSplitFamilyFilter] = useState<string | null>(null);

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

  // 🔧 FIX : Balance calculée SANS les transactions masquées (isHidden)
  const currentDatabaseBalance = useMemo(() => {
    return transactions
      .filter(t => !t.isHidden) // ✅ Exclure les transactions masquées
      .reduce((sum, t) => sum + t.amount, 0);
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
   * ⚡ CARTE D'IDENTITÉ DES CATÉGORIES (COMPATIBILITÉ ID / NOM)
   */
  const categoryLookup = useMemo(() => {
    const idToName = new Map<string, string>();
    const nameToId = new Map<string, string>();
    const parentToChildren = new Map<string, Set<string>>(); 
    
    categories.forEach(cat => {
      idToName.set(cat.id, cat.name);
      nameToId.set(cat.name.toLowerCase(), cat.id);
      
      if (cat.parentId) {
        if (!parentToChildren.has(cat.parentId)) {
          parentToChildren.set(cat.parentId, new Set());
        }
        parentToChildren.get(cat.parentId)?.add(cat.id);
      }
    });
    
    return { idToName, nameToId, parentToChildren };
  }, [categories]);

  // 🆕 HELPER : Normaliser une valeur de catégorie (ID ou Nom → ID)
  const normalizeCategoryValue = useCallback((value: string | null): string | null => {
    if (!value || value === 'all' || value === 'Toutes les catégories') return null;
    
    // Si c'est déjà un ID (commence par 'cat_'), le retourner tel quel
    if (value.startsWith('cat_')) return value;
    
    // Sinon, c'est probablement un nom → le convertir en ID
    return categoryLookup.nameToId.get(value.toLowerCase()) || value;
  }, [categoryLookup]);

  // 🆕 HELPER : Vérifier si une transaction matche une catégorie (hybride ID/Nom)
  const transactionMatchesCategory = useCallback((
    txnCategory: string,
    filterValue: string,
    includeChildren: boolean = false
  ): boolean => {
    if (!txnCategory || !filterValue) return false;
    
    // Normaliser les deux valeurs en IDs
    const txnId = normalizeCategoryValue(txnCategory);
    const filterId = normalizeCategoryValue(filterValue);
    
    if (!txnId || !filterId) return false;
    
    // Match direct
    if (txnId === filterId) return true;
    
    // Si on doit inclure les enfants, vérifier si txnId est un enfant de filterId
    if (includeChildren) {
      const childrenIds = categoryLookup.parentToChildren.get(filterId);
      if (childrenIds && childrenIds.has(txnId)) return true;
    }
    
    return false;
  }, [categoryLookup, normalizeCategoryValue]);

  // 🆕 HELPER : Vérifier si une sous-catégorie matche (gère ID et Nom)
  const transactionMatchesSubCategory = useCallback((
    txnSubCategory: string | undefined,
    filterValue: string
  ): boolean => {
    if (!txnSubCategory || !filterValue) return false;
    
    // 1. Comparaison directe (si les deux sont des noms)
    if (txnSubCategory.toLowerCase() === filterValue.toLowerCase()) return true;
    
    // 2. Si filterValue est un ID, convertir en nom et comparer
    if (filterValue.startsWith('cat_')) {
      const filterName = categoryLookup.idToName.get(filterValue);
      if (filterName && txnSubCategory.toLowerCase() === filterName.toLowerCase()) return true;
    }
    
    // 3. Si txnSubCategory pourrait être un ID (rare), convertir
    if (txnSubCategory.startsWith('cat_')) {
      const txnName = categoryLookup.idToName.get(txnSubCategory);
      if (txnName && txnName.toLowerCase() === filterValue.toLowerCase()) return true;
    }
    
    return false;
  }, [categoryLookup]);

  // ==================================================================================
  // 3. 🔍 MOTEUR DE FILTRAGE HYBRIDE ET OPTIMISÉ
  // ==================================================================================
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];

    let result = transactions;

    // --- A. FILTRES CONTEXTUELS PRIORITAIRES ---
    
    // 🆕 FILTRE FAMILLE DIVISÉE (priorité absolue)
    if (splitFamilyFilter) {
      const familySet = new Set<string>();
      
      // Ajouter le parent
      familySet.add(splitFamilyFilter);
      
      // Trouver tous les enfants directs
      const parent = transactions.find(t => t.id === splitFamilyFilter);
      if (parent && parent.childTransactionIds) {
        parent.childTransactionIds.forEach(childId => familySet.add(childId));
        
        // Trouver récursivement les petits-enfants
        parent.childTransactionIds.forEach(childId => {
          const child = transactions.find(t => t.id === childId);
          if (child && child.childTransactionIds) {
            child.childTransactionIds.forEach(grandchildId => familySet.add(grandchildId));
          }
        });
      }
      
      return transactions
        .filter(t => familySet.has(t.id))
        .sort((a, b) => {
          // Tri hiérarchique : parent d'abord, puis enfants, puis petits-enfants
          if (a.id === splitFamilyFilter) return -1;
          if (b.id === splitFamilyFilter) return 1;
          if (a.parentTransactionId === splitFamilyFilter && b.parentTransactionId !== splitFamilyFilter) return -1;
          if (b.parentTransactionId === splitFamilyFilter && a.parentTransactionId !== splitFamilyFilter) return 1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }
    
    if (selectedRecurringIds && selectedRecurringIds.length > 0) {
      const recurringSet = new Set(selectedRecurringIds);
      return result.filter(t => recurringSet.has(t.id))
                   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    if (selectedTransactionId) {
      return result.filter(t => t.id === selectedTransactionId);
    }
    if (anomalyFilter) {
      const lowerAnomaly = anomalyFilter.toLowerCase();
      result = result.filter(t => t.description.toLowerCase().includes(lowerAnomaly));
    }

    // --- B. PRÉ-CALCULS DES FILTRES ---
    const term = deferredSearchTerm.toLowerCase().trim();
    const hasSearch = term.length > 0;
    
    // 🆕 Normalisation des filtres de catégories
    const filterCatValue = filters.category !== 'all' && filters.category !== '' ? filters.category : null;
    const filterSubCatValue = filters.subCategory !== 'all' && filters.subCategory !== '' ? filters.subCategory : null;
    
    // --- C. BOUCLE DE FILTRAGE PRINCIPALE ---
    result = result.filter(txn => {
      // 1. Gestion du masquage (SAUF pour les opérations parentes divisées)
      const hasChildren = txn.childTransactionIds && Array.isArray(txn.childTransactionIds) && txn.childTransactionIds.length > 0;
      if (txn.isHidden && !hasChildren) return false; // 🔧 FIX : Toujours afficher les opérations parentes divisées même si masquées

      // 2. Recherche textuelle
      if (hasSearch) {
        const catName = categoryLookup.idToName.get(txn.category) || txn.category;
        const matchesSearch = 
          stringIncludes(txn.description, term) ||
          stringIncludes((txn as any).merchant, term) ||
          stringIncludes(catName, term) ||
          txn.amount.toString().includes(term);
        if (!matchesSearch) return false;
      }

      // 3. 🆕 FILTRE CATÉGORIE HIÉRARCHIQUE (HYBRIDE ID/NOM)
      if (filterCatValue) {
        const matches = transactionMatchesCategory(txn.category, filterCatValue, true);
        if (!matches) return false;
      }

      // 4. 🆕 FILTRE SOUS-CATÉGORIE SPÉCIFIQUE
      if (filterSubCatValue) {
        const matches = transactionMatchesSubCategory(txn.subCategory, filterSubCatValue);
        if (!matches) return false;
      }

      // 5. Filtre Type
      if (filters.type !== 'all') {
        if (filters.type === 'income' && txn.amount < 0) return false;
        if (filters.type === 'expense' && txn.amount >= 0) return false;
      }

      // 6. Filtre Statut Division
      if (filters.splitStatus && filters.splitStatus !== 'all') {
        const isChild = !!txn.parentTransactionId;
        
        if (filters.splitStatus === 'split') {
          // "Divisées uniquement" = opérations parentes OU leurs enfants
          if (!hasChildren && !isChild) return false;
        } else if (filters.splitStatus === 'not_split') {
          // "Non divisées" = ni parente ni enfant
          if (hasChildren || isChild) return false;
        }
      }

      // 7. Filtres Standards
      if (filters.person && filters.person !== 'all' && !stringEquals(txn.personId, filters.person)) return false;
      if (filters.country && filters.country !== 'all' && !stringEquals(txn.country?.toLowerCase(), filters.country.toLowerCase())) return false;
      
      if (filters.amountMin && Math.abs(txn.amount) < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && Math.abs(txn.amount) > parseFloat(filters.amountMax)) return false;
      
      if (filters.dateFrom && txn.date < filters.dateFrom) return false;
      if (filters.dateTo && txn.date > filters.dateTo) return false;

      return true;
    });

    // Tri par date décroissante
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions, deferredSearchTerm, filters, categoryLookup, categories,
    selectedRecurringIds, selectedTransactionId, anomalyFilter, splitFamilyFilter,
    normalizeCategoryValue, transactionMatchesCategory, transactionMatchesSubCategory
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
  // 🆕 NAVIGATION INTELLIGENTE AVEC AUTO-SCROLL
  // ========================================

  /**
   * Navigue vers une transaction spécifique avec :
   * - Calcul automatique de la page
   * - Changement de page si nécessaire
   * - Réinitialisation des filtres si la transaction est masquée
   * - Auto-scroll fluide vers la transaction
   */
  const navigateToTransaction = useCallback((targetId: string) => {
    // 1. Chercher dans les transactions filtrées
    let index = filteredTransactions.findIndex(t => t.id === targetId);
    
    // 2. Si introuvable, vérifier si elle existe dans les transactions brutes
    if (index === -1) {
      const existsInRaw = transactions.find(t => t.id === targetId);
      if (existsInRaw) {
        // La transaction existe mais est masquée par un filtre
        toast.info("Réinitialisation des filtres pour localiser la transaction...", {
          duration: 2000,
        });
        
        // Réinitialiser tous les filtres
        clearContextualFilters();
        setFilters({
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
          splitStatus: 'all', // 🔧 FIX : Ajouter splitStatus pour éviter boucle infinie
        });
        
        // Attendre le prochain cycle de rendu pour recalculer
        setTimeout(() => {
          navigateToTransaction(targetId);
        }, 100);
        return;
      } else {
        toast.error("Transaction introuvable");
        return;
      }
    }

    // 3. Calculer la page cible
    const targetPage = Math.floor(index / pageSize) + 1;

    // 4. Changer de page si nécessaire
    if (currentPage !== targetPage) {
      setCurrentPage(targetPage);
    }

    // 5. Mettre à jour la sélection (déclenchera le useEffect du scroll)
    const targetTxn = filteredTransactions[index];
    setSelectedTransaction(targetTxn);
  }, [filteredTransactions, transactions, currentPage, pageSize, clearContextualFilters]);

  /**
   * Auto-scroll vers la transaction sélectionnée avec animation
   */
  useEffect(() => {
    if (selectedTransaction) {
      // Délai pour attendre le rendu de la nouvelle page
      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(`txn-${selectedTransaction.id}`);
        
        if (element) {
          // Scroll fluide vers l'élément
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });

          // Animation de highlight
          element.classList.add('highlight-pulse-txn');
          setTimeout(() => {
            element.classList.remove('highlight-pulse-txn');
          }, 2000);
        }
      }, 150);

      return () => clearTimeout(scrollTimer);
    }
  }, [selectedTransaction, currentPage]); // Réagit aussi au changement de page

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

  // 🆕 HANDLER DIVISION DE TRANSACTION
  const handleSplitTransaction = useCallback(async (
    originalTransaction: Transaction,
    subTransactions: Partial<Transaction>[],
    hideOriginal: boolean,
    note?: string
  ) => {
    try {
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
      
      // Remplacer l'originale et ajouter les enfants
      const updated = transactions.map(t => 
        t.id === originalTransaction.id ? updatedOriginal : t
      ).concat(children);
      
      await handleUpdateDatabase(updated);
      toast.success(`Transaction divisée en ${children.length} sous-transactions`);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Erreur lors de la division:', error);
      toast.error('Erreur lors de la division de la transaction');
    }
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
        {splitFamilyFilter && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-3 flex justify-between items-center"
          >
            <div className="flex items-center gap-3 text-sm text-orange-300">
              <Split className="w-4 h-4" />
              <span className="font-medium">Opération divisée</span>
              <span className="text-white/60">({filteredTransactions.length} transactions)</span>
            </div>
            <button 
              onClick={() => {
                setSplitFamilyFilter(null);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30 transition-colors text-white font-medium"
            >
              Voir tout
            </button>
          </motion.div>
        )}
        
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
                      onSplit={(txn) => setSplittingTransaction(txn)} // 🆕 Handler pour diviser
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
          onSplit={(txn) => {
            setSplittingTransaction(txn);
            setSelectedTransaction(null);
          }}
          onNavigateToParent={(parentId) => {
            // Navigation simple vers le parent UNIQUEMENT (pas toute la famille)
            clearContextualFilters();
            setSplitFamilyFilter(null);
            
            // Filtrer pour afficher UNIQUEMENT le parent
            setSelectedTransactionId(parentId);
            setCurrentPage(1);
            
            // Sélectionner la transaction parente
            const parent = transactions.find(t => t.id === parentId);
            if (parent) {
              setSelectedTransaction(parent);
              toast.success('Navigation vers l\'opération d\'origine');
            } else {
              toast.error('Opération d\'origine introuvable');
            }
          }}
          onNavigateToChildren={(parentId, childIds) => {
            // Filtrer pour afficher UNIQUEMENT la famille (parent + enfants)
            const familyIds = [parentId, ...childIds];
            
            // Créer un filtre contextuel personnalisé
            toast.info(`Affichage de l'opération divisée et ses ${childIds.length} sous-opérations`);
            
            // Filtrer les transactions pour n'afficher que cette famille
            setSplitFamilyFilter(parentId);
            setCurrentPage(1);
          }}
          onToggleHidden={(id, currentHiddenState) => {
            // Basculer l'état isHidden
            const updated = transactions.map(t => 
              t.id === id ? { ...t, isHidden: !currentHiddenState } : t
            );
            handleUpdateDatabase(updated);
            toast.success(currentHiddenState ? 'Opération visible dans les calculs' : 'Opération masquée des calculs');
          }}
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
        {splittingTransaction && (
          <SplitTransactionDialog
            transaction={splittingTransaction}
            onClose={() => setSplittingTransaction(null)}
            onSplit={(subTxns, hideOrig, note) => {
              handleSplitTransaction(splittingTransaction, subTxns, hideOrig, note);
              setSplittingTransaction(null);
            }}
            categories={categories}
          />
        )}
      </AnimatePresence>

    </div>
  );
}