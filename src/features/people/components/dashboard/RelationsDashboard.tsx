import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, TrendingDown, TrendingUp, DollarSign, Percent, 
  AlertCircle, Target, X, Check, CheckCircle2, Search, ChevronLeft, ChevronRight
} from 'lucide-react';

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Features (People)
// Note : On pointe vers features/people/types/base pour la nouvelle architecture
import { PersonRelation} from '@/features/people/types/base';
import { PersonCard } from '@/features/people/components/cards/PersonCard';

// Contextes & Utils
import { useData, Transaction as DataTransaction } from '@/contexts/DataContext';
import { AppEvents, emitEvent } from '@/utils/events';

// Si tu as besoin de labels ou config dans ce fichier :
// import { CONTRIBUTION_TYPE_LABELS } from '@/features/people/constants/config';

interface RelationsDashboardProps {
  people: PersonRelation[];
  /*scores?: PeopleScores | null;*/
  transactions: DataTransaction[];
  onEdit: (p: PersonRelation, t?: string) => void;
  onViewDetail: (p: PersonRelation) => void;
  onDelete: (id: string) => void;
  // MODIFICATION ICI : on ajoute les périodes manquantes
  period: 'all' | 'current-month' | 'last-3-months' | 'last-6-months' | 'current-year' | 'custom';
  customStartDate: string;
  customEndDate: string;
}

interface BudgetAssignment {
  personId: string;
  personName: string;
  currentSpent: number;
  suggestedBudget: number;
  category: string;
  hasBudget?: boolean;
}

export function RelationsDashboard({ 
  people = [], 
  transactions = [],
  onEdit, 
  onViewDetail, 
  onDelete,
  period,
  customStartDate,
  customEndDate
}: RelationsDashboardProps) {
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAssignments, setBudgetAssignments] = useState<BudgetAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const { budgets, updateBudgets } = useData();

  // ===== CALCUL DE LA PÉRIODE =====
// ===== CALCUL DE LA PÉRIODE =====
const { startDate, endDate, monthKey } = useMemo(() => {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'all':
      // Pour "Tout" : plage très large (ou calculée dynamiquement si tu veux)
      start = new Date(2000, 0, 1); // ou Math.min des dates des tx
      end = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate()); // large future
      break;

    case 'current-month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case 'last-3-months':
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case 'last-6-months':
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case 'current-year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;

    case 'custom':
      start = customStartDate ? new Date(customStartDate) : now;
      end = customEndDate ? new Date(customEndDate) : now;
      break;

    default:
      // Sécurité : fallback sur current-month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    monthKey,
  };
}, [period, customStartDate, customEndDate, transactions]); // ← transactions ajouté si tu veux calcul dynamique pour 'all'

// ===== FILTRAGE DES TRANSACTIONS =====
const filteredTransactions = useMemo(() => {
  return transactions.filter(txn => {
    const txnDate = txn.date;
    return txnDate >= startDate && txnDate <= endDate;
  });
}, [transactions, startDate, endDate]);

// ===== STATISTIQUES GLOBALES (CORRIGÉES) =====
const stats = useMemo(() => {
  // TOTAL : Toutes les relations
  const total = people.length;
  
  // Relations avec transactions dans la période
  const peopleWithTransactions = new Set(
    filteredTransactions.filter(t => t.personId).map(t => t.personId)
  );
  const withTransactions = peopleWithTransactions.size;
  
  // Physiques/Morales sur TOUTES les relations
  const physical = people.filter(p => p.personType === 'PHYSIQUE' || !p.personType).length;
  const moral = people.filter(p => p.personType === 'MORALE').length;
  const physicalPercent = total > 0 ? (physical / total) * 100 : 0;
  const moralPercent = total > 0 ? (moral / total) * 100 : 0;

  // Dépenses (toutes les transactions négatives avec personId)
  const totalExpenses = filteredTransactions
    .filter(t => t.amount < 0 && t.personId)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  // Revenus (toutes les transactions positives avec personId)
  const totalIncome = filteredTransactions
    .filter(t => t.amount > 0 && t.personId)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Balance
  const difference = totalIncome - totalExpenses;
  
  // Impact : (Dépenses / Revenus totaux de TOUTES les transactions)
  const allIncomeInPeriod = filteredTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const impactPercent = allIncomeInPeriod > 0 ? (totalExpenses / allIncomeInPeriod) * 100 : 0;

  return {
    total,
    withTransactions,
    withoutTransactions: total - withTransactions,
    physical,
    moral,
    physicalPercent,
    moralPercent,
    totalExpenses,
    totalIncome,
    difference,
    impactPercent
  };
}, [people, filteredTransactions]);

// ===== TOP 3 RELATIONS + CATÉGORIES =====
const analytics = useMemo(() => {
  const personExpenses = new Map<string, number>();
  filteredTransactions
    .filter(t => t.amount < 0 && t.personId)
    .forEach(t => {
      const current = personExpenses.get(t.personId!) || 0;
      personExpenses.set(t.personId!, current + Math.abs(t.amount));
    });

  const top3People = Array.from(personExpenses.entries())
    .map(([personId, spent]) => ({
      person: people.find(p => p.id === personId)!,
      spent
    }))
    .filter(item => item.person)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  // Catégories avec sous-catégories
  const categoryBreakdown = new Map<string, { amount: number; subCategories: Map<string, number> }>();
  
  top3People.forEach(({ person }) => {
    filteredTransactions
      .filter(t => t.amount < 0 && t.personId === person.id)
      .forEach(t => {
        const cat = t.category || 'Non catégorisé';
        const subCat = (t as any).subCategory || 'Général';
        
        if (!categoryBreakdown.has(cat)) {
          categoryBreakdown.set(cat, { amount: 0, subCategories: new Map() });
        }
        
        const catData = categoryBreakdown.get(cat)!;
        catData.amount += Math.abs(t.amount);
        
        const currentSubAmount = catData.subCategories.get(subCat) || 0;
        catData.subCategories.set(subCat, currentSubAmount + Math.abs(t.amount));
      });
  });

  const topCategories = Array.from(categoryBreakdown.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      subCategories: Array.from(data.subCategories.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
    }))
    .sort((a, b) => b.amount - a.amount);

  return { top3People, topCategories };
}, [people, filteredTransactions]);

// ────────────────────────────────────────────────
//               LOGS DE DEBUG (à la toute fin)
// ────────────────────────────────────────────────
console.log("[DEBUG RelationsDashboard] ────────────────");
console.log("[DEBUG] Période sélectionnée :", period);
console.log("[DEBUG] startDate / endDate :", startDate, "→", endDate);
console.log("[DEBUG] Nb transactions total :", transactions?.length ?? 0);
console.log("[DEBUG] Nb transactions filtrées par période :", filteredTransactions.length);
console.log("[DEBUG] Nb tx avec personId (toutes périodes) :", transactions.filter(t => t.personId).length, "/", transactions?.length ?? 0);
console.log("[DEBUG] Nb tx avec personId (dans la période) :", filteredTransactions.filter(t => t.personId).length, "/", filteredTransactions.length);

console.log("[DEBUG] Top 3 personnes :", analytics.top3People);
console.log("[DEBUG] Top 3 personnes length :", analytics.top3People.length);
console.log("[DEBUG] Top catégories :", analytics.topCategories);
console.log("[DEBUG] Top catégories length :", analytics.topCategories.length);
console.log("[DEBUG RelationsDashboard] ────────────────");

  // ✅ BUDGETS EXISTANTS - DÉTECTION AMÉLIORÉE (personId + rules)
  const existingBudgetsByPerson = useMemo(() => {
    const budgetMap = new Map<string, boolean>();
    
    (budgets as any[]).forEach(budget => {
      // ✅ NOUVEAU : Détecter via personId (système de RelationDetail)
      if (budget.personId && budget.month === monthKey) {
        budgetMap.set(budget.personId, true);
      }
      
      // ✅ ANCIEN : Détecter via rules (système legacy)
      if (budget.rules && Array.isArray(budget.rules)) {
        budget.rules.forEach((rule: any) => {
          if (rule.type === 'person' && budget.month === monthKey) {
            budgetMap.set(rule.value, true);
          }
        });
      }
    });
    
    return budgetMap;
  }, [budgets, monthKey]);

  // ===== GESTION BUDGETS =====
  const handleOpenBudgetModal = () => {
    // ✅ Filtrer pour exclure les relations qui ont déjà un budget
    const assignments: BudgetAssignment[] = analytics.top3People
      .filter(({ person }) => !existingBudgetsByPerson.has(person.id))
      .map(({ person, spent }) => ({
        personId: person.id,
        personName: person.name,
        currentSpent: spent,
        suggestedBudget: Math.round(spent * 0.8),
        category: person.relationship || 'Relation',
        hasBudget: false
      }));
    
    if (assignments.length === 0) {
      toast.info('Tous les budgets ont déjà été créés pour ces relations', {
        description: 'Vous pouvez gérer vos budgets existants dans l\'écran Budgets'
      });
      return;
    }
    
    setBudgetAssignments(assignments);
    setShowBudgetModal(true);
  };

  const handleCreateBudgets = async () => {
    try {
      const newBudgets = budgetAssignments.map(assignment => ({
        id: crypto.randomUUID(),
        name: `Budget ${assignment.personName}`,
        category: assignment.category,
        allocated: assignment.suggestedBudget,
        spent: 0,
        icon: '👤',
        color: '#00D1FF',
        personId: assignment.personId, // ✅ NOUVEAU : Ajout du personId
        rules: [
          {
            type: 'person' as const,
            value: assignment.personId,
            operator: 'equals' as const
          }
        ],
        period: 'monthly' as const,
        month: monthKey
      }));

      const updatedBudgets = [...(budgets as any[]), ...newBudgets];
      
      await updateBudgets(updatedBudgets);
      emitEvent(AppEvents.BUDGETS_UPDATED);
      
      toast.success(`${newBudgets.length} budget${newBudgets.length > 1 ? 's' : ''} créé${newBudgets.length > 1 ? 's' : ''}`);
      setShowBudgetModal(false);
    } catch (error) {
      console.error('Error creating budgets:', error);
      toast.error('Erreur lors de la création des budgets');
    }
  };

  // ===== AFFICHAGE DES RELATIONS (AVEC RECHERCHE) =====
  const displayedPeople = useMemo(() => {
    const peopleWithTransactionsInPeriod = new Set(
      filteredTransactions.filter(t => t.personId).map(t => t.personId)
    );

    const withTransactions = people.filter(p => peopleWithTransactionsInPeriod.has(p.id));
    const withoutTransactions = people.filter(p => !peopleWithTransactionsInPeriod.has(p.id));

    let result = [...withTransactions, ...withoutTransactions];

    // Filtrage par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.relationship?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [people, filteredTransactions, searchQuery]);

  // ===== CATÉGORIES FILTRÉES =====
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return analytics.topCategories;
    
    const query = categorySearch.toLowerCase();
    return analytics.topCategories
      .map(cat => ({
        ...cat,
        subCategories: cat.subCategories.filter(sub => 
          sub.name.toLowerCase().includes(query) ||
          cat.category.toLowerCase().includes(query)
        )
      }))
      .filter(cat => 
        cat.category.toLowerCase().includes(query) ||
        cat.subCategories.length > 0
      );
  }, [analytics.topCategories, categorySearch]);

  const budgetStats = useMemo(() => {
    const withBudget = analytics.top3People.filter(({ person }) => 
      existingBudgetsByPerson.has(person.id)
    ).length;
    
    const withoutBudget = analytics.top3People.length - withBudget;
    
    return { withBudget, withoutBudget, total: analytics.top3People.length };
  }, [analytics.top3People, existingBudgetsByPerson]);

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      <div className="max-w-[1800px] mx-auto px-8 py-6 space-y-6">

        {/* ===== SECTION 1 : KPIs Condensés (2 Composants Côte à Côte) ===== */}
        <section className="grid grid-cols-2 gap-4">
          
          {/* Composant 1 : Stats Relations */}
          <motion.div 
            className="bg-[#12131A] border border-white/10 rounded-2xl p-6"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Relations • Période sélectionnée
              </h3>
              <Users className="w-5 h-5 text-blue-400" />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-3xl font-bold text-white tabular-nums">{stats.total}</p>
                <p className="text-xs text-slate-500 mt-1">Total</p>
              </div>
              
              <div>
                <p className="text-3xl font-bold text-cyan-400 tabular-nums">{stats.withTransactions}</p>
                <p className="text-xs text-slate-500 mt-1">Avec transactions</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-blue-400 tabular-nums">{stats.physical}</p>
                <p className="text-xs text-slate-500 mt-1">Physiques ({stats.physicalPercent.toFixed(0)}%)</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-purple-400 tabular-nums">{stats.moral}</p>
                <p className="text-xs text-slate-500 mt-1">Morales ({stats.moralPercent.toFixed(0)}%)</p>
              </div>
            </div>

            {/* Impact % */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Impact sur revenus</span>
                <div className="flex items-center gap-2">
                  <Percent className={`w-4 h-4 ${
                    stats.impactPercent > 70 ? 'text-red-400' :
                    stats.impactPercent > 50 ? 'text-orange-400' :
                    'text-green-400'
                  }`} />
                  <span className={`text-2xl font-bold tabular-nums ${
                    stats.impactPercent > 70 ? 'text-red-400' :
                    stats.impactPercent > 50 ? 'text-orange-400' :
                    'text-green-400'
                  }`}>
                    {stats.impactPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Composant 2 : Flux Financiers */}
          <motion.div 
            className="bg-[#12131A] border border-white/10 rounded-2xl p-6"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Flux Financiers
              </h3>
              <DollarSign className="w-5 h-5 text-cyan-400" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-500 uppercase">Dépenses</span>
                </div>
                <p className="text-2xl font-bold text-red-400 tabular-nums">
                  {stats.totalExpenses.toFixed(0)}€
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-500 uppercase">Revenus</span>
                </div>
                <p className="text-2xl font-bold text-green-400 tabular-nums">
                  {stats.totalIncome.toFixed(0)}€
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className={`w-4 h-4 ${stats.difference >= 0 ? 'text-cyan-400' : 'text-orange-400'}`} />
                  <span className="text-xs text-slate-500 uppercase">Balance</span>
                </div>
                <p className={`text-2xl font-bold tabular-nums ${
                  stats.difference >= 0 ? 'text-cyan-400' : 'text-orange-400'
                }`}>
                  {stats.difference >= 0 ? '+' : ''}{stats.difference.toFixed(0)}€
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ===== SECTION 2 : Analytics ===== */}
        <section className="grid grid-cols-3 gap-4">
          
          {/* Top 3 Dépenses */}
          <div className="bg-[#12131A] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold">Top 3 Dépenses</h3>
                <p className="text-xs text-slate-400 mt-0.5">Relations les plus coûteuses</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>

            <div className="space-y-3">
              {analytics.top3People.length > 0 ? (
                analytics.top3People.map(({ person, spent }, idx) => {
                  const hasBudget = existingBudgetsByPerson.has(person.id);
                  
                  return (
                    <motion.div
                      key={person.id}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors"
                      onClick={() => onViewDetail(person)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white/10">
                          <AvatarImage src={person.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs font-bold">
                            {person.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#12131A] rounded-full flex items-center justify-center border border-white/10">
                          <span className="text-[10px] font-bold text-red-400">#{idx + 1}</span>
                        </div>
                        {hasBudget && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#12131A]">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{person.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {hasBudget ? '✓ Budget défini' : person.relationship}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-400 tabular-nums">
                          {spent.toFixed(0)}€
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {stats.totalExpenses > 0 ? ((spent / stats.totalExpenses) * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-6 text-center">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Aucune dépense détectée</p>
                </div>
              )}
            </div>
          </div>

          {/* Catégories avec recherche */}
          <div className="bg-[#12131A] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold">Catégories</h3>
                <p className="text-xs text-slate-400 mt-0.5">Répartition des dépenses</p>
              </div>
              <DollarSign className="w-5 h-5 text-orange-400" />
            </div>

            {/* Recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Rechercher une catégorie..."
                className="pl-9 h-9 bg-white/5 border-white/10 text-sm"
              />
            </div>

            {/* Liste avec scroll */}
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat, idx) => (
                  <motion.div
                    key={cat.category}
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                      <span className="text-sm font-medium truncate">{cat.category}</span>
                      <span className="text-sm font-bold text-orange-400 tabular-nums ml-2">
                        {cat.amount.toFixed(0)}€
                      </span>
                    </div>
                    
                    {cat.subCategories.length > 0 && (
                      <div className="space-y-1 pl-4 border-l-2 border-white/5">
                        {cat.subCategories.slice(0, 3).map(sub => (
                          <div key={sub.name} className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-500 truncate">{sub.name}</span>
                            <span className="text-slate-400 tabular-nums ml-2">{sub.amount.toFixed(0)}€</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="py-6 text-center">
                  <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Aucune catégorie trouvée</p>
                </div>
              )}
            </div>
          </div>

          {/* Action recommandée */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Action recommandée</h3>
                <p className="text-xs text-slate-400 mt-0.5">Optimisez vos dépenses</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {budgetStats.withoutBudget > 0 ? (
                <>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Définissez des <span className="font-semibold text-cyan-400">budgets personnalisés</span> pour 
                    vos {budgetStats.withoutBudget} relation{budgetStats.withoutBudget > 1 ? 's' : ''} principale{budgetStats.withoutBudget > 1 ? 's' : ''}.
                  </p>

                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Sans budget</span>
                      <span className="font-bold text-orange-400">{budgetStats.withoutBudget}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Avec budget</span>
                      <span className="font-bold text-green-400">{budgetStats.withBudget}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <p className="text-sm font-semibold text-green-400">Tous les budgets définis !</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    Toutes vos relations principales ont un budget.
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleOpenBudgetModal}
              disabled={budgetStats.withoutBudget === 0}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Target className="w-4 h-4 mr-2" />
              {budgetStats.withoutBudget > 0 
                ? `Définir ${budgetStats.withoutBudget} budget${budgetStats.withoutBudget > 1 ? 's' : ''}`
                : 'Budgets définis'
              }
            </Button>
          </div>
        </section>

        {/* ===== SECTION 3 : Liste des Relations (Scroll Horizontal) ===== */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Relations ({displayedPeople.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {stats.withTransactions} avec transactions • {stats.withoutTransactions} sans transactions
              </p>
            </div>

            {/* Barre de recherche */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une relation..."
                className="pl-9 h-10 bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* Scroll horizontal */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth custom-scrollbar">
              {displayedPeople.map((person, idx) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex-shrink-0 w-[280px]"
                >
                  <PersonCard 
                    person={person} 
                    circleLabel={person.circle} 
                    onEdit={() => onEdit(person)} 
                    onViewDetail={() => onViewDetail(person)} 
                    onDelete={() => onDelete(person.id)} 
                  />
                </motion.div>
              ))}

              {displayedPeople.length === 0 && (
                <div className="w-full py-12 text-center">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-base font-medium text-slate-400 mb-1">
                    {searchQuery ? 'Aucune relation trouvée' : 'Aucune relation'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {searchQuery ? 'Essayez une autre recherche' : 'Créez votre première relation'}
                  </p>
                </div>
              )}
            </div>

            {/* Indicateurs de scroll (si > 5 relations) */}
            {displayedPeople.length > 5 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="bg-gradient-to-l from-[#0A0B0D] via-[#0A0B0D] to-transparent w-32 h-full flex items-center justify-end pr-4">
                  <ChevronRight className="w-6 h-6 text-slate-600 animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ===== MODALE BUDGETS ===== */}
      <AnimatePresence>
        {showBudgetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowBudgetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#12131A] rounded-2xl shadow-2xl max-w-2xl w-full border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Target className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Définir les budgets</h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Créez des budgets pour vos relations principales
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBudgetModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  {budgetAssignments.map((assignment) => (
                    <div key={assignment.personId} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold">{assignment.personName}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{assignment.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Dépenses actuelles</p>
                          <p className="text-sm font-bold text-red-400 tabular-nums">
                            {assignment.currentSpent.toFixed(0)}€
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-slate-400 block">
                          Budget mensuel (€)
                        </label>
                        <Input
                          type="number"
                          value={assignment.suggestedBudget}
                          onChange={(e) => {
                            const updated = budgetAssignments.map(a =>
                              a.personId === assignment.personId
                                ? { ...a, suggestedBudget: Number(e.target.value) }
                                : a
                            );
                            setBudgetAssignments(updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            Réduction : {assignment.currentSpent > 0 ? (((assignment.currentSpent - assignment.suggestedBudget) / assignment.currentSpent) * 100).toFixed(0) : 0}%
                          </span>
                          <span className={assignment.suggestedBudget < assignment.currentSpent ? 'text-green-400' : 'text-orange-400'}>
                            {assignment.suggestedBudget < assignment.currentSpent ? 'Économie' : 'Augmentation'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 p-6 bg-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Total budgets</p>
                    <p className="text-2xl font-bold text-cyan-400 tabular-nums">
                      {budgetAssignments.reduce((sum, a) => sum + a.suggestedBudget, 0).toFixed(0)}€
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Économie potentielle</p>
                    <p className="text-2xl font-bold text-green-400 tabular-nums">
                      {budgetAssignments.reduce((sum, a) => sum + (a.currentSpent - a.suggestedBudget), 0).toFixed(0)}€
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowBudgetModal(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateBudgets}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-cyan-500/20"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Créer {budgetAssignments.length} budget{budgetAssignments.length > 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
