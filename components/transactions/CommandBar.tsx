import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Download, Upload, Plus, X, SlidersHorizontal,
  Calendar, User, Tag, Globe, CheckCircle, Trash2, 
  ChevronDown, Layers 
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
}

interface CommandBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: any[];
  people: any[];
  selectedCount: number;
  onClearSelection?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onAddManual?: () => void;
  onBulkCategorize?: (category: string) => void;
  onBulkAssignPerson?: (personId: string) => void;
  onBulkSetType?: (type: string) => void;
  onBulkSetStatus?: (status: string) => void;
  onBulkDelete?: () => void;
}

// --- COMPOSANT SELECT PERSONNALISÉ ---
interface CustomDropdownProps {
  label: string;
  value: string;
  options: { id: string; name: string; emoji?: string }[];
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function CustomDropdown({ label, value, options, onChange, disabled, placeholder }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.name === value || o.id === value);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 outline-none transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 focus:border-cyan-500/50'}`}
      >
        <span className="truncate">
          {selectedOption ? `${selectedOption.emoji ? selectedOption.emoji + ' ' : ''}${selectedOption.name}` : placeholder || 'Choisir...'}
        </span>
        <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#0A0A0A] border border-white/10 rounded-lg shadow-2xl z-[60] overflow-hidden"
          >
            <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.name || opt.id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 border-b border-white/5 last:border-none"
                >
                  {opt.emoji && <span>{opt.emoji}</span>}
                  <span className="truncate">{opt.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMMAND BAR PRINCIPALE ---
export function CommandBarNew({
  filters,
  onFilterChange,
  categories,
  people,
  selectedCount,
  onClearSelection,
  onImport,
  onExport,
  onAddManual,
  onBulkCategorize,
  onBulkAssignPerson,
  onBulkSetType,
  onBulkSetStatus,
  onBulkDelete
}: CommandBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // 1. Logique des catégories Parent / Enfant
  const parentCategories = useMemo(() => {
    const list = categories.filter(c => !c.parentId);
    return [{ id: 'all', name: 'Toutes', emoji: '📂' }, ...list];
  }, [categories]);

  const availableSubCategories = useMemo(() => {
    if (!filters.category || filters.category === 'all') return [];
    const parent = categories.find(c => c.name === filters.category);
    if (!parent) return [];
    const children = categories.filter(c => c.parentId === parent.id);
    return children.length > 0 ? [{ id: 'all', name: 'Toutes les sous-cat.', emoji: '🌿' }, ...children] : [];
  }, [filters.category, categories]);

  // 2. Gestion des badges actifs
  const activeBadges = useMemo(() => {
    const badges: { id: keyof FilterState; label: string; icon: any }[] = [];
    if (filters.category !== 'all') badges.push({ id: 'category', label: filters.category, icon: Tag });
    if (filters.subCategory && filters.subCategory !== 'all') badges.push({ id: 'subCategory', label: filters.subCategory, icon: Layers });
    if (filters.person !== 'all') {
      const p = people.find(pers => String(pers.id) === String(filters.person) || pers.name === filters.person);
      badges.push({ id: 'person', label: p?.name || 'Personne', icon: User });
    }
    if (filters.amountMin || filters.amountMax) badges.push({ id: 'amountMin', label: `${filters.amountMin || 0}€ - ${filters.amountMax || '∞'}€`, icon: SlidersHorizontal });
    if (filters.dateFrom || filters.dateTo) badges.push({ id: 'dateFrom', label: 'Période', icon: Calendar });
    return badges;
  }, [filters, people]);

  const handleReset = () => {
    onFilterChange({
      searchTerm: '', category: 'all', subCategory: 'all', type: 'all', country: 'all', person: 'all',
      amountMin: '', amountMax: '', dateFrom: '', dateTo: '', recurring: 'all',
    });
  };

  const removeFilter = (key: keyof FilterState) => {
    if (key === 'amountMin' || key === 'amountMax') onFilterChange({ ...filters, amountMin: '', amountMax: '' });
    else if (key === 'dateFrom' || key === 'dateTo') onFilterChange({ ...filters, dateFrom: '', dateTo: '' });
    else if (key === 'category') onFilterChange({ ...filters, category: 'all', subCategory: 'all' });
    else onFilterChange({ ...filters, [key]: 'all' });
  };

  // Fermeture menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-30 w-full bg-black/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        
        {/* LIGNE RECHERCHE ET BOUTONS ACTIONS */}
        <div className="flex items-center gap-3">
          
          {/* RECHERCHE */}
          <div className="relative flex-1 max-w-xl group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isFocused ? 'text-cyan-400' : 'text-white/40'}`} />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Rechercher une transaction..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-12 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
            />
            {filters.searchTerm && (
              <button onClick={() => onFilterChange({...filters, searchTerm: ''})} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors">
                <X className="w-3 h-3 text-white/40 hover:text-white/60" />
              </button>
            )}
          </div>

          {/* BOUTON TOGGLE FILTRES */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-sm font-medium ${
              isExpanded || activeBadges.length > 0 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtres</span>
            {activeBadges.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeBadges.length}
              </span>
            )}
          </button>

          {/* ACTIONS (SÉLECTION OU NOUVEAU) */}
          <div className="flex items-center gap-2 ml-auto">
            {selectedCount > 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 pr-2 border-r border-cyan-500/20">
                  <span className="text-xs font-bold text-cyan-400">{selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''}</span>
                  <button onClick={onClearSelection} className="p-1 hover:bg-cyan-500/20 rounded transition-colors text-cyan-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {/* Actions de masse avec Dropdowns au survol */}
                  <div className="relative group">
                    <button className="p-2 hover:bg-cyan-500/20 rounded-lg text-cyan-400 transition-colors"><Tag className="w-4 h-4" /></button>
                    <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-black border border-white/10 rounded-lg shadow-2xl py-2 min-w-[180px] z-50">
                      <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
                        {categories.map(c => (
                          <button key={c.id} onClick={() => onBulkCategorize?.(c.name)} className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                            <span>{c.emoji}</span> {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <button className="p-2 hover:bg-cyan-500/20 rounded-lg text-cyan-400 transition-colors"><User className="w-4 h-4" /></button>
                    <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-black border border-white/10 rounded-lg shadow-2xl py-2 min-w-[150px] z-50">
                      {people.map(p => (
                        <button key={p.id} onClick={() => onBulkAssignPerson?.(p.id)} className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold uppercase text-cyan-400">{p.name[0]}</div>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => onBulkSetType?.('online')} className="p-2 hover:bg-cyan-500/20 rounded-lg text-cyan-400" title="En ligne"><Globe className="w-4 h-4" /></button>
                  <button onClick={() => onBulkSetStatus?.('completed')} className="p-2 hover:bg-cyan-500/20 rounded-lg text-cyan-400" title="Valider"><CheckCircle className="w-4 h-4" /></button>
                  <button onClick={onBulkDelete} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 ml-1 border-l border-white/10 pl-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              </motion.div>
            ) : (
              <div className="relative" ref={actionMenuRef}>
                <button onClick={() => setShowActionMenu(!showActionMenu)} className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all font-medium text-sm">
                  <Plus className="w-4 h-4" /> Nouvelle <ChevronDown className={`w-3 h-3 transition-transform ${showActionMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showActionMenu && (
                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute top-full right-0 mt-2 bg-black border border-white/10 rounded-lg shadow-2xl py-2 min-w-[220px] z-50">
                      <button onClick={() => { onAddManual?.(); setShowActionMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition-colors flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500/20"><Plus className="w-4 h-4 text-cyan-400" /></div>
                        <div><div className="font-medium">Créer une transaction</div><div className="text-xs text-white/40">Ajouter manuellement</div></div>
                      </button>
                      <div className="h-px bg-white/10 my-1" />
                      <button onClick={() => { onImport?.(); setShowActionMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition-colors flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/20"><Upload className="w-4 h-4 text-purple-400" /></div>
                        <div><div className="font-medium">Importer CSV</div><div className="text-xs text-white/40">Fichier bancaire</div></div>
                      </button>
                      {onExport && (
                        <button onClick={() => { onExport(); setShowActionMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition-colors flex items-center gap-3 group border-t border-white/5">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/20"><Download className="w-4 h-4 text-orange-400" /></div>
                          <div><div className="font-medium">Exporter</div><div className="text-xs text-white/40">Télécharger les données</div></div>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* BADGES ACTIFS (VISIBLE SEULEMENT SI FILTRES PRÉSENTS) */}
        <AnimatePresence>
          {activeBadges.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
              {activeBadges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 group hover:border-cyan-500/30 transition-all">
                  <badge.icon className="w-3 h-3 text-cyan-400" />
                  <span>{badge.label}</span>
                  <button onClick={() => removeFilter(badge.id)} className="ml-1 text-white/30 group-hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <button onClick={handleReset} className="text-xs text-red-400/60 hover:text-red-400 px-3 py-1.5 transition-colors font-medium">Effacer tout</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GRILLE DE FILTRES DÉTAILLÉS */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-visible">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 mt-3 border-t border-white/5">
                
                <CustomDropdown 
                  label="Catégorie"
                  value={filters.category}
                  options={parentCategories}
                  onChange={(val) => onFilterChange({...filters, category: val, subCategory: 'all'})}
                />

                <CustomDropdown 
                  label="Sous-Catégorie"
                  value={filters.subCategory}
                  options={availableSubCategories}
                  disabled={filters.category === 'all' || availableSubCategories.length === 0}
                  placeholder={filters.category === 'all' ? 'Choisir catégorie...' : 'Aucune sous-cat.'}
                  onChange={(val) => onFilterChange({...filters, subCategory: val})}
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Montant (€)</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" value={filters.amountMin} onChange={(e) => onFilterChange({...filters, amountMin: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 outline-none focus:border-cyan-500/50" />
                    <input type="number" placeholder="Max" value={filters.amountMax} onChange={(e) => onFilterChange({...filters, amountMax: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 outline-none focus:border-cyan-500/50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Période</label>
                  <div className="flex gap-2">
                    <input type="date" value={filters.dateFrom} onChange={(e) => onFilterChange({...filters, dateFrom: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white/90 outline-none focus:border-cyan-500/50 [color-scheme:dark]" />
                    <input type="date" value={filters.dateTo} onChange={(e) => onFilterChange({...filters, dateTo: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white/90 outline-none focus:border-cyan-500/50 [color-scheme:dark]" />
                  </div>
                </div>

                <CustomDropdown 
                  label="Personne"
                  value={filters.person}
                  options={[{id: 'all', name: 'Tous'}, ...people.map(p => ({id: p.id, name: p.name}))]}
                  onChange={(val) => onFilterChange({...filters, person: val})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setIsExpanded(false)} className="px-4 py-2 text-xs text-white/40 hover:text-white/60 transition-colors font-medium">Réduire</button>
                <button onClick={handleReset} className="px-4 py-2 text-xs bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-medium border border-red-500/20">Réinitialiser</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}