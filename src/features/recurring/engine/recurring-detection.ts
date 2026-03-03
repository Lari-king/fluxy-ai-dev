/**
 * 🔁 ALGORITHME DE DÉTECTION DE RÉCURRENCES - VERSION SMART PATTERN 2026
 * - Priorité sémantique (détecte les salaires variables)
 * - Analyse de stabilité temporelle (fenêtre calendaire)
 * - Mémoïsation agressive pour la performance
 */

import type { Transaction } from '@/features/transactions/types';
import { 
  clusterTransactionsBySimilarity,
  normalizeDescriptionAdvanced,
  ClusterResult,
} from '@/features/recurring/semantic-similarity';

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
  isVariableAmount: boolean; 
  parsed?: {
    merchant: string;
    emoji: string;
    category: string;
    color: string;
  };
}

export interface RecurringDetectionResult {
  patterns: RecurringPattern[];
  totalRecurringTransactions: number;
  monthlyRecurringAmount: number;
  summary: string;
}

// --- CACHE DE MÉMOÏSATION ---
const dateCache = new Map<string, number>();

const getCachedTime = (dateStr: string) => {
  let time = dateCache.get(dateStr);
  if (time === undefined) {
    time = new Date(dateStr).getTime();
    dateCache.set(dateStr, time);
  }
  return time;
};

// --- MOTEUR PRINCIPAL ---

export function detectRecurringPatterns(
  transactions: Transaction[],
  settings: RecurringSettings
): RecurringDetectionResult {
  dateCache.clear();

  const now = Date.now();
  const MS_PER_DAY = 86400000;
  
  // 1️⃣ GROUPEMENT SÉMANTIQUE
  const groups = groupByDescription(transactions, settings);
  const patterns: RecurringPattern[] = [];

  groups.forEach((groupTransactions, groupKey) => {
    if (groupTransactions.length < settings.minOccurrences) return;

    // Tri chronologique
    const sorted = [...groupTransactions].sort((a, b) => getCachedTime(a.date) - getCachedTime(b.date));

    // 2️⃣ ANALYSE TEMPORELLE & MONTANTS
    const intervals: number[] = [];
    const amounts: number[] = [];
    let totalSum = 0;

    for (let i = 0; i < sorted.length; i++) {
      const t = sorted[i];
      totalSum += t.amount;
      amounts.push(Math.abs(t.amount));

      if (i > 0) {
        const diff = getCachedTime(sorted[i].date) - getCachedTime(sorted[i - 1].date);
        const days = diff / MS_PER_DAY;
        // On n'ajoute l'intervalle que s'il est significatif (> 0.5 jour) pour éviter les doublons de saisie
        if (days > 0.5) intervals.push(days);
      }
    }

    // Sécurité si toutes les transactions sont le même jour
    if (intervals.length === 0 && sorted.length >= settings.minOccurrences) {
        intervals.push(0);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / Math.max(1, intervals.length);
    
    // 3️⃣ CALCUL DE LA CONFIANCE
    let stdDevInterval = 0;
    if (intervals.length > 0) {
        const varianceInterval = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
        stdDevInterval = Math.sqrt(varianceInterval);
    }
    
    // Score de base : pénalité par l'instabilité (stdDev)
    let confidence = Math.max(0, 100 - (stdDevInterval * 2.5));

    // Bonus cycle standard (Mensuel ~30j)
    if (avgInterval >= 27 && avgInterval <= 33) {
        confidence = Math.min(100, confidence + 15);
    }
    // Bonus fréquence (plus on a d'occurrences, plus on est sûr)
    confidence += (sorted.length * 2);
    confidence = Math.min(100, confidence);

    if (confidence < settings.minConfidence) return;

    // 4️⃣ ANALYSE DE VARIABILITÉ DU MONTANT
    const avgAmount = totalSum / sorted.length;
    const absAvg = Math.abs(avgAmount);
    
    let cvAmount = 0;
    if (absAvg > 0) {
        const amountVariance = amounts.reduce((sum, amt) => sum + Math.pow(amt - absAvg, 2), 0) / amounts.length;
        const stdDevAmount = Math.sqrt(amountVariance);
        cvAmount = (stdDevAmount / absAvg) * 100;
    }

    const isVariableAmount = cvAmount > 8; // Seuil à 8% pour tolérer les petites variations de taxes/frais

    const lastDateTs = getCachedTime(sorted[sorted.length - 1].date);
    const daysSinceLast = (now - lastDateTs) / MS_PER_DAY;
    
    // Un abonnement est actif s'il n'est pas "en retard" de plus de X fois son cycle
    const isActive = daysSinceLast < (Math.max(avgInterval, 1) * settings.activeMultiplier);

    const meta = normalizeDescriptionAdvanced(sorted[0].description);

    patterns.push({
      id: `rec_${groupKey.replace(/\s+/g, '_')}_${lastDateTs}`,
      description: meta.brand?.toUpperCase() || groupKey.toUpperCase(),
      averageAmount: avgAmount,
      frequency: avgInterval,
      category: sorted[0].category || 'Divers',
      nextExpectedDate: new Date(lastDateTs + (avgInterval || 30) * MS_PER_DAY),
      transactions: sorted,
      confidence: Math.round(confidence),
      type: determineRecurrenceType(avgInterval, settings.typeTolerance),
      isActive,
      isVariableAmount,
      parsed: {
        merchant: meta.brand || groupKey,
        emoji: (sorted[0] as any).emoji || (avgAmount > 0 ? '💰' : '💳'),
        category: sorted[0].category || 'Inconnu',
        color: (sorted[0] as any).color || 'indigo'
      }
    });
  });

  const patternsSorted = patterns.sort((a, b) => b.confidence - a.confidence);
  
  // Calcul du montant mensuel (en isolant dépenses et revenus si nécessaire)
// Remplace par :
const monthlyAmount = patternsSorted
    .filter(p => p.isActive) // On garde tout ce qui est actif (revenus et dépenses)
    .reduce((sum, p) => {
        const factor = 30 / Math.max(1, p.frequency);
        return sum + (p.averageAmount * factor);
    }, 0);

  return {
    patterns: patternsSorted,
    totalRecurringTransactions: patternsSorted.reduce((sum, p) => sum + p.transactions.length, 0),
    monthlyRecurringAmount: Math.abs(monthlyAmount),
    summary: `${patternsSorted.length} abonnements et revenus récurrents détectés`
  };
}

let lastClusterResult: ClusterResult | null = null;
let lastTransactionsHash = '';

function simpleHash(transactions: Transaction[]) {
  return transactions.length + '_' + transactions.map(t => t.id).join(',');
}

function groupByDescription(transactions: Transaction[], settings: RecurringSettings): Map<string, Transaction[]> {
  const hash = simpleHash(transactions);
  if (lastClusterResult && hash === lastTransactionsHash) {
    return lastClusterResult.clusters; // cache hit
  }

  const result = clusterTransactionsBySimilarity(transactions, {
    minSimilarity: settings.semanticMinScore || 85,
    minClusterSize: settings.minOccurrences,
    considerAmount: false,
  });

  lastClusterResult = result;
  lastTransactionsHash = hash;
  return result.clusters;
}

function determineRecurrenceType(avg: number, tol: number): RecurringPattern['type'] {
  if (avg <= 0) return 'custom';
  if (Math.abs(avg - 1) <= tol) return 'daily';
  if (Math.abs(avg - 7) <= tol + 1) return 'weekly';
  if (Math.abs(avg - 14) <= tol + 2) return 'biweekly';
  if (Math.abs(avg - 30) <= tol + 5) return 'monthly';
  if (Math.abs(avg - 90) <= tol + 10) return 'quarterly';
  if (Math.abs(avg - 365) <= tol + 20) return 'yearly';
  return 'custom';
}

export function formatFrequency(days: number): string {
  if (days <= 0) return 'Ponctuel';
  if (days <= 1.5) return 'Quotidien';
  if (days <= 8) return 'Hebdomadaire';
  if (days <= 16) return 'Bi-mensuel';
  if (days <= 32) return 'Mensuel';
  if (days <= 95) return 'Trimestriel';
  if (days <= 370) return 'Annuel';
  return `Tous les ${Math.round(days)} jours`;
}