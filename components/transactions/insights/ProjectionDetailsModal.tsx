/**
 * 📊 PROJECTION DETAILS MODAL - NEURO BANK REDESIGN V2
 * 
 * Design philosophy:
 * - Scannable en 3 secondes
 * - Tailles cohérentes avec le reste de l'app
 * - Cards compactes mais lisibles
 * - Parsing intelligent des descriptions bancaires
 * - Click direct = filtre + detail drawer
 * - Max 5 items puis scroll interne
 */

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Calendar,
  Repeat,
  ArrowRight
} from 'lucide-react';
import { Transaction } from '../../../contexts/DataContext';
import { formatCurrency } from '../../../src/utils/format';
import { parseTransactionDescription, getRecurrencePattern, colorMap } from '../../../src/utils/transaction-parser';
import { normalizeDescription, isSimilarDescription } from '../../../src/utils/insights/projection';

interface ProjectionDetailsModalProps {
  projection: any;
  transactions: Transaction[];
  currentBalance: number;
  onClose: () => void;
  onFilterByTransaction?: (transactionId: string) => void;
  onFilterByRecurring?: (transactionIds: string[]) => void;
}

export const ProjectionDetailsModal = memo(function ProjectionDetailsModal({
  projection,
  transactions,
  currentBalance,
  onClose,
  onFilterByTransaction,
  onFilterByRecurring
}: ProjectionDetailsModalProps) {
  
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  
  // Calculs
  const pastTransactions = projection.details.pastTransactions;
  const recurringPredictions = projection.details.recurringPredictions;
  
  const totalPastRevenue = pastTransactions
    .filter((t: Transaction) => t.amount > 0)
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  const totalPastExpense = Math.abs(pastTransactions
    .filter((t: Transaction) => t.amount < 0)
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0));
  
  const totalRecurringRevenue = recurringPredictions
    .filter((p: any) => p.type === 'revenue')
    .reduce((sum: number, p: any) => sum + p.amount, 0);
  const totalRecurringExpense = recurringPredictions
    .filter((p: any) => p.type === 'expense')
    .reduce((sum: number, p: any) => sum + Math.abs(p.amount), 0);
  
  const projectedChange = projection.projectedBalance - projection.details.previousMonthEndBalance;
  const projectedChangePercent = projection.details.previousMonthEndBalance !== 0 
    ? ((projectedChange / Math.abs(projection.details.previousMonthEndBalance)) * 100).toFixed(1)
    : 0;

  // Parser les transactions
  const parsedTransactions = useMemo(() => {
    return pastTransactions.map((txn: Transaction) => ({
      ...txn,
      parsed: parseTransactionDescription(txn.description)
    }));
  }, [pastTransactions]);

  // Parser les récurrences
  const parsedRecurrences = useMemo(() => {
    return recurringPredictions.map((pred: any) => ({
      ...pred,
      pattern: getRecurrencePattern(pred.description),
      parsedName: parseTransactionDescription(pred.description).merchant
    }));
  }, [recurringPredictions]);

// Remplace le bloc handleRecurringClick (autour de la ligne 398) par celui-ci :
const handleRecurringClick = (pred: any) => {
  // 1. Priorité aux IDs précis fournis par le moteur de projection
  if (pred.transactionIds && pred.transactionIds.length > 0) {
    onFilterByRecurring?.(pred.transactionIds);
    return;
  }

  // 2. Fallback au cas où (recherche par nom normalisé)
  const related = transactions.filter(t => 
    normalizeDescription(t.description) === normalizeDescription(pred.description)
  );

  if (related.length > 0) {
    onFilterByRecurring?.(related.map(t => t.id));
  } else {
    console.warn(`[ProjectionModal] Aucune transaction trouvée pour "${pred.rawDescription || pred.description}" – matching trop strict`);
  }
};

  const getFrequencyLabel = (pred: any) => {
    if (pred.description.toLowerCase().includes('mensuel') || pred.description.toLowerCase().includes('salaire')) {
      return 'Mensuel';
    }
    return 'Récurrent';
  };

  return (
    <div className="h-full flex flex-col bg-black">
      
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
        
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="group flex items-center gap-2 mb-6 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour aux insights
          </button>

          {/* Résultat principal */}
          <div className="mb-6">
            <p className="text-xs text-white/40 mb-2">Projection fin de mois</p>
            <div className="flex items-baseline gap-3 mb-2">
              <span 
                className="text-4xl font-light tracking-tight"
                style={{ 
                  color: projection.projectedBalance >= 0 
                    ? 'rgb(34, 197, 94)' 
                    : 'rgb(239, 68, 68)' 
                }}
              >
                {formatCurrency(projection.projectedBalance)}
              </span>
              <div className="flex items-center gap-2">
                {projectedChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span 
                  className="text-base"
                  style={{ 
                    color: projectedChange >= 0 
                      ? 'rgb(34, 197, 94)' 
                      : 'rgb(239, 68, 68)' 
                  }}
                >
                  {projectedChange >= 0 ? '+' : ''}{projectedChangePercent}%
                </span>
              </div>
            </div>
            <p className="text-xs text-white/50">
              par rapport à la fin du mois dernier ({formatCurrency(projection.details.previousMonthEndBalance)})
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <p className="text-xs text-white/50 mb-2">Confiance</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl text-white font-medium">{projection.confidence}%</span>
                <span className="text-xs text-white/40">
                  {projection.confidence >= 70 ? 'Élevée' : projection.confidence >= 50 ? 'Moyenne' : 'Faible'}
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${projection.confidence}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <p className="text-xs text-white/50 mb-2">Solde actuel</p>
              <span className="text-2xl font-medium" style={{
                color: currentBalance >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
              }}>
                {formatCurrency(currentBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU SCROLLABLE */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">
          
          {/* MÉTHODOLOGIE - TIMELINE VISUELLE */}
          <div className="rounded-xl border border-purple-500/30 overflow-hidden">
            <button
              onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
              className="w-full flex items-center justify-between p-4 bg-purple-500/10 hover:bg-purple-500/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/90 font-medium">Méthodologie de calcul</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${isMethodologyOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isMethodologyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-purple-500/20"
                >
                  <div className="p-5 bg-black/20">
                    {/* Timeline horizontale */}
                    <div className="flex items-center justify-between mb-5 relative">
                      {/* Ligne de connexion */}
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2" />
                      
                      {/* Étape 1 */}
                      <div className="relative z-10 flex flex-col items-center flex-1">
                        <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center mb-2">
                          <span className="text-lg font-bold text-white/90">1</span>
                        </div>
                        <p className="text-xs text-white/40 mb-1">Départ</p>
                        <p className="text-xs text-white/70 font-medium">{formatCurrency(projection.details.previousMonthEndBalance)}</p>
                      </div>

                      <ArrowRight className="w-5 h-5 text-purple-400 relative z-10 flex-shrink-0 mx-2" />

                      {/* Étape 2 */}
                      <div className="relative z-10 flex flex-col items-center flex-1">
                        <div className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-500/50 flex items-center justify-center mb-2">
                          <span className="text-lg font-bold text-cyan-400">2</span>
                        </div>
                        <p className="text-xs text-white/40 mb-1">Actuel</p>
                        <p className="text-xs text-cyan-400 font-medium">{formatCurrency(currentBalance)}</p>
                      </div>

                      <ArrowRight className="w-5 h-5 text-purple-400 relative z-10 flex-shrink-0 mx-2" />

                      {/* Étape 3 */}
                      <div className="relative z-10 flex flex-col items-center flex-1">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-500/50 flex items-center justify-center mb-2">
                          <span className="text-lg font-bold text-purple-400">3</span>
                        </div>
                        <p className="text-xs text-white/40 mb-1">Projection</p>
                        <p className="text-xs text-purple-400 font-medium">{formatCurrency(projection.projectedBalance)}</p>
                      </div>
                    </div>

                    {/* Détails des calculs */}
                    <div className="space-y-2 pt-5 border-t border-white/5">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                        <span className="text-xs text-white/70">Solde fin mois dernier</span>
                        <span className="text-xs text-white/90 font-mono">{formatCurrency(projection.details.previousMonthEndBalance)}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-500/10">
                        <span className="text-xs text-cyan-300">+ Transactions ce mois</span>
                        <span className="text-xs text-cyan-400 font-mono">{formatCurrency(totalPastRevenue - totalPastExpense)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                        <span className="text-xs text-white font-medium">= Solde actuel</span>
                        <span className="text-sm text-white font-mono font-bold">{formatCurrency(currentBalance)}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-500/10">
                        <span className="text-xs text-purple-300">+ Récurrences prévues</span>
                        <span className="text-xs text-purple-400 font-mono">{formatCurrency(totalRecurringRevenue - totalRecurringExpense)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/20 border-2 border-purple-500/40">
                        <span className="text-sm text-white font-medium">= Projection finale</span>
                        <span className="text-base text-white font-mono font-bold">{formatCurrency(projection.projectedBalance)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* TRANSACTIONS DU MOIS */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm text-white/90 font-medium mb-1">Transactions du mois</h3>
              <p className="text-xs text-white/40">{pastTransactions.length} transaction{pastTransactions.length > 1 ? 's' : ''}</p>
            </div>
            
            {parsedTransactions.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-sm text-white/40">Aucune transaction ce mois-ci</p>
              </div>
            ) : (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 overflow-hidden">
                <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
                  {parsedTransactions
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((txn: any, idx: number) => {
                      const colors = colorMap[txn.parsed.color];
                      const Icon = txn.parsed.icon;
                      
                      return (
                        <button
                          key={txn.id}
                          onClick={() => onFilterByTransaction?.(txn.id)}
                          className={`group w-full p-3 flex items-center gap-3 hover:bg-cyan-500/10 transition-all ${
                            idx !== parsedTransactions.length - 1 ? 'border-b border-white/5' : ''
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${colors.text}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm text-white/90 mb-1 group-hover:text-white transition-colors truncate">
                              {txn.parsed.merchant}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                                {txn.parsed.category}
                              </span>
                              <span className="text-xs text-white/40">
                                {new Date(txn.date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <span 
                            className="text-sm font-mono font-medium flex-shrink-0"
                            style={{
                              color: txn.amount > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                            }}
                          >
                            {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                          </span>
                        </button>
                      );
                    })
                  }
                </div>
              </div>
            )}
          </div>

          {/* RÉCURRENCES PRÉDITES */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm text-white/90 font-medium mb-1">Récurrences prédites</h3>
              <p className="text-xs text-white/40">{recurringPredictions.length} prévision{recurringPredictions.length > 1 ? 's' : ''}</p>
            </div>

            {parsedRecurrences.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-sm text-white/40">Aucune récurrence prédite pour ce mois</p>
              </div>
            ) : (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 overflow-hidden">
                <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
                  {parsedRecurrences
                    .sort((a: any, b: any) => Math.abs(b.amount) - Math.abs(a.amount))
                    .map((pred: any, idx: number) => {
                      const colors = colorMap[pred.pattern.color];
                      const Icon = pred.pattern.icon;
                      const confidenceColor = 
                        pred.confidence === 'high' ? 'green' :
                        pred.confidence === 'medium' ? 'yellow' : 'orange';
                      const confidenceColors = colorMap[confidenceColor];
                      
                      return (
<button
  key={idx}
  onClick={() => {
    // Normalisation sécurisée
    const normalizedPred = typeof normalizeDescription === 'function'
      ? normalizeDescription(pred.description)
      : pred.description.toUpperCase().replace(/[^A-Z0-9]/g, ' ');
  
    const matchingTxns = transactions.filter(t => {
      const similarDesc = isSimilarDescription(t.description, pred.description);
      const amountTolerance = Math.abs(Math.abs(t.amount) - Math.abs(pred.amount)) < Math.abs(pred.amount) * 0.1;
      return similarDesc && amountTolerance;
    });
  
    // Sécurité sur les IDs
    const validIds = matchingTxns
      .map(t => t.id)
      .filter(id => typeof id === 'string' && id.length > 8 && /^[a-zA-Z0-9\-_]+$/.test(id));
  
    if (validIds.length > 0) {
      onFilterByRecurring?.(validIds);
    } else {
      console.warn(`[ProjectionModal] Aucune transaction trouvée pour "${pred.description}" – matching trop strict ou données manquantes`);
    }
  }}
  className={`group w-full p-3 flex items-center gap-3 hover:bg-purple-500/10 transition-all ${
    idx !== parsedRecurrences.length - 1 ? 'border-b border-white/5' : ''
  }`}
>
  {/* Garde TOUT le contenu intérieur tel quel */}
  <div className={`w-9 h-9 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
    <Icon className={`w-4 h-4 ${colors.text}`} />
  </div>
  
  <div className="flex-1 min-w-0 text-left">
    <p className="text-sm text-white/90 mb-1 group-hover:text-white transition-colors truncate">
      {pred.parsedName}
    </p>
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
        {pred.pattern.type}
      </span>
      <span className={`text-xs px-1.5 py-0.5 rounded ${confidenceColors.bg} ${confidenceColors.text} border ${confidenceColors.border}`}>
        {pred.confidence === 'high' ? '✓ Haute' :
         pred.confidence === 'medium' ? '~ Moyenne' :
         '! Faible'}
      </span>
      <span className="text-xs text-white/40">
        {new Date(pred.nextExpectedDate).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short'
        })}
      </span>
    </div>
  </div>
  
  <span 
    className="text-sm font-mono font-medium flex-shrink-0"
    style={{
      color: pred.type === 'revenue' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
    }}
  >
    {pred.type === 'revenue' ? '+' : '-'}{formatCurrency(Math.abs(pred.amount))}
  </span>
</button>
                      );
                    })
                  }
                </div>
              </div>
            )}
          </div>

          {/* RISQUES */}
          {projection.risks && projection.risks.length > 0 && (
            <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm text-orange-300 font-medium mb-3">Risques identifiés</h3>
                  <ul className="space-y-2">
                    {projection.risks.map((risk: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-500/10">
                        <span className="text-orange-400 text-base leading-none mt-0.5">•</span>
                        <span className="text-xs text-orange-200/90 leading-relaxed">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
});