/**
 * 🎨 FILTER SELECT - VERSION CORRIGÉE
 * Gère la dualité ID/Nom pour assurer la visibilité des sélections
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface FilterSelectProps {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  value: string;
  options: Array<{ id: string; name: string; count?: number; color?: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const FilterSelect = React.memo<FilterSelectProps>(({
  label,
  icon: Icon,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Choisir...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ✅ CORRECTION : Identification robuste de l'option sélectionnée
  // On cherche par ID d'abord, puis par Nom si l'ID ne matche pas
  const selectedOption = useMemo(() => {
    if (!value || value === 'all') return options.find(opt => opt.id === 'all');
    return options.find(opt => opt.id === value || opt.name === value);
  }, [options, value]);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm 
          transition-all backdrop-blur-xl
          ${isOpen 
            ? 'border-cyan-500/50 bg-white/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
            : 'border-white/10 bg-white/5 text-white/90'
          }
          ${disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'}
        `}
      >
        <span className="truncate font-medium">
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-white/20 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[220px] z-[999] 
                       bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] 
                       overflow-hidden backdrop-blur-3xl"
          >
            <div className="max-h-[280px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {options.map((opt) => {
                // ✅ CORRECTION : Comparaison intelligente pour le style "actif"
                const isActive = value === opt.id || (value !== 'all' && value === opt.name);
                
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm
                      transition-all group
                      ${isActive
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-white/50 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {opt.color && (
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: opt.color }} 
                        />
                      )}
                      <span className="truncate">{opt.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {opt.count !== undefined && (
                        <span className={`text-[10px] font-mono ${isActive ? 'text-cyan-400/60' : 'opacity-30'}`}>
                          {opt.count}
                        </span>
                      )}
                      {isActive && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

FilterSelect.displayName = 'FilterSelect';