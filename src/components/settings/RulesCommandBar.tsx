/**
 * 🎛️ RULES COMMAND BAR - VERSION 2026
 * 
 * Design harmonisé avec CommandBar.tsx :
 * - Recherche optimisée
 * - Filtres intelligents
 * - Actions rapides
 */

import { useMemo, useCallback } from 'react';
import { Search, Plus, Download, Upload, X } from 'lucide-react';

interface RulesCommandBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNewRule: () => void;
  activeFilter: 'all' | 'enabled' | 'disabled';
  onFilterChange: (filter: 'all' | 'enabled' | 'disabled') => void;
  totalRules: number;
  enabledRules: number;
}

export function RulesCommandBar({
  searchTerm,
  onSearchChange,
  onNewRule,
  activeFilter,
  onFilterChange,
  totalRules,
  enabledRules,
}: RulesCommandBarProps) {
  
  const disabledRules = useMemo(() => totalRules - enabledRules, [totalRules, enabledRules]);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        
        {/* Ligne principale */}
        <div className="flex items-center gap-3">
          
          {/* Recherche */}
          <div className="relative flex-1 max-w-md group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              searchTerm ? 'text-cyan-400' : 'text-white/40'
            }`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher une règle..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
            />
            {searchTerm && (
              <button 
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-3 h-3 text-white/40 hover:text-white/60" />
              </button>
            )}
          </div>

          {/* Filtres rapides */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFilterChange('all')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              Toutes
              <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                activeFilter === 'all' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-white/60'
              }`}>
                {totalRules}
              </span>
            </button>
            
            <button
              onClick={() => onFilterChange('enabled')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'enabled'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              Actives
              <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                activeFilter === 'enabled' ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'
              }`}>
                {enabledRules}
              </span>
            </button>
            
            <button
              onClick={() => onFilterChange('disabled')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'disabled'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              Désactivées
              <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                activeFilter === 'disabled' ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60'
              }`}>
                {disabledRules}
              </span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onNewRule}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all shadow-lg shadow-cyan-500/25"
            >
              <Plus className="w-4 h-4" />
              Nouvelle règle
            </button>
          </div>
        </div>

        {/* Stats en dessous si recherche active */}
        {searchTerm && (
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
            <span>{totalRules} règle{totalRules > 1 ? 's' : ''} au total</span>
            <span>{enabledRules} active{enabledRules > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}