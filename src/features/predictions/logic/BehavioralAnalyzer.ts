/**
 * 🧠 BEHAVIORAL ANALYZER (Version Autonome)
 * Emplacement : src/features/predictions/logic/BehavioralAnalyzer.ts
 */

import type { Transaction } from '@/features/transactions/types';

// ================================================================
// 1. LOGIQUE DES AXES COMPORTEMENTAUX (Intégrée)
// ================================================================

export type BehavioralAxis =
  | 'SURVIE_FIXE'        // Incompressible (loyer, factures)
  | 'SURVIE_VARIABLE'    // Nécessaire mais ajustable (alimentation)
  | 'CONFORT'            // Arbitrable (livraison, VTC)
  | 'STATUT_ESTIME'      // Comportemental (sorties)
  | 'PROJET_LONG_TERME'  // Investissement
  | 'SOCIAL_EMOTIONNEL'; // Contextuel (cadeaux)

export interface BehavioralProfile {
  axis: BehavioralAxis;
  compressibilityScore: number; 
  priority: number; 
}

/**
 * Mappe une catégorie vers un profil comportemental
 * Note : Vous pouvez enrichir ce mapping selon vos catégories
 */
export function getCategoryBehavioralProfile(category: string): BehavioralProfile {
  const cat = category.toLowerCase();

  if (cat.includes('loyer') || cat.includes('logement') || cat.includes('impôt') || cat.includes('assurance')) {
    return { axis: 'SURVIE_FIXE', compressibilityScore: 0.1, priority: 1 };
  }
  if (cat.includes('courses') || cat.includes('alim') || cat.includes('santé')) {
    return { axis: 'SURVIE_VARIABLE', compressibilityScore: 0.4, priority: 2 };
  }
  if (cat.includes('resto') || cat.includes('bar') || cat.includes('sortie') || cat.includes('loisir')) {
    return { axis: 'SOCIAL_EMOTIONNEL', compressibilityScore: 0.8, priority: 4 };
  }
  if (cat.includes('shopping') || cat.includes('mode') || cat.includes('luxe')) {
    return { axis: 'STATUT_ESTIME', compressibilityScore: 0.9, priority: 5 };
  }
  if (cat.includes('transport') || cat.includes('uber') || cat.includes('services')) {
    return { axis: 'CONFORT', compressibilityScore: 0.7, priority: 3 };
  }
  if (cat.includes('épargne') || cat.includes('invest')) {
    return { axis: 'PROJET_LONG_TERME', compressibilityScore: 0.5, priority: 2 };
  }

  // Profil par défaut (Arbitrable par sécurité)
  return { axis: 'CONFORT', compressibilityScore: 0.6, priority: 3 };
}

// ================================================================
// 2. MOTEUR D'ANALYSE
// ================================================================

export interface BehavioralAnomaly {
  transaction: Transaction;
  severity: 'low' | 'medium' | 'high';
  score: number;
  reason: string;
  profile: BehavioralProfile;
  behaviorTag: 'impulsive' | 'unusual' | 'critical' | 'lifestyle-creep';
}

const getStats = (values: number[]) => {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return { mean, stdDev: Math.sqrt(variance) };
};

/**
 * Analyse une transaction pour détecter une anomalie comportementale
 */
export function analyzeBehavior(
  transaction: Transaction,
  history: Transaction[]
): BehavioralAnomaly | null {
  const amount = Math.abs(transaction.amount);
  const profile = getCategoryBehavioralProfile(transaction.category);
  
  const categoryHistory = history
    .filter(t => t.category === transaction.category && t.id !== transaction.id)
    .map(t => Math.abs(t.amount));

  if (categoryHistory.length < 3) return null;

  const { mean, stdDev } = getStats(categoryHistory);
  if (stdDev === 0) return null;

  const zScore = (amount - mean) / stdDev;
  const isWeekend = [0, 6].includes(new Date(transaction.date).getDay());

  if (zScore > 1.5) {
    let severity: BehavioralAnomaly['severity'] = 'low';
    let behaviorTag: BehavioralAnomaly['behaviorTag'] = 'unusual';
    let reason = `Dépense inhabituelle en ${transaction.category}.`;

    if ((profile.axis === 'CONFORT' || profile.axis === 'SOCIAL_EMOTIONNEL') && isWeekend && zScore > 2) {
      severity = 'medium';
      behaviorTag = 'impulsive';
      reason = `Pic d'impulsivité week-end détecté (${Math.round(zScore)}x la moyenne).`;
    }

    if (profile.axis === 'SURVIE_FIXE' && zScore > 2.5) {
      severity = 'high';
      behaviorTag = 'critical';
      reason = `Alerte : Augmentation critique d'une charge fixe.`;
    }

    return { transaction, severity, score: zScore, reason, profile, behaviorTag };
  }

  return null;
}

/**
 * Calcule la résilience (capacité à réduire ses dépenses en cas de coup dur)
 */
export function calculateBudgetResilience(transactions: Transaction[]): number {
  const totalsByAxis: Record<string, number> = {};
  
  transactions.forEach(t => {
    const profile = getCategoryBehavioralProfile(t.category);
    totalsByAxis[profile.axis] = (totalsByAxis[profile.axis] || 0) + Math.abs(t.amount);
  });

  const total = Object.values(totalsByAxis).reduce((a, b) => a + b, 0);
  if (total === 0) return 100;

  // Résilience = 1 - (Part des dépenses incompressibles)
  const survivalPart = ((totalsByAxis['SURVIE_FIXE'] || 0) + (totalsByAxis['SURVIE_VARIABLE'] || 0)) / total;
  
  return Math.max(0, Math.round((1 - survivalPart) * 100));
}
