/**
 * 🔀 SPLIT TRANSACTION DIALOG
 * 
 * Permet de diviser une transaction en plusieurs sous-transactions
 * avec catégorisation fine et masquage optionnel de la transaction d'origine
 * 
 * ⚡ DESIGN : Menus déroulants customisés (max 7 items + scroll)
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, AlertTriangle, Check, Split, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { Transaction } from '@/contexts/DataContext';
import { formatCurrency } from '@/utils/format';

interface SplitTransactionDialogProps {
  transaction: Transaction;
  onClose: () => void;
  onSplit: (subTransactions: Partial<Transaction>[], hideOriginal: boolean, note?: string) => void;
  categories: any[];
}

interface SubTransaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  subCategory?: string;
}

// 🆕 COMPOSANT DROPDOWN CUSTOM (Style harmonisé + max 7 items + scroll)
interface CustomSelectProps {
  value: string;
  options: { id: string; name: string; color?: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function CustomSelect({ value, options, onChange, placeholder = 'Choisir...', disabled = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(o => o.name === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2.5 rounded-lg border text-sm text-left
          flex items-center justify-between transition-all
          ${disabled 
            ? 'bg-black/30 border-white/5 text-white/30 cursor-not-allowed' 
            : 'bg-[#0A0A0A]/90 border-white/10 text-white hover:bg-white/5 hover:border-cyan-400/30'
          }
          ${isOpen ? 'border-cyan-400/50 ring-2 ring-cyan-400/20' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption?.color && (
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 w-full mt-1 bg-[#0A0A0A]/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
          >
            <div className="max-h-[245px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.name);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-cyan-500/20 hover:text-white transition-all flex items-center gap-3 border-b border-white/5 last:border-none group"
                >
                  {opt.color && (
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: opt.color }}
                    />
                  )}
                  <span className="flex-1 truncate">{opt.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SplitTransactionDialog({
  transaction,
  onClose,
  onSplit,
  categories
}: SplitTransactionDialogProps) {
  const [subTransactions, setSubTransactions] = useState<SubTransaction[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      amount: 0,
      category: transaction.category || '',
      subCategory: transaction.subCategory
    },
    {
      id: crypto.randomUUID(),
      description: '',
      amount: 0,
      category: transaction.category || '',
      subCategory: transaction.subCategory
    }
  ]);
  
  const [hideOriginal, setHideOriginal] = useState(true);
  const [splitNote, setSplitNote] = useState('');

  const totalAllocated = useMemo(() => {
    return subTransactions.reduce((sum, st) => sum + (st.amount || 0), 0);
  }, [subTransactions]);

  const remaining = Math.abs(transaction.amount) - totalAllocated;
  const isValid = Math.abs(remaining) < 0.01 && subTransactions.every(st => 
    st.description.trim() && st.category && st.amount > 0
  );

  const addSubTransaction = () => {
    setSubTransactions([...subTransactions, {
      id: crypto.randomUUID(),
      description: '',
      amount: 0,
      category: transaction.category || '',
      subCategory: transaction.subCategory
    }]);
  };

  const removeSubTransaction = (id: string) => {
    if (subTransactions.length <= 2) return;
    setSubTransactions(subTransactions.filter(st => st.id !== id));
  };

  const updateSubTransaction = (id: string, updates: Partial<SubTransaction>) => {
    setSubTransactions(subTransactions.map(st => 
      st.id === id ? { ...st, ...updates } : st
    ));
  };

  const handleSubmit = () => {
    if (!isValid) return;

    const newSubTransactions: Partial<Transaction>[] = subTransactions.map(st => ({
      date: transaction.date,
      description: st.description,
      category: st.category,
      subCategory: st.subCategory,
      amount: transaction.amount > 0 ? st.amount : -st.amount,
      type: transaction.type,
      merchant: transaction.merchant,
      parentTransactionId: transaction.id
    }));

    onSplit(newSubTransactions, hideOriginal, splitNote);
  };

  const getSubCategories = (parentCategoryName: string) => {
    return categories.filter(c => {
      const parentCat = categories.find(p => p.name === parentCategoryName && !p.parentId);
      return c.parentId === parentCat?.id;
    });
  };

  const parentCategories = useMemo(() => 
    categories.filter(c => !c.parentId),
    [categories]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-br from-purple-500/10 to-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Split className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-white">Diviser la transaction</h2>
              <p className="text-sm text-white/60 mt-0.5">Décomposer en plusieurs sous-opérations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TRANSACTION ORIGINALE */}
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-white/60 mb-1">Transaction originale</p>
              <p className="text-base text-white font-medium truncate">{transaction.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60 mb-1">Montant total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(Math.abs(transaction.amount))}</p>
            </div>
          </div>
        </div>

        {/* SCROLL AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
          
          {/* SOUS-TRANSACTIONS */}
          <AnimatePresence mode="popLayout">
            {subTransactions.map((st, index) => {
              const subCats = getSubCategories(st.category);
              
              return (
                <motion.div
                  key={st.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/60 font-medium">Sous-transaction #{index + 1}</span>
                    {subTransactions.length > 2 && (
                      <button
                        onClick={() => removeSubTransaction(st.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-white/60 mb-2">Description *</label>
                    <input
                      type="text"
                      value={st.description}
                      onChange={(e) => updateSubTransaction(st.id, { description: e.target.value })}
                      placeholder="Ex: Courses alimentaires"
                      className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A]/90 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Montant */}
                    <div>
                      <label className="block text-xs text-white/60 mb-2">Montant *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={st.amount || ''}
                        onChange={(e) => updateSubTransaction(st.id, { amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A]/90 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                      />
                    </div>

                    {/* Catégorie */}
                    <div>
                      <label className="block text-xs text-white/60 mb-2">Catégorie *</label>
                      <CustomSelect
                        value={st.category}
                        options={parentCategories}
                        onChange={(val) => updateSubTransaction(st.id, { category: val, subCategory: '' })}
                        placeholder="Choisir..."
                      />
                    </div>

                    {/* Sous-catégorie */}
                    <div>
                      <label className="block text-xs text-white/60 mb-2">Sous-catégorie</label>
                      <CustomSelect
                        value={st.subCategory || ''}
                        options={[{ id: 'none', name: 'Aucune' }, ...subCats]}
                        onChange={(val) => updateSubTransaction(st.id, { subCategory: val === 'Aucune' ? '' : val })}
                        placeholder="Aucune"
                        disabled={!st.category || subCats.length === 0}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* AJOUTER UNE SOUS-TRANSACTION */}
          <button
            onClick={addSubTransaction}
            className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/30 bg-white/5 hover:bg-purple-500/10 text-white/60 hover:text-purple-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </button>

          {/* BILAN */}
          <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-purple-500/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">Total alloué</span>
              <span className="text-lg font-medium text-white">{formatCurrency(totalAllocated)}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/70">Reste à allouer</span>
              <span className={`text-lg font-bold ${Math.abs(remaining) < 0.01 ? 'text-green-400' : 'text-orange-400'}`}>
                {formatCurrency(remaining)}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  Math.abs(remaining) < 0.01 ? 'bg-green-500' : totalAllocated > Math.abs(transaction.amount) ? 'bg-red-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min((totalAllocated / Math.abs(transaction.amount)) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* OPTIONS */}
          <div className="space-y-3">
            {/* Masquer l'originale */}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={hideOriginal}
                onChange={(e) => setHideOriginal(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {hideOriginal ? <EyeOff className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
                  <span className="text-sm text-white font-medium">
                    {hideOriginal ? 'Masquer' : 'Conserver visible'} la transaction originale
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  {hideOriginal 
                    ? 'La transaction d\'origine sera masquée des calculs' 
                    : 'La transaction d\'origine restera visible avec un lien vers ses sous-transactions'}
                </p>
              </div>
            </label>

            {/* Note */}
            <div>
              <label className="block text-xs text-white/60 mb-2">Note (optionnel)</label>
              <textarea
                value={splitNote}
                onChange={(e) => setSplitNote(e.target.value)}
                placeholder="Ex: Ticket de courses détaillé"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A]/90 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-white/10 bg-black flex items-center justify-between gap-4">
          {!isValid && (
            <div className="flex items-center gap-2 text-orange-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Complétez tous les champs et allouez tout le montant</span>
            </div>
          )}
          {isValid && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              <span>Prêt à diviser la transaction</span>
            </div>
          )}
          
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-cyan-600"
            >
              Diviser la transaction
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
