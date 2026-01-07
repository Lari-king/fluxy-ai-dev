/**
 * 📊 CARTE STATISTIQUES GLOBALES
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

interface StatsCardProps {
  totalTransactions: number;
  anomaliesCount: number;
  recurringCount: number;
  confidence: number;
}

export const StatsCard = memo(function StatsCard({
  totalTransactions,
  anomaliesCount,
  recurringCount,
  confidence
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-[var(--color-info)]" />
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          Vue d'ensemble
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
            Transactions
          </p>
          <p className="text-lg text-[var(--color-text-primary)]">
            {totalTransactions}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
            Anomalies
          </p>
          <p className="text-lg text-[var(--color-warning)]">
            {anomaliesCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
            Récurrences
          </p>
          <p className="text-lg text-[var(--color-secondary)]">
            {recurringCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
            Confiance
          </p>
          <p className="text-lg text-[var(--color-success)]">
            {confidence}%
          </p>
        </div>
      </div>
    </motion.div>
  );
});
