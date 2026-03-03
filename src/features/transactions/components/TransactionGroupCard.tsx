/**
 * 📦 TRANSACTION GROUP CARD - Carte pour grouper les transactions
 * Affiche un groupe de transactions (par date, catégorie, etc.)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Calendar, DollarSign, Tag } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatDateCompact } from '@/utils/format';
import { cn } from '@/utils/transaction-helpers';

// ============================================================================
// TYPES
// ============================================================================

interface TransactionGroupCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  transactions: Transaction[];
  totalAmount?: number;
  defaultExpanded?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  renderTransaction?: (transaction: Transaction) => React.ReactNode;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function TransactionGroupCard({
  title,
  subtitle,
  icon: Icon = Tag,
  transactions,
  totalAmount,
  defaultExpanded = false,
  onTransactionClick,
  renderTransaction,
  color = 'default'
}: TransactionGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const count = transactions.length;
  const calculatedTotal = totalAmount ?? transactions.reduce((sum, t) => sum + t.amount, 0);
  const isIncome = calculatedTotal >= 0;

  // ============================================================================
  // COLORS
  // ============================================================================

  const colorClasses = {
    default: {
      border: 'border-white/10',
      bg: 'bg-white/5',
      icon: 'text-white/40',
      text: 'text-white'
    },
    primary: {
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/5',
      icon: 'text-cyan-400',
      text: 'text-cyan-400'
    },
    success: {
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
      icon: 'text-emerald-400',
      text: 'text-emerald-400'
    },
    warning: {
      border: 'border-yellow-500/20',
      bg: 'bg-yellow-500/5',
      icon: 'text-yellow-400',
      text: 'text-yellow-400'
    },
    danger: {
      border: 'border-red-500/20',
      bg: 'bg-red-500/5',
      icon: 'text-red-400',
      text: 'text-red-400'
    }
  };

  const colors = colorClasses[color];

  // ============================================================================
  // DEFAULT TRANSACTION RENDERER
  // ============================================================================

  const defaultRenderTransaction = (transaction: Transaction) => {
    const txIsIncome = transaction.amount >= 0;
    
    return (
      <motion.button
        key={transaction.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        onClick={() => onTransactionClick?.(transaction)}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group"
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="text-sm font-medium text-white truncate">
            {transaction.description || 'Sans description'}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-3 h-3 text-white/40" />
            <span className="text-xs text-white/40">
              {formatDateCompact(transaction.date)}
            </span>
            {transaction.category && (
              <>
                <span className="text-white/20">•</span>
                <Tag className="w-3 h-3 text-white/40" />
                <span className="text-xs text-white/40">
                  {transaction.category}
                </span>
              </>
            )}
          </div>
        </div>
        <div className={cn(
          "text-sm font-bold whitespace-nowrap",
          txIsIncome ? "text-emerald-400" : "text-white"
        )}>
          {txIsIncome ? '+' : ''}{formatCurrency(transaction.amount)}
        </div>
      </motion.button>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all",
      colors.border,
      isExpanded ? colors.bg : "bg-transparent"
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            colors.bg
          )}>
            <Icon className={cn("w-6 h-6", colors.icon)} />
          </div>
          <div className="text-left">
            <h3 className={cn("font-bold text-base", colors.text)}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-white/40 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Count Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">
              {count} transaction{count > 1 ? 's' : ''}
            </span>
          </div>

          {/* Total Amount */}
          <div className="text-right">
            <div className={cn(
              "text-lg font-black",
              isIncome ? "text-emerald-400" : "text-white"
            )}>
              {isIncome ? '+' : ''}{formatCurrency(calculatedTotal)}
            </div>
          </div>

          {/* Expand Icon */}
          <div className="ml-4">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-white/40" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/40" />
            )}
          </div>
        </div>
      </button>

      {/* Transactions List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-2">
              {/* Summary Bar */}
              <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-white/40" />
                  <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                    Résumé
                  </span>
                </div>
                <div className="text-xs text-white/60">
                  Moyenne : {formatCurrency(calculatedTotal / count)}
                </div>
              </div>

              {/* Transactions */}
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  Aucune transaction dans ce groupe
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(transaction => (
                    renderTransaction ? 
                      renderTransaction(transaction) : 
                      defaultRenderTransaction(transaction)
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
