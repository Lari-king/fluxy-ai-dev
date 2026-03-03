import { Transaction } from '@/contexts/DataContext';
import { AnomalySettings } from '@/contexts/TransactionSettingsContext';
import { Anomaly as AnomalyResult } from '../types';

/**
 * Calcule la moyenne et l'écart-type pour un set de montants
 */
const getStats = (values: number[]) => {
  const n = values.length;
  if (n === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n);
  return { mean, stdDev };
};

export function detectAnomalies(
  transactions: Transaction[],
  settings: AnomalySettings
): AnomalyResult[] {
  if (!settings.enabled) return [];

  const anomalies: AnomalyResult[] = [];
  const amounts = transactions.map(t => Math.abs(t.amount));
  const { mean, stdDev } = getStats(amounts);

  transactions.forEach(tx => {
    if (tx.isHidden) return;
    const amount = Math.abs(tx.amount);

    // 1. Détection par Z-Score (Montant anormal)
    if (stdDev > 0) {
      const zScore = (amount - mean) / stdDev;
      if (zScore > settings.amountZScoreThreshold) {
        anomalies.push({
          id: `anomaly-amount-${tx.id}`,
          transactionId: tx.id,
          type: 'amount',
          severity: zScore > settings.amountZScoreHigh ? 'high' : 'medium',
          score: zScore,
          message: "Montant nettement supérieur à vos habitudes",
          date: tx.date
        });
      }
    }

    // 2. Détection d'impulsivité (Week-end)
    if (settings.impulsiveEnabled) {
      const day = new Date(tx.date).getDay();
      const isWeekend = day === 0 || day === 6;
      if (isWeekend && amount > (mean * (settings.impulsiveThresholdMultiplier || 1.2))) {
        anomalies.push({
          id: `anomaly-impulsive-${tx.id}`,
          transactionId: tx.id,
          type: 'impulsive',
          severity: 'low',
          score: 1,
          message: "Dépense impulsive potentielle du week-end",
          date: tx.date
        });
      }
    }
  });

  return anomalies;
}