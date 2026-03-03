/**
 * 📊 TRANSACTION TABLE - VERSION FINALE RÉPARÉE
 * Correction : Alignement strict du style Catégorie et Sous-Catégorie (Texte pur, gras, blanc).
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Calendar, DollarSign,
  User, MoreVertical, Edit2, Trash2, Split, Eye
} from 'lucide-react';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Transaction, SortField, TableSort } from '../types';
import { formatCurrency, formatDateCompact } from '@/utils/format';
import { cn } from '@/utils/transaction-helpers';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: (allIds: string[]) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onSplit?: (transaction: Transaction) => void;
  onView?: (transaction: Transaction) => void;
  categories?: any[];
  people?: any[];
}

const TableHeader: React.FC<{
  label: string;
  icon?: React.ElementType;
  sortable?: boolean;
  field?: SortField;
  currentSort?: TableSort;
  onSort?: (field: SortField) => void;
  className?: string;
}> = ({ label, icon: Icon, sortable, field, currentSort, onSort, className }) => {
  const isSorted = currentSort?.field === field;
  return (
    <th
      className={cn(
        "px-4 py-4 text-left text-[10px] font-black uppercase tracking-wider text-white/40",
        sortable && "cursor-pointer hover:text-white/60 select-none",
        className
      )}
      onClick={() => sortable && field && onSort?.(field)}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span>{label}</span>
        {sortable && (
          <span className="ml-auto">
            {isSorted ? (
              currentSort?.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
            )}
          </span>
        )}
      </div>
    </th>
  );
};

export function TransactionTable({
  transactions,
  selectedIds,
  onToggleSelection,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onSplit,
  onView,
  categories = [],
  people = []
}: TransactionTableProps) {
  const [sort, setSort] = useState<TableSort>({ field: 'date', direction: 'desc' });

  const handleSort = useCallback((field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (sort.field) {
        case 'date': aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); break;
        case 'amount': aVal = a.amount; bVal = b.amount; break;
        case 'description': 
            aVal = (a.description || (a as any).label || '').toLowerCase(); 
            bVal = (b.description || (b as any).label || '').toLowerCase(); 
            break;
        case 'category': aVal = (a.category || '').toLowerCase(); bVal = (b.category || '').toLowerCase(); break;
        case 'subCategory' as any: 
            aVal = (a.subCategory || '').toLowerCase(); 
            bVal = (b.subCategory || '').toLowerCase(); 
            break;
        default: aVal = 0; bVal = 0;
      }
      if (aVal !== bVal) return sort.direction === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
      return 0;
    });
  }, [transactions, sort]);

  const handleSelectAll = useCallback(() => {
    onToggleSelectAll(transactions.map(t => t.id));
  }, [onToggleSelectAll, transactions]);

  // Style de base pour les colonnes de catégories (Texte pur)
  const renderCategory = (transaction: Transaction) => {
    const categoryRef = transaction.category;
    if (!categoryRef) return <span className="text-xs text-white/30 italic">Non catégorisé</span>;

    const categoryObj = categories.find(c => 
      c.id === categoryRef || 
      c.name.toLowerCase() === categoryRef.toLowerCase()
    );

    return (
      <span className="text-xs text-white/80 font-bold truncate block" title={categoryObj ? categoryObj.name : categoryRef}>
        {categoryObj ? categoryObj.name : categoryRef}
      </span>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/40">
        <DollarSign className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-semibold">Aucune transaction</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="relative w-full overflow-hidden">
        <table className="w-full border-collapse table-fixed">
          <thead className="sticky top-0 z-10 bg-[#080808]/95 backdrop-blur-xl border-b border-white/5">
            <tr>
              <th className="px-4 py-4 w-12 text-center">
                <Checkbox
                  checked={transactions.length > 0 && selectedIds.length === transactions.length}
                  onCheckedChange={handleSelectAll}
                  className="border-white/20 data-[state=checked]:bg-cyan-500"
                />
              </th>
              <TableHeader label="Date" icon={Calendar} sortable field="date" currentSort={sort} onSort={handleSort} className="w-28" />
              <TableHeader label="Description" sortable field="description" currentSort={sort} onSort={handleSort} className="w-auto" />
              <TableHeader label="Montant" icon={DollarSign} sortable field="amount" currentSort={sort} onSort={handleSort} className="w-32" />
              <TableHeader label="Cat." sortable field="category" currentSort={sort} onSort={handleSort} className="w-32" />
              <TableHeader label="Sous-Cat." sortable field={"subCategory" as any} currentSort={sort} onSort={handleSort} className="w-32" />
              <TableHeader label="Relation" icon={User} className="w-28" />
              <th className="px-4 py-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedTransactions.map((transaction) => {
              const isSelected = selectedIds.includes(transaction.id);
              const isChild = !!transaction.parentTransactionId;
              const isParent = (transaction.childTransactionIds?.length || 0) > 0;
              const isIncome = transaction.amount >= 0;
              const displayText = transaction.description || (transaction as any).label || 'Sans description';

              return (
                <motion.tr
                  key={transaction.id}
                  className={cn(
                    "group hover:bg-white/5 transition-all cursor-pointer",
                    isSelected && "bg-cyan-500/5",
                    transaction.isHidden && "opacity-40"
                  )}
                  onClick={() => onView?.(transaction)}
                >
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelection(transaction.id)}
                      className="border-white/20"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60 whitespace-nowrap font-mono">
                    {formatDateCompact(transaction.date)}
                  </td>
                  <td className="px-4 py-3 overflow-hidden">
                    <div className={cn("flex items-center gap-2 min-w-0", isChild && "pl-6")}>
                      {isParent && <Split className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
                      <span className="text-sm font-medium text-white truncate" title={displayText}>
                        {displayText}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap font-mono">
                    <span className={isIncome ? "text-emerald-400" : "text-white font-bold"}>
                      {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  
                  {/* COLONNE CATÉGORIE (Texte Pur) */}
                  <td className="px-4 py-3 min-w-0">
                    {renderCategory(transaction)}
                  </td>

                  {/* ✅ COLONNE SOUS-CATÉGORIE (Style identique à Catégorie : Texte Pur) */}
                  <td className="px-4 py-3 min-w-0">
                    {transaction.subCategory ? (
                      <span 
                        className="text-xs text-white/60 font-medium truncate block" 
                        title={transaction.subCategory}
                      >
                        {transaction.subCategory}
                      </span>
                    ) : (
                      <span className="text-xs text-white/10">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs text-white/40 truncate">
                    {people.find(p => p.id === transaction.personId)?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4 text-white/40" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-white/10 text-white">
                        <DropdownMenuItem onClick={() => onView?.(transaction)} className="gap-2">
                          <Eye className="w-4 h-4" /> Détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(transaction)} className="gap-2">
                          <Edit2 className="w-4 h-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onSplit?.(transaction)} 
                          className="gap-2 text-purple-400" 
                          disabled={isChild}
                        >
                          <Split className="w-4 h-4" /> Diviser
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={() => onDelete?.(transaction.id)} className="gap-2 text-red-400">
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}