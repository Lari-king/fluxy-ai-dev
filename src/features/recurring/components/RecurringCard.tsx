/**
 * 🔄 RECURRING CARD - VERSION RESTAURÉE (ESTIMATION + LIAISON TESLA)
 * FIX : Correction du crash frequency.toLowerCase() et typage TS.
 */

import { memo, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Repeat,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  UserPlus,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format';
import { formatFrequency } from '@/features/recurring/engine/recurring-detection';
import { parseTransactionDescription, colorMap } from '@/utils/transaction-parser';
import { format, addDays, addMonths, addWeeks, addYears, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { RecurringDetectionResult, RecurringPattern } from '@/features/recurring/engine/recurring-detection';
import { PersonRelation } from '@/features/people/types/base';

interface RecurringCardProps {
  recurring: RecurringDetectionResult;
  existingPeople?: PersonRelation[];
  onFilterByRecurring?: (transactionIds: string[]) => void;
  onCreateRelation?: (pattern: RecurringPattern) => void;
}

export const RecurringCard = memo(function RecurringCard({
  recurring,
  existingPeople = [],
  onFilterByRecurring,
  onCreateRelation
}: RecurringCardProps) {
  
  /**
   * 🛠️ CALCUL DE LA PROCHAINE ÉCHÉANCE (Ancienne logique Tesla - SÉCURISÉE)
   */
/**
   * 🛠️ CALCUL DE LA PROCHAINE ÉCHÉANCE (Version 2026 Corrigée)
   * Gère les formats String (IA) et Number (Engine) sans crash.
   */
const calculateNextOccurrence = (
  lastDateStr: string | undefined, 
  frequency: string | number | undefined
) => {
  // 1. Protection contre les valeurs nulles ou indéfinies
  if (!lastDateStr || frequency === undefined || frequency === null) return null;
  
  try {
    // 2. Parsing de la date avec validation
    const lastDate = parseISO(lastDateStr);
    if (!isValid(lastDate)) return null;

    let nextDate: Date;
    
    // 3. Normalisation de la fréquence en chaîne de caractères pour le switch
    const freqLabel = String(frequency).toLowerCase();

    // 4. Détermination de la date suivante
    switch (true) {
      case freqLabel.includes('week') || freqLabel.includes('hebdo'): 
        nextDate = addWeeks(lastDate, 1); 
        break;
      case freqLabel.includes('year') || freqLabel.includes('annu'): 
        nextDate = addYears(lastDate, 1); 
        break;
      case freqLabel.includes('month') || freqLabel.includes('mensu'):
        nextDate = addMonths(lastDate, 1);
        break;
      // Si la fréquence est un nombre (ex: 30) on ajoute le nombre de jours
      case !isNaN(Number(frequency)):
        nextDate = addDays(lastDate, Number(frequency));
        break;
      default: 
        // Par défaut, on projette à +1 mois
        nextDate = addMonths(lastDate, 1);
    }

    // 5. Comparaison avec la date actuelle pour le statut
    const now = new Date();
    if (nextDate < now) {
      return "Bientôt";
    }
    
    // 6. Formatage final (ex: "15 Mars")
    return format(nextDate, "dd MMM", { locale: fr });

  } catch (e) {
    console.error("❌ [RecurringCard] Erreur calcul échéance:", e);
    return null;
  }
};

  const existingNamesSet = useMemo(() => {
    return new Set(existingPeople.map(p => p.name.toLowerCase().trim()));
  }, [existingPeople]);

  const displayedPatterns = useMemo(() => {
    const allPatterns = recurring?.patterns || [];
  
    return allPatterns
      .map(p => {
        // 1. Parsing pour l'affichage par défaut (abrégé)
        const parsed = parseTransactionDescription(p.description);
        const merchantName = (parsed.merchant || p.description).toLowerCase().trim();
        
        // 2. LOGIQUE DE LIAISON ROBUSTE
        // On vérifie d'abord si une des transactions du pattern possède déjà un personId
// 2. LOGIQUE DE LIAISON ROBUSTE (Priorité ID > Nom Original)
        // On identifie si une personne est déjà associée à l'une des transactions de ce pattern
        const linkedPerson = existingPeople?.find(person => {
          // A. Match par ID de transaction (Le plus fiable après un clic sur Lier)
          const hasLinkedTransaction = p.transactions.some(t => t.personId === person.id);
          
          // B. Match par nom de marchand d'origine (Sécurité si l'ID n'est pas encore propagé)
          const isOriginalMerchant = (person as any).originalMerchantName?.toLowerCase() === merchantName;
          
          // C. Match par nom actuel (Fallback)
          const isCurrentName = person.name.toLowerCase() === merchantName;

          return hasLinkedTransaction || isOriginalMerchant || isCurrentName;
        });

        const isLinked = !!linkedPerson;
        
        // 3. NOM DYNAMIQUE : On affiche le nom de la relation (ex: "Sfr" devient "Box Fibre")
        // Si lié, on prend le nom de la PersonRelation, sinon le nom parsé.
        const finalDisplayName = linkedPerson ? linkedPerson.name : (parsed.merchant || p.description);
  
        const lastTxDate = p.transactions.reduce((latest, t) => t.date > latest ? t.date : latest, '');
  
        // 4. Calcul de la tendance
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
  
        const freqString = String(p.frequency); 
  
        return { 
          ...p, 
          parsed: {
            merchant: finalDisplayName, // ✅ Le nom de la relation remplace le nom abrégé si lié
            category: parsed.category || p.category,
            color: parsed.color,
            emoji: (parsed as any).emoji || (p as any).parsed?.emoji || '🏢' 
          }, 
          isLinked, 
          trend, 
          changePercent, 
          nextDate: calculateNextOccurrence(lastTxDate, freqString)
        };
      })
      // On trie pour mettre les "Non liés" en premier afin d'inciter à l'action
      .sort((a, b) => (a.isLinked === b.isLinked ? 0 : a.isLinked ? 1 : -1));
  }, [recurring?.patterns, existingPeople,]); // ⚡ Recalcule dès que 'existingPeople' change (fin du freeze)

  if (!recurring || displayedPatterns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
        <Repeat className="w-8 h-8 text-white/10 mb-3" />
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest text-center">
          Aucun flux récurrent détecté
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[420px] bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <Repeat className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            {displayedPatterns.length} Opérations Identifiées
          </span>
        </div>
        <div className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-400">
          STABLE ENGINE
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-black/20">
        {displayedPatterns.map((pattern, idx) => {
          const colors = colorMap[pattern.parsed?.color || 'default'] || colorMap.default;
          
          return (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onFilterByRecurring?.(pattern.transactions.map(t => t.id))}
              className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                pattern.isLinked 
                ? 'bg-white/[0.01] border-white/5 opacity-80' 
                : 'bg-white/[0.04] border-white/10 border-l-purple-500/50'
              }`}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                   <span className="text-xl">{pattern.parsed?.emoji}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-[13px] font-bold text-white truncate pr-2 uppercase tracking-tight">
                      {pattern.parsed?.merchant}
                    </h4>
                    <span className={`text-[13px] font-mono font-bold ${pattern.averageAmount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(pattern.averageAmount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] px-1 rounded uppercase font-black ${colors.bg} ${colors.text}`}>
                      {pattern.parsed?.category}
                    </span>
                    <span className="text-[10px] text-white/20">•</span>
                    <span className="text-[10px] text-white/40 font-medium">
                      {formatFrequency(pattern.frequency)}
                    </span>
                    {pattern.nextDate && (
                      <>
                        <span className="text-[10px] text-white/20">•</span>
                        <div className="flex items-center gap-1 text-[10px] text-cyan-400/70">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>Prévu {pattern.nextDate}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions & Stats */}
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
                </div>

                {pattern.isLinked ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-green-500/20 bg-green-500/5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                    <span className="text-[9px] text-green-500 font-black uppercase tracking-tighter">Relation Active</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[9px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 font-black uppercase tracking-tighter"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateRelation?.(pattern);
                    }}
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Lier
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Impact */}
      <div className="p-4 bg-purple-500/5 border-t border-purple-500/20 backdrop-blur-md">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] font-black text-purple-400/60 uppercase tracking-[0.2em] mb-1">Impact Mensuel Estimé</p>
            <p className="text-2xl font-mono font-light text-white tracking-tighter">
              {formatCurrency(recurring?.monthlyRecurringAmount || 0)}
            </p>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Confiance</p>
             <div className="flex gap-0.5 justify-end">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className={`h-1 w-3 rounded-full ${s <= 4 ? 'bg-purple-500' : 'bg-white/10'}`} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
});