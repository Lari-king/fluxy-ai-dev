import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, TrendingUp, Calendar, Flame, BarChart3 } from 'lucide-react';

export function UltraInsightsGuide() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-colors"
        title="Afficher le guide"
      >
        <Info className="w-5 h-5" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-400" />
            <h3 className="text-white">Comment utiliser Ultra Insights</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/80 text-sm mb-1">
                <strong>Insights Automatiques</strong>
              </p>
              <p className="text-white/60 text-xs">
                Détection automatique des hausses/baisses importantes de dépenses. Survolez pour plus de détails.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/80 text-sm mb-1">
                <strong>Analyse Temporelle</strong>
              </p>
              <p className="text-white/60 text-xs">
                Graphique empilé montrant l'évolution de vos dépenses par catégorie sur 12 mois. Survolez pour voir les montants détaillés.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Flame className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/80 text-sm mb-1">
                <strong>Heatmap des Habitudes</strong>
              </p>
              <p className="text-white/60 text-xs">
                Carte thermique montrant vos dépenses par jour du mois. Plus c'est violet, plus vous avez dépensé ce jour-là. Cliquez sur une catégorie pour changer la vue.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <BarChart3 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/80 text-sm mb-1">
                <strong>Comparaison de Périodes</strong>
              </p>
              <p className="text-white/60 text-xs">
                Compare vos dépenses avant et après les 6 derniers mois pour identifier les évolutions.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/40 text-xs">
            💡 <strong>Astuce :</strong> Faites défiler la page pour voir toutes les analyses. Toutes les données restent sur votre appareil.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
