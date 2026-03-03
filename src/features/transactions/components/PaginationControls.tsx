/**
 * 📄 PAGINATION CONTROLS
 * Composant UI pur pour la pagination
 */

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calculator } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  totalAmount?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export function PaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  totalAmount = 0
}: PaginationControlsProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Info Gauche */}
      <div className="flex items-center gap-6">
        <div className="text-sm text-white/60">
          Affichage de <span className="text-white/90 font-medium">{startItem}-{endItem}</span>
          {' '}sur{' '}
          <span className="text-white/90 font-medium">{totalItems}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 uppercase tracking-wider font-medium">
            Par page :
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/90 hover:border-cyan-500/50 hover:bg-white/10 focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
          >
            {[10, 25, 50, 100, 250].map(size => (
              <option key={size} value={size} className="bg-black">
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Centre */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-white/10 hover:bg-white/5 hover:border-cyan-500/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/10 transition-all text-white/90"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-white/10 hover:bg-white/5 hover:border-cyan-500/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/10 transition-all text-white/90"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 px-4 text-sm font-medium">
          <span className="text-white/90">{currentPage}</span>
          <span className="text-white/30">/</span>
          <span className="text-white/60">{totalPages || 1}</span>
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg border border-white/10 hover:bg-white/5 hover:border-cyan-500/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/10 transition-all text-white/90"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg border border-white/10 hover:bg-white/5 hover:border-cyan-500/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/10 transition-all text-white/90"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Montant Total Droite */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">
            Total période
          </span>
          <span
            className={`text-sm font-mono font-bold ${
              totalAmount >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(totalAmount)}
          </span>
        </div>
        <div
          className={`p-2 rounded-lg ${
            totalAmount >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}
        >
          <Calculator
            className={`w-4 h-4 ${
              totalAmount >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
