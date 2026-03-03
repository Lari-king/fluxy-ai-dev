/**
 * 📊 PROJECTION DETAILS PANEL - NEURO BANK REDESIGN V2
 * Adapté pour l'affichage dans le panneau latéral gauche
 */

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Zap,
  Calendar
} from 'lucide-react';
import type { Transaction } from '@/features/transactions/types';
import { formatCurrency } from '@/utils/format';
import { parseTransactionDescription, colorMap } from '@/utils/transaction-parser';
import { normalizeDescription, isSimilarDescription } from '@/features/predictions/services/projection';
import { useData } from '@/contexts/DataContext'; // ✅ Ajouté pour récupérer les transactions

interface ProjectionDetailsModalProps {
  projection: any;
  transactions?: Transaction[]; // ✅ Optionnel - utilise DataContext si absent
  currentBalance?: number; // ✅ Optionnel - calculé si absent
  onClose: () => void;
  onFilterByTransaction?: (transactionId: string) => void;
  onFilterByRecurring?: (transactionIds: string[]) => void;
}

// Couleur de secours si la catégorie est inconnue de l'IA
const fallbackColor = {
  bg: 'bg-zinc-500/10',
  text: 'text-zinc-400',
  border: 'border-zinc-500/20',
  icon: 'text-zinc-500'
};

export const ProjectionDetailsModal = memo(function ProjectionDetailsModal({
  projection,
  transactions: propTransactions,
  currentBalance: propCurrentBalance,
  onClose,
  onFilterByRecurring
}: ProjectionDetailsModalProps) {
  
  // ✅ Utiliser DataContext si les transactions ne sont pas fournies
  const { transactions: contextTransactions = [] } = useData();
  const transactions = propTransactions || contextTransactions;
  
  // ✅ Calculer le currentBalance si non fourni
  const currentBalance = propCurrentBalance ?? transactions.reduce((sum, t) => sum + t.amount, 0);
  
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  
  // 1. Logique de dates
  const now = useMemo(() => new Date(), []);
  const endOfMonth = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }, [now]);

  // 2. Extraction sécurisée des données
  const recurringPredictions = projection?.details?.recurringPredictions || [];
  const previousMonthEndBalance = projection?.details?.previousMonthEndBalance || 0;
  
  const recurringThisMonth = useMemo(() => recurringPredictions.filter((p: any) => {
    const nextDate = new Date(p.nextExpectedDate);
    return nextDate > now && nextDate <= endOfMonth;
  }), [recurringPredictions, now, endOfMonth]);
  
  const totalRecurringRevenue = recurringThisMonth
    .filter((p: any) => p.type === 'revenue')
    .reduce((sum: number, p: any) => sum + p.amount, 0);
    
  const totalRecurringExpense = recurringThisMonth
    .filter((p: any) => p.type === 'expense')
    .reduce((sum: number, p: any) => sum + Math.abs(p.amount), 0);
  
  const projectedChange = projection.projectedBalance - previousMonthEndBalance;
  const projectedChangePercent = previousMonthEndBalance !== 0 
    ? ((projectedChange / Math.abs(previousMonthEndBalance)) * 100).toFixed(1)
    : 0;

  const handleRecurringClick = (pred: any) => {
    const normalizedPredDesc = normalizeDescription(pred.description || pred.rawDescription);
    const matchingTransactions = transactions.filter(t => {
      const normalizedTxnDesc = normalizeDescription(t.description);
      return isSimilarDescription(normalizedTxnDesc, normalizedPredDesc);
    });
    
    if (matchingTransactions.length > 0) {
      // ✅ Correction : On n'appelle plus onClose() ici pour permettre 
      // de voir les résultats au centre sans fermer ce panneau
      onFilterByRecurring?.(matchingTransactions.map(t => t.id));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden border-r border-white/5">
      
      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden border-b border-white/5 bg-white/[0.01]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px]" />
        
        <div className="relative p-5">
          <button
            onClick={onClose}
            className="group flex items-center gap-2 mb-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Retour intelligence
          </button>

          <div className="mb-6">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">
              Solde Projeté Fin de Mois
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-light tracking-tighter ${projection.projectedBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                {formatCurrency(projection.projectedBalance)}
              </span>
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${projectedChange >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {projectedChange >= 0 ? '+' : ''}{projectedChangePercent}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Confiance</p>
              <div className="flex items-center justify-between">
                <span className="text-lg text-white font-light font-mono">{projection.confidence}%</span>
                <Zap className={`w-3 h-3 ${projection.confidence > 70 ? 'text-yellow-400' : 'text-white/20'}`} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Actuel</p>
              <span className={`text-lg font-light font-mono ${currentBalance >= 0 ? 'text-white/90' : 'text-red-400'}`}>
                {formatCurrency(currentBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* ACCORDÉON MÉTHODOLOGIE */}
        <div className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden">
          <button
            onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
            className="w-full flex items-center justify-between p-3 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Calcul IA</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform ${isMethodologyOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isMethodologyOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5 p-4 space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-white/40 uppercase">Base départ</span>
                    <span className="text-white/80 font-mono">{formatCurrency(previousMonthEndBalance)}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-cyan-400 uppercase">Réalisé</span>
                    <span className="text-cyan-400 font-mono">+{formatCurrency(currentBalance - previousMonthEndBalance)}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-purple-400 uppercase">Futur</span>
                    <span className="text-purple-400 font-mono">-{formatCurrency(totalRecurringExpense - totalRecurringRevenue)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* LISTE DES RÉCURRENCES ATTENDUES */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="w-3 h-3 text-purple-400" />
            <h3 className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Flux attendus</h3>
          </div>

          <div className="space-y-2">
            {recurringThisMonth.length > 0 ? recurringThisMonth.map((pred: any, idx: number) => {
              const { merchant: merchantName } = parseTransactionDescription(pred.description || pred.rawDescription);
              const isRevenue = pred.type === 'revenue';
              const pattern = pred.pattern || {};
              
              const colors = colorMap[pattern.category as keyof typeof colorMap] || fallbackColor;
              const confidencePercent = Math.round((pattern.confidence || 0.8) * 100);
              
              const confidenceColors = 
                confidencePercent >= 80 ? { text: 'text-emerald-400', border: 'border-emerald-500/20' } :
                confidencePercent >= 60 ? { text: 'text-orange-400', border: 'border-orange-500/20' } :
                { text: 'text-red-400', border: 'border-red-500/20' };

              return (
                <button
                  key={idx}
                  onClick={() => handleRecurringClick(pred)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[11px] font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors truncate">
                      {merchantName}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[8px] uppercase font-black tracking-tighter px-1 rounded-sm ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {pattern.category || 'Flux'}
                      </span>
                      <span className={`text-[8px] font-bold ${confidenceColors.text}`}>
                        {confidencePercent}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className={`text-[11px] font-mono font-bold ${isRevenue ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isRevenue ? '+' : ''}{formatCurrency(pred.amount)}
                    </p>
                    <p className="text-[8px] text-white/20 font-black uppercase">Impact</p>
                  </div>
                </button>
              );
            }) : (
              <div className="p-6 text-center border border-dashed border-white/10 rounded-xl">
                <p className="text-[9px] uppercase font-bold text-white/20 tracking-widest">Aucun flux</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION RISQUES IA */}
        {projection.risks && projection.risks.length > 0 && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.02] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-[9px] font-black text-orange-300 uppercase tracking-widest mb-2">Vigilance</h3>
                <ul className="space-y-2">
                  {projection.risks.map((risk: string, idx: number) => (
                    <li key={idx} className="text-[10px] text-white/60 leading-tight">
                      • {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="h-8 flex items-center justify-center opacity-20">
          <div className="w-1 h-1 rounded-full bg-white mx-1" />
          <div className="w-1 h-1 rounded-full bg-white mx-1" />
        </div>
      </div>
    </div>
  );
});
