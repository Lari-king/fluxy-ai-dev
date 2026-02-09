import React from 'react';
import { motion } from 'framer-motion';
import { Database, Upload, AlertCircle } from 'lucide-react';

interface EmptyStateUltraInsightsProps {
  transactionCount: number;
  monthsCovered: number;
  onImportClick?: () => void;
}

export function EmptyStateUltraInsights({ 
  transactionCount, 
  monthsCovered,
  onImportClick 
}: EmptyStateUltraInsightsProps) {
  const needsMoreData = transactionCount < 10 || monthsCovered < 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-12 text-center max-w-2xl mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="inline-block mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Database className="w-10 h-10 text-purple-400" />
        </div>
      </motion.div>

      <h2 className="text-2xl text-white mb-4">
        {transactionCount === 0 
          ? "Aucune donnée disponible"
          : "Pas encore assez de données"
        }
      </h2>

      {transactionCount === 0 ? (
        <div className="space-y-4">
          <p className="text-white/60">
            Ultra Insights a besoin de transactions pour analyser vos patterns financiers.
          </p>
          <p className="text-white/60 text-sm">
            Importez vos transactions pour commencer l'analyse.
          </p>

          {onImportClick && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onImportClick}
              className="mt-6 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 mx-auto transition-colors"
            >
              <Upload className="w-5 h-5" />
              Importer des transactions
            </motion.button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-white/60">
            Vous avez <strong className="text-white">{transactionCount} transactions</strong> couvrant{' '}
            <strong className="text-white">{monthsCovered} mois</strong>.
          </p>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-amber-200 text-sm mb-2">
                  <strong>Recommandation :</strong>
                </p>
                <ul className="text-amber-200/80 text-sm space-y-1">
                  <li>• Au moins <strong>4 mois</strong> de données pour la détection de changements</li>
                  <li>• Au moins <strong>50 transactions</strong> pour des insights pertinents</li>
                  <li>• Transactions <strong>catégorisées</strong> pour l'analyse par catégorie</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-white/40 text-xs mt-6">
            Les analyses seront plus précises avec davantage de données historiques.
          </p>
        </div>
      )}

      {/* Progrès visuel */}
      {transactionCount > 0 && (
        <div className="mt-8">
          <div className="flex justify-between text-xs text-white/60 mb-2">
            <span>Données collectées</span>
            <span>{Math.min(100, Math.round((transactionCount / 50) * 100))}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (transactionCount / 50) * 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
