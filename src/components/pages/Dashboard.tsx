import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { 
  TrendingUp, TrendingDown, Wallet, Target, Users, ArrowUpRight, 
  ArrowDownRight, Calendar, Sparkles, Zap, Activity, DollarSign,
  PieChart, BarChart3, LineChart, Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GoalsProgress } from '@/components/dashboard/GoalsProgress';
import { MillionaireCountdown } from '@/components/dashboard/MillionaireCountdown';
import { OverdraftIndicator } from '@/components/dashboard/OverdraftIndicator';
import { AllocationRing } from '@/components/dashboard/AllocationRing';
import { TopPeople } from '@/components/dashboard/TopPeople';
import { calculateBudgetSpent } from '@/utils/budget-rules';
import { filterCompletedTransactions } from '@/utils/transaction-helpers';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export function Dashboard({ onNavigate = () => {} }: DashboardProps) {
  const { user } = useAuth();
  
  // ✅ Use centralized data from DataContext
  const { transactions, budgets, goals, people, accounts, loading } = useData();

  // Calculate budgets with spent amounts
  const budgetsWithSpent = useMemo(() => {
    return budgets.map(budget => ({
      ...budget,
      spent: calculateBudgetSpent(budget, transactions),
    }));
  }, [budgets, transactions]);

  // Calculations (exclude upcoming transactions)
  const completedTransactions = useMemo(() => filterCompletedTransactions(transactions), [transactions]);
  const totalIncome = useMemo(() => 
    completedTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    [completedTransactions]
  );
  const totalExpenses = useMemo(() => 
    Math.abs(completedTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
    [completedTransactions]
  );
  
  // ✅ Memoize all calculations to prevent memory buildup
  const netBalance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);
  const totalBudgetAllocated = useMemo(() => budgetsWithSpent.reduce((sum, b) => sum + b.allocated, 0), [budgetsWithSpent]);
  const totalBudgetSpent = useMemo(() => budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0), [budgetsWithSpent]);
  const completedGoals = useMemo(() => goals.filter(g => g.current >= g.target).length, [goals]);

  // Recent transactions (all, including upcoming)
  const recentTransactions = useMemo(() => 
    [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [transactions]
  );

  // Top spending categories (completed only)
  const topCategories = useMemo(() => {
    const categorySpending = completedTransactions
      .filter(t => t.amount < 0)
      .reduce((acc, t) => {
        const cat = t.category || 'Non catégorisé';
        acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [completedTransactions]);

  // 📝 Début de la modification demandée (lignes 80-108 dans le fichier original)
  // Top people with their transaction totals (completed only)
  const peopleWithTransactions = useMemo(() => {
    return people.map(person => {
      // ✅ CORRECTION : utiliser personId au lieu de assignedTo
      const personTransactions = completedTransactions.filter(t => t.personId === person.id);
      
      // Calculer les revenus et dépenses séparément
      const income = personTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const expenses = personTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
      const totalAmount = income + expenses; // Net impact
      
      // Calculer la transaction moyenne
      const averageTransaction = personTransactions.length > 0 
        ? totalAmount / personTransactions.length 
        : 0;
      
      // Trouver la dernière transaction
      const lastTransaction = personTransactions.length > 0
        ? personTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;
      
      return {
        id: person.id,
        name: person.name,
        avatar: person.avatar,
        relationship: person.relationship,
        totalAmount,
        income,
        expenses: Math.abs(expenses),
        transactionCount: personTransactions.length,
        color: person.color,
        averageTransaction,
        lastTransactionDate: lastTransaction?.date,
        lastTransactionAmount: lastTransaction?.amount,
      };
    }).filter(p => p.transactionCount > 0); // Seulement les personnes avec des transactions
  }, [people, completedTransactions]);
  // 📝 Fin de la modification demandée
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-spin" 
                  style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de votre dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[2000px] mx-auto">
        {/* Stunning Header avec effet glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl" />
          <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 dark:border-gray-800/20 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 mb-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                      Bonjour {user?.name || 'Explorateur'} 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Quick action buttons */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3"
              >
                <button
                  onClick={() => onNavigate('transactions')}
                  className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white shadow-lg hover:shadow-2xl transition-all hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Nouvelle transaction</span>
                  </span>
                </button>
                <button
                  onClick={() => onNavigate('budgets')}
                  className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all hover:scale-105 shadow-lg"
                >
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <PieChart className="w-4 h-4" />
                    <span className="hidden sm:inline">Budgets</span>
                  </span>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Mega Stats Cards - Style moderne avec animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Net Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-2xl" />
            <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-0">Solde net</Badge>
              </div>
              <div className="text-white">
                <div className="text-sm opacity-90 mb-1">Balance totale</div>
                <div className="text-4xl mb-2">{netBalance.toLocaleString('fr-FR')} €</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 text-green-200">
                    <ArrowUpRight className="w-4 h-4" />
                    +{((netBalance / (totalIncome || 1)) * 100).toFixed(1)}%
                  </span>
                  <span className="opacity-70">vs budget</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Income */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border-2 border-green-200 dark:border-green-800 shadow-lg hover:shadow-2xl transition-all group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <Badge variant="outline" className="border-green-300 text-green-700 dark:text-green-400 dark:border-green-700">Revenus</Badge>
              </div>
              <div className="text-3xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                +{totalIncome.toLocaleString('fr-FR')} €
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {transactions.filter(t => t.amount > 0).length} transactions
              </div>
            </div>
          </motion.div>

          {/* Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border-2 border-red-200 dark:border-red-800 shadow-lg hover:shadow-2xl transition-all group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 rounded-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <Badge variant="outline" className="border-red-300 text-red-700 dark:text-red-400 dark:border-red-700">Dépenses</Badge>
              </div>
              <div className="text-3xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-pink-600">
                -{totalExpenses.toLocaleString('fr-FR')} €
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {transactions.filter(t => t.amount < 0).length} transactions
              </div>
            </div>
          </motion.div>

          {/* Budget Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border-2 border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-2xl transition-all group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <Badge variant="outline" className="border-orange-300 text-orange-700 dark:text-orange-400 dark:border-orange-700">Budget</Badge>
              </div>
              <div className="text-3xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600">
                {((totalBudgetSpent / totalBudgetAllocated) * 100 || 0).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {totalBudgetSpent.toLocaleString('fr-FR')} € / {totalBudgetAllocated.toLocaleString('fr-FR')} €
              </div>
              <Progress value={(totalBudgetSpent / totalBudgetAllocated) * 100} className="h-2" />
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid - Allocation des revenus */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <AllocationRing transactions={transactions} totalIncome={totalIncome} />
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base text-gray-900 dark:text-white">Transactions récentes</h3>
              </div>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Voir tout
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <TooltipProvider>
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent pr-2">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucune transaction récente</p>
                  </div>
                ) : (
    recentTransactions.map((txn, index) => {
        const maxLength = 35;
        // ✅ FIX: On ajoute une valeur par défaut "" si description est undefined
        const description = txn.description || ""; 
        const truncatedDesc = description.length > maxLength 
          ? description.substring(0, maxLength) + '...'
          : description;
        
        return (
                      <Tooltip key={txn.id}>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.03 }}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                txn.amount > 0
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                              }`}>
                                {txn.amount > 0 ? (
                                  <ArrowDownRight className="w-4 h-4" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-900 dark:text-white truncate">
                                  {truncatedDesc}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  {new Date(txn.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                  {txn.category && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{txn.category}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                     <div className={`text-sm font-medium flex-shrink-0 ml-2 ${
  (txn.amount || 0) > 0 // Ajout du (|| 0)
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'
}`}>
  {(txn.amount || 0) > 0 ? '+' : ''}
  {(txn.amount || 0).toLocaleString('fr-FR')} € {/* Sécurité ici */}
</div>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-sm">
                          <p className="text-xs font-medium mb-1">{txn.description}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(txn.date).toLocaleDateString('fr-FR', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                          {txn.category && <p className="text-xs text-gray-400 mt-1">Catégorie : {txn.category}</p>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })
                )}
              </div>
            </TooltipProvider>
          </motion.div>
        </div>

        {/* Goals, Millionaire, Overdraft Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <GoalsProgress goals={goals} onNavigate={onNavigate} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <MillionaireCountdown 
              currentNetWorth={netBalance}
              transactions={transactions}
              patrimoine={accounts}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <OverdraftIndicator currentBalance={netBalance} />
          </motion.div>
        </div>

        {/* Top Categories with modern design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base text-gray-900 dark:text-white">Top catégories de dépenses</h3>
            {/* J'ai laissé Top Categories pour référence (l'implémentation de AllocatioRing est dans un autre fichier) */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent pr-2">
            {topCategories.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucune dépense enregistrée</p>
              </div>
            ) : (
              topCategories.map(([category, amount], index) => {
                const percentage = (amount / totalExpenses) * 100;
                const colors = [
                  'from-blue-500 to-cyan-500',
                  'from-purple-500 to-pink-500',
                  'from-orange-500 to-red-500',
                  'from-green-500 to-emerald-500',
                  'from-yellow-500 to-orange-500',
                ];

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + index * 0.05 }}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {category}
                        </span>
                        <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                          #{index + 1}
                        </Badge>
                      </div>
                      <div className="text-xl font-semibold text-gray-900 dark:text-white">
                        {amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 1.2 + index * 0.05, duration: 0.6 }}
                            className={`h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-full`}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {percentage.toFixed(1)}% du total
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Top People */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <TopPeople people={peopleWithTransactions} onNavigate={onNavigate} />
        </motion.div>
      </div>
    </div>
  );
}