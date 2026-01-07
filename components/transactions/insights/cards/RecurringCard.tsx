/**
 * 🔄 RECURRING CARD - VERSION COHÉRENTE 2026
 * 
 * Design unifié avec parsing intelligent :
 * - Tailles cohérentes avec ProjectionDetailsModal
 * - Parsing des descriptions pour noms clairs
 * - Catégories colorées automatiques
 * - Max 5 items puis scroll interne
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Repeat,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../../../src/utils/format';
import { formatFrequency } from '../../../../src/utils/insights/recurring-detection';
import { parseTransactionDescription, colorMap } from '../../../../src/utils/transaction-parser';
import type { RecurringDetectionResult } from '../../../../src/utils/insights/recurring-detection';

interface RecurringCardProps {
  recurring: RecurringDetectionResult;
  onFilterByRecurring?: (transactionIds: string[]) => void;
}

export const RecurringCard = memo(function RecurringCard({
  recurring,
  onFilterByRecurring,
}: RecurringCardProps) {
  
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

        return { ...p, trend, parsed };
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
                <h3 className="text-sm text-white/90 font-medium">Abonnements</h3>
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
              <motion.button
                key={pattern.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onFilterByRecurring?.(transactionIds)}
                className="group w-full p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm text-white/90 group-hover:text-white transition-colors truncate">
                        {pattern.parsed.merchant}
                      </h4>
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
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {pattern.parsed.category}
                      </span>
                      <span className="text-xs text-white/40">{formatFrequency(pattern.frequency)}</span>
                    </div>
                  </div>
                  
                  <span className={`text-sm font-mono font-medium flex-shrink-0 ${
                    pattern.averageAmount >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(pattern.averageAmount)}
                  </span>
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
              </motion.button>
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
