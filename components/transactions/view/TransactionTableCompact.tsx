/**
 * 📊 TRANSACTION TABLE COMPACT
 * 
 * Version compacte du tableau adaptée au layout 3 panneaux
 * avec CSS variables du design system
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Transaction } from '../../../contexts/DataContext';
import { 
  Calendar, 
  Tag,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Checkbox } from '../../ui/checkbox';
import { formatCurrency } from '../../../src/utils/format';

interface TransactionTableCompactProps {
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
  categories?: Array<{ name: string; color?: string }>;
  selectedTransactionId?: string | null;
}

export function TransactionTableCompact({
  transactions,
  onTransactionClick,
  categories = [],
  selectedTransactionId = null,
}: TransactionTableCompactProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-[var(--color-bg-primary)]">
      
      {/* Header */}
      <div 
        className="grid gap-3 px-4 py-3 border-b border-[var(--color-border-primary)] bg-[var(--bg-glass-elevated)] sticky top-0 z-10"
        style={{
          gridTemplateColumns: '40px 100px 1fr 140px 120px',
        }}
      >
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selectedIds.size === transactions.length && transactions.length > 0}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedIds(new Set(transactions.map(t => t.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
        </div>
        <span className="text-xs text-[var(--color-text-tertiary)] uppercase font-medium">
          Date
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)] uppercase font-medium">
          Description
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)] uppercase font-medium">
          Catégorie
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)] uppercase font-medium text-right">
          Montant
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {transactions.map((transaction) => {
          const isSelected = selectedIds.has(transaction.id);
          const isActiveRow = selectedTransactionId === transaction.id;
          const isIncome = transaction.amount > 0;
          const category = categories.find(c => c.name === transaction.category);

          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                grid gap-3 px-4 py-3 border-b border-[var(--color-border-primary)]
                hover:bg-[var(--bg-glass)] transition-all cursor-pointer
                ${isSelected ? 'bg-[var(--color-primary-bg)] border-l-2 border-l-[var(--color-primary)]' : ''}
                ${isActiveRow ? 'bg-[var(--color-primary)]/10 border-l-4 border-l-[var(--color-primary)] shadow-lg' : ''}
              `}
              style={{
                gridTemplateColumns: '40px 100px 1fr 140px 120px',
              }}
              onClick={() => onTransactionClick(transaction)}
            >
              {/* Checkbox */}
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(e) => toggleSelection(transaction.id, e as any)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-3 h-3 text-[var(--color-text-muted)] flex-shrink-0" />
                <span className="text-xs text-[var(--color-text-secondary)] truncate">
                  {new Date(transaction.date).toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'short' 
                  })}
                </span>
              </div>

              {/* Description */}
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-sm text-[var(--color-text-primary)] truncate font-medium">
                  {transaction.description}
                </span>
                {transaction.city && (
                  <span className="text-xs text-[var(--color-text-muted)] truncate">
                    {transaction.city}
                  </span>
                )}
              </div>

              {/* Catégorie */}
              <div className="flex items-center gap-2 min-w-0">
                {category?.color && (
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                <span className="text-xs text-[var(--color-text-secondary)] truncate">
                  {transaction.category || 'Non classifié'}
                </span>
              </div>

              {/* Montant */}
              <div className="flex items-center justify-end gap-2">
                {isIncome ? (
                  <TrendingUp className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[var(--color-danger)] flex-shrink-0" />
                )}
                <span 
                  className="text-sm font-medium"
                  style={{ 
                    color: isIncome 
                      ? 'var(--color-success)' 
                      : 'var(--color-danger)' 
                  }}
                >
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </motion.div>
          );
        })}

        {transactions.length === 0 && (
          <div className="flex items-center justify-center h-full py-20">
            <div className="text-center">
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Aucune transaction
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}