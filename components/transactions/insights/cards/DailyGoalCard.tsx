/**
 * 🎯 DAILY GOAL CARD - Optimisée avec React.memo
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { formatCurrency } from '../../../../src/utils/format';
import { calculateDailyGoal } from '../../../../src/utils/insights/projection';

interface DailyGoalCardProps {
  transactions: any[];
  projection: any;
}

export const DailyGoalCard = memo(function DailyGoalCard({ 
  transactions, 
  projection 
}: DailyGoalCardProps) {
  const dailyGoal = calculateDailyGoal(transactions, projection);
  
  // N'afficher que si pertinent
  if (dailyGoal.current === 0 && dailyGoal.target === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`glass-card p-4 ${
        dailyGoal.severity === 'danger' ? 'border-[var(--color-danger-border)]' :
        dailyGoal.severity === 'warning' ? 'border-[var(--color-warning-border)]' :
        'border-[var(--color-success-border)]'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Target className={`w-4 h-4 ${
          dailyGoal.severity === 'danger' ? 'text-[var(--color-danger)]' :
          dailyGoal.severity === 'warning' ? 'text-[var(--color-warning)]' :
          'text-[var(--color-success)]'
        }`} />
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          Objectif Quotidien
        </h3>
        <span className={`ml-auto px-2 py-0.5 rounded text-xs ${
          dailyGoal.severity === 'danger' ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' :
          dailyGoal.severity === 'warning' ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' :
          'bg-[var(--color-success)]/10 text-[var(--color-success)]'
        }`}>
          {dailyGoal.severity === 'danger' ? 'Critique' :
           dailyGoal.severity === 'warning' ? 'Attention' : 'OK'}
        </span>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            Rythme actuel
          </span>
          <span className="text-sm text-[var(--color-danger)] font-medium">
            {formatCurrency(Math.abs(dailyGoal.current))}/jour
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            Objectif recommandé
          </span>
          <span className={`text-sm font-medium ${
            dailyGoal.severity === 'safe' ? 'text-[var(--color-success)]' :
            'text-[var(--color-warning)]'
          }`}>
            {formatCurrency(Math.abs(dailyGoal.target))}/jour
          </span>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-primary)]">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            Ajustement nécessaire
          </span>
          <span className={`text-sm font-bold ${
            dailyGoal.adjustment > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
          }`}>
            {dailyGoal.adjustment > 0 ? '+' : ''}
            {formatCurrency(dailyGoal.adjustment)}/jour
          </span>
        </div>
      </div>
      
      <div className={`p-3 rounded-lg text-xs leading-relaxed ${
        dailyGoal.severity === 'danger' ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' :
        dailyGoal.severity === 'warning' ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' :
        'bg-[var(--color-success)]/10 text-[var(--color-success)]'
      }`}>
        {dailyGoal.message}
      </div>
    </motion.div>
  );
});
