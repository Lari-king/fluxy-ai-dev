/**
 * ⚡ MASS ACTION MENU
 * Menu dropdown pour actions en masse sur catégories
 */

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trash2, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MassActionMenuProps {
  selectedCount: number;
  transactionCount: number;
  onReassign: () => void;
  onDelete: () => void;
}

export function MassActionMenu({ 
  selectedCount, 
  transactionCount, 
  onReassign, 
  onDelete 
}: MassActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/90 rounded-lg px-3 py-2 text-sm font-medium transition-all"
        title="Actions en masse"
      >
        <MoreVertical className="w-4 h-4" />
        Actions ({selectedCount})
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/10 bg-white/5">
              <div className="text-xs font-medium text-white/90">Actions en masse</div>
              <div className="text-[10px] text-white/40 mt-0.5">
                {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''} • {transactionCount} transaction{transactionCount > 1 ? 's' : ''}
              </div>
            </div>

            {/* Actions */}
            <div className="p-1">
              <button
                onClick={() => {
                  onReassign();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-all text-left group"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 group-hover:bg-purple-500/20 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white/90">Réassigner</div>
                  <div className="text-[10px] text-white/40">
                    Déplacer {transactionCount} transaction{transactionCount > 1 ? 's' : ''}
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onDelete();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all text-left group"
              >
                <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 group-hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white/90">Supprimer</div>
                  <div className="text-[10px] text-white/40">
                    Supprimer {selectedCount} catégorie{selectedCount > 1 ? 's' : ''}
                  </div>
                </div>
              </button>
            </div>

            {/* Footer warning */}
            <div className="p-2 border-t border-white/10 bg-orange-500/5">
              <div className="text-[10px] text-orange-400 leading-relaxed">
                ⚠️ Les catégories contenant des transactions ne peuvent être supprimées directement
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
