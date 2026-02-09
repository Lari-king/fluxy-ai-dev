import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Edit2, Trash2, Globe, MapPin, Building2, 
  User, Calendar, DollarSign, Tag, Link as LinkIcon, Map, StickyNote,
  ExternalLink, Repeat, Bell, Clock, Layers, TrendingUp
} from 'lucide-react';
import { Transaction } from '@/utils/csv-parser';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TransactionFormDialog } from '@/components/transactions/modals/TransactionFormDialog';
import { isUpcomingTransaction } from '@/utils/transaction-helpers';
import { 
  getRecurringGroupStats, 
  formatRecurringPeriod 
} from '@/utils/recurring-group-helpers';

interface TransactionGroupCardProps {
  transaction: Transaction;
  groupSize: number;
  allTransactions: Transaction[];
  index: number;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  onCreateRecurringGroup?: (transactionIds: string[], sharedData: any) => void;
  categories: any[];
  people?: any[];
  allAvailableTransactions?: Transaction[];
  // AJOUT des props de sélection
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function TransactionGroupCard({ 
  transaction, 
  groupSize,
  allTransactions,
  index, 
  onUpdate, 
  onDelete,
  onCreateRecurringGroup,
  categories,
  people = [],
  allAvailableTransactions = [],
  // DÉCONSTRUCTION des props de sélection
  isSelected = false,
  onSelect
}: TransactionGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isGroup = groupSize > 1;
  const isIncome = transaction.amount > 0;
  const isUpcoming = isUpcomingTransaction(transaction);
  
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(transaction.amount));

  const groupStats = isGroup ? getRecurringGroupStats(allTransactions) : null;

  const getCategoryColor = (category?: string) => {
    const colors: any = {
      'Alimentation': 'from-orange-500 to-red-500',
      'Transport': 'from-blue-500 to-cyan-500',
      'Logement': 'from-purple-500 to-pink-500',
      'Santé': 'from-green-500 to-emerald-500',
      'Loisirs': 'from-yellow-500 to-orange-500',
      'Famille': 'from-pink-500 to-rose-500',
      'Éducation': 'from-indigo-500 to-blue-500',
    };
    return colors[category || ''] || 'from-gray-500 to-gray-600';
  };

  const getCategoryIcon = (category?: string) => {
    const icons: any = {
      'Alimentation': '🍽️',
      'Transport': '🚗',
      'Logement': '🏠',
      'Santé': '⚕️',
      'Loisirs': '🎮',
      'Famille': '👨‍👩‍👧',
      'Éducation': '📚',
    };
    return icons[category || ''] || '💰';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const person = people.find(p => p.id === transaction.personId);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.03 }}
        className={`
          bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl 
          transition-all duration-300 overflow-hidden border-2 relative
          ${isUpcoming 
            ? 'border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20' 
            : 'border-gray-200 dark:border-gray-700'
          }
          ${isGroup ? 'ring-2 ring-blue-400/30 dark:ring-blue-600/30' : ''}
          ${isSelected ? 'ring-4 ring-purple-400/50 dark:ring-purple-600/50' : ''} // Feedback visuel de sélection
        `}
      >
        {/* Checkbox de sélection (NOUVEAU) */}
        {onSelect && (
          <div className="absolute left-4 top-4 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation(); // Empêche l'expansion de la carte lors du clic
                onSelect(e.target.checked);
              }}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              // Empêche la propagation sur le clic aussi, juste au cas où.
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        )}

        {/* Main Content (MODIFICATION du padding) */}
        <div className={onSelect ? "pl-14 pr-6 py-6" : "p-5"}>
          <div className="flex items-start gap-4">
            {/* Category Icon or Person Avatar */}
            {person ? (
              <Avatar className="w-14 h-14 ring-4 ring-offset-2 shadow-lg flex-shrink-0" style={{ '--tw-ring-color': person.color }as React.CSSProperties}>
                <AvatarImage src={person.avatar} />
                <AvatarFallback style={{ backgroundColor: person.color }} className="text-white text-xl">
                  {person.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className={`
                w-14 h-14 rounded-2xl bg-gradient-to-br ${getCategoryColor(transaction.category)}
                flex items-center justify-center text-2xl shadow-lg flex-shrink-0
              `}>
                {getCategoryIcon(transaction.category)}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg mb-1 truncate">
                    {transaction.description}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {transaction.category && (
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-white/50 dark:bg-gray-800/50"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {transaction.category}
                      </Badge>
                    )}

                    {isGroup && (
                      <Badge 
                        className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0"
                      >
                        <Layers className="w-3 h-3 mr-1" />
                        {groupSize}x récurrence{groupSize > 1 ? 's' : ''}
                      </Badge>
                    )}

                    {transaction.isRecurring && !isGroup && (
                      <Badge variant="outline" className="gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                        <Repeat className="w-3 h-3" />
                        {transaction.frequency === 'monthly' ? 'Mensuel' :
                         transaction.frequency === 'quarterly' ? 'Trimestriel' :
                         transaction.frequency === 'yearly' ? 'Annuel' : 'Récurrent'}
                      </Badge>
                    )}

                    {isUpcoming && (
                      <Badge variant="outline" className="gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-400 dark:border-amber-600">
                        <Clock className="w-3 h-3" />
                        À venir
                      </Badge>
                    )}

                    {transaction.type === 'online' && (
                      <Badge variant="outline" className="gap-1">
                        <Globe className="w-3 h-3" />
                        En ligne
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <div className={`text-2xl ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isIncome ? '+' : '-'}{formattedAmount}
                  </div>
                  {isGroup && groupStats && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Total: {Math.abs(groupStats.totalAmount).toFixed(2)}€
                    </div>
                  )}
                </div>
              </div>

              {/* Date and Person */}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {isGroup && groupStats 
                    ? formatRecurringPeriod(groupStats.firstDate, groupStats.lastDate)
                    : formatDate(transaction.date)
                  }
                </div>
                {person && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={person.avatar} />
                      <AvatarFallback className="text-xs">
                        {person.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{person.name}</span>
                  </div>
                )}
              </div>

              {/* Group details toggle */}
              {isGroup && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGroupDetails(!showGroupDetails)}
                  className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  {showGroupDetails ? 'Masquer' : 'Voir'} les {groupSize} occurrences
                </Button>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-9 h-9 p-0"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </Button>
            </div>
          </div>
        </div>

        {/* Group Details */}
        <AnimatePresence>
          {showGroupDetails && isGroup && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-hidden"
            >
              <div className="p-5 space-y-2">
                <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                  Historique des occurrences
                </h4>
                {allTransactions.map((txn, idx) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDate(txn.date)}</span>
                    </div>
                    <span className={`font-medium ${txn.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {txn.amount > 0 ? '+' : ''}{txn.amount.toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {transaction.brand && (
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Marque</div>
                        <div className="text-sm font-medium">{transaction.brand}</div>
                      </div>
                    </div>
                  )}

                  {(transaction.address || transaction.city) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Localisation</div>
                        <div className="text-sm font-medium">
                          {transaction.city || transaction.address}
                        </div>
                      </div>
                    </div>
                  )}

                  {transaction.url && (
                    <div className="flex items-start gap-2 col-span-2">
                      <LinkIcon className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">URL</div>
                        <a 
                          href={transaction.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Voir le lien <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {transaction.notes && (
                    <div className="flex items-start gap-2 col-span-2">
                      <StickyNote className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Notes</div>
                        <div className="text-sm">{transaction.notes}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(transaction.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Edit Dialog */}
      <AnimatePresence>
      {showEditDialog && (
  <TransactionFormDialog
    transaction={transaction}
    onClose={() => setShowEditDialog(false)}
    onSave={onUpdate}
    onCreateRecurringGroup={onCreateRecurringGroup}
    categories={categories}
    people={people}
    allTransactions={allAvailableTransactions}
  />
)}
      </AnimatePresence>
    </>
  );
}