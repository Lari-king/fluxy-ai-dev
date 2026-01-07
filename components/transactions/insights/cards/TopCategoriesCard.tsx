/**
 * 📊 CARTE TOP CATÉGORIES
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { Transaction } from '../../../../contexts/DataContext';
import { formatCurrency } from '../../../../src/utils/format';

interface TopCategoriesCardProps {
  transactions: Transaction[];
}

function calculateTopCategories(transactions: Transaction[]) {
  const categoryTotals = new Map<string, number>();
  let totalExpenses = 0;

  transactions.filter(t => t.amount < 0).forEach(t => {
    const cat = t.category || 'Non classifié';
    const amount = Math.abs(t.amount);
    categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + amount);
    totalExpenses += amount;
  });

  return Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export const TopCategoriesCard = memo(function TopCategoriesCard({
  transactions
}: TopCategoriesCardProps) {
  const topCategories = calculateTopCategories(transactions).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-[var(--color-info)]" />
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          Top catégories
        </h3>
      </div>

      {topCategories.map((cat, idx) => (
        <div key={cat.category} className="mb-3 last:mb-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--color-text-primary)]">
              {cat.category}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {cat.percentage}%
              </span>
              <span className="text-xs font-mono text-[var(--color-warning)] bg-[var(--color-warning-soft)] px-1.5 py-0.5 rounded">
                #{idx + 1}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 bg-[var(--bg-glass)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full"
                style={{ width: `${cat.percentage}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-[var(--color-danger)]">
            {formatCurrency(cat.amount)}
          </p>
        </div>
      ))}
    </motion.div>
  );
});
