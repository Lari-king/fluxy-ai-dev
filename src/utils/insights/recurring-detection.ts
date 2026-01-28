/**
 * 🔁 ALGORITHME DE DÉTECTION DE RÉCURRENCES - VERSION OPTIMISÉE 2026
 * - Mémoïsation des dates et normalisations
 * - Détection par fenêtre calendaire (plus robuste que le simple intervalle de jours)
 * - Performance accrue sur les gros volumes de transactions
 */

import { Transaction } from 'contexts/DataContext';
import { 
  clusterTransactionsBySimilarity,
  normalizeDescriptionAdvanced,
} from './semantic-similarity';

// --- TYPES & INTERFACES ---

export interface RecurringSettings {
  enabled: boolean;
  minOccurrences: number;
  maxCoefficientVariation: number;
  minConfidence: number;
  activeMultiplier: number;
  typeTolerance: number;
  useSemanticSimilarity?: boolean;  
  semanticMinScore?: number;        
  seasonalEnabled?: boolean;        
  seasonalTolerance?: number;       
}

export interface RecurringPattern {
  id: string;
  description: string;
  averageAmount: number;
  frequency: number; 
  category: string;
  nextExpectedDate: Date;
  transactions: Transaction[];
  confidence: number; 
  type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  isActive: boolean;
  seasonalVariance?: number; 
  isVariableAmount: boolean; // 🆕 Détecte si le montant fluctue (ex: Orange)
}

export interface RecurringDetectionResult {
  patterns: RecurringPattern[];
  totalRecurringTransactions: number;
  monthlyRecurringAmount: number;
  summary: string;
}

// --- CACHE DE MÉMOÏSATION ---
const dateCache = new Map<string, number>();
const normalizeCache = new Map<string, string>();

const getCachedTime = (dateStr: string) => {
  if (!dateCache.has(dateStr)) {
    dateCache.set(dateStr, new Date(dateStr).getTime());
  }
  return dateCache.get(dateStr)!;
};

const getNormalizedDesc = (desc: string) => {
  if (!normalizeCache.has(desc)) {
    normalizeCache.set(desc, desc.toLowerCase().trim());
  }
  return normalizeCache.get(desc)!;
};

// --- MOTEUR PRINCIPAL ---

// --- MOTEUR PRINCIPAL CORRIGÉ ---

export function detectRecurringPatterns(
  transactions: Transaction[],
  settings: RecurringSettings
): RecurringDetectionResult {
  // Reset des caches pour cette exécution
  dateCache.clear();
  normalizeCache.clear();

  const now = Date.now();
  const descriptionGroups = groupByDescription(transactions, settings);
  const patterns: RecurringPattern[] = [];

  descriptionGroups.forEach((groupTransactions, description) => {
    if (groupTransactions.length < settings.minOccurrences) return;

    const sorted = [...groupTransactions].sort((a, b) => getCachedTime(a.date) - getCachedTime(b.date));

    // 1. Analyse des intervalles
    const intervals: number[] = [];
    const monthsSet = new Set<string>();
    let totalSum = 0; // On garde le signe ici !

    for (let i = 0; i < sorted.length; i++) {
      const t = sorted[i];
      totalSum += t.amount; // Pas de Math.abs ici

      if (i > 0) {
        const t1 = getCachedTime(sorted[i - 1].date);
        const t2 = getCachedTime(t.date);
        intervals.push((t2 - t1) / 86400000);
        const d = new Date(t2);
        monthsSet.add(`${d.getFullYear()}-${d.getMonth()}`);
      }
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const hasMonthConsistency = monthsSet.size >= (sorted.length * 0.8);

    // 2. Confiance
    let varianceInterval = 0;
    for (const interval of intervals) varianceInterval += Math.pow(interval - avgInterval, 2);
    const cv = avgInterval > 0 ? (Math.sqrt(varianceInterval / intervals.length) / avgInterval) * 100 : 100;
    
    let confidence = Math.max(0, 100 - (cv * 0.7));
    if (hasMonthConsistency && avgInterval >= 25 && avgInterval <= 35) confidence = Math.min(100, confidence + 20);

    if (confidence < settings.minConfidence) return;

    // 3. Métriques
    const avgAmount = totalSum / sorted.length;
    // On calcule la variance sur la valeur absolue pour la saisonnalité (Orange, EDF...)
    const sVariance = calculateSeasonalVariance(sorted, Math.abs(avgAmount));

    const lastDateTs = getCachedTime(sorted[sorted.length - 1].date);
    const isActive = (now - lastDateTs) / 86400000 < (avgInterval * settings.activeMultiplier);

    patterns.push({
      id: `rec_${now}_${Math.random().toString(36).substring(2, 7)}`,
      description,
      averageAmount: avgAmount, // Négatif si dépense, positif si revenu
      frequency: avgInterval,
      category: sorted[0].category || 'Non classifié', // Performance : on prend la première
      nextExpectedDate: new Date(lastDateTs + avgInterval * 86400000),
      transactions: sorted,
      confidence: Math.round(confidence),
      type: determineRecurrenceType(avgInterval, settings.typeTolerance),
      isActive,
      isVariableAmount: sVariance > 10
    });
  });

  const patternsSorted = patterns.sort((a, b) => b.confidence - a.confidence);
  
  // Correction du calcul du montant mensuel (respecte les signes)
  const monthlyAmount = patternsSorted
    .filter(p => p.isActive)
    .reduce((sum, p) => sum + (p.averageAmount * (30 / Math.max(1, p.frequency))), 0);

  return {
    patterns: patternsSorted,
    totalRecurringTransactions: patternsSorted.reduce((sum, p) => sum + p.transactions.length, 0),
    monthlyRecurringAmount: monthlyAmount,
    summary: `${patternsSorted.length} récurrences détectées`
  };
}

/**
 * Variance saisonnière optimisée (utilise la moyenne déjà calculée)
 */
function calculateSeasonalVariance(transactions: Transaction[], avg: number): number {
  if (transactions.length < 2 || avg === 0) return 0;
  const maxDeviation = Math.max(...transactions.map(t => Math.abs(Math.abs(t.amount) - avg)));
  return (maxDeviation / avg) * 100;
}

/**
 * Groupement par description avec cache de normalisation
 */
function groupByDescription(transactions: Transaction[], settings: RecurringSettings): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();

  if (settings.useSemanticSimilarity) {
    const result = clusterTransactionsBySimilarity(transactions, {
      minSimilarity: settings.semanticMinScore || 70,
      minClusterSize: settings.minOccurrences,
      considerAmount: false, // On désactive pour les abonnements variables comme Orange
    });

    result.clusters.forEach(txns => {
      const meta = normalizeDescriptionAdvanced(txns[0].description);
      groups.set(meta.brand || meta.normalized || txns[0].description, txns);
    });
  } else {
    const processedIds = new Set<string>();
    for (const txn of transactions) {
      if (processedIds.has(txn.id)) continue;

      const cluster: Transaction[] = [txn];
      processedIds.add(txn.id);
      const norm1 = getNormalizedDesc(txn.description);

      for (const other of transactions) {
        if (processedIds.has(other.id)) continue;
        const norm2 = getNormalizedDesc(other.description);

        if (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1)) {
          cluster.push(other);
          processedIds.add(other.id);
        }
      }
      groups.set(txn.description, cluster);
    }
  }
  return groups;
}

function determineRecurrenceType(avg: number, tol: number): any {
  if (Math.abs(avg - 1) <= tol) return 'daily';
  if (Math.abs(avg - 7) <= tol + 1) return 'weekly';
  if (Math.abs(avg - 14) <= tol + 2) return 'biweekly';
  if (Math.abs(avg - 30) <= tol + 4) return 'monthly';
  if (Math.abs(avg - 90) <= tol + 7) return 'quarterly';
  if (Math.abs(avg - 365) <= tol + 15) return 'yearly';
  return 'custom';
}

function formatCurrency(amt: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amt);
}
/**
 * Formatage de la fréquence pour l'UI (Requis par RecurringCard.tsx)
 */
export function formatFrequency(days: number): string {
  if (days <= 1.5) return 'Quotidien';
  if (days <= 8) return 'Hebdomadaire';
  if (days <= 16) return 'Bi-mensuel';
  if (days <= 32) return 'Mensuel';
  if (days <= 95) return 'Trimestriel';
  if (days <= 370) return 'Annuel';
  return `Tous les ${Math.round(days)} jours`;
}