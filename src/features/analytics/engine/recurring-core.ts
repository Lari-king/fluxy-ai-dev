/**
 * 🔄 MOTEUR DE RÉCURRENCES (Recurring Core)
 * Identifie les patterns cycliques et les abonnements.
 */

import { Transaction } from '@/contexts/DataContext';
import { RecurringSettings } from '@/contexts/TransactionSettingsContext';

export interface RecurringPattern {
  id: string;
  description: string;
  averageAmount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'unknown';
  confidence: number; // 0 à 100
  nextExpectedDate: string;
  transactions: Transaction[];
  isActive: boolean;
}

/**
 * Calcule l'écart type pour valider la régularité d'un montant
 */
const getCoefficientOfVariation = (amounts: number[]) => {
  const n = amounts.length;
  if (n < 2) return 0;
  const mean = amounts.reduce((a, b) => a + b, 0) / n;
  const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  return (stdDev / mean) * 100; // Pourcentage de variation
};

/**
 * Analyse une liste de transactions pour détecter des cycles
 */
export function detectRecurringPatterns(
  transactions: Transaction[],
  settings: RecurringSettings
): RecurringPattern[] {
  if (!settings.enabled) return [];

  // 1. Groupement par description (Marchand)
  const groups: Record<string, Transaction[]> = {};
  transactions.forEach(tx => {
    if (tx.isHidden) return;
    const desc = tx.description.toLowerCase().trim();
    if (!groups[desc]) groups[desc] = [];
    groups[desc].push(tx);
  });

  const patterns: RecurringPattern[] = [];

  // 2. Analyse de chaque groupe
  Object.entries(groups).forEach(([desc, txs]) => {
    if (txs.length < settings.minOccurrences) return;

    // Trier par date
    const sortedTxs = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculer les intervalles en jours
    const intervals: number[] = [];
    for (let i = 1; i < sortedTxs.length; i++) {
      const d1 = new Date(sortedTxs[i - 1].date);
      const d2 = new Date(sortedTxs[i].date);
      intervals.push(Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Calculer la moyenne de l'intervalle et du montant
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const avgAmount = sortedTxs.reduce((a, b) => a + Math.abs(b.amount), 0) / sortedTxs.length;
    
    const amountVariation = getCoefficientOfVariation(txs.map(t => Math.abs(t.amount)));

    // 3. Détermination de la fréquence
    let frequency: RecurringPattern['frequency'] = 'unknown';
    if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly';
    else if (avgInterval >= 6 && avgInterval <= 8) frequency = 'weekly';
    else if (avgInterval >= 360) frequency = 'yearly';
    else if (avgInterval === 1) frequency = 'daily';

    // 4. Calcul du score de confiance
    let confidence = 0;
    if (frequency !== 'unknown') confidence += 40;
    if (amountVariation < settings.maxCoefficientVariation) confidence += 40;
    if (txs.length > settings.minOccurrences) confidence += 20;

    if (confidence >= settings.minConfidence) {
      // Calcul de la prochaine date prévue
      const lastDate = new Date(sortedTxs[sortedTxs.length - 1].date);
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + Math.round(avgInterval));

      patterns.push({
        id: `pattern-${desc.replace(/\s+/g, '-')}`,
        description: txs[0].description,
        averageAmount: avgAmount,
        frequency,
        confidence,
        nextExpectedDate: nextDate.toISOString(),
        transactions: sortedTxs,
        isActive: true
      });
    }
  });

  return patterns;
}