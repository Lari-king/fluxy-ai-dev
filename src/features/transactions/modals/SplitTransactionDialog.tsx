/**
 * ✂️ SPLIT TRANSACTION DIALOG - Dialog pour diviser une transaction
 * Permet de diviser une transaction parent en plusieurs sous-transactions
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Split, AlertCircle, CheckCircle, DollarSign, Tag, Eye, EyeOff
} from 'lucide-react';
import { Transaction, SubTransaction } from '../types';
import { formatCurrency } from '@/utils/format';
import { generateId } from '@/utils/transaction-helpers';
import * as TransactionEngine from '../services/transaction-engine';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/contexts/DataContext';

// ============================================================================
// TYPES
// ============================================================================

interface SplitTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSplit?: (original: Transaction, subTransactions: Transaction[], hideOriginal: boolean) => void;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function SplitTransactionDialog({
  open,
  onClose,
  transaction,
  onSplit
}: SplitTransactionDialogProps) {
  const { categories } = useData();

  // ============================================================================
  // STATE
  // ============================================================================

  const [subTransactions, setSubTransactions] = useState<SubTransaction[]>([
    { id: generateId('sub'), description: '', amount: 0, category: '', subCategory: '' }
  ]);
  const [hideOriginal, setHideOriginal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (open && transaction) {
      // Reset with 2 empty sub-transactions
      setSubTransactions([
        { id: generateId('sub'), description: '', amount: 0, category: transaction.category || '', subCategory: '' },
        { id: generateId('sub'), description: '', amount: 0, category: transaction.category || '', subCategory: '' }
      ]);
      setHideOriginal(true);
    }
  }, [open, transaction]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const parentCategories = useMemo(() => 
    categories.filter(c => !c.parentId),
    [categories]
  );

  const totalAllocated = useMemo(() => 
    subTransactions.reduce((sum, sub) => sum + (Number(sub.amount) || 0), 0),
    [subTransactions]
  );

  const remaining = useMemo(() => 
    (transaction?.amount || 0) - totalAllocated,
    [transaction, totalAllocated]
  );

  const isValid = useMemo(() => {
    if (!transaction) return false;
    if (subTransactions.length < 2) return false;
    if (Math.abs(remaining) > 0.01) return false;
    
    return subTransactions.every(sub => {
      const hasDescription = sub.description?.trim().length > 0;
      const hasCategory = !!sub.category;
      // On vérifie que le montant n'est pas égal à zéro (on accepte négatif et positif)
      const hasAmount = sub.amount !== 0; 
      
      return hasDescription && hasCategory && hasAmount;
    });
  }, [transaction, subTransactions, remaining]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAddSubTransaction = () => {
    setSubTransactions(prev => [
      ...prev,
      { 
        id: generateId('sub'), 
        description: '', 
        // On propose le reste quel que soit son signe
        amount: remaining !== 0 ? remaining : 0, 
        category: transaction?.category || '', 
        subCategory: '' 
      }
    ]);
  };

  const handleRemoveSubTransaction = (id: string) => {
    if (subTransactions.length <= 2) {
      toast.error('Il faut au moins 2 sous-transactions');
      return;
    }
    setSubTransactions(prev => prev.filter(sub => sub.id !== id));
  };

  const handleUpdateSubTransaction = (id: string, field: keyof SubTransaction, value: any) => {
    // Convert "none" to empty string
    const actualValue = value === 'none' ? '' : value;
    setSubTransactions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, [field]: actualValue } : sub
    ));
  };

  const handleDistributeEqually = () => {
    if (!transaction || subTransactions.length === 0) return;
    
    const amountPerSub = transaction.amount / subTransactions.length;
    setSubTransactions(prev => prev.map(sub => ({
      ...sub,
      amount: Math.round(amountPerSub * 100) / 100
    })));
  };

  const handleSubmit = async () => {
    if (!transaction || !isValid) return;

    setIsSaving(true);

    try {
      const newTransactions = TransactionEngine.prepareSplitTransactions(
        transaction,
        subTransactions
      );

      if (onSplit) {
        await onSplit(transaction, newTransactions, hideOriginal);
      }

      toast.success(`Transaction divisée en ${subTransactions.length} parties`);
      onClose();
    } catch (error) {
      console.error('Error splitting transaction:', error);
      toast.error('Erreur lors de la division');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Split className="w-5 h-5 text-purple-400" />
            Diviser la transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Original Transaction Info */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white/40 mb-2">
                  Transaction originale
                </h3>
                <p className="text-lg font-bold text-white">
                  {transaction.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-purple-400">
                  {formatCurrency(transaction.amount)}
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {transaction.category || 'Non catégorisé'}
                </div>
              </div>
            </div>

            {/* Hide Original Option */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <Checkbox
                id="hide-original"
                checked={hideOriginal}
                onCheckedChange={(checked) => setHideOriginal(checked as boolean)}
                className="border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
              />
              <Label 
                htmlFor="hide-original" 
                className="text-sm text-white/80 cursor-pointer flex items-center gap-2"
              >
                {hideOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Masquer la transaction originale après division
              </Label>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xs text-white/40 mb-1">Total alloué</div>
              <div className="text-lg font-bold text-white">
                {formatCurrency(totalAllocated)}
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${
              Math.abs(remaining) < 0.01 
                ? 'bg-emerald-500/10 border-emerald-500/20' 
                : 'bg-yellow-500/10 border-yellow-500/20'
            }`}>
              <div className="text-xs text-white/40 mb-1">Restant</div>
              <div className={`text-lg font-bold ${
                Math.abs(remaining) < 0.01 ? 'text-emerald-400' : 'text-yellow-400'
              }`}>
                {formatCurrency(remaining)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xs text-white/40 mb-1">Sous-transactions</div>
              <div className="text-lg font-bold text-white">
                {subTransactions.length}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDistributeEqually}
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs"
            >
              <DollarSign className="w-3.5 h-3.5 mr-2" />
              Répartir équitablement
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSubTransaction}
              className="flex-1 bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Ajouter une ligne
            </Button>
          </div>

          {/* Sub-transactions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white/40 flex items-center gap-2">
              <Split className="w-3.5 h-3.5" />
              Sous-transactions ({subTransactions.length})
            </h3>
            
            <AnimatePresence>
              {subTransactions.map((sub, index) => {
                const subCategory = categories.find(c => c.name === sub.category || c.id === sub.category);
                const subSubCategories = subCategory 
                  ? categories.filter(c => c.parentId === subCategory.id)
                  : [];

                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <span className="text-xs font-black text-purple-400">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-xs text-white/40">
                          Sous-transaction #{index + 1}
                        </span>
                      </div>
                      {subTransactions.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSubTransaction(sub.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Description */}
                      <div className="space-y-2">
                        <Label className="text-xs text-white/60">Description</Label>
                        <Input
                          value={sub.description}
                          onChange={(e) => handleUpdateSubTransaction(sub.id, 'description', e.target.value)}
                          placeholder="Ex: Alimentaire"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      {/* Amount */}
                      <div className="space-y-2">
                        <Label className="text-xs text-white/60 flex items-center gap-2">
                          <DollarSign className="w-3 h-3" />
                          Montant
                        </Label>
                        <Input
  type="number"
  step="0.01"
  value={sub.amount || ''}
  onChange={(e) => {
    // Utilise parseFloat pour bien capturer le signe "-"
    const val = parseFloat(e.target.value);
    handleUpdateSubTransaction(sub.id, 'amount', isNaN(val) ? 0 : val);
  }}
  placeholder="0.00"
  className="bg-white/5 border-white/10 text-white font-bold"
/>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Category */}
                      <div className="space-y-2">
                        <Label className="text-xs text-white/60 flex items-center gap-2">
                          <Tag className="w-3 h-3" />
                          Catégorie
                        </Label>
                        <Select
                          value={sub.category || 'none'}
                          onValueChange={(value) => {
                            handleUpdateSubTransaction(sub.id, 'category', value);
                            handleUpdateSubTransaction(sub.id, 'subCategory', '');
                          }}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                            <SelectItem value="none">Aucune</SelectItem>
                            {parentCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.icon && <span className="mr-2">{cat.icon}</span>}
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sub-category */}
                      <div className="space-y-2">
                        <Label className="text-xs text-white/60">Sous-catégorie</Label>
                        <Select
                          value={sub.subCategory || 'none'}
                          onValueChange={(value) => handleUpdateSubTransaction(sub.id, 'subCategory', value)}
                          disabled={subSubCategories.length === 0}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white disabled:opacity-40">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                            <SelectItem value="none">Aucune</SelectItem>
                            {subSubCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Validation Messages */}
          {Math.abs(remaining) > 0.01 && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-yellow-400">
                  Le total des sous-transactions ne correspond pas au montant original
                </p>
                <p className="text-xs text-yellow-400/80 mt-1">
                  Il reste {formatCurrency(Math.abs(remaining))} à allouer.
                </p>
              </div>
            </div>
          )}

          {isValid && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-400">
                  Prêt à diviser
                </p>
                <p className="text-xs text-emerald-400/80 mt-1">
                  La transaction sera divisée en {subTransactions.length} sous-transactions.
                </p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSaving}
              className="flex-1 bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Split className="w-4 h-4 mr-2" />
              {isSaving ? 'Division...' : 'Diviser la transaction'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
