import { useMemo } from 'react'; // ✅ Correction : Ajout de l'import manquant
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';

// Import des sous-composants
import { TimelineEvolution } from '../charts/TimelineEvolution';
import { HabitsHeatmap } from '../charts/HabitsHeatmap';
import { PeriodComparison } from '../charts/PeriodComparison';
import { InsightCard } from '../cards/InsightCard';
import { UltraInsightsGuide } from './UltraInsightsGuide';

// Import du Cerveau et des Types
import { useUltraIntelligence } from '../../hooks/useUltraIntelligence';
import { GeneratedInsight } from '../../types';

interface UltraInsightsViewProps {
  onBack: () => void;
}

export function UltraInsightsView({ onBack }: UltraInsightsViewProps) {
  const { 
    insights, 
    behavioralAlerts, 
    analysis, 
    heatmaps, 
    selectedHeatmapCategory, 
    setSelectedHeatmapCategory,
    categories,
    transactions,
    stats
  } = useUltraIntelligence();

  // 1. All Insights avec Type Guard et Type de retour explicite
  const allInsights = useMemo((): GeneratedInsight[] => {
    const base = (insights || []) as GeneratedInsight[];
    
    const behavioral = (behavioralAlerts || [])
      .filter((alert): alert is NonNullable<typeof alert> => alert !== null)
      .map((alert) => ({
        id: `alert-${alert.transaction.id}`,
        type: 'anomaly' as const,
        severity: alert.severity === 'high' ? 'critical' as const : 'warning' as const,
        title: alert.behaviorTag.toUpperCase(),
        description: alert.reason,
        recommendation: `Cette dépense en ${alert.transaction.category} sort de vos habitudes.`,
        data: alert.transaction
      }));

    return [...base, ...behavioral];
  }, [insights, behavioralAlerts]);

  // 2. Transformation pour la Heatmap
  const formattedHeatmaps = useMemo(() => {
    return heatmaps.map(h => ({
      categoryId: h.categoryId,
      categoryName: h.categoryName,
      totalAmount: h.total,
      avgPerDay: h.total / 31,
      cells: (h.data || Array(31).fill(0)).map((amount: number, index: number) => ({
        day: index + 1,
        amount: amount,
        transactionCount: 0
      }))
    }));
  }, [heatmaps]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen pb-20"
      style={{
        background: 'radial-gradient(circle at top right, rgba(147, 51, 234, 0.12) 0%, transparent 40%), #0a0a0a',
      }}
    >
      {/* Header Bar */}
      <div className="sticky top-0 z-30 p-6 border-b border-white/5 backdrop-blur-xl bg-black/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h1 className="text-xl font-bold text-white tracking-tight">Ultra Intelligence</h1>
              </div>
              <p className="text-white/40 text-xs mt-0.5 font-medium uppercase tracking-widest">
                Système d'analyse prédictive
              </p>
            </div>
          </div>
          <div className="hidden md:block px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-white/40 font-mono">
              DATA_SET: {stats?.transactionCount || 0} TXNS | {stats?.monthsCovered || 0} MONTHS
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-12">
        <UltraInsightsGuide />

        <section>
          <SectionHeader title="Analyses Clés" subtitle="Générées par le moteur d'intelligence" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allInsights.slice(0, 6).map((insight: GeneratedInsight, idx: number) => (
              // ✅ Correction : Types explicites pour insight et idx
              <InsightCard key={insight.id} insight={insight as any} index={idx} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8">
          <div>
            <SectionHeader title="Flux Temporel" subtitle="Évolution catégorisée sur 12 mois" />
            <div className="glass-card p-6">
              <TimelineEvolution 
                data={analysis?.monthlyData || []} 
                categories={categories} 
                changes={(analysis as any)?.changes || []}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <SectionHeader title="Patterns d'Habitudes" subtitle="Densité des dépenses par jour" />
            <HabitsHeatmap
              heatmaps={formattedHeatmaps as any}
              selectedCategory={selectedHeatmapCategory}
              onCategorySelect={setSelectedHeatmapCategory}
            />
          </section>

          <section>
            <SectionHeader title="Écarts de Périodes" subtitle="Comparatif dynamique N vs N-1" />
            <div className="glass-card p-6 h-full">
               <PeriodComparison transactions={transactions} categories={categories} />
            </div>
          </section>
        </div>

        <footer className="text-center pt-12">
          <p className="text-white/20 text-[10px] font-mono uppercase tracking-[0.2em]">
            End of Intelligence Report • Private Local Analysis
          </p>
        </footer>
      </main>
    </motion.div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
        {title}
      </h2>
      <p className="text-white/40 text-sm ml-3.5">{subtitle}</p>
    </div>
  );
}