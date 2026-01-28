/**
 * 📄 RIGHT PANEL - TRANSACTION DETAILS V2026
 * 
 * Design harmonisé avec LeftPanel :
 * - Hiérarchie visuelle optimisée
 * - Micro-interactions raffinées
 * - Groupements logiques
 * - Performance optimisée
 * - Section "Règles détectées" intelligente
 */

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Tag, 
  Globe, 
  MapPin, 
  User, 
  Building2, 
  StickyNote, 
  Repeat,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Target,
  Zap,
  AlertTriangle,
  ShieldAlert,
  Split, // 🆕 Icône pour diviser
  CornerDownRight // 🆕 Icône pour sous-transaction
} from 'lucide-react';
import { Transaction } from '../../contexts/DataContext';
import { useRules } from '../../contexts/RulesContext';
import { evaluateRule } from '../../src/utils/ruleEngine';
import { formatCurrency } from '../../src/utils/format';
import { Rule } from '../../types/rules';

/**
 * 🧠 INTELLIGENCE : Analyse contextuelle des règles
 * Calcule le contexte d'une règle par rapport à l'historique des transactions
 */
const getRuleContext = (rule: Rule, transaction: Transaction, allTransactions: Transaction[]) => {
  if (!allTransactions || allTransactions.length === 0) return null;

  // Filtrer les transactions pertinentes pour cette règle
  const relevantTransactions = allTransactions.filter(t => {
    if (rule.type === 'category_budget' && t.category === rule.conditions.category) return true;
    if ((rule.type === 'merchant_frequency' || rule.type === 'merchant_amount') && 
        rule.conditions.merchantName && 
        t.description === rule.conditions.merchantName) return true;
    return false;
  });

  // 🏷️ BUDGET PAR CATÉGORIE
  if (rule.type === 'category_budget') {
    const period = rule.conditions.period || 'monthly';
    const txDate = new Date(transaction.date);
    
    // Filtrer par période (mois courant de la transaction affichée)
    const periodTransactions = relevantTransactions.filter(t => {
      const d = new Date(t.date);
      if (period === 'daily') {
        return d.toDateString() === txDate.toDateString();
      } else if (period === 'weekly') {
        const weekStart = new Date(txDate);
        weekStart.setDate(txDate.getDate() - txDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return d >= weekStart && d < weekEnd;
      } else if (period === 'monthly') {
        return d.getMonth() === txDate.getMonth() && d.getFullYear() === txDate.getFullYear();
      } else if (period === 'yearly') {
        return d.getFullYear() === txDate.getFullYear();
      }
      return false;
    });
    
    const totalSpent = periodTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const limit = rule.conditions.maxAmount || 0;
    
    return {
      type: 'budget',
      total: totalSpent,
      limit: limit,
      overage: totalSpent - limit,
      percentage: limit > 0 ? (totalSpent / limit) * 100 : 0,
      transactionCount: periodTransactions.length
    };
  }

  // 🛒 FRÉQUENCE MARCHAND
  if (rule.type === 'merchant_frequency') {
    const period = rule.conditions.frequencyPeriod || 'monthly';
    const txDate = new Date(transaction.date);
    
    const periodTransactions = relevantTransactions.filter(t => {
      const d = new Date(t.date);
      if (period === 'daily') return d.toDateString() === txDate.toDateString();
      if (period === 'weekly') {
        const weekStart = new Date(txDate);
        weekStart.setDate(txDate.getDate() - txDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return d >= weekStart && d < weekEnd;
      }
      if (period === 'monthly') {
        return d.getMonth() === txDate.getMonth() && d.getFullYear() === txDate.getFullYear();
      }
      return false;
    });
    
    return {
      type: 'frequency',
      count: periodTransactions.length,
      limit: rule.conditions.maxFrequency || 0,
      overage: periodTransactions.length - (rule.conditions.maxFrequency || 0)
    };
  }

  return null;
};

interface RightPanelDetailsProps {
  transaction: Transaction | null;
  prediction?: any; // 🆕 Prédiction récurrente
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onSplit?: (transaction: Transaction) => void; // 🆕 Callback pour diviser une transaction
  onNavigateToParent?: (parentId: string) => void; // 🆕 Callback pour naviguer vers la transaction parente
  onNavigateToChildren?: (parentId: string, childIds: string[]) => void; // 🆕 Callback pour naviguer vers les sous-transactions
  onToggleHidden?: (id: string, currentHiddenState: boolean) => void; // 🆕 Callback pour masquer/afficher
  categories?: Array<{ name: string; color?: string; icon?: string; emoji?: string }>;
  people?: Array<{ id: string; name: string; avatar?: string; color?: string }>;
  allTransactions?: Transaction[]; // 🆕 Liste complète des transactions pour vérifier l'existence des enfants
}

export function RightPanelDetails({ 
  transaction,
  prediction, // 🆕 Récupération de la prop
  onClose, 
  onEdit,
  onDelete,
  onSplit, // 🆕
  onNavigateToParent, // 🆕
  onNavigateToChildren, // 🆕
  onToggleHidden, // 🆕
  categories = [],
  people = [],
  allTransactions = []
}: RightPanelDetailsProps) {
  
  // --- HOOKS ---
  const { rules } = useRules();

  // --- COMPUTED VALUES ---
  const category = useMemo(() => 
    categories.find(c => c.name === transaction?.category),
    [categories, transaction?.category]
  );
  
  const person = useMemo(() => 
    people.find(p => p.id === transaction?.personId),
    [people, transaction?.personId]
  );
  
  const isIncome = useMemo(() => 
    (transaction?.amount || 0) >= 0,
    [transaction?.amount]
  );

  // 🆕 Vérifier si la transaction a des sous-transactions QUI EXISTENT VRAIMENT
  const hasChildTransactions = useMemo(() => {
    if (!(transaction as any)?.childTransactionIds || (transaction as any).childTransactionIds.length === 0) {
      return false;
    }
    
    // Vérifier que les enfants existent réellement dans allTransactions
    if (allTransactions.length > 0) {
      const childIds = (transaction as any).childTransactionIds as string[];
      const existingChildren = childIds.filter(childId => 
        allTransactions.some(t => t.id === childId)
      );
      return existingChildren.length > 0;
    }
    
    // Si allTransactions n'est pas fourni, faire confiance à childTransactionIds
    return true;
  }, [transaction, allTransactions]);

  const childCount = useMemo(() => {
    if (!(transaction as any)?.childTransactionIds) return 0;
    
    // Compter seulement les enfants qui existent réellement
    if (allTransactions.length > 0) {
      const childIds = (transaction as any).childTransactionIds as string[];
      return childIds.filter(childId => 
        allTransactions.some(t => t.id === childId)
      ).length;
    }
    
    return (transaction as any).childTransactionIds.length;
  }, [transaction, allTransactions]);

  // 🧠 OPTIMISATION : Évaluer quelles règles matchent + calculer le contexte intelligent
  const matchedRules = useMemo(() => {
    if (!transaction) return [];

    return rules
      .filter(rule => rule.enabled)
      .map(rule => {
        const result = evaluateRule(rule, transaction);
        if (!result.matches) return null;
        
        // 🆕 NOUVEAU : Calculer le contexte intelligent
        const context = getRuleContext(rule, transaction, allTransactions);
        return { rule, reason: result.reason, context };
      })
      .filter(Boolean) as Array<{ rule: any; reason?: string; context: any }>;
  }, [transaction, rules, allTransactions]);

  const formattedAmount = useMemo(() => {
    if (!transaction) return '';
    return formatCurrency(transaction.amount);
  }, [transaction]);

  const formattedDate = useMemo(() => {
    if (!transaction) return '';
    return new Date(transaction.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [transaction]);

  const daysAgo = useMemo(() => {
    if (!transaction) return 0;
    return Math.floor((Date.now() - new Date(transaction.date).getTime()) / (1000 * 60 * 60 * 24));
  }, [transaction]);

  const relativeTime = useMemo(() => {
    if (daysAgo === 0) return "Aujourd'hui";
    if (daysAgo === 1) return 'Hier';
    if (daysAgo < 7) return `Il y a ${daysAgo} jours`;
    if (daysAgo < 30) return `Il y a ${Math.floor(daysAgo / 7)} semaine${Math.floor(daysAgo / 7) > 1 ? 's' : ''}`;
    if (daysAgo < 365) return `Il y a ${Math.floor(daysAgo / 30)} mois`;
    return `Il y a ${Math.floor(daysAgo / 365)} an${Math.floor(daysAgo / 365) > 1 ? 's' : ''}`;
  }, [daysAgo]);

  // --- HANDLERS ---
  const handleEdit = useCallback(() => {
    if (transaction && onEdit) {
      onEdit(transaction);
    }
  }, [transaction, onEdit]);

  const handleDelete = useCallback(() => {
    if (!transaction || !onDelete) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      onDelete(transaction.id);
      onClose();
    }
  }, [transaction, onDelete, onClose]);

  const handleSplit = useCallback(() => {
    if (transaction && onSplit) {
      onSplit(transaction);
    }
  }, [transaction, onSplit]);

  // Ne rien afficher si pas de transaction
  if (!transaction) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={transaction.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="h-full overflow-y-auto scrollbar-thin bg-black border-l border-white/10"
        style={{ width: 'var(--right-panel-width, 380px)' }}
      >
        {/* HEADER AVEC GRADIENT */}
        <div className="sticky top-0 bg-black/90 backdrop-blur-xl border-b border-white/10 z-20">
          <div className="relative overflow-hidden">
            {/* Gradient bubble */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'} rounded-full blur-3xl`} />
            
            <div className="relative p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isIncome 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    {isIncome ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-white/90">
                      Détails
                    </h2>
                    <p className="text-xs text-white/40 font-mono">
                      #{transaction.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white/90"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-3">
          
          {/* 🆕 SECTION AUDIT (si transaction orpheline avec historique) */}
          {(transaction as any).auditInfo?.wasChildOf && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-300 font-medium mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Audit - Opération d'origine supprimée
                  </p>
                  <p className="text-sm text-white/70">
                    Cette sous-opération était liée à une transaction qui a été supprimée
                  </p>
                </div>
              </div>

              {/* Détails de la transaction supprimée */}
              <div className="bg-black/20 border border-red-500/20 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Libellé d'origine</span>
                  <span className="text-white/80 font-medium">
                    {(transaction as any).auditInfo.wasChildOf.description}
                  </span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Montant d'origine</span>
                  <span className="text-white/80 font-medium">
                    {formatCurrency((transaction as any).auditInfo.wasChildOf.amount)}
                  </span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Date d'origine</span>
                  <span className="text-white/80 font-medium">
                    {new Date((transaction as any).auditInfo.wasChildOf.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Supprimée le</span>
                  <span className="text-red-400 font-medium">
                    {new Date((transaction as any).auditInfo.wasChildOf.deletedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Note explicative */}
              <div className="mt-3 p-2 rounded-lg bg-red-900/10 border border-red-500/20">
                <p className="text-xs text-red-200/80">
                  <span className="font-medium">Note :</span> Cette sous-opération est désormais indépendante. 
                  L'historique de l'opération d'origine est conservé à titre informatif.
                </p>
              </div>
            </div>
          )}

          {/* 🆕 LIEN VERS TRANSACTION PARENTE (si sous-transaction) */}
          {(transaction as any).parentTransactionId && !(transaction as any).auditInfo && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
                  <CornerDownRight className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-purple-300 font-medium mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Sous-opération
                  </p>
                  <p className="text-sm text-white/70">
                    Cette transaction fait partie d'une opération divisée
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Trouver la transaction parente et la sélectionner
                  const parentId = (transaction as any).parentTransactionId;
                  // TODO: Appeler un callback pour naviguer vers la transaction parente
                  onNavigateToParent?.(parentId);
                }}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:text-purple-200 text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Voir l'opération d'origine
              </button>
            </div>
          )}

          {/* 🆕 INDICATEUR TRANSACTION DIVISÉE (si transaction parente) */}
          {hasChildTransactions && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center flex-shrink-0">
                  <Split className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-orange-300 font-medium mb-1 flex items-center gap-1">
                    <Split className="w-3 h-3" />
                    Opération divisée
                  </p>
                  <p className="text-sm text-white/70">
                    Cette transaction a été divisée en <span className="font-semibold text-orange-300">{childCount} sous-opérations</span>
                  </p>
                </div>
              </div>
              {(transaction as any).splitNote && (
                <div className="mt-3 p-2 rounded-lg bg-black/20 border border-orange-500/20">
                  <p className="text-xs text-white/60">
                    <span className="text-orange-300 font-medium">Note:</span> {(transaction as any).splitNote}
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  const childIds = (transaction as any).childTransactionIds || [];
                  onNavigateToChildren?.(transaction.id, childIds);
                }}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 hover:text-orange-200 text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <CornerDownRight className="w-4 h-4" />
                Voir les {childCount} sous-opérations
              </button>
              
              {/* Bouton pour masquer/afficher */}
              {onToggleHidden && (
                <button
                  onClick={() => {
                    onToggleHidden(transaction.id, !!(transaction as any).isHidden);
                  }}
                  className="mt-2 w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white/90 text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  {(transaction as any).isHidden ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Afficher dans les calculs
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Masquer des calculs
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* HERO - MONTANT */}
          <div className={`relative overflow-hidden rounded-xl border p-6 ${
            isIncome 
              ? 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20' 
              : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20'
          }`}>
            <div className="text-center space-y-2">
              <div className={`text-4xl font-light tracking-tight ${
                isIncome ? 'text-green-400' : 'text-red-400'
              }`}>
                {formattedAmount}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  isIncome 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {isIncome ? 'Revenu' : 'Dépense'}
                </div>
                {transaction.status && (
                  <div className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-white/60 flex items-center gap-1">
                    {transaction.status === 'completed' ? (
                      <><CheckCircle2 className="w-3 h-3" /> Validé</>
                    ) : (
                      <><AlertCircle className="w-3 h-3" /> En attente</>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION PRINCIPALE */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
              Informations principales
            </div>

            {/* Description */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors group">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/40 mb-1">Description</p>
                  <p className="text-sm text-white/90 break-words leading-relaxed">
                    {transaction.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Date avec timeline */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-1">Date</p>
                  <p className="text-sm text-white/90">{formattedDate}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Clock className="w-3 h-3 text-white/30" />
                    <span className="text-white/60">{relativeTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Catégorie avec emoji */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-1">Catégorie</p>
                  <div className="flex items-center gap-2">
                    {category?.emoji && (
                      <span className="text-lg">{category.emoji}</span>
                    )}
                    {category?.color && !category?.emoji && (
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <span className="text-sm text-white/90">
                      {transaction.category || 'Non classé'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personne */}
            {person && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-white/40 mb-1">Personne</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400 uppercase">
                        {person.name[0]}
                      </div>
                      <span className="text-sm text-white/90">{person.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION RÈGLES DÉTECTÉES */}
          {matchedRules.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1 flex items-center gap-2">
                <Target className="w-3.5 h-3.5" />
                Règles détectées ({matchedRules.length})
              </div>

              {matchedRules.map(({ rule, reason, context }) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border p-4 space-y-3 ${
                    rule.severity === 'error' 
                      ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30'
                      : rule.severity === 'warning'
                      ? 'bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30'
                      : 'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30'
                  }`}
                >
                  {/* En-tête de la règle */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      rule.severity === 'error' ? 'bg-red-500/20' :
                      rule.severity === 'warning' ? 'bg-orange-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      <ShieldAlert className={`w-5 h-5 ${
                        rule.severity === 'error' ? 'text-red-400' :
                        rule.severity === 'warning' ? 'text-orange-400' :
                        'text-blue-400'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h5 className="text-sm font-medium text-white/90">{rule.name}</h5>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          rule.severity === 'error' ? 'bg-red-500/20 text-red-400' :
                          rule.severity === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {rule.severity === 'error' ? 'Critique' : 
                           rule.severity === 'warning' ? 'Avertissement' : 'Info'}
                        </span>
                      </div>
                      {rule.description && (
                        <p className="text-xs text-white/60 leading-relaxed">{rule.description}</p>
                      )}
                    </div>
                  </div>

                  {/* 🆕 AFFICHAGE CONTEXTUEL INTELLIGENT */}
                  {context && context.type === 'budget' && (
                    <div className="mt-3 mb-2 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">
                          Budget utilisé ({formatCurrency(context.total)})
                        </span>
                        <span className={context.overage > 0 ? "text-red-400 font-bold" : "text-cyan-400 font-medium"}>
                          {context.overage > 0 
                            ? `+${formatCurrency(context.overage)} hors budget` 
                            : `${Math.round(context.percentage)}%`
                          }
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            context.overage > 0 ? 'bg-red-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(context.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-white/40">
                        {context.transactionCount} transaction{context.transactionCount > 1 ? 's' : ''} dans cette période
                      </div>
                    </div>
                  )}

                  {/* 🆕 CONTEXTE FRÉQUENCE */}
                  {context && context.type === 'frequency' && (
                    <div className="mt-3 mb-2 bg-black/20 rounded-lg p-3 border border-white/5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/60">Achats détectés</span>
                        <span className={context.overage > 0 ? "text-red-400 font-bold" : "text-cyan-400"}>
                          {context.count} / {context.limit}
                          {context.overage > 0 && ` (+${context.overage})`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Explication du déclenchement */}
                  <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                    <div className="flex items-start gap-2">
                      <Zap className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        rule.severity === 'error' ? 'text-red-400' :
                        rule.severity === 'warning' ? 'text-orange-400' :
                        'text-blue-400'
                      }`} />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-white/80 mb-1">Pourquoi cette règle s'applique :</div>
                        <div className="text-xs text-white/70 leading-relaxed">
                          {getRuleExplanation(rule, transaction, reason)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions suggérées */}
                  {rule.actions?.markAsAnomaly && (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                      <span>Marquée comme anomalie dans Insights</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* SECTION ANALYSE PRÉDICTIVE */}
          {prediction && (
            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Analyse Prédictive
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 space-y-3 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
              >
                {/* En-tête */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h5 className="text-sm font-medium text-white/90">Transaction récurrente détectée</h5>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        prediction.confidence === 'high' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : prediction.confidence === 'medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        Fiabilité {prediction.confidence === 'high' ? 'Haute' : prediction.confidence === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/70 leading-relaxed">
                      Cette opération apparaît en moyenne tous les <span className="text-purple-300 font-medium">{prediction.intervalDays} jours</span>
                    </p>
                  </div>
                </div>

                {/* Détails */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Fréquence</p>
                    <p className="text-xs font-medium text-white/80">{prediction.occurrences} fois en 6 mois</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Prochain estimé</p>
                    <p className="text-xs font-medium text-purple-300">
                      {new Date(prediction.nextExpectedDate).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Montant moyen */}
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Montant moyen</span>
                    <span className="text-sm font-medium text-purple-300">{formatCurrency(prediction.amount)}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* SECTION DÉTAILS */}
          {(transaction.country || transaction.city || transaction.type || transaction.url) && (
            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
                Détails complémentaires
              </div>

              {/* Type de paiement */}
              {transaction.type && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-white/40 mb-1">Type de paiement</p>
                      <p className="text-sm text-white/90">
                        {transaction.type === 'online' && '🌐 Paiement en ligne'}
                        {transaction.type === 'physical' && '🏪 Magasin physique'}
                        {!transaction.type && '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Localisation */}
              {(transaction.country || transaction.city) && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      {transaction.country && (
                        <div>
                          <p className="text-xs text-white/40 mb-1">Pays</p>
                          <p className="text-sm text-white/90">{transaction.country}</p>
                        </div>
                      )}
                      {transaction.city && (
                        <div className="pt-2 border-t border-white/5">
                          <p className="text-xs text-white/40 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Ville
                          </p>
                          <p className="text-sm text-white/90">{transaction.city}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* URL */}
              {transaction.url && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors group">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/40 mb-1">Lien externe</p>
                      <a
                        href={transaction.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyan-400 hover:text-cyan-300 break-all underline decoration-cyan-400/30 hover:decoration-cyan-300 transition-colors flex items-center gap-1"
                      >
                        <span className="truncate">Voir le lien</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {transaction.notes && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <StickyNote className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-white/40 mb-1">Notes</p>
                      <p className="text-sm text-white/90 break-words leading-relaxed">
                        {transaction.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION RÉCURRENCE */}
          {transaction.recurringGroupId && (
            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
                Récurrence
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <Repeat className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-purple-400/60 mb-1">Groupe récurrent</p>
                    <p className="text-sm text-purple-400 font-medium">
                      Transaction récurrente
                    </p>
                    <p className="text-xs text-purple-400/60 mt-1 font-mono">
                      #{transaction.recurringGroupId.slice(0, 12)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MÉTADONNÉES */}
          <div className="space-y-2 pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
              Métadonnées
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Identifiant</span>
                  <span className="text-white/60 font-mono text-[10px]">
                    {transaction.id.slice(0, 16)}...
                  </span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Sens</span>
                  <span className={`text-xs font-medium ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                    {isIncome ? '↑ Crédit' : '↓ Débit'}
                  </span>
                </div>
                {transaction.brand && (
                  <>
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40">Marque</span>
                      <span className="text-white/60">{transaction.brand}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ACTIONS FLOTTANTES */}
        <div className="sticky bottom-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 mt-4">
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 text-white/90 rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm font-medium transition-all group"
              >
                <Edit className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-lg py-2.5 px-4 flex items-center justify-center transition-all hover:shadow-lg hover:shadow-red-500/20"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onSplit && (
              <button
                onClick={handleSplit}
                className="bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 rounded-lg py-2.5 px-4 flex items-center justify-center transition-all hover:shadow-lg hover:shadow-purple-500/20"
                title="Diviser"
              >
                <Split className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}

/**
 * 📝 Génère une explication détaillée du déclenchement de la règle
 */
function getRuleExplanation(rule: any, transaction: Transaction, reason?: string): string {
  const conditions = rule.conditions;
  const amount = Math.abs(transaction.amount);

  switch (rule.type) {
    case 'keyword_detection':
      return `Le libellé "${transaction.description}" contient le mot-clé "${reason?.replace('Mot-clé trouvé: ', '')}" surveillé par cette règle.`;

    case 'category_budget':
      return `Cette transaction de ${formatCurrency(amount)} dans la catégorie "${transaction.category}" ${
        conditions.maxAmount 
          ? `dépasse le budget de ${formatCurrency(conditions.maxAmount)} sur la période ${getPeriodLabel(conditions.period)}.`
          : 'correspond aux critères de la règle.'
      }`;

    case 'merchant_frequency':
      return `Transaction détectée chez un marchand surveillé. ${
        conditions.maxFrequency 
          ? `Cette règle surveille la fréquence des achats (max ${conditions.maxFrequency} ${getPeriodLabel(conditions.frequencyPeriod)}).`
          : 'Marchand surveillé par cette règle.'
      }`;

    case 'merchant_amount':
      return `Transaction de ${formatCurrency(amount)} chez un marchand surveillé. ${
        conditions.merchantMaxAmount
          ? `Cette règle vérifie que le total ${getPeriodLabel(conditions.frequencyPeriod)} ne dépasse pas ${formatCurrency(conditions.merchantMaxAmount)}.`
          : 'Montant surveillé par cette règle.'
      }`;

    case 'time_range':
      const timeRange = conditions.startTime && conditions.endTime 
        ? `entre ${conditions.startTime} et ${conditions.endTime}`
        : 'dans la plage horaire définie';
      return `Transaction effectuée ${timeRange}. ${
        conditions.timeRangeMaxAmount
          ? `Budget maximum de ${formatCurrency(conditions.timeRangeMaxAmount)} ${getPeriodLabel(conditions.timeRangePeriod)}.`
          : ''
      }`;

    case 'recurring_variance':
      return `Abonnement "${conditions.recurringDescription}" détecté. ${
        conditions.maxVariancePercent
          ? `Cette règle surveille les variations de prix (max ${conditions.maxVariancePercent}%).`
          : 'Surveillance des changements de tarif.'
      }`;

    case 'person_flow':
      return `Flux de fonds impliquant "${conditions.personName}". ${
        conditions.minAmount
          ? `Montant minimum surveillé : ${formatCurrency(conditions.minAmount)}.`
          : ''
      }`;

    default:
      return reason || 'Cette transaction correspond aux critères de la règle.';
  }
}

/**
 * 📅 Retourne le label de période en français
 */
function getPeriodLabel(period?: string): string {
  switch (period) {
    case 'daily': return 'par jour';
    case 'weekly': return 'par semaine';
    case 'monthly': return 'par mois';
    case 'yearly': return 'par an';
    default: return '';
  }
}