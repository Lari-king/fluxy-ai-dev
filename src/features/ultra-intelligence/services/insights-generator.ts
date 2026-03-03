/**
 * 🧠 INSIGHTS GENERATOR
 * Emplacement : src/features/ultra-intelligence/services/insights-generator.ts
 * * Génération automatique d'insights textuels à partir des analyses comportementales
 * et des patterns de concentration thermique.
 */

// ✅ Import corrigé suite à la fusion des modules de détection
import type { BehavioralAnomaly } from '@/features/predictions/logic/BehavioralAnalyzer';
import type { ConcentrationPattern } from './heatmap-builder';

export interface GeneratedInsight {
  id: string;
  type: 'change' | 'pattern' | 'anomaly' | 'trend';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
  data?: any;
}

/**
 * Génère des insights à partir des ANOMALIES détectées par le BehavioralAnalyzer
 */
export function generateBehavioralInsights(
  anomalies: BehavioralAnomaly[],
  limit: number = 5
): GeneratedInsight[] {
  return anomalies.slice(0, limit).map((anomaly, index) => {
    // Calcul de la sévérité basée sur le z-score (écart à la normale)
    const severity: GeneratedInsight['severity'] = 
      anomaly.severity === 'high' || anomaly.score > 3 ? 'critical' :
      anomaly.severity === 'medium' || anomaly.score > 2 ? 'warning' : 'info';

    const date = new Date(anomaly.transaction.date);
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    return {
      id: `behavior-${anomaly.transaction.id}-${index}`,
      type: 'change',
      severity,
      title: `${anomaly.behaviorTag === 'impulsive' ? '⚡ Pic d\'impulsivité' : '🔍 Anomalie détectée'}`,
      description: `${anomaly.reason} (Dépense de ${Math.abs(anomaly.transaction.amount)}€ le ${dateStr}).`,
      recommendation: `Cette dépense est ${Math.round(anomaly.score)}x plus élevée que votre moyenne habituelle pour ${anomaly.transaction.category}.`,
      data: anomaly,
    };
  });
}

/**
 * Génère des insights à partir des patterns de concentration (Heatmap)
 */
export function generateConcentrationInsights(
  patterns: ConcentrationPattern[],
  limit: number = 3
): GeneratedInsight[] {
  return patterns
    .filter(p => p.pattern !== 'uniforme' && p.concentration > 60)
    .slice(0, limit)
    .map((pattern, index) => ({
      id: `pattern-${index}`,
      type: 'pattern',
      severity: 'info',
      title: `🔁 Cycle détecté : ${pattern.categoryName}`,
      description: `${pattern.concentration}% de vos dépenses "${pattern.categoryName}" sont concentrées sur la période : ${pattern.mainPeriod}.`,
      recommendation: pattern.pattern === 'début-de-mois' 
        ? 'Vos prélèvements sont groupés en début de mois. Vérifiez que votre solde est suffisant après le virement du salaire.'
        : 'Ce pattern de fin de mois peut indiquer des achats de "rattrapage" ou des sorties plus fréquentes.',
      data: pattern,
    }));
}

/**
 * Génère un résumé global de l'intelligence financière
 */
export function generateGlobalSummary(
  anomalies: BehavioralAnomaly[],
  resilienceScore: number
): GeneratedInsight {
  const criticalCount = anomalies.filter(a => a.severity === 'high').length;

  return {
    id: 'summary',
    type: 'trend',
    severity: resilienceScore < 30 ? 'warning' : 'info',
    title: '📊 Santé Comportementale',
    description: `Score de résilience budgétaire : ${resilienceScore}%. Nous avons identifié ${anomalies.length} écarts par rapport à vos habitudes ce mois-ci.`,
    recommendation: criticalCount > 0 
      ? `Attention : ${criticalCount} anomalies critiques nécessitent votre vigilance.`
      : 'Votre comportement global reste cohérent avec vos moyennes historiques.',
  };
}

/**
 * Fonction maîtresse : Regroupe tous les moteurs pour générer la liste finale
 */
export function generateAllInsights(
  anomalies: BehavioralAnomaly[],
  patterns: ConcentrationPattern[],
  resilienceScore: number
): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  // 1. Résumé Global
  insights.push(generateGlobalSummary(anomalies, resilienceScore));

  // 2. Anomalies comportementales (les plus importantes d'abord)
  insights.push(...generateBehavioralInsights(anomalies, 5));

  // 3. Patterns temporels (Heatmap)
  insights.push(...generateConcentrationInsights(patterns, 3));

  return insights;
}

/**
 * Note : La fonction formatMonthName a été intégrée directement dans les générateurs 
 * pour utiliser les objets Date des transactions.
 */