/**
 * 🚨 ALGORITHME DE DÉTECTION D'ANOMALIES - VERSION CORRIGÉE & AMÉLIORÉE 2025
 * 
 * Fonctionnalités :
 * - Montant anormal
 * - Catégorie inhabituelle
 * - Fréquence anormale
 * - Doublons
 * - Localisation inhabituelle
 * - 🆕 Dépenses impulsives (week-end +20% vs moyenne habituelle)
 */

import { Transaction } from '../../../contexts/DataContext';

export interface AnomalySettings {
  enabled: boolean;
  lookbackDays: number;
  amountZScoreThreshold: number;
  amountZScoreHigh: number;
  amountZScoreMedium: number;
  amountMinHistory: number;
  categoryMinHistory: number;
  categoryUnusualThreshold: number;
  frequencyZScoreThreshold: number;
  frequencyZScoreHigh: number;
  duplicateWindowDays: number;
  locationUnusualThreshold: number;
  locationHighSeverityThreshold: number;

  // 🆕 2025 : Détection impulsivité week-end
  impulsiveEnabled?: boolean;                    // défaut : true
  impulsiveThresholdMultiplier?: number;         // défaut : 1.2 (+20%)
}

export interface Anomaly {
  transaction: Transaction;
  type: 'amount' | 'category' | 'frequency' | 'location' | 'duplicate';
  severity: 'low' | 'medium' | 'high';
  reason: string;
  expectedValue?: string | number;
  actualValue?: string | number;
  confidence: number; // 0-100

  // 🆕 Type de comportement (pour AnomaliesCard)
  behaviorType?: 'impulsive';
}

export interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  totalChecked: number;
  suspiciousCount: number;
  summary: string;
}

/**
 * Détection principale
 */
export function detectAnomalies(
  transactions: Transaction[],
  settings: AnomalySettings
): AnomalyDetectionResult {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - settings.lookbackDays * 24 * 60 * 60 * 1000);

  const recentTransactions = transactions.filter(txn => new Date(txn.date) >= cutoffDate);

  const anomalies: Anomaly[] = [];

  anomalies.push(...detectAmountAnomalies(recentTransactions, transactions, settings));
  anomalies.push(...detectCategoryAnomalies(recentTransactions, transactions, settings));
  anomalies.push(...detectFrequencyAnomalies(recentTransactions, settings));
  anomalies.push(...detectDuplicates(recentTransactions, settings));
  anomalies.push(...detectLocationAnomalies(recentTransactions, transactions, settings));

  // 🆕 Détection impulsivité week-end
  if (settings.impulsiveEnabled ?? true) {
    anomalies.push(...detectImpulsiveSpending(recentTransactions, transactions, settings));
  }

  // Tri par sévérité puis confiance
  anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.confidence - a.confidence;
  });

  const suspiciousCount = anomalies.filter(a => a.severity === 'high').length;

  return {
    anomalies,
    totalChecked: recentTransactions.length,
    suspiciousCount,
    summary: generateSummary(anomalies),
  };
}

/**
 * Montants anormaux
 */
function detectAmountAnomalies(
  recentTransactions: Transaction[],
  allTransactions: Transaction[],
  settings: AnomalySettings
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  const categoryGroups = new Map<string, Transaction[]>();
  allTransactions.forEach(txn => {
    const cat = txn.category || 'Non classifié';
    if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
    categoryGroups.get(cat)!.push(txn);
  });

  recentTransactions.forEach(txn => {
    const cat = txn.category || 'Non classifié';
    const categoryTxns = categoryGroups.get(cat) || [];

    if (categoryTxns.length < settings.amountMinHistory) return;

    const amounts = categoryTxns.map(t => Math.abs(t.amount));
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = calculateStdDev(amounts, mean);

    const txnAmount = Math.abs(txn.amount);
    const zScore = stdDev > 0 ? (txnAmount - mean) / stdDev : 0;

    if (Math.abs(zScore) > settings.amountZScoreThreshold) {
      const severity: 'low' | 'medium' | 'high' =
        Math.abs(zScore) > settings.amountZScoreHigh ? 'high' :
        Math.abs(zScore) > settings.amountZScoreMedium ? 'medium' : 'low';

      anomalies.push({
        transaction: txn,
        type: 'amount',
        severity,
        reason: zScore > 0
          ? `Montant ${Math.round(zScore * 100)}% plus élevé que la moyenne habituelle`
          : `Montant anormalement faible pour cette catégorie`,
        expectedValue: mean.toFixed(2),
        actualValue: txnAmount.toFixed(2),
        confidence: Math.min(95, 60 + Math.abs(zScore) * 10),
      });
    }
  });

  return anomalies;
}

/**
 * Catégories inhabituelles
 */
function detectCategoryAnomalies(
  recentTransactions: Transaction[],
  allTransactions: Transaction[],
  settings: AnomalySettings
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  const merchantGroups = new Map<string, Transaction[]>();
  allTransactions.forEach(txn => {
    const merchant = txn.description.toLowerCase().trim();
    if (!merchantGroups.has(merchant)) merchantGroups.set(merchant, []);
    merchantGroups.get(merchant)!.push(txn);
  });

  recentTransactions.forEach(txn => {
    const merchant = txn.description.toLowerCase().trim();
    const merchantTxns = merchantGroups.get(merchant) || [];

    if (merchantTxns.length < settings.categoryMinHistory) return;

    const categoryCounts = new Map<string, number>();
    merchantTxns.forEach(t => {
      const cat = t.category || 'Non classifié';
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });

    const mostFrequent = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    const currentCategory = txn.category || 'Non classifié';
    const currentPercent = (categoryCounts.get(currentCategory) || 0) / merchantTxns.length * 100;

    if (currentCategory !== mostFrequent[0] && currentPercent < settings.categoryUnusualThreshold) {
      anomalies.push({
        transaction: txn,
        type: 'category',
        severity: 'medium',
        reason: `Catégorie inhabituelle pour "${txn.description}"`,
        expectedValue: mostFrequent[0],
        actualValue: currentCategory,
        confidence: 100 - currentPercent,
      });
    }
  });

  return anomalies;
}

/**
 * Fréquences anormales
 */
function detectFrequencyAnomalies(
  recentTransactions: Transaction[],
  settings: AnomalySettings
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  const dailyGroups = new Map<string, Transaction[]>();
  recentTransactions.forEach(txn => {
    const dateKey = new Date(txn.date).toISOString().split('T')[0];
    if (!dailyGroups.has(dateKey)) dailyGroups.set(dateKey, []);
    dailyGroups.get(dateKey)!.push(txn);
  });

  const dailyCounts = Array.from(dailyGroups.values()).map(txns => txns.length);
  if (dailyCounts.length === 0) return anomalies;

  const avgDaily = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
  const stdDev = calculateStdDev(dailyCounts, avgDaily);

  dailyGroups.forEach((txns, date) => {
    if (stdDev === 0) return;
    const zScore = (txns.length - avgDaily) / stdDev;

    if (zScore > settings.frequencyZScoreThreshold) {
      const representativeTxn = txns[0];
      anomalies.push({
        transaction: representativeTxn,
        type: 'frequency',
        severity: zScore > settings.frequencyZScoreHigh ? 'high' : 'medium',
        reason: `${txns.length} transactions le ${date} – activité très inhabituelle`,
        expectedValue: Math.round(avgDaily),
        actualValue: txns.length,
        confidence: Math.min(90, 50 + zScore * 10),
      });
    }
  });

  return anomalies;
}

/**
 * Doublons
 */
function detectDuplicates(
  recentTransactions: Transaction[],
  settings: AnomalySettings
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (let i = 0; i < recentTransactions.length; i++) {
    const txn = recentTransactions[i];
    const txnDate = new Date(txn.date);

    for (let j = i + 1; j < recentTransactions.length; j++) {
      const other = recentTransactions[j];
      const otherDate = new Date(other.date);

      const daysDiff = Math.abs((txnDate.getTime() - otherDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > settings.duplicateWindowDays) continue;

      const isSimilar =
        Math.abs(txn.amount - other.amount) < 0.01 &&
        txn.description.toLowerCase().trim() === other.description.toLowerCase().trim();

      if (isSimilar) {
        anomalies.push({
          transaction: txn,
          type: 'duplicate',
          severity: 'high',
          reason: `Doublon potentiel avec transaction du ${other.date}`,
          confidence: 85,
        });
        break;
      }
    }
  }

  return anomalies;
}

/**
 * Localisations inhabituelles
 */
function detectLocationAnomalies(
  recentTransactions: Transaction[],
  allTransactions: Transaction[],
  settings: AnomalySettings
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  const countryCounts = new Map<string, number>();
  allTransactions.forEach(txn => {
    const country = txn.country || 'Unknown';
    countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
  });

  const totalTxns = allTransactions.length || 1;
  const mostFrequentCountries = Array.from(countryCounts.entries())
    .map(([country, count]) => ({
      country,
      count,
      percent: (count / totalTxns) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  const usualCountries = new Set(
    mostFrequentCountries
      .filter((c, idx) => c.percent > settings.locationUnusualThreshold || idx < 3)
      .map(c => c.country)
  );

  recentTransactions.forEach(txn => {
    const country = txn.country || 'Unknown';
    if (!usualCountries.has(country) && country !== 'Unknown') {
      const countryData = mostFrequentCountries.find(c => c.country === country);
      const percent = countryData?.percent || 0;

      anomalies.push({
        transaction: txn,
        type: 'location',
        severity: percent < settings.locationHighSeverityThreshold ? 'high' : 'medium',
        reason: `Transaction depuis un pays inhabituel : ${country}`,
        expectedValue: Array.from(usualCountries).join(', '),
        actualValue: country,
        confidence: Math.min(90, 100 - percent * 10),
      });
    }
  });

  return anomalies;
}

/**
 * 🆕 DÉTECTION DES DÉPENSES IMPULSIVES (week-end ou pic >20%)
 */
function detectImpulsiveSpending(
  recentTransactions: Transaction[],
  allTransactions: Transaction[],
  settings: AnomalySettings
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Moyenne des dépenses par jour de la semaine (0=dimanche → 6=samedi)
  const dayOfWeekStats = new Array(7).fill(null).map(() => ({ count: 0, total: 0 }));

  allTransactions.forEach(txn => {
    if (txn.amount >= 0) return; // seulement dépenses
    const date = new Date(txn.date);
    const day = date.getDay();
    dayOfWeekStats[day].count += 1;
    dayOfWeekStats[day].total += Math.abs(txn.amount);
  });

  const dayAverages = dayOfWeekStats.map(stat => stat.count > 0 ? stat.total / stat.count : 0);

  recentTransactions.forEach(txn => {
    if (txn.amount >= 0) return; // seulement dépenses

    const date = new Date(txn.date);
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;

    const avgForDay = dayAverages[day];
    if (avgForDay === 0) return;

    const threshold = settings.impulsiveThresholdMultiplier ?? 1.2; // +20% par défaut
    const txnAbs = Math.abs(txn.amount);

    if (txnAbs > avgForDay * threshold) {
      const percentAbove = Math.round((txnAbs / avgForDay - 1) * 100);

      anomalies.push({
        transaction: txn,
        type: 'amount',
        severity: isWeekend ? 'medium' : 'low',
        reason: isWeekend
          ? `Dépense week-end +${percentAbove}% vs votre moyenne habituelle (impulsivité détectée – Barclays 2025)`
          : `Dépense +${percentAbove}% vs moyenne ce jour-là`,
        behaviorType: 'impulsive',
        confidence: isWeekend ? 80 : 70,
      });
    }
  });

  return anomalies;
}

/**
 * Calcul de l'écart-type
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Résumé textuel
 */
function generateSummary(anomalies: Anomaly[]): string {
  if (anomalies.length === 0) return 'Aucune anomalie détectée';

  const highSeverity = anomalies.filter(a => a.severity === 'high').length;
  const mediumSeverity = anomalies.filter(a => a.severity === 'medium').length;

  if (highSeverity > 0) {
    return `${highSeverity} anomalie${highSeverity > 1 ? 's' : ''} critique${highSeverity > 1 ? 's' : ''} détectée${highSeverity > 1 ? 's' : ''}`;
  }
  if (mediumSeverity > 0) {
    return `${mediumSeverity} anomalie${mediumSeverity > 1 ? 's' : ''} modérée${mediumSeverity > 1 ? 's' : ''}`;
  }
  return `${anomalies.length} anomalie${anomalies.length > 1 ? 's' : ''} mineure${anomalies.length > 1 ? 's' : ''}`;
}