import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, TrendingUp, Calendar, Flame, BarChart3 } from 'lucide-react';

export function UltraInsightsGuide() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-colors border border-purple-400/30"
        title="Afficher le guide"
      >
        <Info className="w-5 h-5" />
      </button>
    );
  }

  const guideItems = [
    {
      icon: TrendingUp,
      title: "Insights Automatiques",
      text: "Détection des variations majeures. L'IA identifie ce qui sort de l'ordinaire."
    },
    {
      icon: Calendar,
      title: "Analyse Temporelle",
      text: "Évolution de vos dépenses par catégorie sur 12 mois glissants."
    },
    {
      icon: Flame,
      title: "Heatmap des Habitudes",
      text: "Visualisez quels jours du mois concentrent vos sorties d'argent."
    },
    {
      icon: BarChart3,
      title: "Comparaison de Périodes",
      text: "Analyse comparative entre votre historique et vos dépenses récentes."
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="glass-card p-6 border border-purple-500/20 bg-purple-500/5 mb-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Info className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-white font-medium text-lg">Comment utiliser Ultra Insights</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guideItems.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <item.icon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white/80 text-sm font-semibold mb-1">{item.title}</p>
                <p className="text-white/60 text-xs leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-white/40 text-[10px] uppercase tracking-wider">
            🔒 Vos données ne quittent jamais votre appareil
          </p>
          <span className="text-purple-400/60 text-[10px] font-bold">ALGORITHME V2.0</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}