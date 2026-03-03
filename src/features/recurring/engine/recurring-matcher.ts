import type { Transaction } from '@/features/transactions/types';
import {
  normalizeAll,
  normalizeDescriptionAdvanced,
} from '@/features/recurring/semantic-similarity';

/**
 * ⚡ CONFIGURATION DES POIDS DE PERTINENCE
 */
const WEIGHTS = {
  STRICT_AMOUNT: 0.45,    // Le montant concorde exactement ou presque
  DESCRIPTION: 0.35,      // Le nom du marchand est similaire
  TEMPORAL_CYCLE: 0.20    // La date respecte un cycle (mensuel, hebdo...)
};

export interface SimilarTransaction {
  transaction: Transaction;
  matchScore: number;
  daysDifference: number; // Différence en jours entre la transaction cible et le candidat
}

/**
 * Calcule le score de cycle temporel (proximité du jour du mois)
 */
function getCycleScore(d1: Date, d2: Date): number {
  const day1 = d1.getDate();
  const day2 = d2.getDate();
  
  // Différence circulaire entre les jours du mois (ex: entre le 31 et le 1er = 1 jour)
  const diff = Math.min(Math.abs(day1 - day2), 31 - Math.abs(day1 - day2));
  
  if (diff <= 2) return 100; // Excellent (tolérance pour week-ends)
  if (diff <= 5) return 70;
  return Math.max(0, 40 - diff * 5);
}

/**
 * RECURRING MATCHER V5.2 - VERSION OPTIMISÉE
 * Trouve les transactions similaires pour suggérer des regroupements récurrents
 * 
 * Améliorations :
 * - Normalisation batch via normalizeAll (une seule passe)
 * - Utilisation de normalizeDescriptionAdvanced au lieu de la version simplifiée
 */
export function findSimilarTransactions(
  target: Transaction,
  allTransactions: Transaction[],
  threshold = 75
): SimilarTransaction[] {
  // 1. Normalisation unique de toutes les transactions (gros gain perf)
  const normalizedMap = normalizeAll(allTransactions);

  // Normalisation de la cible (une seule fois)
  const targetInfo = normalizeDescriptionAdvanced(target.description);
  const targetNorm = targetInfo.normalized;
  const targetAmount = Math.abs(target.amount);
  const targetDate = new Date(target.date);

  return allTransactions
    .filter(t => t.id !== target.id)
    .map(txn => {
      const txnInfo = normalizedMap.get(txn.id);
      if (!txnInfo) {
        // Sécurité (ne devrait pas arriver si normalizeAll a bien fonctionné)
        return null as any;
      }

      const txnAmount = Math.abs(txn.amount);
      const txnDate = new Date(txn.date);

      // 1. Score de Montant (tolérance relative au montant total)
      const amountDiff = Math.abs(targetAmount - txnAmount);
      const amountScore = amountDiff === 0 ? 100 :
                          amountDiff < 0.05 ? 95 : // Centimes d'écart
                          Math.max(0, 100 - (amountDiff / (targetAmount * 0.15 || 1)) * 100);

      // 2. Score de Texte (Jaro-Winkler sur descriptions normalisées)
      // On utilise la version avancée .normalized au lieu de re-normaliser
      const descScore = jaroWinkler(targetNorm, txnInfo.normalized) * 100;

      // 3. Score de Cycle (Jour du mois)
      const cycleScore = getCycleScore(targetDate, txnDate);

      // Moyenne pondérée finale
      const matchScore = Math.round(
        (amountScore * WEIGHTS.STRICT_AMOUNT) +
        (descScore * WEIGHTS.DESCRIPTION) +
        (cycleScore * WEIGHTS.TEMPORAL_CYCLE)
      );

      // Calcul de la différence absolue en jours
      const daysDifference = Math.round(
        (txnDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return { 
        transaction: txn, 
        matchScore,
        daysDifference
      };
    })
    .filter((m): m is SimilarTransaction => m !== null && m.matchScore >= threshold)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Regroupeur intelligent par Cluster
 * (inchangé, mais bénéficie indirectement de la perf de findSimilarTransactions)
 */
export function groupRecurringTransactions(transactions: Transaction[]): Transaction[][] {
  const groups: Transaction[][] = [];
  const visited = new Set<string>();

  // Tri par date décroissante pour commencer par les plus récentes
  const sorted = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const txn of sorted) {
    if (visited.has(txn.id)) continue;

    // Recherche de candidats parmi ceux non encore visités
    const matches = findSimilarTransactions(
      txn, 
      transactions.filter(t => !visited.has(t.id)), 
      80
    );

    if (matches.length >= 1) {
      const cluster = [txn, ...matches.map(m => m.transaction)];
      
      // On accepte le groupe s'il contient au moins 2 transactions
      if (cluster.length >= 2) {
        groups.push(cluster);
        cluster.forEach(c => visited.add(c.id));
      }
    }
  }

  return groups;
}

// ──────────────────────────────────────────────
// Fonctions conservées mais non modifiées
// ──────────────────────────────────────────────

/**
 * Distance de Jaro-Winkler (inchangée – déjà performante pour les noms courts)
 */
function jaroWinkler(s1: string, s2: string): number {
  let m = 0;
  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1 === s2) return 1;

  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  for (let i = 0; i < s1.length; i++) {
    const low = Math.max(0, i - range);
    const high = Math.min(i + range + 1, s2.length);
    for (let j = low; j < high; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
  }

  if (m === 0) return 0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
  }

  const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
  const p = 0.1; // Facteur d'échelle
  let l = 0; // Longueur du préfixe commun
  while (s1[l] === s2[l] && l < 4) l++;

  return jaro + l * p * (1 - jaro);
}