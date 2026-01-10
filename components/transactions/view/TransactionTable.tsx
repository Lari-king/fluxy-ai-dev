/**
 * 📊 TRANSACTION TABLE - VERSION OPTIMISÉE
 * 
 * ✅ Toutes vos fonctionnalités conservées
 * ✅ Checkbox corrigée avec stopPropagation
 * ✅ Performance optimisée (useMemo/useCallback)
 */

import React, { useState, forwardRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '../../../contexts/DataContext';
import { 
  ArrowUpDown, MoreVertical, Edit, Trash2, Copy, Tag, 
  ChevronDown, ChevronRight, Calendar, Repeat
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { formatCurrency } from 'src/utils/format';
import { format, parseISO } from 'date-fns';

interface TransactionTableProps {
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  onCreateRecurringGroup?: (transactionIds: string[], sharedData: Partial<Transaction>) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkCategorize?: (ids: string[], category: string) => void;
  onBulkAssignPerson?: (ids: string[], personId: string) => void;
  onBulkSetType?: (ids: string[], type: 'online' | 'physical') => void;
  onBulkMarkRecurring?: (ids: string[], isRecurring: boolean) => void;
  onBulkSetCountry?: (ids: string[], country: string) => void;
  people?: any[];
  categories?: any[];
  selectedIds?: string[];
  setSelectedIds?: (ids: string[]) => void;
  selectedTransactionId?: string | null;
  tableConfig?: {
    dateFormat?: string;
    descLimit?: number;
    relationLabel?: string;
    statusOptions?: Array<{id: string, label: string, color: string}>;
  };
}

type SortField = 'date' | 'description' | 'amount' | 'category' | 'person';
type SortDirection = 'asc' | 'desc';

interface TransactionRowProps {
  transaction: Transaction;
  isGrouped?: boolean;
}

export function TransactionTable({
  transactions,
  onTransactionClick,
  onUpdate,
  onDelete,
  onCreateRecurringGroup,
  onBulkDelete,
  onBulkCategorize,
  onBulkAssignPerson,
  onBulkSetType,
  onBulkMarkRecurring,
  onBulkSetCountry,
  people = [],
  categories = [],
  selectedIds = [],
  setSelectedIds,
  selectedTransactionId
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 🆕 OPTIMISATION : useCallback pour éviter re-création
  const toggleSelection = useCallback((id: string) => {
    if (!setSelectedIds) return;
    
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(Array.from(newSelected));
  }, [selectedIds, setSelectedIds]);

  const toggleSelectAll = useCallback(() => {
    if (!setSelectedIds) return;
    
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(t => t.id));
    }
  }, [selectedIds.length, transactions, setSelectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds?.([]);
  }, [setSelectedIds]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection]);

  // 🆕 OPTIMISATION : useMemo pour tri
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'amount':
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'person':
          const personA = people.find(p => p.id === a.personId);
          const personB = people.find(p => p.id === b.personId);
          aValue = personA?.name || '';
          bValue = personB?.name || '';
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [transactions, sortField, sortDirection, people]);

  // 🆕 OPTIMISATION : useMemo pour groupes
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    const standalone: Transaction[] = [];

    sortedTransactions.forEach(txn => {
      if (txn.recurringGroupId) {
        if (!groups[txn.recurringGroupId]) {
          groups[txn.recurringGroupId] = [];
        }
        groups[txn.recurringGroupId].push(txn);
      } else {
        standalone.push(txn);
      }
    });

    return { groups, standalone };
  }, [sortedTransactions]);

  // 🆕 OPTIMISATION : useCallback pour getPerson
  const getPerson = useCallback((transaction: Transaction) => {
    return people.find(p => p.id === transaction.personId);
  }, [people]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-4 opacity-30" />;
    }
    return (
      <ArrowUpDown 
        className={`size-4 transition-transform duration-200 ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
      />
    );
  };

  // Table Header
  const TableHeader = () => (
    <div className="sticky top-0 z-10 border-b border-[var(--color-border-primary)] bg-[var(--bg-glass-elevated)] backdrop-blur-sm">
      <div className="grid grid-cols-[40px_110px_minmax(180px,1fr)_140px_120px_160px_120px_50px] gap-2 px-6 py-3 text-xs uppercase text-[var(--color-text-tertiary)]">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selectedIds.length === transactions.length && transactions.length > 0}
            onCheckedChange={toggleSelectAll}
            aria-label="Sélectionner tout"
          />
        </div>
        
        <button
          onClick={() => handleSort('date')}
          className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors text-left"
        >
          <span className="truncate">Date</span>
          {renderSortIcon('date')}
        </button>
        
        <button
          onClick={() => handleSort('description')}
          className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors text-left"
        >
          <span className="truncate">Description</span>
          {renderSortIcon('description')}
        </button>
        
        <button
          onClick={() => handleSort('category')}
          className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors text-left"
        >
          <span className="truncate">Catégorie</span>
          {renderSortIcon('category')}
        </button>
        
        <div className="flex items-center gap-2 text-left">
          <span className="truncate">Sous-cat.</span>
        </div>
        
        <button
          onClick={() => handleSort('person')}
          className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors text-left"
        >
          <span className="truncate">Personne</span>
          {renderSortIcon('person')}
        </button>
        
        <button
          onClick={() => handleSort('amount')}
          className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors justify-end"
        >
          <span className="truncate">Montant</span>
          {renderSortIcon('amount')}
        </button>
        
        <div className="w-full" />
      </div>
    </div>
  );

  // 🆕 TransactionRow avec React.memo pour performance
  const TransactionRowWithRef = React.memo(forwardRef<HTMLDivElement, TransactionRowProps>(({ transaction, isGrouped = false }, ref) => {
    const isSelected = selectedIds.includes(transaction.id);
    const person = getPerson(transaction);
    const isIncome = transaction.amount > 0;
    const isRecurring = !!transaction.isRecurring || !!transaction.recurringGroupId;
    const isActiveRow = selectedTransactionId === transaction.id;
    const isFuture = new Date(transaction.date) > new Date();

    // 🆕 CORRECTION CHECKBOX : Handler avec useCallback
    const handleCheckboxChange = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      toggleSelection(transaction.id);
    }, [transaction.id]);

    const handleRowClick = useCallback((e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-row-click]')) return;
      onTransactionClick(transaction);
    }, [transaction]);

    return (
      <motion.div
        ref={ref} 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className={`
          grid grid-cols-[40px_110px_minmax(180px,1fr)_140px_120px_160px_120px_50px] gap-2 px-6 py-3 
          border-b border-[var(--color-border-primary)]
          hover:bg-[var(--bg-glass)] transition-colors cursor-pointer
          ${isSelected ? 'bg-[var(--color-primary)]/10 border-l-2 border-l-[var(--color-primary)]' : ''}
          ${isActiveRow ? 'bg-[var(--color-primary)]/20 border-l-4 border-l-[var(--color-primary)] shadow-lg' : ''}
          ${isGrouped ? 'bg-[var(--bg-glass)]/30' : ''}
        `}
        onClick={handleRowClick}
      >
        {/* ✅ CHECKBOX CORRIGÉE avec stopPropagation */}
        <div 
          className="flex items-center justify-center" 
          data-no-row-click
          onClick={handleCheckboxChange}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleSelection(transaction.id)}
            className="border-white/20 data-[state=checked]:bg-[var(--color-primary)] data-[state=checked]:border-[var(--color-primary)]"
          />
        </div>

        {/* Date & Statut */}
        <div className="flex flex-col justify-center">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {(() => {
              try {
                if (!transaction.date) return 'Date inconnue';
                const parsedDate = parseISO(transaction.date);
                if (isNaN(parsedDate.getTime())) return 'Date invalide';
                return format(parsedDate, 'dd/MM/yyyy');
              } catch (e) {
                return 'Format erroné';
              }
            })()}
          </span>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isFuture ? 'text-amber-500' : 'text-emerald-500'}`}>
            {isFuture ? 'À venir' : 'Réalisé'}
          </span>
        </div>

        {/* Description */}
        <div className="flex items-center gap-3 min-w-0">
          {transaction.brandLogo && (
            <img 
              src={transaction.brandLogo} 
              alt={transaction.brand || ''}
              className="size-8 rounded object-contain bg-white flex-shrink-0 border border-[var(--color-border-primary)]"
            />
          )}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span 
                className="truncate text-sm text-[var(--color-text-primary)] font-medium"
                title={transaction.description}
              >
                {transaction.description}
              </span>
              {isRecurring && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-white/10 bg-white/5 text-white/60 flex-shrink-0">
                  <Repeat className="size-2.5 mr-1" />
                  Récurrent
                </Badge>
              )}
            </div>
            {transaction.brand && (
              <span className="text-xs text-[var(--color-text-muted)] truncate">
                {transaction.brand}
              </span>
            )}
          </div>
        </div>

        {/* Catégorie */}
        <div className="flex items-center gap-2 min-w-0">
          {transaction.category && (
            <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-[var(--color-text-secondary)] border border-white/10 truncate">
              {transaction.category}
            </span>
          )}
        </div>

        {/* Sous-catégorie */}
        <div className="flex items-center gap-2 min-w-0">
          {(transaction as any).subCategory && (
            <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-white border border-white/20 truncate">
              {(transaction as any).subCategory}
            </span>
          )}
        </div>

        {/* Personne */}
        <div className="flex items-center justify-center min-w-0">
          {person ? (
            <Avatar className="size-7 flex-shrink-0" title={person.name}>
              <AvatarImage src={person.avatar} />
              <AvatarFallback className="text-xs bg-[var(--bg-glass)] text-white">
                {person.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="size-7" />
          )}
        </div>

        {/* Montant */}
        <div className="flex items-center justify-end gap-2">
          <span 
            className="tabular-nums font-bold text-sm"
            style={{ color: isIncome ? 'var(--color-success)' : 'var(--color-danger)' }}
          >
            {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
          </span>
        </div>

        {/* Menu Actions */}
        <div className="flex items-center justify-center" data-no-row-click>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/10">
                <MoreVertical className="size-4 text-white/50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1A] border-white/10 text-white shadow-2xl">
              <DropdownMenuItem onClick={() => onTransactionClick(transaction)} className="cursor-pointer">
                <Edit className="size-4 mr-2" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(transaction.description)} className="cursor-pointer">
                <Copy className="size-4 mr-2" /> Copier description
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => {
                   if(confirm('Supprimer cette transaction ?')) onDelete(transaction.id)
                }} 
                className="text-red-400 focus:text-red-400 cursor-pointer"
              >
                <Trash2 className="size-4 mr-2" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  }));
  
  TransactionRowWithRef.displayName = 'TransactionRow';

  const RecurringGroupRow = React.memo(({ groupId, groupTransactions }: { groupId: string; groupTransactions: Transaction[] }) => {
    const isExpanded = expandedGroups.has(groupId);
    const firstTxn = groupTransactions[0];
    const totalAmount = groupTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = totalAmount / groupTransactions.length;
    const isIncome = avgAmount > 0;

    const toggleExpand = useCallback(() => {
      const newExpanded = new Set(expandedGroups);
      if (isExpanded) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      setExpandedGroups(newExpanded);
    }, [isExpanded, groupId]);

    return (
      <div>
        <div
          className="grid grid-cols-[40px_110px_minmax(180px,1fr)_140px_120px_160px_120px_50px] gap-2 px-6 py-3 border-b border-[var(--color-border-primary)] bg-[var(--bg-glass)]/50 hover:bg-[var(--bg-glass)] transition-colors cursor-pointer"
          onClick={toggleExpand}
        >
          <div className="flex items-center justify-center">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isExpanded ? <ChevronDown className="size-4 text-[var(--color-text-secondary)]" /> : <ChevronRight className="size-4 text-[var(--color-text-secondary)]" />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs border-[var(--color-secondary-border)] bg-[var(--color-secondary-bg)] text-[var(--color-secondary)]">
              <Tag className="size-3" />
              {groupTransactions.length}x
            </Badge>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            {firstTxn.brandLogo && (
              <img 
                src={firstTxn.brandLogo} 
                alt={firstTxn.brand || ''}
                className="size-8 rounded object-contain bg-white flex-shrink-0 border border-[var(--color-border-primary)]"
              />
            )}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="truncate text-sm text-[var(--color-text-primary)] font-medium">
                {firstTxn.description}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                Groupe récurrent • {firstTxn.frequency === 'monthly' ? 'mensuel' : firstTxn.frequency === 'yearly' ? 'annuel' : 'trimestriel'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            {firstTxn.category && (
              <span className="text-xs px-2 py-1 rounded-md bg-[var(--bg-glass)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)] truncate">
                {firstTxn.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-[var(--color-text-muted)]">
              {groupTransactions.length} transaction{groupTransactions.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className={`flex items-center justify-end gap-2`}>
            <span className="text-xs text-[var(--color-text-muted)]">moy.</span>
            <span 
              className="tabular-nums font-medium text-sm"
              style={{ color: isIncome ? 'var(--color-success)' : 'var(--color-danger)' }}
            >
              {formatCurrency(Math.abs(avgAmount))}
            </span>
          </div>

          <div className="w-full" />
        </div>

        <AnimatePresence>
          {isExpanded && groupTransactions.map(txn => (
            <TransactionRowWithRef key={txn.id} transaction={txn} isGrouped />
          ))}
        </AnimatePresence>
      </div>
    );
  });

  RecurringGroupRow.displayName = 'RecurringGroupRow';

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
      <div className="flex-1 overflow-auto scrollbar-thin">
        <TableHeader />
        
        <AnimatePresence mode="popLayout">
          {groupedTransactions.standalone.map(txn => (
            <TransactionRowWithRef key={txn.id} transaction={txn} />
          ))}
          
          {Object.entries(groupedTransactions.groups).map(([groupId, groupTxns]) => (
            <RecurringGroupRow
              key={groupId}
              groupId={groupId}
              groupTransactions={groupTxns}
            />
          ))}
        </AnimatePresence>

        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-glass)] mx-auto mb-4 flex items-center justify-center">
              <Tag className="size-8 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-secondary)] text-lg">Aucune transaction à afficher</p>
            <p className="text-[var(--color-text-tertiary)] text-sm mt-2">Essayez d&apos;ajuster vos filtres</p>
          </div>
        )}
      </div> 
    </div>
  );
}
