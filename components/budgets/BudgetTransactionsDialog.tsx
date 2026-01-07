import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Budget } from '../../types/budget';
import { Transaction } from '../../src/utils/csv-parser';
import { getTransactionsForBudget } from '../../src/utils/budget-rules';
import { X, Calendar, User, Tag, TrendingDown, Receipt } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { formatCurrency } from '../../src/utils/format';

interface BudgetTransactionsDialogProps {
  budget: Budget | null;
  transactions: Transaction[];
  people: Array<{ id: string; name: string; avatar?: string; color?: string }>;
  onClose: () => void;
}

export function BudgetTransactionsDialog({ budget, transactions, people, onClose }: BudgetTransactionsDialogProps) {
  if (!budget) return null;

  const budgetTransactions = getTransactionsForBudget(budget, transactions).filter(txn => txn.amount < 0);
  const totalSpent = budgetTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  
  // Sort by date (most recent first)
  const sortedTransactions = [...budgetTransactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <AnimatePresence>
      <Dialog open={!!budget} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                style={{ backgroundColor: budget.color }}
              >
                {budget.icon}
              </div>
              <div>
                <DialogTitle className="text-2xl">{budget.name}</DialogTitle>
                <DialogDescription>
                  {budget.month ? (
                    <>Budget du mois de {new Date(budget.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</>
                  ) : (
                    <>Toutes les transactions de ce budget</>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 py-4 border-y border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Alloué</div>
              <div className="text-xl">{formatCurrency(budget.allocated)} €</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Dépensé</div>
              <div className="text-xl text-red-600">{formatCurrency(totalSpent)} €</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Restant</div>
              <div className={`text-xl ${budget.allocated - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(budget.allocated - totalSpent)} €
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {sortedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aucune transaction pour ce budget
                  {budget.month && ' ce mois-ci'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {sortedTransactions.map((txn, index) => {
                  const assignedPeople = (() => {
                    if (!txn.assignedTo) return [];
                    
                    // Handle both array and string formats
                    const ids = Array.isArray(txn.assignedTo) 
                      ? txn.assignedTo 
                      : txn.assignedTo.split(',').map(id => id.trim());
                    
                    return people.filter(p => ids.includes(p.id));
                  })();

                  return (
                    <TooltipProvider key={txn.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                          >
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 flex-shrink-0">
                              <TrendingDown className="w-5 h-5" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 dark:text-white truncate mb-1.5">
                                {txn.description}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(txn.date).toLocaleDateString('fr-FR')}
                                </div>
                                {txn.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {txn.category}
                                  </Badge>
                                )}
                                {assignedPeople.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-gray-500" />
                                    {assignedPeople.map((person, idx) => (
                                      <div
                                        key={person.id}
                                        className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-white shadow-md"
                                        style={{ 
                                          backgroundColor: person.color || '#6B7280',
                                          marginLeft: idx > 0 ? '-10px' : '0',
                                          zIndex: assignedPeople.length - idx
                                        }}
                                        title={person.name}
                                      >
                                        {person.avatar ? (
                                          <img src={person.avatar} alt={person.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                          person.name.charAt(0).toUpperCase()
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right flex-shrink-0">
                              <div className="text-base font-medium text-red-600 dark:text-red-400">
                                {formatCurrency(txn.amount)} €
                              </div>
                            </div>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-md">
                          <div className="space-y-1">
                            <p className="font-medium">{txn.description}</p>
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                              <p>Date: {new Date(txn.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              {txn.category && <p>Catégorie: {txn.category}</p>}
                              {assignedPeople.length > 0 && (
                                <p>Personne(s): {assignedPeople.map(p => p.name).join(', ')}</p>
                              )}
                              <p className="font-medium text-red-600">Montant: {formatCurrency(txn.amount)} €</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}
