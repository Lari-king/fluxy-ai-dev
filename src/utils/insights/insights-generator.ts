/**
 * INSIGHTS GENERATOR
 * Génération automatique d'insights textuels à partir des analyses
 */

import type { ChangeAlert } from '@/utils/insights/change-detection';
import type { ConcentrationPattern } from '@/utils/insights/heatmap-builder';

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
 * Génère des insights à partir des alertes de changement
 */
export function generateChangeInsights(
  changes: ChangeAlert[],
  limit: number = 5
): GeneratedInsight[] {
  return changes.slice(0, limit).map((change, index) => {
    const isIncrease = change.type === 'spike';
    const severity: GeneratedInsight['severity'] = 
      Math.abs(change.percent) > 100 ? 'critical' :
      Math.abs(change.percent) > 50 ? 'warning' : 'info';

    const monthName = formatMonthName(change.month);

    return {
      id: `change-${index}`,
      type: 'change',
      severity,
      title: `${isIncrease ? '📈 Hausse' : '📉 Baisse'} importante en ${monthName}`,
      description: `Vos dépenses "${change.category}" ont ${isIncrease ? 'augmenté' : 'diminué'} de ${Math.abs(change.percent)}% (${change.currentAmount}€ vs ${change.previousAverage}€ en moyenne).`,
      recommendation: isIncrease 
        ? `Analysez les transactions de ${monthName} pour identifier la cause de cette hausse.`
        : `Cette réduction pourrait indiquer un changement positif dans vos habitudes.`,
      data: change,
    };
  });
}

/**
 * Génère des insights à partir des patterns de concentration
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
      title: `🔁 Pattern détecté : ${pattern.categoryName}`,
      description: `${pattern.concentration}% de vos dépenses "${pattern.categoryName}" sont concentrées ${pattern.mainPeriod}.`,
      recommendation: pattern.pattern === 'début-de-mois' 
        ? 'Cette concentration en début de mois peut créer une pression budgétaire. Envisagez d\'étaler certaines dépenses.'
        : pattern.pattern === 'fin-de-mois'
        ? 'Cette concentration en fin de mois peut indiquer une planification à améliorer.'
        : 'Cette concentration au milieu du mois est inhabituelle.',
      data: pattern,
    }));
}

/**
 * Génère un résumé global des insights
 */
export function generateGlobalSummary(
  changes: ChangeAlert[],
  patterns: ConcentrationPattern[]
): GeneratedInsight {
  const increasesCount = changes.filter(c => c.type === 'spike').length;
  const decreasesCount = changes.filter(c => c.type === 'drop').length;
  const patternsCount = patterns.filter(p => p.pattern !== 'uniforme').length;

  return {
    id: 'summary',
    type: 'trend',
    severity: 'info',
    title: '📊 Vue d\'ensemble',
    description: `${changes.length} changements significatifs détectés (${increasesCount} hausses, ${decreasesCount} baisses). ${patternsCount} patterns temporels identifiés.`,
    recommendation: 'Explorez les graphiques ci-dessous pour comprendre l\'évolution de vos finances.',
  };
}

/**
 * Détecte les anomalies (changements multiples simultanés)
 */
export function detectSimultaneousChanges(changes: ChangeAlert[]): GeneratedInsight[] {
  const changesByMonth = new Map<string, ChangeAlert[]>();

  changes.forEach(change => {
    if (!changesByMonth.has(change.month)) {
      changesByMonth.set(change.month, []);
    }
    changesByMonth.get(change.month)!.push(change);
  });

  const insights: GeneratedInsight[] = [];

  changesByMonth.forEach((monthChanges, month) => {
    if (monthChanges.length >= 3) {
      const monthName = formatMonthName(month);
      insights.push({
        id: `anomaly-${month}`,
        type: 'anomaly',
        severity: 'warning',
        title: `⚠️ Événement majeur en ${monthName}`,
        description: `${monthChanges.length} catégories ont changé simultanément ce mois-ci : ${monthChanges.map(c => c.category).join(', ')}.`,
        recommendation: 'Cela peut indiquer un événement de vie important (déménagement, changement de travail, etc.).',
        data: { month, changes: monthChanges },
      });
    }
  });

  return insights;
}

/**
 * Génère tous les insights disponibles
 */
export function generateAllInsights(
  changes: ChangeAlert[],
  patterns: ConcentrationPattern[]
): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  // 1. Résumé global
  insights.push(generateGlobalSummary(changes, patterns));

  // 2. Changements significatifs
  insights.push(...generateChangeInsights(changes, 5));

  // 3. Anomalies (changements simultanés)
  insights.push(...detectSimultaneousChanges(changes));

  // 4. Patterns de concentration
  insights.push(...generateConcentrationInsights(patterns, 3));

  return insights;
}

/**
 * Formatte un mois (YYYY-MM) en nom lisible
 */
function formatMonthName(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
