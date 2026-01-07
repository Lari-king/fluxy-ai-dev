import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, TrendingUp, AlertCircle, CheckCircle, Zap, Edit2, Trash2, Calendar, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { AppEvents, emitEvent } from '../../src/utils/events';
// Assumer l'importation des vrais composants de formulaire/dialogue
import { BudgetFormDialog } from '../budgets/BudgetFormDialog'; 
import { BudgetTransactionsDialog } from '../budgets/BudgetTransactionsDialog';


// =======================================================================================
// Définitions de Types (synchronisées avec DataContext)
// =======================================================================================

export type BudgetRuleType = 'category' | 'person' | 'keyword' | 'amount';

export interface BudgetRule {
  type: BudgetRuleType;
  value: string | number;
  operator?: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  allocated: number;
  spent: number; // Sera recalculé dans useMemo
  icon: string;
  color: string;
  rules?: BudgetRule[];
  period?: 'monthly' | 'yearly' | 'weekly';
  month?: string;
  startDate?: string;
  endDate?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  person?: string;
}

interface Category { id: string; name: string; }
interface Person { id: string; name: string; }

// =======================================================================================
// Fonctions Utilitaires (Définies localement)
// =======================================================================================

const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
}).format(amount);

const formatPercentage = (amount: number) => `${Math.round(amount)}%`;

/**
 * Logique pour calculer le montant dépensé pour un budget donné
 * en filtrant les transactions
 */
const calculateBudgetSpent = (budget: Budget, transactions: Transaction[]): number => {
  // Simple logic: sum up transactions whose absolute amount is negative (expenses)
  // and which match the budget's category.
  // NOTE: For full budget rule support (person, keyword, etc.), this logic would be more complex.
  if (budget.category) {
    return transactions
      .filter(t => t.category === budget.category && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }
  return 0; 
};


// =======================================================================================
// Composant Budgets
// =======================================================================================

export function Budgets() {
  const { accessToken } = useAuth();
  
  // ✅ Utilisation des données réelles du DataContext
  const { 
    budgets: rawBudgets, 
    transactions, 
    categories, 
    people, 
    loading, 
    updateBudgets 
  } = useData();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    // Format YYYY-MM
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Calculate spent amounts for budgets and filter by selected month
  const budgets = useMemo(() => {
    // 1. Enrichir les budgets avec le montant dépensé calculé à partir des transactions
    const allBudgets = (rawBudgets as Budget[]).map(budget => ({
      ...budget,
      spent: calculateBudgetSpent(budget, transactions as Transaction[]), 
    }));
    
    // 2. Filtrer par le mois sélectionné
    return allBudgets.filter(budget => !budget.month || budget.month === selectedMonth);
  }, [rawBudgets, transactions, selectedMonth]);

  // ✅ Memoize calculations for overall stats
  const totalAllocated = useMemo(() => budgets.reduce((sum, b) => sum + b.allocated, 0), [budgets]);
  const totalSpent = useMemo(() => budgets.reduce((sum, b) => sum + b.spent, 0), [budgets]);
  const totalRemaining = useMemo(() => totalAllocated - totalSpent, [totalAllocated, totalSpent]);

  const handleSaveBudget = async (budget: Budget) => {
    try {
      // Logic for new ID generation for a new budget
      const budgetToSave = { 
        ...budget, 
        id: budget.id || crypto.randomUUID() 
      };

      const updatedBudgets = editingBudget
        ? (rawBudgets as Budget[]).map(b => b.id === budgetToSave.id ? budgetToSave : b) 
        : [...(rawBudgets as Budget[]), budgetToSave];
      
      if (accessToken) {
        await updateBudgets(updatedBudgets);
        emitEvent(AppEvents.BUDGETS_UPDATED);
      }
      
      toast.success(editingBudget ? 'Budget modifié' : 'Budget créé');
      setEditingBudget(null);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const filtered = (rawBudgets as Budget[]).filter(b => b.id !== id); 
      
      if (accessToken) {
        await updateBudgets(filtered);
        emitEvent(AppEvents.BUDGETS_UPDATED);
      }
      
      toast.success('Budget supprimé');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatus = (budget: Budget) => {
    const percentage = (budget.spent / (budget.allocated || 1)) * 100;
    if (percentage >= 100) return { color: 'text-red-600', icon: AlertCircle, label: 'Dépassé', bgColor: 'bg-red-50 dark:bg-red-950/20', borderColor: 'border-red-200 dark:border-red-800' };
    if (percentage >= 80) return { color: 'text-orange-600', icon: Zap, label: 'Attention', bgColor: 'bg-orange-50 dark:bg-orange-950/20', borderColor: 'border-orange-200 dark:border-orange-800' };
    return { color: 'text-green-600', icon: CheckCircle, label: 'OK', bgColor: 'bg-green-50 dark:bg-green-950/20', borderColor: 'border-green-200 dark:border-green-800' };
  };

  /**
   * Utilise une modal Sonner pour la confirmation de suppression (pour remplacer window.confirm)
   */
  const handleConfirmDelete = (budget: Budget) => {
    toast.custom((t: any) => (
      <Card className="bg-white dark:bg-gray-900 border border-red-400 dark:border-red-700 shadow-2xl">
        <div className="flex items-start p-4">
          <Trash2 className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
          <div className="flex-grow">
            <CardTitle className="text-lg">Confirmer la suppression</CardTitle>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Êtes-vous sûr de vouloir supprimer l'enveloppe "{budget.name}" ?
            </p>
            <div className="flex space-x-2 mt-3">
              <Button
                onClick={() => {
                  toast.dismiss(t.id);
                  handleDeleteBudget(budget.id);
                }}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 text-sm py-2 px-3"
              >
                <Check className="w-4 h-4" /> Oui, supprimer
              </Button>
              <Button
                onClick={() => toast.dismiss(t.id)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white flex items-center gap-1 text-sm py-2 px-3"
              >
                <X className="w-4 h-4" /> Annuler
              </Button>
            </div>
          </div>
        </div>
      </Card>
    ), { duration: Infinity, id: `delete-confirm-${budget.id}` });
  };


  // Génère les options de mois pour la sélection
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    // Générer 6 mois passés et 6 mois futurs (12 options au total)
    for (let i = -5; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50/30 to-purple-50/30 dark:from-gray-950 dark:via-orange-950/20 dark:to-purple-950/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 relative mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-purple-500 to-pink-500 rounded-full animate-spin" 
                 style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de vos budgets...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-purple-50/30 dark:from-gray-950 dark:via-orange-950/20 dark:to-purple-950/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-purple-600 to-pink-600">
                Budgets & Enveloppes
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez vos budgets mensuels avec la méthode des enveloppes
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl px-4 py-2 shadow-lg border border-gray-200 dark:border-gray-700">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  {monthOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 shadow-lg shadow-orange-500/30 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une enveloppe
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards - Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-blue-200 dark:border-blue-800 shadow-xl">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-500" />
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center ring-4 ring-offset-2 ring-blue-200 dark:ring-blue-800">
                    <Wallet className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Budget total</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAllocated)}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-red-200 dark:border-red-800 shadow-xl">
              <div className="h-1.5 bg-gradient-to-r from-red-500 to-pink-500" />
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 flex items-center justify-center ring-4 ring-offset-2 ring-red-200 dark:ring-red-800">
                    <TrendingUp className="w-7 h-7 text-red-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Dépensé</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSpent)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatPercentage((totalSpent / (totalAllocated || 1)) * 100)}% utilisé
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-green-200 dark:border-green-800 shadow-xl">
              <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-500" />
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center ring-4 ring-offset-2 ring-green-200 dark:ring-green-800">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Restant</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRemaining)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatPercentage((totalRemaining / (totalAllocated || 1)) * 100)}% disponible
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enveloppes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {budgets.map((budget, index) => {
            const percentage = Math.min((budget.spent / (budget.allocated || 1)) * 100, 100);
            const status = getStatus(budget);
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <div 
                  className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                  style={{ borderColor: budget.color }}
                  onClick={() => setSelectedBudget(budget)}
                >
                  {/* Barre de couleur en haut */}
                  <div className="h-1.5 bg-gradient-to-r" style={{ 
                    background: `linear-gradient(to right, ${budget.color}, ${budget.color}cc)` 
                  } as React.CSSProperties} />

                  {/* Gradient de fond subtil */}
                  <div 
                    className="absolute inset-0 opacity-5"
                    style={{ 
                      background: `linear-gradient(135deg, ${budget.color} 0%, transparent 100%)`
                    } as React.CSSProperties}
                  />

                  <div className="relative p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg ring-4 ring-offset-2 transition-transform group-hover:scale-110"
                          style={{ 
                            backgroundColor: budget.color,
                            '--tw-ring-color': `${budget.color}40`
                          } as React.CSSProperties}
                        >
                          {budget.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{budget.name}</h3>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusIcon className={`w-4 h-4 ${status.color}`} />
                            <span className={`text-sm ${status.color}`}>{status.label}</span>
                            {budget.month && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(budget.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBudget(budget);
                          }}
                          className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmDelete(budget); 
                          }}
                          className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Progression</span>
                        <span className={status.color}>
                          {formatPercentage(percentage)}%
                        </span>
                      </div>
                      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.05, ease: "easeOut" }}
                          className="h-full rounded-full shadow-lg relative"
                          style={{ 
                            background: `linear-gradient(90deg, ${budget.color} 0%, ${budget.color}dd 100%)`,
                            boxShadow: `0 0 15px ${budget.color}66`
                          } as React.CSSProperties}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Montants */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className={`${status.bgColor} rounded-xl p-3 border-2 ${status.borderColor}`}>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dépensé</div>
                        <div className="text-lg font-medium" style={{ color: budget.color }}>
                          {formatCurrency(budget.spent)}
                        </div>
                      </div>
                      <div className={`${budget.allocated - budget.spent >= 0 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'} rounded-xl p-3 border-2`}>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Restant</div>
                        <div className={`text-lg font-medium ${budget.allocated - budget.spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(budget.allocated - budget.spent)}
                        </div>
                      </div>
                    </div>

                    {/* Budget total */}
                    <div className="text-center pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget alloué</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(budget.allocated)}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {budgets.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border-dashed border-2 border-gray-300 dark:border-gray-700 mt-12"
          >
            <AlertCircle className="w-10 h-10 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">Aucun budget trouvé pour ce mois.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Cliquez sur "Créer une enveloppe" pour commencer à budgétiser.
            </p>
          </motion.div>
        )}

        {/* Create/Edit Dialog */}
        <AnimatePresence>
          {(showCreateDialog || editingBudget) && (
            <BudgetFormDialog
              budget={editingBudget}
              onClose={() => {
                setShowCreateDialog(false);
                setEditingBudget(null);
              }}
              onSave={handleSaveBudget}
              categories={categories as Category[]}
              people={people as Person[]}
            />
          )}
        </AnimatePresence>

        {/* Budget Transactions Dialog */}
        <AnimatePresence>
            {selectedBudget && (
                <BudgetTransactionsDialog
                    budget={selectedBudget}
                    transactions={transactions as Transaction[]}
                    people={people as Person[]}
                    onClose={() => setSelectedBudget(null)}
                />
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}