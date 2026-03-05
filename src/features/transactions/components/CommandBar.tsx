/**
 * ⚡ COMMAND BAR - SYSTÈME DE CONTRÔLE AVANCÉ
 * Version : 2.1.0 (Focus Sync & Intelligence Toggle)
 * * Cette barre de commande gère :
 * 1. La recherche plein texte avec debounce
 * 2. Le filtrage multi-critères (Catégories, Sous-cat, Personnes)
 * 3. Le Toggle Intelligence (LeftPanel)
 * 4. Les actions de masse (Bulk)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, Filter, FolderTree, Tags, User, DollarSign,
  Calendar, Tag, Zap, CheckCircle, Trash2, Upload, ChevronDown,
  BarChart3, Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { FilterState } from '../types';
import { FilterSelect } from '@/components/ui/FilterSelect';

// ============================================================================
// 🧱 TYPES & INTERFACES
// ============================================================================

interface CommandBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: any[];
  people: any[];
  transactions?: any[];
  selectedCount: number;
  onClearSelection?: () => void;
  onImport?: () => void;
  onAddManual?: () => void;
  onBulkCategorize?: (category: string) => void;
  onBulkCategorizeSubCategory?: (subCategory: string) => void;
  onBulkAssignPerson?: (personId: string) => void;
  onBulkSetStatus?: (status: string) => void;
  onBulkDelete?: () => void;
  onToggleIntelligence?: () => void; // ✅ Ajouté pour corriger l'erreur 2322
}

// ============================================================================
// 🛠️ SOUS-COMPOSANTS INTERNES
// ============================================================================

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

const DebouncedInput = React.memo<DebouncedInputProps>(({ 
  value, 
  onChange, 
  delay = 300, 
  ...props 
}) => {
  const [innerValue, setInnerValue] = React.useState(value);
  React.useEffect(() => setInnerValue(value), [value]);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (innerValue !== value) onChange(innerValue);
    }, delay);
    return () => clearTimeout(timer);
  }, [innerValue, value, onChange, delay]);

  return (
    <input 
      {...props} 
      value={innerValue} 
      onChange={(e) => setInnerValue(e.target.value)} 
    />
  );
});

const AmountRangePicker = React.memo<{
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
}>(({ min, max, onChange }) => (
  <div className="space-y-2 px-1">
    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">
      <DollarSign className="w-3 h-3 text-emerald-400" /> Montants
    </label>
    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-xl focus-within:border-emerald-500/30 transition-all">
      <DebouncedInput
        type="number"
        placeholder="Min"
        className="w-full bg-transparent border-none px-3 py-2 text-sm text-white outline-none placeholder:text-white/10"
        value={min}
        onChange={(val) => onChange(val, max)}
      />
      <div className="h-4 w-[1px] bg-white/10 mx-1" />
      <DebouncedInput
        type="number"
        placeholder="Max"
        className="w-full bg-transparent border-none px-3 py-2 text-sm text-white outline-none text-right placeholder:text-white/10"
        value={max}
        onChange={(val) => onChange(min, val)}
      />
    </div>
  </div>
));

const DateRangePicker = React.memo<{
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}>(({ from, to, onChange }) => (
  <div className="space-y-2 px-1">
    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">
      <Calendar className="w-3 h-3 text-amber-400" /> Période
    </label>
    <div className="grid grid-cols-2 gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-amber-500/50 transition-all [color-scheme:dark]"
      />
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-amber-500/50 transition-all [color-scheme:dark]"
      />
    </div>
  </div>
));

// ============================================================================
// 🚀 COMPOSANT PRINCIPAL
// ============================================================================

export function CommandBar({
  filters,
  onFilterChange,
  categories,
  people,
  transactions = [],
  selectedCount,
  onClearSelection,
  onAddManual,
  onImport,
  onBulkDelete,
  onBulkCategorize,
  onBulkSetStatus,
  onToggleIntelligence // ✅ Reçu ici
}: CommandBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Détecte si le mode Focus (provenant de l'Intelligence) est actif
  const isFocusActive = useMemo(() => {
    return (filters as any).transactionIds?.length > 0;
  }, [filters]);

  // --------------------------------------------------------------------------
  // 📊 CALCUL DES COMPTEURS
  // --------------------------------------------------------------------------

  const transactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.category) {
        counts[t.category] = (counts[t.category] || 0) + 1;
        if (t.subCategory) {
          counts[`${t.category}__${t.subCategory}`] = (counts[`${t.category}__${t.subCategory}`] || 0) + 1;
        }
      }
    });
    return counts;
  }, [transactions]);

  const parentCategories = useMemo(() => {
    const parents = categories.filter(c => !c.parentId);
    return [
      { id: 'all', name: 'Toutes les catégories', count: transactions.length },
      ...parents.map(c => ({
        ...c,
        count: transactionCounts[c.id] || transactionCounts[c.name] || 0
      }))
    ];
  }, [categories, transactionCounts, transactions.length]);

  const subCategories = useMemo(() => {
    if (!filters.category || filters.category === 'all') return [];
    const parent = categories.find(c => c.id === filters.category || c.name === filters.category);
    if (!parent) return [];
    const children = categories.filter(c => c.parentId === parent.id);
    return [
      { id: 'all', name: 'Toutes les sous-cat.' },
      ...children.map(c => ({
        ...c,
        count: transactionCounts[`${parent.id}__${c.id}`] || transactionCounts[`${parent.name}__${c.name}`] || 0
      }))
    ];
  }, [filters.category, categories, transactionCounts]);

  const handleReset = useCallback(() => {
    onFilterChange({
      ...filters,
      searchTerm: '',
      category: 'all',
      subCategory: 'all',
      type: 'all',
      country: 'all',
      person: 'all',
      amountMin: '',
      amountMax: '',
      recurring: 'all',
      splitStatus: 'all',
      // @ts-ignore
      transactionIds: []
    });
  }, [onFilterChange, filters]);

  return (
    <div className="w-full p-6">
      <div className={`relative z-50 bg-[#0A0A0A]/60 backdrop-blur-3xl border rounded-2xl p-4 shadow-2xl transition-all duration-500 ${
        isFocusActive ? 'border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border-white/10'
      }`}>
        
        <div className="flex items-center gap-4">
          {/* TOGGLE INTELLIGENCE */}
          <button
            onClick={onToggleIntelligence}
            className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-cyan-400 hover:border-cyan-500/30 transition-all group"
            title="Intelligence Artificielle"
          >
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <div className="relative flex-1 group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
              isFocusActive ? 'text-cyan-400' : 'text-white/20 group-focus-within:text-cyan-400'
            }`} />
            <DebouncedInput
              type="text"
              value={filters.searchTerm}
              onChange={(value) => onFilterChange({ ...filters, searchTerm: value })}
              placeholder={isFocusActive ? "Filtrage intelligent actif..." : "Rechercher un marchand, ville, libellé..."}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
            />
            {isFocusActive && (
               <button 
                 onClick={handleReset}
                 className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-cyan-500/20 text-cyan-400 rounded-md hover:bg-cyan-500/30 transition-colors"
               >
                 <X className="w-3.5 h-3.5" />
               </button>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border font-bold transition-all ${
              isExpanded
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Filter className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            <span className="text-xs uppercase tracking-[0.15em]">Filtres</span>
          </button>

          <div className="flex items-center gap-3 min-w-fit">
            {selectedCount > 0 ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/40 px-2 py-1.5 rounded-xl"
              >
                <span className="px-3 text-xs font-black text-cyan-400 uppercase tracking-tighter">
                  {selectedCount} SÉLECTIONNÉES
                </span>
                <button onClick={onClearSelection} className="p-2 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <>
                <button onClick={onImport} className="bg-white/5 border border-white/10 text-white px-5 py-3.5 rounded-xl font-black hover:bg-white/10 transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <Upload className="w-4 h-4" /> IMPORTER
                </button>
                <button onClick={onAddManual} className="bg-white text-black px-6 py-3.5 rounded-xl font-black hover:bg-cyan-400 hover:scale-[1.02] transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest shadow-lg shadow-white/5">
                  <Plus className="w-4 h-4" /> NOUVEAU
                </button>
              </>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "circOut" }}
              className="overflow-visible"
            >
              <div className="pt-8 mt-6 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-[60]">
                  <FilterSelect
                    label="Catégorie Principale"
                    icon={FolderTree}
                    value={filters.category}
                    options={parentCategories}
                    onChange={(v) => onFilterChange({ ...filters, category: v, subCategory: 'all' })}
                  />
                  <FilterSelect
                    label="Sous-Catégorie"
                    icon={Tags}
                    value={filters.subCategory}
                    options={subCategories}
                    disabled={subCategories.length <= 1}
                    onChange={(v) => onFilterChange({ ...filters, subCategory: v })}
                  />
                  <FilterSelect
                    label="Relation"
                    icon={User}
                    value={filters.person}
                    options={[{ id: 'all', name: 'Tout le monde' }, ...people]}
                    onChange={(v) => onFilterChange({ ...filters, person: v })}
                  />
                  <AmountRangePicker
                    min={filters.amountMin}
                    max={filters.amountMax}
                    onChange={(min, max) => onFilterChange({ ...filters, amountMin: min, amountMax: max })}
                  />
                  <DateRangePicker
                    from={filters.dateFrom}
                    to={filters.dateTo}
                    onChange={(from, to) => onFilterChange({ ...filters, dateFrom: from, dateTo: to })}
                  />
                </div>

                {selectedCount > 0 && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-8 p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex flex-wrap gap-4 items-center justify-between shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg"><Zap className="w-4 h-4 text-cyan-400" /></div>
                      <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Actions groupées</p>
                    </div>
                    <div className="flex flex-wrap gap-2 relative z-[70]">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-white hover:bg-white/10 transition-all outline-none">
                            <Tag className="w-3.5 h-3.5 text-cyan-400" /> Catégoriser <ChevronDown className="w-3 h-3 opacity-30" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1A1A1A] border-white/10 text-white max-h-60 overflow-y-auto min-w-[200px] z-[100]">
                          <DropdownMenuLabel className="text-[10px] text-white/40 uppercase p-3">Catégories</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/5" />
                          {categories.filter(c => !c.parentId).map(c => (
                            <DropdownMenuItem key={c.id} onClick={() => onBulkCategorize?.(c.name)} className="cursor-pointer hover:bg-white/10 py-2.5 px-4">
                              {c.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <button onClick={() => onBulkSetStatus?.('confirmed')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all">
                        <CheckCircle className="w-3.5 h-3.5" /> Valider
                      </button>
                      <button onClick={onBulkDelete} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-white/20">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-[10px] font-medium uppercase tracking-tighter">{transactions.length} Opérations</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleReset} className="px-6 py-2.5 text-[10px] font-black text-red-400 bg-red-500/5 rounded-xl border border-red-500/20 hover:bg-red-500/10 uppercase tracking-[0.2em] transition-all">Reset</button>
                    <button onClick={() => setIsExpanded(false)} className="px-6 py-2.5 text-[10px] font-black text-white/40 bg-white/5 rounded-xl border border-white/10 hover:text-white uppercase tracking-[0.2em] transition-all">Fermer</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}