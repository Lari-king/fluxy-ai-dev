import React from 'react';
import { motion } from 'framer-motion';
import type { CategoryHeatmap } from '@/utils/insights/heatmap-builder';

interface HabitsHeatmapProps {
  heatmaps: CategoryHeatmap[];
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
}

export function HabitsHeatmap({ heatmaps, selectedCategory, onCategorySelect }: HabitsHeatmapProps) {
  const displayHeatmap = selectedCategory
    ? heatmaps.find(h => h.categoryId === selectedCategory)
    : heatmaps[0];

  if (!displayHeatmap) {
    return (
      <div className="glass-card p-6">
        <p className="text-white/60">Aucune donnée disponible pour la heatmap.</p>
      </div>
    );
  }

  const maxAmount = Math.max(...displayHeatmap.cells.map(c => c.amount));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="mb-6">
        <h3 className="text-xl mb-2 text-white">
          🔥 Carte Thermique des Habitudes
        </h3>
        <p className="text-white/60 text-sm mb-4">
          Visualisation de la concentration de vos dépenses par jour du mois.
        </p>

        {/* Sélecteur de catégorie */}
        <div className="flex gap-2 flex-wrap">
          {heatmaps.slice(0, 8).map((heatmap, idx) => (
            <button
              key={heatmap.categoryId}
              onClick={() => onCategorySelect?.(heatmap.categoryId)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                displayHeatmap.categoryId === heatmap.categoryId
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {heatmap.categoryName}
            </button>
          ))}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-white/60 mb-1">Total</div>
          <div className="text-lg text-white">{Math.round(displayHeatmap.totalAmount)}€</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-white/60 mb-1">Moy./jour</div>
          <div className="text-lg text-white">{Math.round(displayHeatmap.avgPerDay)}€</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-white/60 mb-1">Jour max</div>
          <div className="text-lg text-white">
            {displayHeatmap.cells.reduce((max, cell) => cell.amount > max.amount ? cell : max).day}
          </div>
        </div>
      </div>

      {/* Grille thermique */}
      <div className="space-y-2">
        <div className="grid grid-cols-[60px_1fr] gap-4">
          <div></div>
          <div className="grid grid-cols-31 gap-1">
            {Array.from({ length: 31 }, (_, i) => (
              <div key={i} className="text-[10px] text-white/40 text-center">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[60px_1fr] gap-4">
          <div className="flex items-center text-sm text-white/80">
            {displayHeatmap.categoryName}
          </div>
          <div className="grid grid-cols-31 gap-1">
            {displayHeatmap.cells.map((cell) => {
              const intensity = maxAmount > 0 ? cell.amount / maxAmount : 0;
              return (
                <motion.div
                  key={cell.day}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: cell.day * 0.01 }}
                  className="aspect-square rounded relative group cursor-pointer"
                  style={{
                    backgroundColor: intensity === 0
                      ? 'rgba(255, 255, 255, 0.05)'
                      : `rgba(147, 51, 234, ${0.2 + intensity * 0.8})`,
                  }}
                  title={`Jour ${cell.day}: ${Math.round(cell.amount)}€ (${cell.transactionCount} transactions)`}
                >
                  {/* Tooltip au hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-black/90 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                      {Math.round(cell.amount)}€
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Légende de couleur */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">Intensité des dépenses</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Faible</span>
            <div className="flex gap-1">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity, idx) => (
                <div
                  key={idx}
                  className="w-6 h-4 rounded"
                  style={{ backgroundColor: `rgba(147, 51, 234, ${opacity})` }}
                />
              ))}
            </div>
            <span className="text-xs text-white/60">Élevée</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
