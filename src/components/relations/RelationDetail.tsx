import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Mail, Edit, Trash2, MoreVertical, Calendar as CalendarIcon, 
  Clock, MapPin, Plus, X, Check, TrendingUp, TrendingDown, DollarSign, 
  Activity, Target, AlertTriangle, Award, ChevronLeft, ChevronRight, Eye, Link2,
  PiggyBank
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PersonRelation } from '@/types/people';
import { Transaction } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { AppEvents, emitEvent } from '@/utils/events';

interface RelationDetailProps {
  person: PersonRelation;
  transactions: Transaction[];
  allPeople?: PersonRelation[];
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onViewDetail?: (p: PersonRelation) => void;
}

type Period = 'all' | 'current-month' | 'last-3-months' | 'last-6-months' | 'current-year' | 'custom';

interface ActivityType {
  id: string;
  name: string;
  date: string;
  location?: string;
  duration?: number;
  plannedAmount?: number;
  status: 'past' | 'ongoing' | 'future';
  personId: string;
}

interface EmailReportConfig {
  startDate: string;
  endDate: string;
  message: string;
}

// Stockage localStorage pour les activités uniquement
const ACTIVITIES_STORAGE_KEY = 'relation-activities';

const getActivitiesFromStorage = (): ActivityType[] => {
  try {
    const data = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveActivitiesToStorage = (activities: ActivityType[]) => {
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
  } catch (error) {
    console.error('Error saving activities:', error);
  }
};

export function RelationDetail({
  person,
  transactions,
  allPeople = [],
  onEdit,
  onDelete,
  onBack,
  onViewDetail
}: RelationDetailProps) {
  const { budgets: allBudgets, updateBudgets } = useData();
  
  const [period, setPeriod] = useState<Period>('current-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showEmailReportModal, setShowEmailReportModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [budgetMonth, setBudgetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [emailReportConfig, setEmailReportConfig] = useState<EmailReportConfig>({
    startDate: '',
    endDate: '',
    message: ''
  });
  
  // Activités locales
  const [allActivities, setAllActivities] = useState<ActivityType[]>(getActivitiesFromStorage());
  
  const personActivities = useMemo(() => 
    allActivities.filter(a => a.personId === person.id),
    [allActivities, person.id]
  );

  // Budget depuis DataContext
  const personBudget = useMemo(() => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return (allBudgets as any[]).find((b: any) => 
      b.personId === person.id && b.month === currentMonth
    );
  }, [allBudgets, person.id]);

  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
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
        start = customStartDate ? new Date(customStartDate) : new Date();
        end = customEndDate ? new Date(customEndDate) : new Date();
        break;
      default:
        start = new Date(2000, 0, 1);
        end = now;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [period, customStartDate, customEndDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => txn.date >= startDate && txn.date <= endDate);
  }, [transactions, startDate, endDate]);

  const stats = useMemo(() => {
    const expenses = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const income = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    // Catégories avec priorité aux sous-catégories
    const categoryMap = new Map<string, number>();
    filteredTransactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const subCat = (t as any).subCategory;
        const cat = subCat || t.category || 'Non catégorisé';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Math.abs(t.amount));
      });
    
    const topCategories = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const allPersonTransactions = transactions.filter(t => t.personId === person.id);
    const firstTxnDate = allPersonTransactions.length > 0
      ? new Date(Math.min(...allPersonTransactions.map(t => new Date(t.date).getTime())))
      : new Date();
    const daysSinceFirst = Math.floor((new Date().getTime() - firstTxnDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let timeSinceFirst = '';
    if (daysSinceFirst < 7) {
      timeSinceFirst = `${daysSinceFirst} jour${daysSinceFirst > 1 ? 's' : ''}`;
    } else if (daysSinceFirst < 30) {
      const weeks = Math.floor(daysSinceFirst / 7);
      timeSinceFirst = `${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else if (daysSinceFirst < 365) {
      const months = Math.floor(daysSinceFirst / 30);
      timeSinceFirst = `${months} mois`;
    } else {
      const years = Math.floor(daysSinceFirst / 365);
      timeSinceFirst = `${years} an${years > 1 ? 's' : ''}`;
    }

    // Classements CORRECTS
    const allPeopleWithTransactions = allPeople.map(p => {
      const pTransactions = transactions.filter(t => t.personId === p.id);
      const pAmount = pTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        id: p.id,
        transactionCount: pTransactions.length,
        totalAmount: pAmount
      };
    }).filter(p => p.transactionCount > 0);

    const sortedByCount = [...allPeopleWithTransactions].sort((a, b) => b.transactionCount - a.transactionCount);
    const sortedByAmount = [...allPeopleWithTransactions].sort((a, b) => b.totalAmount - a.totalAmount);

    const rankByCount = sortedByCount.findIndex(p => p.id === person.id) + 1;
    const rankByAmount = sortedByAmount.findIndex(p => p.id === person.id) + 1;

    // POIDS DES REVENUS CORRIGÉ : dépenses de cette relation / revenus globaux
    const totalRevenues = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const personExpenses = allPersonTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const weightOnRevenues = totalRevenues > 0 ? (personExpenses / totalRevenues) * 100 : 0;

    const spendingByDay = new Map<number, number>();
    filteredTransactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const day = new Date(t.date).getDate();
        spendingByDay.set(day, (spendingByDay.get(day) || 0) + Math.abs(t.amount));
      });

    return {
      totalSpent: expenses,
      totalIncome: income,
      balance,
      transactionCount: filteredTransactions.length,
      totalTransactionCount: allPersonTransactions.length,
      topCategories,
      categoryCount: categoryMap.size,
      timeSinceFirst,
      daysSinceFirst,
      rankByCount,
      rankByAmount,
      weightOnRevenues,
      spendingByDay
    };
  }, [filteredTransactions, transactions, person.id, allPeople]);

  const budget = useMemo(() => {
    if (!personBudget) {
      return {
        allocated: 0,
        spent: stats.totalSpent,
        remaining: 0,
        percentage: 0,
        isDefined: false
      };
    }

    const allocated = personBudget.allocated || 0;
    const spent = stats.totalSpent;
    const remaining = allocated - spent;
    const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;

    return {
      allocated,
      spent,
      remaining,
      percentage,
      isDefined: true
    };
  }, [personBudget, stats.totalSpent]);

  // Stats activités avec budget
  const activitiesStats = useMemo(() => {
    const totalActivitiesAmount = personActivities
      .filter(a => a.plannedAmount)
      .reduce((sum, a) => sum + (a.plannedAmount || 0), 0);
    
    const budgetAllocated = budget.allocated;
    const alreadySpent = stats.totalSpent;
    const remainingAfterActivities = budgetAllocated - alreadySpent - totalActivitiesAmount;
    const isOverBudget = remainingAfterActivities < 0;
    const overBudgetAmount = isOverBudget ? Math.abs(remainingAfterActivities) : 0;

    return {
      totalActivitiesAmount,
      remainingAfterActivities,
      isOverBudget,
      overBudgetAmount,
      budgetDefined: budget.isDefined
    };
  }, [personActivities, budget, stats.totalSpent]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredTransactions]);

  const reportTransactions = useMemo(() => {
    const reportStart = emailReportConfig.startDate || startDate;
    const reportEnd = emailReportConfig.endDate || endDate;
    
    return transactions.filter(
      t => t.date >= reportStart && t.date <= reportEnd && t.personId === person.id
    );
  }, [transactions, emailReportConfig, startDate, endDate, person.id]);

  const generateEmailReport = () => {
    const reportStart = emailReportConfig.startDate || startDate;
    const reportEnd = emailReportConfig.endDate || endDate;

    const reportContent = `
Bonjour ${person.name},

${emailReportConfig.message || 'Voici un récapitulatif de nos transactions.'}

📊 RAPPORT DE TRANSACTIONS
Période : ${new Date(reportStart).toLocaleDateString('fr-FR')} - ${new Date(reportEnd).toLocaleDateString('fr-FR')}

TOTAL : ${reportTransactions.length} transaction(s)

DÉTAIL PAR TRANSACTION :
${reportTransactions.map((t, idx) => `
${idx + 1}. ${new Date(t.date).toLocaleDateString('fr-FR')}
   Description : ${t.description}
   Montant : ${t.amount.toFixed(2)}€
   Catégorie : ${t.category || 'Non catégorisé'}
   ${(t as any).subCategory ? `Sous-catégorie : ${(t as any).subCategory}` : ''}
`).join('\n')}

RÉSUMÉ :
- Dépenses totales : ${reportTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}€
- Revenus totaux : ${reportTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toFixed(2)}€

Cordialement,
    `.trim();

    const mailtoLink = `mailto:${person.email}?subject=Rapport de transactions - ${new Date(reportStart).toLocaleDateString('fr-FR')} au ${new Date(reportEnd).toLocaleDateString('fr-FR')}&body=${encodeURIComponent(reportContent)}`;
    
    window.location.href = mailtoLink;
    setShowEmailReportModal(false);
    setShowActionsMenu(false);
    toast.success('Email ouvert dans votre client mail');
  };

  const handleSaveActivity = (activity: Partial<ActivityType>) => {
    const updatedActivities = [...allActivities];
    
    if (editingActivity) {
      const index = updatedActivities.findIndex(a => a.id === editingActivity.id);
      if (index !== -1) {
        updatedActivities[index] = { ...updatedActivities[index], ...activity } as ActivityType;
      }
      toast.success('Activité modifiée');
    } else {
      const newActivity: ActivityType = {
        id: crypto.randomUUID(),
        name: activity.name || '',
        date: activity.date || new Date().toISOString().split('T')[0],
        location: activity.location,
        duration: activity.duration,
        plannedAmount: activity.plannedAmount,
        status: new Date(activity.date || '') > new Date() ? 'future' : 'past',
        personId: person.id
      };
      updatedActivities.push(newActivity);
      toast.success('Activité ajoutée');
    }
    
    setAllActivities(updatedActivities);
    saveActivitiesToStorage(updatedActivities);
    setShowActivityModal(false);
    setEditingActivity(null);
  };

  const handleDeleteActivity = (id: string) => {
    const updatedActivities = allActivities.filter(a => a.id !== id);
    setAllActivities(updatedActivities);
    saveActivitiesToStorage(updatedActivities);
    toast.success('Activité supprimée');
  };

  const handleSaveBudget = async (amount: number, month: string) => {
    try {
      const budgetsArray = allBudgets as any[];
      
      // Supprimer l'ancien budget de cette personne pour ce mois
      const filtered = budgetsArray.filter((b: any) => 
        !(b.personId === person.id && b.month === month)
      );
      
      const newBudget = {
        id: crypto.randomUUID(),
        personId: person.id,
        name: `Budget ${person.name}`,
        category: person.name,
        allocated: amount,
        spent: 0,
        icon: '👤',
        color: '#00D1FF',
        month,
        period: 'monthly' as const,
        createdAt: new Date().toISOString()
      };
      
      filtered.push(newBudget);
      await updateBudgets(filtered);
      emitEvent(AppEvents.BUDGETS_UPDATED);
      
      setShowBudgetModal(false);
      toast.success('Budget défini');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Erreur lors de la sauvegarde du budget');
    }
  };

  const isActivityOverBudget = (activityAmount: number) => {
    if (!budget.isDefined) return false;
    return (budget.spent + activityAmount) > budget.allocated;
  };

  const getActivityOverBudgetAmount = (activityAmount: number) => {
    if (!budget.isDefined) return 0;
    const total = budget.spent + activityAmount;
    return total > budget.allocated ? total - budget.allocated : 0;
  };

  const VISIBLE_TRANSACTIONS = 6;
  const VISIBLE_ACTIVITIES = 4;
  const VISIBLE_CATEGORIES = 5;

  // Date minimum pour les activités (aujourd'hui)
  const minActivityDate = new Date().toISOString().split('T')[0];

  return (
    <div className="h-screen flex flex-col bg-[#0A0B0D] text-white overflow-hidden">
      
      {/* HEADER */}
      <header className="flex-shrink-0 border-b border-white/5 bg-[#0A0B0D]/95 backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            
            {/* Navigation Relations CENTRÉE */}
            {allPeople.length > 0 && (
              <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                <button
                  onClick={() => {
                    const currentIndex = allPeople.findIndex(p => p.id === person.id);
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : allPeople.length - 1;
                    onViewDetail?.(allPeople[prevIndex]);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>

                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  {allPeople.slice(0, 7).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => p.id !== person.id && onViewDetail?.(p)}
                      className={`transition-all ${
                        p.id === person.id
                          ? 'ring-2 ring-cyan-400 scale-125'
                          : 'opacity-50 hover:opacity-100 hover:scale-110'
                      }`}
                    >
                      <Avatar className={`border-2 border-white/10 ${p.id === person.id ? 'h-12 w-12' : 'h-10 w-10'}`}>
                        <AvatarImage src={p.avatar} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-blue-500">
                          {p.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const currentIndex = allPeople.findIndex(p => p.id === person.id);
                    const nextIndex = currentIndex < allPeople.length - 1 ? currentIndex + 1 : 0;
                    onViewDetail?.(allPeople[nextIndex]);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            )}

            {/* Filtre Période */}
            <div className="flex items-center gap-3 ml-auto">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="current-month">Mois en cours</option>
                <option value="last-3-months">3 derniers mois</option>
                <option value="last-6-months">6 derniers mois</option>
                <option value="current-year">Année en cours</option>
                <option value="all">Toute la période</option>
                <option value="custom">Personnalisée</option>
              </select>

              {period === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                  <span className="text-slate-500">→</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="grid grid-cols-12 gap-4">

            {/* ========== COLONNE GAUCHE (3 colonnes) ========== */}
            <div className="col-span-3 space-y-4">
              
              {/* Photo + Type de relation + Menu Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#12131A] border border-white/10 rounded-2xl relative overflow-hidden"
              >
                <div className="relative h-56">
                  <Avatar className="absolute inset-0 w-full h-full rounded-t-2xl">
                    <AvatarImage 
                      src={person.avatar} 
                      className="object-cover w-full h-full rounded-t-2xl"
                    />
                    <AvatarFallback className="text-7xl bg-gradient-to-br from-cyan-500 to-blue-500 rounded-t-2xl w-full h-full flex items-center justify-center">
                      {person.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="absolute top-2 right-2 z-50" ref={actionsMenuRef}>
                    <button
                      onClick={() => setShowActionsMenu(!showActionsMenu)}
                      className="p-2 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {showActionsMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute top-full right-0 mt-2 bg-[#0A0A0A]/95 border border-white/10 rounded-xl shadow-2xl py-2 min-w-[200px] backdrop-blur-2xl"
                          style={{ zIndex: 100 }}
                        >
                          <button
                            onClick={() => { onEdit(); setShowActionsMenu(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition-all flex items-center gap-3"
                          >
                            <Edit className="w-4 h-4 text-blue-400" />
                            Modifier
                          </button>
                          <button
                            onClick={() => { window.location.href = `tel:${person.phone}`; setShowActionsMenu(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition-all flex items-center gap-3"
                          >
                            <Phone className="w-4 h-4 text-green-400" />
                            Appeler
                          </button>
                          <button
                            onClick={() => { setShowEmailReportModal(true); setShowActionsMenu(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition-all flex items-center gap-3"
                          >
                            <Mail className="w-4 h-4 text-cyan-400" />
                            Envoyer rapport
                          </button>
                          <div className="h-px bg-white/10 my-1" />
                          <button
                            onClick={() => { onDelete(); setShowActionsMenu(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-3"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="p-4 text-center">
                  <p className="text-sm text-slate-400">{person.relationship || 'Relation'}</p>
                </div>
              </motion.div>

              {/* Statistiques */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#12131A] border border-white/10 rounded-2xl p-4"
              >
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-400 uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  Statistiques
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">Depuis</span>
                    </div>
                    <p className="text-sm font-bold text-cyan-400">{stats.timeSinceFirst}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <DollarSign className="w-3 h-3" />
                      <span className="text-xs">Opérations</span>
                    </div>
                    <p className="text-sm font-bold text-purple-400">{stats.totalTransactionCount}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Award className="w-3 h-3" />
                      <span className="text-xs">Classement (ops)</span>
                    </div>
                    <p className="text-sm font-bold text-orange-400">#{stats.rankByCount || '—'}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Award className="w-3 h-3" />
                      <span className="text-xs">Classement (€)</span>
                    </div>
                    <p className="text-sm font-bold text-orange-400">#{stats.rankByAmount || '—'}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs">Poids revenus</span>
                    </div>
                    <p className="text-sm font-bold text-green-400">{stats.weightOnRevenues.toFixed(1)}%</p>
                  </div>
                </div>
              </motion.div>

              {/* BUDGET UNIFIÉ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`bg-gradient-to-br rounded-2xl p-4 border ${
                  budget.isDefined && budget.percentage > 100
                    ? 'from-red-500/10 to-orange-500/5 border-red-500/30'
                    : budget.isDefined
                    ? 'from-green-500/10 to-emerald-500/5 border-green-500/30'
                    : 'from-purple-500/10 to-pink-500/5 border-purple-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-400 uppercase tracking-wider">
                    <Target className="w-4 h-4" />
                    Budget défini
                  </h3>
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 text-purple-400" />
                  </button>
                </div>

                {budget.isDefined ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Alloué</span>
                      <span className="font-bold text-white">{budget.allocated.toFixed(0)}€</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Dépensé</span>
                      <span className={`font-bold ${budget.percentage > 100 ? 'text-red-400' : 'text-cyan-400'}`}>
                        {budget.spent.toFixed(0)}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Reste</span>
                      <span className={`font-bold ${budget.remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {budget.remaining.toFixed(0)}€
                      </span>
                    </div>

                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`h-full ${
                          budget.percentage > 100
                            ? 'bg-gradient-to-r from-red-500 to-orange-500'
                            : budget.percentage > 75
                            ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500'
                        }`}
                      />
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-1">
                      {budget.percentage.toFixed(0)}% utilisé
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-slate-500">Aucun budget défini</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* ========== COLONNE CENTRALE (6 colonnes) ========== */}
            <div className="col-span-6 space-y-4">
              
              {/* Transactions - LIMITÉ À 6 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-[#12131A] border border-white/10 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Transactions ({stats.transactionCount})
                  </h3>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-slate-500">Revenus</span>
                      <span className="font-bold text-green-400">+{stats.totalIncome.toFixed(0)}€</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-slate-500">Dépenses</span>
                      <span className="font-bold text-red-400">-{stats.totalSpent.toFixed(0)}€</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-cyan-400" />
                      <span className="text-slate-500">Balance</span>
                      <span className={`font-bold ${stats.balance >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                        {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(0)}€
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                  {sortedTransactions.length > 0 ? (
                    <>
                      {sortedTransactions.slice(0, VISIBLE_TRANSACTIONS).map((txn) => (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium truncate">{txn.description}</p>
                              {txn.amount > 0 && <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />}
                              {txn.amount < 0 && <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />}
                              {txn.personId && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                                  <Link2 className="w-3 h-3" />
                                  Lié
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {new Date(txn.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </p>
                          </div>
                          <div className="text-right ml-3">
                            <p className={`text-xs font-bold ${txn.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {txn.amount < 0 ? '' : '+'}{txn.amount.toFixed(0)}€
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {sortedTransactions.length > VISIBLE_TRANSACTIONS && (
                        <>
                          <div className="h-px bg-white/5 my-2" />
                          {sortedTransactions.slice(VISIBLE_TRANSACTIONS).map((txn) => (
                            <div
                              key={txn.id}
                              className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-medium truncate">{txn.description}</p>
                                  {txn.amount > 0 && <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />}
                                  {txn.amount < 0 && <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />}
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  {new Date(txn.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                </p>
                              </div>
                              <div className="text-right ml-3">
                                <p className={`text-xs font-bold ${txn.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  {txn.amount < 0 ? '' : '+'}{txn.amount.toFixed(0)}€
                                </p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Aucune transaction</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Activités OPTIMISÉ - LIMITÉ À 4 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#12131A] border border-white/10 rounded-2xl p-4"
              >
                {/* Header avec Stats inline */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-4 h-4 text-slate-400" />
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Activités</h3>
                      <Button
                        onClick={() => {
                          setEditingActivity(null);
                          setShowActivityModal(true);
                        }}
                        className="ml-auto bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 h-7 text-xs px-3"
                        size="sm"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    
                    {/* Stats compactes */}
                    {activitiesStats.budgetDefined && personActivities.length > 0 && (
                      <div className="flex items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-1">
                          <PiggyBank className="w-3 h-3 text-cyan-400" />
                          <span className="text-slate-500">Activités prévues</span>
                          <span className="font-bold text-cyan-400">{activitiesStats.totalActivitiesAmount.toFixed(0)}€</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Dépensé</span>
                          <span className="font-bold text-orange-400">{stats.totalSpent.toFixed(0)}€</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Reste</span>
                          <span className={`font-bold ${activitiesStats.isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                            {activitiesStats.isOverBudget ? '-' : ''}{Math.abs(activitiesStats.remainingAfterActivities).toFixed(0)}€
                          </span>
                        </div>
                        {activitiesStats.isOverBudget && (
                          <>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-1 text-red-400">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="font-bold">-{activitiesStats.overBudgetAmount.toFixed(0)}€</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Liste compacte */}
                <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {personActivities.length > 0 ? (
                    <>
                      {personActivities.slice(0, VISIBLE_ACTIVITIES).map((activity) => {
                        const isOverBudget = activity.plannedAmount ? isActivityOverBudget(activity.plannedAmount) : false;
                        const overAmount = activity.plannedAmount ? getActivityOverBudgetAmount(activity.plannedAmount) : 0;
                        
                        return (
                          <div key={activity.id}>
                            <div className={`p-2 rounded-lg border flex items-center justify-between ${
                              isOverBudget 
                                ? 'bg-red-500/5 border-red-500/20'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            } transition-colors`}>
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <h4 className="font-medium text-xs truncate">{activity.name}</h4>
                                <span className="text-[10px] text-slate-500 flex-shrink-0">
                                  {new Date(activity.date).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short'
                                  })}
                                </span>
                                {activity.location && (
                                  <>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-[10px] text-slate-500 flex-shrink-0 truncate max-w-[100px]">
                                      {activity.location}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                {activity.plannedAmount && (
                                  <span className={`text-xs font-bold ${isOverBudget ? 'text-red-400' : 'text-cyan-400'}`}>
                                    {activity.plannedAmount}€
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingActivity(activity);
                                    setShowActivityModal(true);
                                  }}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                  title="Modifier"
                                >
                                  <Edit className="w-3 h-3 text-slate-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(activity.id)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </button>
                              </div>
                            </div>
                            {isOverBudget && (
                              <div className="px-2 py-1 flex items-center gap-2 text-[10px] text-red-400">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                <span>Dépassement budget de {overAmount.toFixed(0)}€</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {personActivities.length > VISIBLE_ACTIVITIES && (
                        <>
                          <div className="h-px bg-white/5 my-2" />
                          {personActivities.slice(VISIBLE_ACTIVITIES).map((activity) => {
                            const isOverBudget = activity.plannedAmount ? isActivityOverBudget(activity.plannedAmount) : false;
                            const overAmount = activity.plannedAmount ? getActivityOverBudgetAmount(activity.plannedAmount) : 0;
                            
                            return (
                              <div key={activity.id}>
                                <div className={`p-2 rounded-lg border flex items-center justify-between ${
                                  isOverBudget 
                                    ? 'bg-red-500/5 border-red-500/20'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                } transition-colors`}>
                                  <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <h4 className="font-medium text-xs truncate">{activity.name}</h4>
                                    <span className="text-[10px] text-slate-500 flex-shrink-0">
                                      {new Date(activity.date).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short'
                                      })}
                                    </span>
                                    {activity.location && (
                                      <>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-[10px] text-slate-500 flex-shrink-0 truncate max-w-[100px]">
                                          {activity.location}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    {activity.plannedAmount && (
                                      <span className={`text-xs font-bold ${isOverBudget ? 'text-red-400' : 'text-cyan-400'}`}>
                                        {activity.plannedAmount}€
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleDeleteActivity(activity.id)}
                                      className="p-1 hover:bg-white/10 rounded transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                    </button>
                                  </div>
                                </div>
                                {isOverBudget && (
                                  <div className="px-2 py-1 flex items-center gap-2 text-[10px] text-red-400">
                                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                    <span>Dépassement de {overAmount.toFixed(0)}€</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="py-6 text-center">
                      <CalendarIcon className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Aucune activité enregistrée</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* ========== COLONNE DROITE (3 colonnes) ========== */}
            <div className="col-span-3 space-y-4">
              
              {/* Calendrier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-[#12131A] border border-white/10 rounded-2xl p-4"
              >
                <h3 className="text-sm font-semibold mb-3 text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Calendrier des dépenses
                </h3>

                <div className="grid grid-cols-7 gap-1">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
                    <div key={idx} className="text-[10px] text-slate-500 text-center mb-1">
                      {day}
                    </div>
                  ))}

                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const spending = stats.spendingByDay.get(day) || 0;
                    const maxSpending = Math.max(...Array.from(stats.spendingByDay.values()), 1);
                    const intensity = spending / maxSpending;

                    return (
                      <div
                        key={day}
                        className="aspect-square rounded-md flex items-center justify-center text-[10px] font-medium relative group"
                        style={{
                          backgroundColor: intensity > 0
                            ? `rgba(0, 209, 255, ${0.1 + intensity * 0.9})`
                            : 'rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        {day}
                        {spending > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/90 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {spending.toFixed(0)}€
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Moins</span>
                  <div className="flex gap-1">
                    {[0.2, 0.4, 0.6, 0.8, 1].map((intensity, idx) => (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: `rgba(0, 209, 255, ${intensity})` }}
                      />
                    ))}
                  </div>
                  <span>Plus</span>
                </div>
              </motion.div>

              {/* Catégories impactées - LIMITÉ À 5 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#12131A] border border-white/10 rounded-2xl p-4"
              >
                <h3 className="text-sm font-semibold mb-3 text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-cyan-400">{stats.categoryCount}</span>
                  </div>
                  Catégories impactées
                </h3>

                <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                  {stats.topCategories.length > 0 ? (
                    <>
                      {stats.topCategories.slice(0, VISIBLE_CATEGORIES).map((cat, idx) => {
                        const percentage = stats.totalSpent > 0 ? (cat.amount / stats.totalSpent) * 100 : 0;
                        const colors = [
                          'from-cyan-500 to-blue-500',
                          'from-purple-500 to-pink-500',
                          'from-orange-500 to-red-500',
                          'from-green-500 to-emerald-500',
                          'from-yellow-500 to-orange-500'
                        ];

                        return (
                          <div key={cat.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium truncate">{cat.name}</span>
                              <span className="text-slate-400 tabular-nums ml-2 whitespace-nowrap text-[10px]">
                                {cat.amount.toFixed(0)}€ ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, delay: 0.4 + idx * 0.05 }}
                                className={`h-full bg-gradient-to-r ${colors[idx % colors.length]}`}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {stats.topCategories.length > VISIBLE_CATEGORIES && (
                        <>
                          <div className="h-px bg-white/5 my-2" />
                          {stats.topCategories.slice(VISIBLE_CATEGORIES).map((cat, idx) => {
                            const percentage = stats.totalSpent > 0 ? (cat.amount / stats.totalSpent) * 100 : 0;
                            const colors = [
                              'from-cyan-500 to-blue-500',
                              'from-purple-500 to-pink-500',
                              'from-orange-500 to-red-500',
                              'from-green-500 to-emerald-500',
                              'from-yellow-500 to-orange-500'
                            ];
                            const colorIdx = (VISIBLE_CATEGORIES + idx) % colors.length;

                            return (
                              <div key={cat.name} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium truncate">{cat.name}</span>
                                  <span className="text-slate-400 tabular-nums ml-2 whitespace-nowrap text-[10px]">
                                    {cat.amount.toFixed(0)}€ ({percentage.toFixed(0)}%)
                                  </span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${colors[colorIdx]}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-xs text-slate-500">Aucune catégorie</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      {/* ========== MODALE BUDGET ========== */}
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
              className="bg-[#12131A] rounded-2xl shadow-2xl max-w-md w-full border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold">Définir un budget</h3>
                  </div>
                  <button
                    onClick={() => setShowBudgetModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const amount = Number(formData.get('amount'));
                  const month = formData.get('month') as string;
                  handleSaveBudget(amount, month);
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Mois *</label>
                  <input
                    type="month"
                    name="month"
                    required
                    defaultValue={budgetMonth}
                    onChange={(e) => setBudgetMonth(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Montant (€) *</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    defaultValue={personBudget?.allocated}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                    placeholder="500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowBudgetModal(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== MODALE EMAIL ========== */}
      <AnimatePresence>
        {showEmailReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowEmailReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#12131A] rounded-2xl shadow-2xl max-w-3xl w-full border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Envoyer un rapport par email</h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        À : {person.email || person.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEmailReportModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Période du rapport</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={emailReportConfig.startDate || startDate}
                      onChange={(e) => setEmailReportConfig({ ...emailReportConfig, startDate: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                    />
                    <span className="text-slate-500">→</span>
                    <input
                      type="date"
                      value={emailReportConfig.endDate || endDate}
                      onChange={(e) => setEmailReportConfig({ ...emailReportConfig, endDate: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message (optionnel)</label>
                  <textarea
                    value={emailReportConfig.message}
                    onChange={(e) => setEmailReportConfig({ ...emailReportConfig, message: e.target.value })}
                    placeholder="Ajoutez un message personnalisé..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm min-h-[100px] resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Prévisualisation</label>
                    <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Aperçu complet
                    </button>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-[300px] overflow-y-auto text-sm font-mono text-slate-400 custom-scrollbar">
                    <p className="mb-2">Bonjour {person.name},</p>
                    <p className="mb-4">{emailReportConfig.message || 'Voici un récapitulatif de nos transactions.'}</p>
                    <p className="font-bold mb-2">📊 RAPPORT DE TRANSACTIONS</p>
                    <p className="mb-4">
                      Période : {new Date(emailReportConfig.startDate || startDate).toLocaleDateString('fr-FR')} - {new Date(emailReportConfig.endDate || endDate).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-cyan-400 mb-2">TOTAL : {reportTransactions.length} transaction(s)</p>
                    
                    {reportTransactions.length > 0 && (
                      <>
                        <p className="font-bold mt-3 mb-2">DÉTAIL PAR TRANSACTION :</p>
                        {reportTransactions.slice(0, 3).map((t, idx) => (
                          <div key={t.id} className="mb-2 text-xs">
                            <p>{idx + 1}. {new Date(t.date).toLocaleDateString('fr-FR')}</p>
                            <p className="ml-3">Description : {t.description}</p>
                            <p className="ml-3">Montant : {t.amount.toFixed(2)}€</p>
                            <p className="ml-3">Catégorie : {t.category || 'Non catégorisé'}</p>
                          </div>
                        ))}
                        {reportTransactions.length > 3 && (
                          <p className="text-xs text-slate-600">... et {reportTransactions.length - 3} transaction(s) supplémentaire(s)</p>
                        )}
                        
                        <p className="font-bold mt-3 mb-2">RÉSUMÉ :</p>
                        <p className="text-xs">- Dépenses totales : {reportTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}€</p>
                        <p className="text-xs">- Revenus totaux : {reportTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toFixed(2)}€</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 p-6 bg-white/5">
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowEmailReportModal(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    onClick={generateEmailReport}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Ouvrir dans ma messagerie
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== MODALE ACTIVITÉ ========== */}
      <AnimatePresence>
        {showActivityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => {
              setShowActivityModal(false);
              setEditingActivity(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#12131A] rounded-2xl shadow-2xl max-w-md w-full border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold">
                      {editingActivity ? 'Modifier l\'activité' : 'Nouvelle activité'}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowActivityModal(false);
                      setEditingActivity(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveActivity({
                    name: formData.get('name') as string,
                    date: formData.get('date') as string,
                    location: formData.get('location') as string || undefined,
                    duration: formData.get('duration') ? Number(formData.get('duration')) : undefined,
                    plannedAmount: formData.get('plannedAmount') ? Number(formData.get('plannedAmount')) : undefined
                  });
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Nom de l'activité *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingActivity?.name}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                    placeholder="Dîner au restaurant"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Date * (à partir d'aujourd'hui)</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingActivity?.date}
                    min={minActivityDate}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Localisation</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingActivity?.location}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                    placeholder="Paris, France"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Durée (min)</label>
                    <input
                      type="number"
                      name="duration"
                      defaultValue={editingActivity?.duration}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                      placeholder="120"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Montant prévu (€)</label>
                    <input
                      type="number"
                      name="plannedAmount"
                      defaultValue={editingActivity?.plannedAmount}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowActivityModal(false);
                      setEditingActivity(null);
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {editingActivity ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 209, 255, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 209, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
