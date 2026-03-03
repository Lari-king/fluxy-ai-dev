import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Calendar, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { EnrichedBudget } from '../types';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';

interface BudgetCardProps {
  budget: EnrichedBudget;
  index: number;
  onEdit: (budget: EnrichedBudget) => void;
  onDelete: (budget: EnrichedBudget) => void;
  onClick: (budget: EnrichedBudget) => void;
}

export const BudgetCard = ({ budget, index, onEdit, onDelete, onClick }: BudgetCardProps) => {
  const percentage = Math.min((budget.spent / (budget.allocated || 1)) * 100, 100);
  
  // Détermination du statut visuel
  const getStatus = () => {
    if (percentage >= 100) return { color: 'text-red-600', icon: AlertCircle, label: 'Dépassé', bgColor: 'bg-red-50 dark:bg-red-950/20', borderColor: 'border-red-200 dark:border-red-800' };
    if (percentage >= 80) return { color: 'text-orange-600', icon: Zap, label: 'Attention', bgColor: 'bg-orange-50 dark:bg-orange-950/20', borderColor: 'border-orange-200 dark:border-orange-800' };
    return { color: 'text-green-600', icon: CheckCircle, label: 'OK', bgColor: 'bg-green-50 dark:bg-green-950/20', borderColor: 'border-green-200 dark:border-green-800' };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onClick(budget)}
      className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer"
      style={{ borderColor: budget.color }}
    >
      {/* Barre de progression subtile en haut */}
      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className="h-full"
          style={{ backgroundColor: budget.color }}
        />
      </div>

      <div className="p-6">
        {/* Header de la carte */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg ring-4 ring-offset-2 transition-transform group-hover:scale-110"
              style={{ 
                backgroundColor: budget.color,
                '--tw-ring-color': `${budget.color}40`
              } as any}
            >
              {budget.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{budget.name}</h3>
              <div className="flex items-center gap-1.5">
                <StatusIcon className={`w-4 h-4 ${status.color}`} />
                <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onEdit(budget); }}
              className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 hover:bg-blue-100"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onDelete(budget); }}
              className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar principale */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Consommation</span>
            <span className="font-bold">{Math.round(percentage)}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full relative"
              style={{ backgroundColor: budget.color }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`${status.bgColor} rounded-xl p-3 border ${status.borderColor}`}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Dépensé</div>
            <div className="text-lg font-bold" style={{ color: budget.color }}>{formatCurrency(budget.spent)}</div>
          </div>
          <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700`}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Restant</div>
            <div className={`text-lg font-bold ${budget.allocated - budget.spent < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
              {formatCurrency(budget.allocated - budget.spent)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <div className="text-xs text-gray-400 mb-1">Objectif Mensuel</div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(budget.allocated)}</div>
        </div>
      </div>
    </motion.div>
  );
};