/**
 * 🛠️ UTILITÉ : Dialogue de confirmation et d'appairage manuel.
 * Ce fichier permet à l'utilisateur de valider les suggestions de l'algorithme "Fuzzy Matcher".
 * Il sécurise la base de données en évitant les faux positifs tout en permettant de 
 * reconstruire des séries historiques complètes à partir d'une seule détection.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Repeat,
  Link2,
  Sparkles,
  Info
} from 'lucide-react';
import { Transaction } from '@/utils/csv-parser';
import { SimilarTransaction } from '@/utils/recurring-matcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Correction : Import manquant
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  // Initialisation avec les transactions ayant un score > 80%
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(similarTransactions.filter(st => st.matchScore > 80).map(st => st.transaction.id))
  );

  const totalImpact = useMemo(() => {
    return Array.from(selectedIds).reduce((acc, id) => {
      const t = similarTransactions.find(st => st.transaction.id === id);
      return acc + (t?.transaction.amount || 0);
    }, sourceTransaction.amount);
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
      month: 'long',
      year: 'numeric',
    });
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-blue-500';
    return 'text-amber-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header Dynamique */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Repeat className="w-32 h-32 rotate-12" />
          </div>
          
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Intelligence Récurrente</h2>
              </div>
              <p className="text-white/80 text-lg max-w-2xl">
                Nous avons identifié <span className="text-white font-bold">{similarTransactions.length} correspondances</span> potentielles.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-all flex-shrink-0 border border-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Section Référence */}
        <div className="px-8 py-6 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]/30">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="px-3 py-1 border-indigo-500/50 text-indigo-500 bg-indigo-500/5 uppercase tracking-widest text-[10px] font-black">
              Transaction Pivot
            </Badge>
          </div>
          <div className="flex items-center justify-between group">
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-[var(--color-text-primary)] truncate">{sourceTransaction.description}</p>
              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-medium">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  {formatDate(sourceTransaction.date)}
                </div>
                <div className="h-4 w-[1px] bg-[var(--color-border-primary)]" />
                <Badge className="bg-purple-500/10 text-purple-500 border-none">
                  {sourceTransaction.category || 'Non classé'}
                </Badge>
              </div>
            </div>
            <div className="text-3xl font-black text-right text-[var(--color-text-primary)]">
              {sourceTransaction.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
        </div>

        {/* Liste des Candidats */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-8 py-4 flex items-center justify-between bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Historique Probable
            </h3>
            <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-[10px] uppercase font-bold text-indigo-500">
              {selectedIds.size === similarTransactions.length ? 'Désélectionner' : 'Tout sélectionner'}
            </Button>
          </div>

          <ScrollArea className="flex-1 px-8 py-4">
            <div className="space-y-4 mb-8">
              {similarTransactions.map((similar) => {
                const isSelected = selectedIds.has(similar.transaction.id);
                const amountDiff = ((similar.transaction.amount - sourceTransaction.amount) / Math.abs(sourceTransaction.amount)) * 100;
                
                return (
                  <motion.div
                    key={similar.transaction.id}
                    layout
                    onClick={() => handleToggle(similar.transaction.id)}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
                      isSelected ? 'bg-indigo-500/[0.03] border-indigo-500/50' : 'bg-[var(--color-bg-secondary)]/50 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-5">
                      <Checkbox checked={isSelected} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--color-text-primary)] text-lg truncate group-hover:text-indigo-500 transition-colors">
                              {similar.transaction.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm font-mono font-medium text-[var(--color-text-secondary)]">{formatDate(similar.transaction.date)}</span>
                              {similar.daysDifference !== undefined && (
                                <Badge variant="secondary" className="text-[10px] font-bold">
                                  {Math.abs(similar.daysDifference)}j
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-[var(--color-text-primary)]">
                              {similar.transaction.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </p>
                            <div className={`text-[10px] font-black uppercase mt-1 ${getMatchScoreColor(similar.matchScore)}`}>
                              {similar.matchScore}% Score
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-8 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <Info className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Impact : <span className="text-indigo-500">{totalImpact.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <Button variant="ghost" onClick={onCancel} className="font-bold">Annuler</Button>
              <Button 
                onClick={() => onConfirm(Array.from(selectedIds))} // Correction : onConfirm utilisé ici
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-10 py-6 rounded-2xl"
              >
                Sceller l&apos;association
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}