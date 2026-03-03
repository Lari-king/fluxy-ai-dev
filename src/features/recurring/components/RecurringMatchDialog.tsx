/**
 * 🛠️ UTILITÉ : Dialogue de confirmation et d'appairage manuel.
 * Ce fichier permet à l'utilisateur de valider les suggestions de l'algorithme "Fuzzy Matcher".
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Repeat,
  Link2,
  Sparkles,
  Info,
  Check
} from 'lucide-react';

// Imports types & composants
import type { Transaction } from '@/features/transactions/types';
import { SimilarTransaction } from '../engine/recurring-matcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/utils/format';

interface RecurringTransactionMatchDialogProps {
  sourceTransaction: Transaction;
  similarTransactions: SimilarTransaction[];
  onConfirm: (selectedTransactionIds: string[]) => void;
  onCancel: () => void;
}

export function RecurringTransactionMatchDialog({
  sourceTransaction,
  similarTransactions,
  onConfirm,
  onCancel,
}: RecurringTransactionMatchDialogProps) {
  
  // Initialisation : on sélectionne par défaut les scores élevés (> 80%)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(similarTransactions.filter(st => st.matchScore > 80).map(st => st.transaction.id))
  );

  // Fermeture sur touche Echap
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const totalImpact = useMemo(() => {
    const selectedAmount = Array.from(selectedIds).reduce((acc, id) => {
      const t = similarTransactions.find(st => st.transaction.id === id);
      return acc + (t?.transaction.amount || 0);
    }, 0);
    return sourceTransaction.amount + selectedAmount;
  }, [selectedIds, similarTransactions, sourceTransaction]);

  const handleToggle = (transactionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === similarTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(similarTransactions.map(st => st.transaction.id)));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-blue-400';
    return 'text-amber-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0A0A0B] border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header Design Tesla/Apple */}
        <div className="relative bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-transparent p-8 border-b border-white/5">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Analyse des Récurrences</h2>
              </div>
              <p className="text-white/40 text-sm">
                Validez les transactions appartenant à la même série pour affiner vos prévisions.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>

        {/* Transaction Pivot (Celle d'où on part) */}
        <div className="px-8 py-6 bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Transaction de référence</span>
              <p className="text-xl font-semibold text-white">{sourceTransaction.description}</p>
              <div className="flex items-center gap-4 text-sm text-white/40">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(sourceTransaction.date)}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs">{sourceTransaction.category}</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(sourceTransaction.amount)}
            </div>
          </div>
        </div>

        {/* Liste des suggestions */}
        <div className="flex-1 flex flex-col min-h-0 bg-black/40">
          <div className="px-8 py-4 flex items-center justify-between border-b border-white/5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5" />
              {similarTransactions.length} Suggestions trouvées
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSelectAll} 
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            >
              {selectedIds.size === similarTransactions.length ? 'TOUT DÉCOCHER' : 'TOUT SÉLECTIONNER'}
            </Button>
          </div>

          <ScrollArea className="flex-1 px-8 py-4">
            <div className="space-y-3 pb-8">
              {similarTransactions.map((similar) => {
                const isSelected = selectedIds.has(similar.transaction.id);
                
                return (
                  <motion.div
                    key={similar.transaction.id}
                    whileHover={{ x: 4 }}
                    onClick={() => handleToggle(similar.transaction.id)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(79,70,229,0.1)]' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium truncate transition-colors ${isSelected ? 'text-white' : 'text-white/70'}`}>
                            {similar.transaction.description}
                          </p>
                          <span className="font-bold text-white">
                            {formatCurrency(similar.transaction.amount)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-white/30">{formatDate(similar.transaction.date)}</span>
                          <Badge variant="outline" className="text-[9px] border-white/10 text-white/40">
                            {similar.daysDifference} jours d'écart
                          </Badge>
                          <span className={`text-[10px] font-bold uppercase ml-auto ${getMatchScoreColor(similar.matchScore)}`}>
                            {similar.matchScore}% Match
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Footer avec calcul d'impact réel */}
        <div className="p-8 bg-white/[0.02] border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <Info className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Impact total estimé</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(totalImpact)} 
                  <span className="text-xs text-white/30 font-normal ml-2">({selectedIds.size + 1} tx)</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                variant="ghost" 
                onClick={onCancel} 
                className="flex-1 sm:flex-none text-white/60 hover:text-white"
              >
                Annuler
              </Button>
              <Button 
                onClick={() => onConfirm(Array.from(selectedIds))}
                disabled={selectedIds.size === 0}
                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                Confirmer la série
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
