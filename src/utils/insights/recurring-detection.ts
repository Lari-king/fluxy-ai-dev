/**
 * 🔁 ALGORITHME DE DÉTECTION DE RÉCURRENCES - VERSION 2025 COMPLÈTE
 * * Améliorations :
 * - Clustering sémantique (Fuzzy Matching) pour grouper les marchands aux noms variables.
 * - Analyse de l'écart-type pour la régularité temporelle.
 * - Calcul de seasonalVariance pour les factures fluctuantes.
 * - Gestion des types de récurrences (Hebdo, Mensuel, etc.)
 */

import { Transaction } from 'contexts/DataContext';

// Imports des utilitaires de similarité (doivent être présents dans votre projet)
import { 
  clusterTransactionsBySimilarity,
  normalizeDescriptionAdvanced,
} from './semantic-similarity';

export interface RecurringSettings {
  enabled: boolean;
  minOccurrences: number;           // ex: 2 ou 3
  maxCoefficientVariation: number;  // Régularité des dates (ex: 20%)
  minConfidence: number;            // Score min pour afficher (ex: 70)
  activeMultiplier: number;         // Seuil pour déclarer "actif" (ex: 1.5x l'intervalle)
  typeTolerance: number;            // Tolérance en jours pour le type (ex: 2j)

  // Flux Smart
  useSemanticSimilarity?: boolean;  
  semanticMinScore?: number;        

  // 🆕 2025 : Détection variation saisonnière
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
}

export interface RecurringDetectionResult {
  patterns: RecurringPattern[];
  totalRecurringTransactions: number;
  monthlyRecurringAmount: number;
  summary: string;
}

/**
 * MOTEUR PRINCIPAL DE DÉTECTION
 */
export function detectRecurringPatterns(
  transactions: Transaction[],
  settings: RecurringSettings
): RecurringDetectionResult {
  
  // 1. Groupement des transactions (C'est ici que le "boost" de détection opère)
  const descriptionGroups = groupByDescription(transactions, settings);

  const patterns: RecurringPattern[] = [];
  const now = new Date();

  descriptionGroups.forEach((groupTransactions, description) => {
    // On ignore les groupes trop petits
    if (groupTransactions.length < settings.minOccurrences) return;

    // Tri par date pour l'analyse temporelle
    const sorted = [...groupTransactions].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 2. Analyse des intervalles (Fréquence)
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.abs(
        (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      intervals.push(days);
    }

    if (intervals.length === 0) return;

    // Calcul de la régularité (Coefficient de Variation)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const varianceInterval = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(varianceInterval);
    const coefficientOfVariation = avgInterval > 0 ? (stdDev / avgInterval) * 100 : 100;

    // 3. Validation de la confiance
    const confidence = Math.max(0, 100 - (coefficientOfVariation * 0.8)); // On pondère pour être plus tolérant
    if (confidence < settings.minConfidence) return;

    // 4. Détermination des métriques
    const type = determineRecurrenceType(avgInterval, settings.typeTolerance);
    const avgAmount = sorted.reduce((sum, t) => sum + t.amount, 0) / sorted.length;
    
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const nextExpectedDate = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);

    // Déterminer si la récurrence est toujours d'actualité
    const daysSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    const isActive = daysSinceLast < (avgInterval * settings.activeMultiplier);

    // Trouver la catégorie la plus utilisée dans ce groupe
    const categoryCount: Record<string, number> = {};
    sorted.forEach(t => {
      const cat = t.category || 'Non classifié';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    const mostFrequentCategory = Object.keys(categoryCount).reduce((a, b) =>
      categoryCount[a] > categoryCount[b] ? a : b
    );

    const pattern: RecurringPattern = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description,
      averageAmount: avgAmount,
      frequency: avgInterval,
      category: mostFrequentCategory,
      nextExpectedDate,
      transactions: sorted,
      confidence: Math.round(confidence),
      type,
      isActive,
    };

    // 5. Analyse Saisonnière (2025)
    if (settings.seasonalEnabled ?? true) {
      const sVariance = calculateSeasonalVariance(sorted);
      if (sVariance > (settings.seasonalTolerance ?? 15)) {
        pattern.seasonalVariance = Math.round(sVariance);
      }
    }

    patterns.push(pattern);
  });

  // 6. Finalisation des résultats
  patterns.sort((a, b) => b.confidence - a.confidence);

  const totalRecurringTransactions = patterns.reduce((sum, p) => sum + p.transactions.length, 0);

  const monthlyRecurringAmount = patterns
    .filter(p => p.isActive)
    .reduce((sum, p) => {
      // Normalisation au mois (30 jours)
      const monthlyFrequency = 30 / Math.max(1, p.frequency);
      return sum + p.averageAmount * monthlyFrequency;
    }, 0);

  const activeCount = patterns.filter(p => p.isActive).length;
  const summary = `${patterns.length} récurrences (${activeCount} actives), impact mensuel estimé : ${formatCurrency(monthlyRecurringAmount)}`;

  return {
    patterns,
    totalRecurringTransactions,
    monthlyRecurringAmount,
    summary,
  };
}

/**
 * Calcul de la variance saisonnière (Variation des montants)
 */
function calculateSeasonalVariance(transactions: Transaction[]): number {
  if (transactions.length < 3) return 0;

  const amounts = transactions.map(t => Math.abs(t.amount));
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  
  if (avg === 0) return 0;

  // On cherche l'écart maximal par rapport à la moyenne
  const maxDeviation = Math.max(...amounts.map(amt => Math.abs(amt - avg)));
  return (maxDeviation / avg) * 100;
}

/**
 * Groupement intelligent (Booster de détection)
 */
function groupByDescription(
  transactions: Transaction[],
  settings: RecurringSettings
): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  
  if (settings.useSemanticSimilarity) {
    // Utilisation du clustering sémantique avancé (SANS CASSER)
    const result = clusterTransactionsBySimilarity(transactions, {
      minSimilarity: settings.semanticMinScore || 70,
      minClusterSize: settings.minOccurrences,
      considerAmount: true,
      amountTolerance: 25, // Plus tolérant sur les variations de prix
    });

    result.clusters.forEach(txns => {
      const first = txns[0];
      // On essaie de trouver un nom de marque propre
      const meta = normalizeDescriptionAdvanced(first.description);
      const key = meta.brand || meta.normalized || first.description;
      groups.set(key, txns);
    });
  } else {
    // Fallback : Groupement classique par similarité textuelle simple
    const processed = new Set<string>();
    transactions.forEach(txn => {
      if (processed.has(txn.id)) return;

      const cluster: Transaction[] = [txn];
      processed.add(txn.id);

      transactions.forEach(other => {
        if (processed.has(other.id)) return;

        const similarity = calculateSimpleSimilarity(txn.description, other.description);
        if (similarity > 75) {
          cluster.push(other);
          processed.add(other.id);
        }
      });
      
      groups.set(txn.description, cluster);
    });
  }

  return groups;
}

/**
 * Similarité textuelle basique
 */
function calculateSimpleSimilarity(s1: string, s2: string): number {
  const n1 = s1.toLowerCase().trim();
  const n2 = s2.toLowerCase().trim();
  if (n1 === n2) return 100;
  if (n1.includes(n2) || n2.includes(n1)) return 85;
  return 0;
}

/**
 * Traduit l'intervalle en type lisible
 */
function determineRecurrenceType(
  avgInterval: number,
  tolerance: number
): 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom' {
  if (Math.abs(avgInterval - 1) <= tolerance) return 'daily';
  if (Math.abs(avgInterval - 7) <= (tolerance + 1)) return 'weekly';
  if (Math.abs(avgInterval - 14) <= (tolerance + 1)) return 'biweekly';
  if (Math.abs(avgInterval - 30) <= (tolerance + 3)) return 'monthly';
  if (Math.abs(avgInterval - 90) <= (tolerance + 5)) return 'quarterly';
  if (Math.abs(avgInterval - 365) <= (tolerance + 10)) return 'yearly';
  return 'custom';
}

/**
 * Formatage de la fréquence pour l'UI
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}