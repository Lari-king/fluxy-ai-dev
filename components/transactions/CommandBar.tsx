/**
 * ⚡ COMMAND BAR - VERSION ULTRA-OPTIMISÉE 2026
 * 
 * Inspiré du LeftPanel avec :
 * - Glassmorphism & backdrop blur
 * - Séparation visuelle catégories/sous-catégories
 * - Animations fluides
 * - UX optimisée
 * 
 * ⚡ OPTIMISATIONS PERFORMANCE :
 * - Mémoïsation stricte des tableaux d'options
 * - Calcul des compteurs optimisé (une seule boucle)
 * - Suppression des re-renders inutiles
 * - useCallback sur tous les handlers
 * 
 * 🔧 CORRECTIONS APPLIQUÉES :
 * - ✅ Sous-catégories passent NAME au lieu de ID
 * - ✅ Compteurs utilisent clé composite ${parent.name}__${child.name}
 * - ✅ Calcul compteurs compatible ID/Nom avec categoryLookup
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Download, Upload, Plus, X, SlidersHorizontal,
  Calendar, User, Tag, Globe, CheckCircle, Trash2, 
  ChevronDown, FolderTree, Tags, Sparkles, Filter,
  TrendingUp, DollarSign, Zap, AlertCircle
} from 'lucide-react';

// --- TYPES ---
export interface FilterState {
  searchTerm: string;
  category: string;
  subCategory: string;
  type: string;
  country: string;
  person: string;
  amountMin: string;
  amountMax: string;
  dateFrom: string;
  dateTo: string;
  recurring: string;
  splitStatus?: 'all' | 'split' | 'not_split'; // 🆕 Filtre pour opérations divisées
}

interface CommandBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: any[];
  people: any[];
  transactions?: any[];
  selectedCount: number;
  onClearSelection?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onAddManual?: () => void;
  onBulkCategorize?: (category: string) => void;
  onBulkCategorizeSubCategory?: (subCategory: string) => void;
  onBulkAssignPerson?: (personId: string) => void;
  onBulkSetType?: (type: string) => void;
  onBulkSetStatus?: (status: string) => void;
  onBulkDelete?: () => void;
}

// --- COMPOSANT CUSTOM SELECT MODERNE (AVEC COMPTEURS) ---
interface ModernSelectProps {
  label: string;
  icon?: any;
  value: string;
  options: { id: string; name: string; emoji?: string; color?: string; count?: number }[];
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

const ModernSelect = React.memo(function ModernSelect({ 
  label, icon: Icon, value, options, onChange, disabled, placeholder, variant = 'default'
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => 
    options.find(o => o.name === value || o.id === value),
    [options, value]
  );

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [isOpen]);

  const variantStyles = {
    default: 'bg-white/5 border-white/10 hover:bg-white/10 focus:border-cyan-400/50',
    primary: 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 focus:border-cyan-400',
    secondary: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 focus:border-purple-400'
  };

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-wider">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm text-white/90
          border backdrop-blur-xl transition-all duration-200
          ${disabled ? 'opacity-30 cursor-not-allowed' : variantStyles[variant]}
          ${isOpen ? 'shadow-lg shadow-cyan-500/20' : ''}
        `}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.emoji && <span className="text-base">{selectedOption.emoji}</span>}
          {selectedOption?.color && (
            <span 
              className="w-2 h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption ? selectedOption.name : placeholder || 'Choisir...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#0A0A0A]/95 border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden backdrop-blur-2xl"
          >
            <div className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.name); // 🔧 FIX : Passer le NAME pour compatibilité avec les transactions
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center justify-between border-b border-white/5 last:border-none group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {opt.emoji && <span className="text-base flex-shrink-0">{opt.emoji}</span>}
                    {opt.color && (
                      <span 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform" 
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    <span className="truncate">{opt.name}</span>
                  </div>
                  {opt.count !== undefined && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 ml-2 flex-shrink-0">
                      {opt.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// --- COMMAND BAR PRINCIPALE ---
export function CommandBarNew({
  filters,
  onFilterChange,
  categories,
  people,
  transactions = [],
  selectedCount,
  onClearSelection,
  onImport,
  onExport,
  onAddManual,
  onBulkCategorize,
  onBulkCategorizeSubCategory,
  onBulkAssignPerson,
  onBulkSetType,
  onBulkSetStatus,
  onBulkDelete
}: CommandBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // ⚡ PERFORMANCE : Carte d'identité des catégories (ID ↔ NOM)
  const categoryLookup = useMemo(() => {
    const idToName = new Map<string, string>();
    const nameToId = new Map<string, string>();
    
    categories.forEach(cat => {
      idToName.set(cat.id, cat.name);
      nameToId.set(cat.name.toLowerCase(), cat.id);
    });
    
    return { idToName, nameToId };
  }, [categories]);

  // ⚡ PERFORMANCE : Compteurs optimisés (une seule boucle) - 🔧 CORRIGÉ
  const transactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    for (const t of transactions) {
      // 1️⃣ Compteur CATÉGORIE (gérer ID → Nom)
      if (t.category && t.category !== 'Non classifié') {
        const catName = categoryLookup.idToName.get(t.category) || t.category;
        counts[catName] = (counts[catName] || 0) + 1;
      }
      
      // 2️⃣ Compteur SOUS-CATÉGORIE (clé composite avec noms)
      if (t.subCategory && t.category) {
        const catName = categoryLookup.idToName.get(t.category) || t.category;
        const subCatName = categoryLookup.idToName.get(t.subCategory) || t.subCategory;
        
        // ✅ Clé composite : "Alimentation__Restaurants"
        const key = `${catName}__${subCatName}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    
    return counts;
  }, [transactions, categoryLookup]);

  // ⚡ PERFORMANCE : Arbre des catégories stable
  const categoryTree = useMemo(() => {
    const parents = categories.filter(c => !c.parentId);
    const children: Record<string, any[]> = {};
    
    categories.forEach(c => {
      if (c.parentId) {
        if (!children[c.parentId]) children[c.parentId] = [];
        children[c.parentId].push(c);
      }
    });
    
    return { parents, children };
  }, [categories]);

  // ⚡ PERFORMANCE : Options stables avec compteurs
  const parentCategoriesWithCounts = useMemo(() => {
    const all = { id: 'all', name: 'Toutes les catégories', emoji: '📂', count: transactions.length };
    const parentsWithCounts = categoryTree.parents.map(c => ({
      ...c,
      count: transactionCounts[c.name] || 0
    }));
    return [all, ...parentsWithCounts];
  }, [categoryTree.parents, transactionCounts, transactions.length]);

  const availableSubCategories = useMemo(() => {
    if (!filters.category || filters.category === 'all' || filters.category === 'Toutes les catégories') return [];
    const parent = categories.find(c => c.name === filters.category);
    if (!parent) return [];
    const children = categoryTree.children[parent.id] || [];
    
    const childrenWithCounts = children.map(c => ({
      ...c,
      count: transactionCounts[`${parent.name}__${c.name}`] || 0
    }));
    
    return children.length > 0 
      ? [{ id: 'all', name: 'Toutes les sous-cat.', emoji: '🌿' }, ...childrenWithCounts] 
      : [];
  }, [filters.category, categories, categoryTree.children, transactionCounts]);

  const peopleOptions = useMemo(() => 
    [{id: 'all', name: 'Toutes les personnes', emoji: '👥'}, ...people.map(p => ({id: p.id, name: p.name, emoji: '👤'}))],
    [people]
  );

  const activeBadges = useMemo(() => {
    const badges: { id: keyof FilterState; label: string; icon: any; color: string }[] = [];
    
    if (filters.category !== 'all' && filters.category !== 'Toutes les catégories') {
      badges.push({ id: 'category', label: filters.category, icon: FolderTree, color: 'cyan' });
    }
    if (filters.subCategory && filters.subCategory !== 'all' && filters.subCategory !== 'Toutes les sous-cat.') {
      badges.push({ id: 'subCategory', label: filters.subCategory, icon: Tags, color: 'purple' });
    }
    if (filters.person !== 'all' && filters.person !== 'Toutes les personnes') {
      const p = people.find(pers => String(pers.id) === String(filters.person) || pers.name === filters.person);
      badges.push({ id: 'person', label: p?.name || 'Personne', icon: User, color: 'blue' });
    }
    if (filters.amountMin || filters.amountMax) {
      badges.push({ 
        id: 'amountMin', 
        label: `${filters.amountMin || '0'}€ - ${filters.amountMax || '∞'}€`, 
        icon: DollarSign, 
        color: 'green' 
      });
    }
    if (filters.dateFrom || filters.dateTo) {
      badges.push({ id: 'dateFrom', label: 'Période personnalisée', icon: Calendar, color: 'orange' });
    }
    
    return badges;
  }, [filters, people]);

  const handleReset = useCallback(() => {
    onFilterChange({
      searchTerm: '', category: 'all', subCategory: 'all', type: 'all', country: 'all', person: 'all',
      amountMin: '', amountMax: '', dateFrom: '', dateTo: '', recurring: 'all',
    });
  }, [onFilterChange]);

  const removeFilter = useCallback((key: keyof FilterState) => {
    if (key === 'amountMin' || key === 'amountMax') {
      onFilterChange({ ...filters, amountMin: '', amountMax: '' });
    } else if (key === 'dateFrom' || key === 'dateTo') {
      onFilterChange({ ...filters, dateFrom: '', dateTo: '' });
    } else if (key === 'category') {
      onFilterChange({ ...filters, category: 'all', subCategory: 'all' });
    } else {
      onFilterChange({ ...filters, [key]: 'all' });
    }
  }, [filters, onFilterChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30'
  };

  return (
    <div className="sticky top-0 z-30 w-full bg-black/80 backdrop-blur-2xl border-b border-white/10">
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        
        {/* LIGNE PRINCIPALE */}
        <div className="flex items-center gap-4 relative z-10">
          
          {/* RECHERCHE */}
          <div className="relative flex-1 max-w-2xl group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-200 ${isFocused ? 'text-cyan-400 scale-110' : 'text-white/40'}`} />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Rechercher une transaction par description, montant ou catégorie..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 backdrop-blur-xl"
            />
            {filters.searchTerm && (
              <button 
                onClick={() => onFilterChange({...filters, searchTerm: ''})} 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 group/clear"
              >
                <X className="w-4 h-4 text-white/40 group-hover/clear:text-white/70" />
              </button>
            )}
          </div>

          {/* BOUTON FILTRES */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all duration-200 text-sm backdrop-blur-xl
              ${isExpanded || activeBadges.length > 0 
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
              }
            `}
          >
            <Filter className="w-5 h-5" />
            <span>Filtres avancés</span>
            {activeBadges.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="min-w-[24px] h-6 px-2 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center shadow-lg"
              >
                {activeBadges.length}
              </motion.span>
            )}
          </motion.button>

          {/* ACTIONS */}
          <div className="flex items-center gap-3 ml-auto">
            {selectedCount > 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 20 }} 
                animate={{ opacity: 1, scale: 1, x: 0 }} 
                className="flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 px-5 py-3 rounded-xl backdrop-blur-xl shadow-xl"
              >
                <div className="flex items-center gap-3 pr-3 border-r border-white/20">
                  <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Sélection active</span>
                    <span className="text-sm text-white font-semibold">{selectedCount} transaction{selectedCount > 1 ? 's' : ''}</span>
                  </div>
                  <button 
                    onClick={onClearSelection} 
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-all text-white/70 hover:text-white"
                    title="Désélectionner tout"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  
                  {/* CATÉGORIE PRINCIPALE */}
                  <div className="relative group/cat">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2.5 hover:bg-cyan-500/30 rounded-lg text-cyan-400 transition-all backdrop-blur-xl border border-cyan-500/20" 
                      title="Catégorie principale"
                    >
                      <FolderTree className="w-5 h-5" />
                    </motion.button>
                    <div className="absolute top-full right-0 mt-2 hidden group-hover/cat:block bg-[#0A0A0A]/95 border border-white/10 rounded-xl shadow-2xl py-2 min-w-[220px] z-[100] backdrop-blur-2xl">
                      <div className="px-4 py-2 border-b border-white/10">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                          <FolderTree className="w-3 h-3" />
                          Catégorie principale
                        </div>
                      </div>
                      <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        {categoryTree.parents.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => onBulkCategorize?.(c.name)} 
                            className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between group/item"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full group-hover/item:scale-125 transition-transform" style={{ backgroundColor: c.color }} />
                              <span>{c.name}</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                              {transactionCounts[c.name] || 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SOUS-CATÉGORIE - 🔧 CORRIGÉ */}
                  <div className="relative group/sub">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2.5 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-all backdrop-blur-xl border border-purple-500/20" 
                      title="Sous-catégorie"
                    >
                      <Tags className="w-5 h-5" />
                    </motion.button>
                    <div className="absolute top-full right-0 mt-2 hidden group-hover/sub:block bg-[#0A0A0A]/95 border border-white/10 rounded-xl shadow-2xl py-2 min-w-[280px] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 z-[100] backdrop-blur-2xl">
                      <div className="px-4 py-2 border-b border-white/10">
                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-3 h-3" />
                          Sous-catégorie
                        </div>
                      </div>
                      {categoryTree.parents.map(parent => {
                        const children = categoryTree.children[parent.id] || [];
                        if (children.length === 0) return null;
                        
                        return (
                          <div key={parent.id} className="border-t border-white/5 first:border-t-0">
                            <div className="px-4 py-2 bg-white/5 sticky top-0">
                              <div className="text-xs font-semibold text-white/70 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: parent.color }} />
                                {parent.name}
                              </div>
                            </div>
                            {children.map(child => (
                              <button 
                                key={child.id}
                                onClick={() => onBulkCategorizeSubCategory?.(child.name)} 
                                className="w-full text-left pl-8 pr-4 py-3 text-sm text-white/70 hover:bg-purple-500/20 hover:text-white transition-all flex items-center justify-between group/item"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="w-2 h-2 rounded-full bg-purple-400/50 group-hover/item:scale-125 transition-transform" />
                                  <span className="flex-1">{child.name}</span>
                                  <span className="text-[10px] text-white/30">→ {parent.name}</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 ml-2">
                                  {transactionCounts[`${parent.name}__${child.name}`] || 0}
                                </span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PERSONNE */}
                  <div className="relative group/person">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2.5 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-all backdrop-blur-xl border border-blue-500/20"
                    >
                      <User className="w-5 h-5" />
                    </motion.button>
                    <div className="absolute top-full right-0 mt-2 hidden group-hover/person:block bg-[#0A0A0A]/95 border border-white/10 rounded-xl shadow-2xl py-2 min-w-[180px] z-[100] backdrop-blur-2xl">
                      <div className="px-4 py-2 border-b border-white/10">
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Assigner à</div>
                      </div>
                      {people.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => onBulkAssignPerson?.(p.id)} 
                          className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-blue-500/20 hover:text-white transition-all flex items-center gap-3"
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold uppercase text-blue-400 border border-blue-500/30">
                            {p.name[0]}
                          </div>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TYPE */}
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onBulkSetType?.('online')} 
                    className="p-2.5 hover:bg-green-500/30 rounded-lg text-green-400 transition-all backdrop-blur-xl border border-green-500/20" 
                    title="Marquer comme en ligne"
                  >
                    <Globe className="w-5 h-5" />
                  </motion.button>

                  {/* STATUT */}
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onBulkSetStatus?.('completed')} 
                    className="p-2.5 hover:bg-emerald-500/30 rounded-lg text-emerald-400 transition-all backdrop-blur-xl border border-emerald-500/20" 
                    title="Marquer comme réalisé"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </motion.button>

                  {/* SUPPRIMER */}
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onBulkDelete} 
                    className="p-2.5 hover:bg-red-500/30 rounded-lg text-red-400 transition-all ml-2 border-l border-white/20 pl-4 backdrop-blur-xl border border-red-500/20" 
                    title="Supprimer la sélection"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <div className="relative" ref={actionMenuRef}>
                <motion.button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 bg-gradient-to-r from-white to-gray-100 text-black px-6 py-3.5 rounded-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all text-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nouvelle transaction</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showActionMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showActionMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-3 bg-[#0A0A0A]/95 border border-white/10 rounded-xl shadow-2xl py-2 min-w-[260px] z-50 backdrop-blur-2xl"
                    >
                      <button
                        onClick={() => { onAddManual?.(); setShowActionMenu(false); }}
                        className="w-full text-left px-4 py-4 text-sm text-white/90 hover:bg-white/10 transition-all flex items-center gap-4 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all">
                          <Plus className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">Créer une transaction</div>
                          <div className="text-xs text-white/40">Ajouter manuellement</div>
                        </div>
                      </button>

                      <div className="h-px bg-white/10 my-1" />

                      <button
                        onClick={() => { onImport?.(); setShowActionMenu(false); }}
                        className="w-full text-left px-4 py-4 text-sm text-white/90 hover:bg-white/10 transition-all flex items-center gap-4 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all">
                          <Upload className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">Importer CSV</div>
                          <div className="text-xs text-white/40">Depuis votre banque</div>
                        </div>
                      </button>

                      {onExport && (
                        <>
                          <div className="h-px bg-white/10 my-1" />
                          <button
                            onClick={() => { onExport(); setShowActionMenu(false); }}
                            className="w-full text-left px-4 py-4 text-sm text-white/90 hover:bg-white/10 transition-all flex items-center gap-4 group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all">
                              <Download className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white">Exporter CSV</div>
                              <div className="text-xs text-white/40">Télécharger les données</div>
                            </div>
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* BADGES ACTIFS */}
        <AnimatePresence>
          {activeBadges.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10"
            >
              {activeBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-xl
                    text-sm font-medium group transition-all duration-200
                    ${colorMap[badge.color]}
                  `}
                >
                  <badge.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{badge.label}</span>
                  <button 
                    onClick={() => removeFilter(badge.id)} 
                    className="ml-1 p-1 hover:bg-white/20 rounded-lg transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
              <motion.button 
                onClick={handleReset} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-sm text-red-400/80 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/30"
              >
                Tout effacer
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GRILLE FILTRES DÉTAILLÉS */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="overflow-visible"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-6 mt-4 border-t border-white/10">
                
                <ModernSelect 
                  label="Catégorie principale"
                  icon={FolderTree}
                  value={filters.category}
                  options={parentCategoriesWithCounts}
                  onChange={(val) => onFilterChange({...filters, category: val, subCategory: 'all'})}
                  variant="primary"
                />

                <ModernSelect 
                  label="Sous-catégorie"
                  icon={Tags}
                  value={filters.subCategory}
                  options={availableSubCategories}
                  disabled={filters.category === 'all' || filters.category === 'Toutes les catégories' || availableSubCategories.length === 0}
                  placeholder={filters.category === 'all' || filters.category === 'Toutes les catégories' ? 'Choisir une catégorie...' : 'Aucune sous-cat.'}
                  onChange={(val) => onFilterChange({...filters, subCategory: val})}
                  variant="secondary"
                />

                {/* 🆕 FILTRE OPÉRATIONS DIVISÉES */}
                <ModernSelect 
                  label="Opérations divisées"
                  icon={TrendingUp}
                  value={filters.splitStatus || 'all'}
                  options={[
                    { id: 'all', name: 'Toutes', emoji: '📊' },
                    { id: 'split', name: 'Divisées uniquement', emoji: '🔀' },
                    { id: 'not_split', name: 'Non divisées', emoji: '📝' }
                  ]}
                  onChange={(val) => onFilterChange({...filters, splitStatus: val as 'all' | 'split' | 'not_split'})}
                />

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    <DollarSign className="w-3 h-3" />
                    Montant (€)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={filters.amountMin} 
                      onChange={(e) => onFilterChange({...filters, amountMin: e.target.value})} 
                      className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:shadow-lg focus:shadow-emerald-500/10 transition-all backdrop-blur-xl placeholder:text-white/30"
                    />
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={filters.amountMax} 
                      onChange={(e) => onFilterChange({...filters, amountMax: e.target.value})} 
                      className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:shadow-lg focus:shadow-emerald-500/10 transition-all backdrop-blur-xl placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    Période
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={filters.dateFrom} 
                      onChange={(e) => onFilterChange({...filters, dateFrom: e.target.value})} 
                      className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white/90 outline-none focus:border-orange-400/50 focus:bg-white/10 focus:shadow-lg focus:shadow-orange-500/10 transition-all backdrop-blur-xl [color-scheme:dark]"
                    />
                    <input 
                      type="date" 
                      value={filters.dateTo} 
                      onChange={(e) => onFilterChange({...filters, dateTo: e.target.value})} 
                      className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white/90 outline-none focus:border-orange-400/50 focus:bg-white/10 focus:shadow-lg focus:shadow-orange-500/10 transition-all backdrop-blur-xl [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <motion.button 
                  onClick={() => setIsExpanded(false)} 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 text-sm text-white/60 hover:text-white/90 transition-all rounded-xl hover:bg-white/5"
                >
                  Réduire
                </motion.button>
                <motion.button 
                  onClick={handleReset} 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 text-sm bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/30 hover:border-red-500/50"
                >
                  Réinitialiser tout
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
