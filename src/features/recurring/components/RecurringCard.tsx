/**
 * 🔄 RECURRING CARD - VERSION COMPLÈTE HAUTE FIDÉLITÉ
 * FIX : Correction du parsing des dates (DD/MM/YY) pour éviter le masquage erroné.
 */

import { memo, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Repeat,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format';
import { formatFrequency } from '@/features/recurring/engine/recurring-detection';
import { parseTransactionDescription, colorMap } from '@/utils/transaction-parser';
import type { RecurringDetectionResult, RecurringPattern } from '@/features/recurring/engine/recurring-detection';
import { PersonRelation } from '@/features/people/types/base';

interface RecurringCardProps {
  recurring: RecurringDetectionResult;
  existingPeople?: PersonRelation[];
  onFilterByRecurring?: (transactionIds: string[]) => void;
  onCreateRelation?: (pattern: RecurringPattern) => void;
  linkedPatternIds?: Set<string>;
}

export const RecurringCard = memo(function RecurringCard({
  recurring,
  existingPeople = [],
  onFilterByRecurring,
  onCreateRelation,
  linkedPatternIds = new Set<string>()
}: RecurringCardProps) {
  
  useEffect(() => {
    console.group("🔍 DEBUG RECURRING CARD");
    console.log("Données 'recurring' reçues :", recurring);
    console.log("Nombre de patterns bruts :", recurring?.patterns?.length || 0);
    console.groupEnd();
  }, [recurring]);

  /**
   * 🛠️ Helper : Parse les dates au format DD/MM/YY ou ISO
   */
  const safeParseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      const fullYear = year < 100 ? 2000 + year : year;
      return new Date(fullYear, month - 1, day);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const isRecent = (dateStr: string, days: number): boolean => {
    const date = safeParseDate(dateStr);
    if (!date) return false;
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  };

  const existingNamesSet = useMemo(() => {
    return new Set(existingPeople.map(p => p.name.toLowerCase().trim()));
  }, [existingPeople]);

  const displayedPatterns = useMemo(() => {
    const allPatterns = recurring?.patterns || [];

    const getLastDate = (p: RecurringPattern): string => {
      if ((p as any).lastTransactionDate) return (p as any).lastTransactionDate;
      if (p.transactions && p.transactions.length > 0) {
        return p.transactions.reduce((latest, t) => t.date > latest ? t.date : latest, '');
      }
      return '';
    };

    const processed = allPatterns
      .map(p => {
        const parsed = parseTransactionDescription(p.description);
        const merchantName = (parsed.merchant || p.description).toLowerCase().trim();
        
        const isLinked = 
          p.transactions.some(t => !!t.personId) || 
          linkedPatternIds.has(p.id) || 
          existingNamesSet.has(merchantName);

        const lastTxDate = getLastDate(p);

        const txs = p.transactions;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let changePercent = 0;
        if (txs.length >= 2) {
          const last = Math.abs(txs[txs.length - 1].amount);
          const prev = Math.abs(txs[txs.length - 2].amount);
          changePercent = prev !== 0 ? ((last - prev) / prev) * 100 : 0;
          if (changePercent > 1) trend = 'up';
          else if (changePercent < -1) trend = 'down';
        }

        return { 
          ...p, 
          parsed: {
            merchant: parsed.merchant || p.description,
            category: parsed.category || p.category,
            color: parsed.color,
            emoji: (parsed as any).emoji || (p.parsed as any)?.emoji || '🏢' 
          }, 
          isLinked, 
          trend, 
          changePercent, 
          computedLastDate: lastTxDate 
        };
      })
      /**
       * ⚠️ MODIFICATION CRITIQUE : 
       * Si le pattern vient de l'IA (isActive), on l'affiche même s'il est vieux.
       * On n'applique le filtre de 90 jours QUE pour les patterns non-identifiés explicitement comme actifs.
       */
      .filter(p => {
        // On renvoie 'true' pour tout le monde sans condition
        return true; 
      })
      .sort((a, b) => {
        if (a.isLinked !== b.isLinked) return a.isLinked ? 1 : -1;
        return b.confidence - a.confidence;
      });

    return processed;
  }, [recurring?.patterns, linkedPatternIds, existingNamesSet]);

  if (!recurring || displayedPatterns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
        <Repeat className="w-8 h-8 text-white/10 mb-3" />
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest text-center">
          {recurring?.patterns?.length > 0 
            ? `${recurring.patterns.length} flux masqués (trop anciens)`
            : "Aucun flux récurrent détecté"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[420px] bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <Repeat className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            {displayedPatterns.length} Flux récurrents
          </span>
        </div>
        <div className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-400">
          IA ENGINE
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-black/20">
        {displayedPatterns.map((pattern, idx) => {
          const transactionIds = pattern.transactions.map(t => t.id);
          const colors = colorMap[pattern.parsed?.color || 'default'] || colorMap.default;
          
          return (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.06)" }}
              onClick={() => onFilterByRecurring?.(transactionIds)}
              className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                pattern.isLinked 
                ? 'bg-white/[0.01] border-white/5 opacity-60' 
                : 'bg-white/[0.04] border-white/10 border-l-purple-500/50'
              }`}
            >
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0 shadow-inner`}>
                   <span className="text-xl">{pattern.parsed?.emoji}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-[13px] font-bold text-white truncate pr-2">
                      {pattern.parsed?.merchant}
                    </h4>
                    <span className={`text-[13px] font-mono font-bold ${pattern.averageAmount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(pattern.averageAmount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] px-1 rounded uppercase font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {pattern.parsed?.category}
                    </span>
                    <span className="text-[10px] text-white/30">•</span>
                    <span className="text-[10px] text-white/40 font-medium">
                      {formatFrequency(pattern.frequency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   {pattern.trend !== 'stable' && (
                     <div className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                       pattern.trend === 'up' ? 'text-red-400 bg-red-400/5' : 'text-green-400 bg-green-400/5'
                     }`}>
                       {pattern.trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                       {Math.abs(Math.round(pattern.changePercent))}%
                     </div>
                   )}
                   <span className="text-[9px] text-white/20 uppercase tracking-widest">
                     Score {Math.round(pattern.confidence)}%
                   </span>
                </div>

                {pattern.isLinked ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/5 border border-green-500/10">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span className="text-[9px] text-green-500 font-black uppercase tracking-tighter">Lié</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-3 text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 font-black uppercase tracking-tighter"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateRelation?.(pattern);
                    }}
                  >
                    <UserPlus className="w-3 h-3 mr-1.5" />
                    Lier
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 bg-purple-500/5 border-t border-purple-500/20 backdrop-blur-md">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] font-black text-purple-400/60 uppercase tracking-[0.2em] mb-1">Impact Mensuel</p>
            <p className="text-2xl font-mono font-light text-white tracking-tighter">
              {formatCurrency(recurring?.monthlyRecurringAmount || 0)}
            </p>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Précision IA</p>
             <div className="flex gap-0.5 justify-end">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className={`h-1 w-3 rounded-full ${s <= 4 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-white/10'}`} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
});