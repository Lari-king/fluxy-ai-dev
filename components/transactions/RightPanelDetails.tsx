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

import React, { useMemo, useCallback } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { Transaction } from '../../contexts/DataContext';
import { useRules } from '../../contexts/RulesContext';
import { evaluateRule } from '../../src/utils/ruleEngine';
import { formatCurrency } from '../../src/utils/format';
import { isSimilarDescription } from 'src/utils/insights/projection';

// ... (tes imports)

interface RightPanelDetailsProps {
  transaction: Transaction | null;
  prediction?: any; 
  recurringPredictions?: any[]; // 🆕 Ajoute cette ligne pour recevoir la liste globale
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  categories?: Array<{ name: string; color?: string; icon?: string; emoji?: string }>;
  people?: Array<{ id: string; name: string; avatar?: string; color?: string }>;
}

export function RightPanelDetails({ 
  transaction,
  prediction, 
  recurringPredictions = [], // 🆕 Récupère la liste
  onClose, 
  onEdit,
  onDelete,
  categories = [],
  people = []
}: RightPanelDetailsProps) {
  
  // --- HOOKS ---
  const { rules } = useRules();

  const matchedPrediction = useMemo(() => {
    if (!transaction || !recurringPredictions) return null;

    // 1. On cherche si l'ID de la transaction sélectionnée est dans une prédiction
    const byId = recurringPredictions.find(p => 
      p.transactionIds?.includes(transaction.id)
    );
    if (byId) return byId;

    // 2. Fallback par nom normalisé
    return recurringPredictions.find(p => 
      isSimilarDescription(p.description, transaction.description)
    );
  }, [transaction, recurringPredictions]);

  // ... (garde la suite de tes useMemo : category, person, isIncome, etc.)

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

  // Évaluer quelles règles matchent cette transaction
  const matchedRules = useMemo(() => {
    if (!transaction) return [];

    return rules
      .filter(rule => rule.enabled)
      .map(rule => {
        const result = evaluateRule(rule, transaction);
        return result.matches ? { rule, reason: result.reason } : null;
      })
      .filter(Boolean) as Array<{ rule: any; reason?: string }>;
  }, [transaction, rules]);

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

              {matchedRules.map(({ rule, reason }) => (
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

{/* SECTION ANALYSE PRÉDICTIVE DYNAMIQUE */}
{prediction && (
            <div className="space-y-2 pt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80 px-1 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Intelligence Artificielle
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 to-purple-500/5 p-4 space-y-3 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              >
                {/* En-tête avec Score de Confiance */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                    <Repeat className="w-5 h-5 text-purple-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h5 className="text-sm font-medium text-white/90">Suite Logique Détectée</h5>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 ${
                        prediction.confidence >= 90
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        <Target className="w-3 h-3" />
                        {prediction.confidence}% de probabilité
                      </div>
                    </div>
                    {/* Le texte explicatif EXACT */}
                    <p className="text-xs text-purple-200/60 leading-relaxed">
                      Cette transaction appartient à une récurrence identifiée <span className="text-purple-300 font-medium">
                        {prediction.transactionIds?.length || prediction.occurrences} fois
                      </span> dans votre historique.
                    </p>
                  </div>
                </div>

                {/* Grille de détails */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                    <p className="text-[10px] text-white/40 uppercase mb-1 font-bold">Cycle Moyen</p>
                    <p className="text-xs font-medium text-white/90">
                      Tous les {prediction.intervalDays} jours
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                    <p className="text-[10px] text-white/40 uppercase mb-1 font-bold">Prochaine échéance</p>
                    <p className="text-xs font-medium text-purple-300">
                      {new Date(prediction.nextExpectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Montant Habituel */}
                <div className="bg-black/30 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase font-bold">Montant Habituel</span>
                    <span className="text-sm font-medium text-purple-300">
                      {formatCurrency(prediction.amount)}
                    </span>
                  </div>
                  {/* Petit graphique circulaire de confiance */}
                  <div className="w-8 h-8 relative" title={`Confiance : ${prediction.confidence}%`}>
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/5" strokeWidth="4" />
                      <circle 
                        cx="18" cy="18" r="16" fill="none" 
                        className={prediction.confidence >= 90 ? "stroke-emerald-500" : "stroke-purple-500"}
                        strokeWidth="4" 
                        strokeDasharray={`${prediction.confidence}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
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
                        {transaction.type === 'withdrawal' && '💵 Retrait'}
                        {transaction.type === 'transfer' && '🔄 Virement'}
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