/**
 * ⚠️ ANOMALIES CARD - VERSION COHÉRENTE 2026
 * 
 * Design unifié avec parsing intelligent :
 * - Tailles cohérentes
 * - Parsing pour noms clairs
 * - Catégories colorées
 * - Max 5 items puis scroll interne
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../../../src/utils/format';
import { parseTransactionDescription, colorMap } from '../../../../src/utils/transaction-parser';
import type { Anomaly } from '../../../../src/utils/insights/anomaly-detection';

interface AnomaliesCardProps {
  anomalies: {
    anomalies: Anomaly[];
    suspiciousCount: number;
  };
  onFilterByAnomaly?: (description: string) => void;
}

export const AnomaliesCard = memo(function AnomaliesCard({
  anomalies: anomaliesData,
  onFilterByAnomaly,
}: AnomaliesCardProps) {
  
  const parsedAnomalies = useMemo(() => {
    return anomaliesData.anomalies.map(anomaly => ({
      ...anomaly,
      parsed: parseTransactionDescription(anomaly.transaction.description)
    }));
  }, [anomaliesData.anomalies]);

  if (parsedAnomalies.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-orange-500/10 to-orange-900/10 border border-orange-500/30">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="relative px-4 py-3 border-b border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm text-white/90 font-medium">Anomalies</h3>
                <p className="text-xs text-white/40">{anomaliesData.suspiciousCount} détectée{anomaliesData.suspiciousCount > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste avec scroll interne (max 5 items) */}
      <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
        <div className="p-3 space-y-2">
          {parsedAnomalies.map((anomaly, idx) => {
            const colors = colorMap[anomaly.parsed.color];
            const Icon = anomaly.parsed.icon;
            
            return (
              <motion.button
              key={`${anomaly.transaction.id}-${idx}`} // On combine l'ID et l'index pour garantir l'unicité
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onFilterByAnomaly?.(anomaly.transaction.description)}
                className="group w-full p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-white/90 mb-1 group-hover:text-white transition-colors truncate">
                      {anomaly.parsed.merchant}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {anomaly.parsed.category}
                      </span>
                      <span className="text-xs text-orange-400">{anomaly.confidence}%</span>
                    </div>
                  </div>
                  
                  <span className="text-sm font-mono font-medium text-orange-400 flex-shrink-0">
                    {formatCurrency(anomaly.transaction.amount)}
                  </span>
                </div>

                <p className="text-xs text-white/50 leading-relaxed mb-2">
                  {anomaly.reason}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-white/40">
                    {new Date(anomaly.transaction.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>

                {/* Conseil impulsif */}
                <AnimatePresence>
                  {anomaly.behaviorType === 'impulsive' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="pt-2 border-t border-cyan-500/20"
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-cyan-400 leading-relaxed">
                          Comportement impulsif • Essayez de budgeter vos week-ends
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
