/**
 * 🔄 RECURRING CARD - VERSION TESLA 2026
 * 
 * Design unifié avec parsing intelligent + Conversion auto en Relations :
 * - Tailles cohérentes avec ProjectionDetailsModal
 * - Parsing des descriptions pour noms clairs
 * - Catégories colorées automatiques
 * - Max 5 items puis scroll interne
 * - ⚡ NOUVEAU : Bouton "Créer relation & lier" pour conversion instantanée
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Repeat,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format';
import { formatFrequency } from '@/utils/insights/recurring-detection';
import { parseTransactionDescription, colorMap } from '@/utils/transaction-parser';
import type { RecurringDetectionResult, RecurringPattern } from '@/utils/insights/recurring-detection';
import { PersonRelation } from '@/types/people';

interface RecurringCardProps {
  recurring: RecurringDetectionResult;
  existingPeople?: PersonRelation[]; // 🆕 On passe la liste des gens pour vérifier l'existence
  onFilterByRecurring?: (transactionIds: string[]) => void;
  onCreateRelation?: (pattern: RecurringPattern) => void; // 🆕 Nouvelle action
}

export const RecurringCard = memo(function RecurringCard({
  recurring,
  existingPeople = [],
  onFilterByRecurring,
  onCreateRelation
}: RecurringCardProps) {
  
  // ⚡ Performance : Set de noms normalisés pour lookup O(1)
  const existingNamesSet = useMemo(() => {
    return new Set(existingPeople.map(p => p.name.toLowerCase().trim()));
  }, [existingPeople]);

  const activePatterns = useMemo(() => {
    return recurring.patterns
      .filter((p) => p.isActive)
      .map(p => {
        const txs = p.transactions;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        
        if (txs.length >= 2) {
          const last = Math.abs(txs[txs.length - 1].amount);
          const prev = Math.abs(txs[txs.length - 2].amount);
          const diff = ((last - prev) / prev) * 100;
          if (diff > 2) trend = 'up';
          else if (diff < -2) trend = 'down';
        }

        // Parser pour obtenir merchant + catégorie
        const parsed = parseTransactionDescription(p.description);
        
        // 🔑 CORRECTION : Vérifie si le pattern a déjà un personId (vient de LeftPanelInsights)
        const isLinked = !!(p as any).isAlreadyLinked;

        return { ...p, trend, parsed, isLinked };
      })
      .sort((a, b) => b.confidence - a.confidence);
  }, [recurring.patterns]);

  if (activePatterns.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-900/10 border border-purple-500/30">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="relative px-4 py-3 border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Repeat className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm text-white/90 font-medium">Abonnements détectés</h3>
                <p className="text-xs text-white/40">{activePatterns.length} actif{activePatterns.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste avec scroll interne (max 5 items) */}
      <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
        <div className="p-3 space-y-2">
          {activePatterns.map((pattern, idx) => {
            const transactionIds = pattern.transactions.map((t) => t.id);
            const colors = colorMap[pattern.parsed.color];
            const Icon = pattern.parsed.icon;
            
            return (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group relative p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all"
              >
                {/* Zone cliquable pour le filtre */}
                <div 
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => onFilterByRecurring?.(transactionIds)}
                >
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm text-white/90 font-medium truncate pr-2">
                        {/* 🔑 Affiche le nom de la relation si liée, sinon le merchant parsé */}
                        {(pattern as any).displayName || pattern.parsed.merchant}
                      </h4>
                      <span className={`text-sm font-mono font-medium flex-shrink-0 ${
                        pattern.averageAmount >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(pattern.averageAmount)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {pattern.parsed.category}
                      </span>
                      <span className="text-[10px] text-white/40">{formatFrequency(pattern.frequency)}</span>
                      {pattern.confidence > 95 && (
                        <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                      )}
                      {pattern.trend !== 'stable' && (
                        pattern.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-red-400 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-green-400 flex-shrink-0" />
                        )
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                      <span className="text-white/40">
                        Prochain : {new Date(pattern.nextExpectedDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span className="text-white/40">{Math.round(pattern.confidence)}%</span>
                    </div>

                    {/* 🆕 Action Bar - Apparaît si non lié */}
                    {!pattern.isLinked && onCreateRelation && (
                      <motion.div 
                        initial={{ opacity: 0.8 }}
                        whileHover={{ opacity: 1 }}
                        className="flex justify-end mt-2"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateRelation(pattern);
                          }}
                        >
                          <UserPlus className="w-3 h-3 mr-1.5" />
                          Créer relation & lier
                        </Button>
                      </motion.div>
                    )}
                    
                    {/* Badge "Relation existante" */}
                    {pattern.isLinked && (
                      <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-green-400 flex items-center gap-1 opacity-60">
                          <CheckCircle2 className="w-3 h-3" /> Relation existante
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="relative overflow-hidden border-t border-purple-500/20">
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="relative px-4 py-3 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-300">Budget mensuel</span>
            </div>
            <span className={`text-base font-medium ${
              recurring.monthlyRecurringAmount >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(recurring.monthlyRecurringAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
