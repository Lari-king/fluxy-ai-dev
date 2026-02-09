import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { UltraInsightsActivation } from '@/components/insights/UltraInsightsActivation';
import { TimelineEvolution } from '@/components/insights/TimelineEvolution';
import { HabitsHeatmap } from '@/components/insights/HabitsHeatmap';
import { InsightCard } from '@/components/insights/InsightCard';
import { PeriodComparison } from '@/components/insights/PeriodComparison';
import { EmptyStateUltraInsights } from '@/components/insights/EmptyStateUltraInsights';
import { UltraInsightsGuide } from '@/components/insights/UltraInsightsGuide';
import { detectAllCategoryChanges, getTopChanges, type MonthlyAmount } from '@/utils/insights/change-detection';
import { buildAllHeatmaps, analyzeConcentrationPatterns } from '@/utils/insights/heatmap-builder';
import { generateAllInsights } from '@/utils/insights/insights-generator';
import { comparePeriods, calculatePeriodStats } from '@/utils/insights/period-comparator';

interface UltraInsightsProps {
  onBack: () => void;
}

export function UltraInsights({ onBack }: UltraInsightsProps) {
  const { transactions, categories } = useData();
  const [isActivated, setIsActivated] = useState(false);
  const [selectedHeatmapCategory, setSelectedHeatmapCategory] = useState<string>();

  // Calculer les stats pour l'empty state
  const stats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { transactionCount: 0, monthsCovered: 0 };
    }

    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const monthsCovered = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24 * 30));

    return {
      transactionCount: transactions.length,
      monthsCovered,
    };
  }, [transactions]);

  const hasEnoughData = stats.transactionCount >= 10 && stats.monthsCovered >= 4;

  // Préparer les données mensuelles pour le graphique
  const monthlyData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Grouper par mois et catégorie
    const monthlyMap = new Map<string, Map<string, number>>();

    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, new Map());
      }

      const categoryMap = monthlyMap.get(monthKey)!;
      const currentAmount = categoryMap.get(txn.category) || 0;
      categoryMap.set(txn.category, currentAmount + Math.abs(txn.amount));
    });

    // Convertir en tableau et trier par mois
    const months = Array.from(monthlyMap.keys()).sort();
    
    // Prendre les 12 derniers mois
    const last12Months = months.slice(-12);

    const result = last12Months.map(month => {
      const categoryMap = monthlyMap.get(month)!;
      const monthData: any = { month };

      categories.forEach(cat => {
        monthData[cat.id] = categoryMap.get(cat.id) || 0;
      });

      return monthData;
    });

    // Debug: afficher les données dans la console
    console.log('📊 Ultra Insights - Données du graphique:', {
      totalTransactions: transactions.length,
      monthsCovered: months.length,
      last12Months: last12Months.length,
      sampleData: result[0],
      categories: categories.map(c => c.id),
    });

    return result;
  }, [transactions, categories]);

  // Détecter les changements
  const changes = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Préparer les données pour l'analyse
    const monthlyAmounts: MonthlyAmount[] = [];

    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const category = categories.find(c => c.id === txn.category);
      
      monthlyAmounts.push({
        month: monthKey,
        amount: Math.abs(txn.amount),
        category: category?.name || 'Non catégorisé',
      });
    });

    // Détecter les changements
    const changesByCategory = detectAllCategoryChanges(monthlyAmounts);
    return getTopChanges(changesByCategory, 10);
  }, [transactions, categories]);

  // Construire les heatmaps
  const heatmaps = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    return buildAllHeatmaps(
      transactions,
      categories.map(cat => ({ id: cat.id, name: cat.name }))
    );
  }, [transactions, categories]);

  // Analyser les patterns de concentration
  const concentrationPatterns = useMemo(() => {
    if (heatmaps.length === 0) return [];
    return analyzeConcentrationPatterns(heatmaps);
  }, [heatmaps]);

  // Générer les insights automatiques
  const insights = useMemo(() => {
    return generateAllInsights(changes, concentrationPatterns);
  }, [changes, concentrationPatterns]);

  // Préparer les catégories pour le graphique
  const categoryColors = useMemo(() => {
    const colors = [
      '#9333ea', '#ec4899', '#f59e0b', '#10b981', '#06b6d4',
      '#6366f1', '#f97316', '#14b8a6', '#a855f7', '#fb923c',
    ];

    return categories.slice(0, 10).map((cat, idx) => ({
      id: cat.id,
      name: cat.name,
      color: colors[idx % colors.length],
    }));
  }, [categories]);

  // Gérer l'activation
  const handleActivate = () => {
    setIsActivated(true);
  };

  const handleCancel = () => {
    onBack();
  };

  return (
    <div className="min-h-screen relative overflow-y-auto">
      {/* Animation d'activation */}
      <AnimatePresence>
        {!isActivated && (
          <UltraInsightsActivation onActivate={handleActivate} onCancel={handleCancel} />
        )}
      </AnimatePresence>

      {/* Contenu principal (visible après activation) */}
      {isActivated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative min-h-screen pb-20"
          style={{
            background: 'radial-gradient(circle at top right, rgba(147, 51, 234, 0.15) 0%, transparent 50%), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.1) 0%, transparent 50%), #0a0a0a',
          }}
        >
          {/* Particules de fond RÉDUITES (5 au lieu de 20) */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-purple-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: 'linear',
                }}
              />
            ))}
          </div>

          {/* Header */}
          <div className="relative z-10 p-6 border-b border-white/10 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <h1 className="text-2xl bg-gradient-to-r from-purple-400 via-purple-200 to-purple-400 bg-clip-text text-transparent">
                      Ultra Insights
                    </h1>
                  </div>
                  <p className="text-white/60 text-sm mt-1">
                    Analyse avancée de vos patterns financiers
                  </p>
                </div>
              </div>

              <div className="text-xs text-white/40">
                {transactions?.length || 0} transactions • {categories?.length || 0} catégories
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
            {/* Guide d'utilisation */}
            <UltraInsightsGuide />

            {/* Insights automatiques */}
            <section>
              <h2 className="text-lg text-white/90 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"></span>
                Insights Automatiques
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.slice(0, 6).map((insight, idx) => (
                  <InsightCard key={insight.id} insight={insight} index={idx} />
                ))}
              </div>
            </section>

            {/* Timeline d'évolution */}
            <section>
              <h2 className="text-lg text-white/90 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"></span>
                Analyse Temporelle
              </h2>
              <TimelineEvolution
                data={monthlyData}
                categories={categoryColors}
                changes={changes}
              />
            </section>

            {/* Heatmap des habitudes */}
            <section>
              <h2 className="text-lg text-white/90 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"></span>
                Habitudes de Dépense
              </h2>
              <HabitsHeatmap
                heatmaps={heatmaps}
                selectedCategory={selectedHeatmapCategory}
                onCategorySelect={setSelectedHeatmapCategory}
              />
            </section>

            {/* Comparaison de périodes */}
            <section>
              <h2 className="text-lg text-white/90 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"></span>
                Comparaison de Périodes
              </h2>
              <PeriodComparison
                transactions={transactions}
                categories={categories}
              />
            </section>

            {/* Footer info */}
            <div className="text-center text-white/40 text-xs py-8">
              Toutes les analyses sont calculées localement sur votre appareil
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}