import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { runIntelligenceEngine } from '../services/engine';
import { calculateBudgetResilience, analyzeBehavior } from '@/features/predictions/logic/BehavioralAnalyzer';

export function useUltraIntelligence() {
  const { transactions, categories } = useData();
  const [isActivated, setIsActivated] = useState(false);
  const [selectedHeatmapCategory, setSelectedHeatmapCategory] = useState<string>();

  // 1. Moteur d'intelligence principal (Analyses temporelles et tendances)
  const engineResult = useMemo(() => {
    if (!transactions.length || !categories.length) return null;
    return runIntelligenceEngine(transactions, categories);
  }, [transactions, categories]);

  // 2. Score de résilience (Issu du nouveau BehavioralAnalyzer)
  const resilienceScore = useMemo(() => {
    if (!transactions.length) return 0;
    return calculateBudgetResilience(transactions);
  }, [transactions]);

  // 3. Analyse comportementale détaillée (Anomalies et Alertes)
  const behavioralAlerts = useMemo(() => {
    if (!transactions.length) return [];
    
    // On analyse les 50 dernières transactions pour trouver des anomalies pertinentes
    return transactions
      .slice(0, 50) 
      .map(t => analyzeBehavior(t, transactions))
      .filter(Boolean) // Supprime les null (les transactions normales)
      .sort((a, b) => (b?.score || 0) - (a?.score || 0)); // Trie par importance
  }, [transactions]);

  // 4. Calcul des Heatmaps (Logique simplifiée réintégrée pour éviter les imports cassés)
  const heatmaps = useMemo(() => {
    if (!transactions.length || !categories.length) return [];

    return categories.map(cat => {
      const days = Array(31).fill(0);
      const catTxns = transactions.filter(t => t.category === cat.id);
      
      catTxns.forEach(t => {
        const day = new Date(t.date).getDate();
        if (day >= 1 && day <= 31) {
          days[day - 1] += Math.abs(t.amount);
        }
      });

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        data: days,
        total: days.reduce((a, b) => a + b, 0)
      };
    }).filter(h => h.total > 0);
  }, [transactions, categories]);

  // 5. Statistiques de couverture des données
  const stats = useMemo(() => {
    const distinctMonths = new Set(transactions.map(t => t.date.substring(0, 7)));
    return {
      transactionCount: transactions.length,
      monthsCovered: distinctMonths.size,
      hasEnoughData: transactions.length >= 50 && distinctMonths.size >= 3
    };
  }, [transactions]);

  // Sélection automatique de la catégorie ayant le plus gros volume pour la heatmap
  useEffect(() => {
    if (heatmaps.length > 0 && !selectedHeatmapCategory) {
      const topCat = [...heatmaps].sort((a, b) => b.total - a.total)[0];
      setSelectedHeatmapCategory(topCat.categoryId);
    }
  }, [heatmaps, selectedHeatmapCategory]);

  return {
    isActivated,
    setIsActivated,
    insights: engineResult?.insights || [],
    behavioralAlerts,
    analysis: engineResult,
    resilienceScore,
    heatmaps,
    selectedHeatmapCategory,
    setSelectedHeatmapCategory,
    stats,
    categories,
    transactions
  };
}