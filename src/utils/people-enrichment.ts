/**
 * 🎯 ORCHESTRATEUR PRINCIPAL - ENRICHISSEMENT COMPLET
 * 
 * Combine tous les calculateurs pour produire des PersonRelation complètes
 * avec toutes les dimensions calculées
 * 
 * ⚡ Performance : O(n) optimisé avec mémoisation et cache
 * 
 * Architecture :
 * 1. Agrégation transactions → stats financières
 * 2. Calcul indicateurs → tendances, dépendances, progressions
 * 3. Exécution DSL → signaux d'arbitrage
 * 4. Calcul scores globaux → liberté + résilience
 */

import { Transaction } from '../../contexts/DataContext';
import {
  PersonRelation,
  PeopleScores,
  ArbitrageRule,
} from '../../types/people';
import {
  enrichAllPeople,
  clearAggregationCache,
} from './people-calculator';
import {
  enrichAllWithArbitrageSignals,
} from './people-dsl-engine';
import {
  calculatePeopleScores,
} from './people-scores';
import { DEFAULT_MONTHLY_INCOME } from '../constants/people-config';
import { migrateIfNeeded } from './people-migration';

// ========================================
// 📊 CONTEXTE D'ENRICHISSEMENT
// ========================================

/**
 * Contexte global pour l'enrichissement
 * Permet de partager des données entre les différents calculateurs
 */
export interface EnrichmentContext {
  transactions: Transaction[];
  monthlyIncome: number;
  customRules?: ArbitrageRule[];
}

/**
 * Résultat complet de l'enrichissement
 */
export interface EnrichmentResult {
  people: PersonRelation[];
  scores: PeopleScores;
  stats: {
    totalPeople: number;
    totalTransactions: number;
    avgMonthlyImpact: number;
    peopleWithObjectives: number;
    peopleInProgress: number;
  };
}

// ========================================
// 🔄 PIPELINE D'ENRICHISSEMENT
// ========================================

/**
 * Enrichit toutes les personnes avec le pipeline complet
 * 
 * Pipeline :
 * 1. Migration automatique (si nécessaire)
 * 2. Enrichissement avec stats financières + indicateurs
 * 3. Enrichissement avec signaux d'arbitrage
 * 4. Calcul des scores globaux
 * 
 * ⚡ Performance : O(n) optimisé
 * - 1 passe pour migration
 * - 1 passe pour stats financières (avec cache)
 * - 1 passe pour signaux DSL
 * - 1 passe pour scores
 * Total : O(4n) = O(n)
 * 
 * @param rawPeople - Personnes brutes (peuvent être ancien format)
 * @param context - Contexte d'enrichissement
 * @returns Résultat complet avec people enrichies + scores
 */
export function enrichPeoplePipeline(
  rawPeople: any[],
  context: EnrichmentContext
): EnrichmentResult {
  const { transactions, monthlyIncome, customRules } = context;
  
  // === ÉTAPE 1 : Migration automatique ===
  const migratedPeople = migrateIfNeeded(rawPeople);
  
  // === ÉTAPE 2 : Enrichissement avec stats financières + indicateurs ===
  const peopleWithStats = enrichAllPeople(
    migratedPeople,
    transactions,
    monthlyIncome
  );
  
  // === ÉTAPE 3 : Enrichissement avec signaux d'arbitrage ===
  const peopleWithArbitrage = enrichAllWithArbitrageSignals(
    peopleWithStats,
    customRules
  );
  
  // === ÉTAPE 4 : Calcul des scores globaux ===
  const scores = calculatePeopleScores(peopleWithArbitrage, monthlyIncome);
  
  // === ÉTAPE 5 : Calcul des statistiques globales ===
  const stats = calculateGlobalStats(peopleWithArbitrage, transactions);
  
  return {
    people: peopleWithArbitrage,
    scores,
    stats,
  };
}

/**
 * Calcule des statistiques globales sur l'ensemble des relations
 * 
 * @param people - Relations enrichies
 * @param transactions - Toutes les transactions
 * @returns Statistiques globales
 */
function calculateGlobalStats(
  people: PersonRelation[],
  transactions: Transaction[]
): EnrichmentResult['stats'] {
  // Transactions non masquées (exclure les sous-transactions)
  const visibleTransactions = transactions.filter(t => !t.isHidden);
  
  // Impact mensuel moyen total
  const totalMonthlyImpact = people.reduce(
    (sum, p) => sum + (p.totalImpact || 0),
    0
  );
  const avgMonthlyImpact = totalMonthlyImpact / (people.length || 1);
  
  // Personnes avec objectifs
  const peopleWithObjectives = people.filter(p => p.targetObjective).length;
  
  // Personnes en progression (amélioration)
  const peopleInProgress = people.filter(
    p => p.trend === 'AMELIORATION'
  ).length;
  
  return {
    totalPeople: people.length,
    totalTransactions: visibleTransactions.length,
    avgMonthlyImpact,
    peopleWithObjectives,
    peopleInProgress,
  };
}

// ========================================
// 🎯 HOOKS D'OPTIMISATION
// ========================================

/**
 * Cache global des résultats d'enrichissement
 * 
 * Clé : hash des inputs (people + transactions + monthlyIncome)
 * Valeur : EnrichmentResult
 */
const enrichmentCache = new Map<string, EnrichmentResult>();

/**
 * Génère une clé de cache pour l'enrichissement
 */
function generateCacheKey(
  people: any[],
  transactions: Transaction[],
  monthlyIncome: number
): string {
  return `${people.length}_${transactions.length}_${monthlyIncome}_${people[0]?.id || ''}_${transactions[0]?.id || ''}`;
}

/**
 * Enrichit avec mémoisation automatique
 * 
 * Si les inputs n'ont pas changé, retourne le résultat en cache
 * 
 * ⚡ Performance : O(1) si en cache, O(n) sinon
 * 
 * @param rawPeople - Personnes brutes
 * @param context - Contexte d'enrichissement
 * @param useCache - Activer le cache (par défaut true)
 * @returns Résultat enrichi (potentiellement en cache)
 */
export function enrichPeopleWithCache(
  rawPeople: any[],
  context: EnrichmentContext,
  useCache: boolean = true
): EnrichmentResult {
  const cacheKey = generateCacheKey(
    rawPeople,
    context.transactions,
    context.monthlyIncome
  );
  
  // Vérifier le cache
  if (useCache && enrichmentCache.has(cacheKey)) {
    return enrichmentCache.get(cacheKey)!;
  }
  
  // Calcul complet
  const result = enrichPeoplePipeline(rawPeople, context);
  
  // Mise en cache
  if (useCache) {
    enrichmentCache.set(cacheKey, result);
  }
  
  return result;
}

/**
 * Nettoie tous les caches
 * 
 * À appeler quand les données changent significativement
 * (ajout/suppression de personne, import de transactions, etc.)
 */
export function clearAllCaches(): void {
  enrichmentCache.clear();
  clearAggregationCache();
}

// ========================================
// 🔍 FILTRAGE ET RECHERCHE
// ========================================

/**
 * Filtre les personnes selon des critères
 */
export interface PeopleFilter {
  circles?: string[];
  contributionTypes?: string[];
  dependanceLevels?: string[];
  trends?: string[];
  arbitrageSignals?: string[];
  personTypes?: string[];
  searchQuery?: string;
}

/**
 * Filtre les personnes enrichies selon des critères
 * 
 * @param people - Personnes enrichies
 * @param filter - Critères de filtrage
 * @returns Personnes filtrées
 */
export function filterPeople(
  people: PersonRelation[],
  filter: PeopleFilter
): PersonRelation[] {
  return people.filter(person => {
    // Filtre par cercle
    if (filter.circles && filter.circles.length > 0) {
      if (!filter.circles.includes(person.circle)) {
        return false;
      }
    }
    
    // Filtre par type de contribution
    if (filter.contributionTypes && filter.contributionTypes.length > 0) {
      if (!person.contributionType || !filter.contributionTypes.includes(person.contributionType)) {
        return false;
      }
    }
    
    // Filtre par niveau de dépendance
    if (filter.dependanceLevels && filter.dependanceLevels.length > 0) {
      if (!person.dependanceLevel || !filter.dependanceLevels.includes(person.dependanceLevel)) {
        return false;
      }
    }
    
    // Filtre par tendance
    if (filter.trends && filter.trends.length > 0) {
      if (!person.trend || !filter.trends.includes(person.trend)) {
        return false;
      }
    }
    
    // Filtre par signal d'arbitrage
    if (filter.arbitrageSignals && filter.arbitrageSignals.length > 0) {
      if (!person.arbitrageSignal || !filter.arbitrageSignals.includes(person.arbitrageSignal)) {
        return false;
      }
    }
    
    // Filtre par type de personne
    if (filter.personTypes && filter.personTypes.length > 0) {
      if (!filter.personTypes.includes(person.personType)) {
        return false;
      }
    }
    
    // Recherche textuelle
    if (filter.searchQuery && filter.searchQuery.trim() !== '') {
      const query = filter.searchQuery.toLowerCase();
      const searchableText = [
        person.name,
        person.relationship,
        person.notes,
        person.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      if (!searchableText.includes(query)) {
        return false;
      }
    }
    
    return true;
  });
}

// ========================================
// 📊 TRI ET CLASSEMENT
// ========================================

/**
 * Critères de tri disponibles
 */
export type SortCriteria =
  | 'name'
  | 'totalImpact'
  | 'dependance'
  | 'trend'
  | 'progression'
  | 'lastTransaction';

/**
 * Trie les personnes selon un critère
 * 
 * @param people - Personnes enrichies
 * @param criteria - Critère de tri
 * @param ascending - Ordre croissant (par défaut false)
 * @returns Personnes triées
 */
export function sortPeople(
  people: PersonRelation[],
  criteria: SortCriteria,
  ascending: boolean = false
): PersonRelation[] {
  const sorted = [...people].sort((a, b) => {
    let comparison = 0;
    
    switch (criteria) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      
      case 'totalImpact':
        comparison = (a.totalImpact || 0) - (b.totalImpact || 0);
        break;
      
      case 'dependance':
        comparison = (a.dependanceRatio || 0) - (b.dependanceRatio || 0);
        break;
      
      case 'trend':
        const trendOrder = { AMELIORATION: 1, STABLE: 0, AGGRAVATION: -1 };
        comparison =
          (trendOrder[a.trend as keyof typeof trendOrder] || 0) -
          (trendOrder[b.trend as keyof typeof trendOrder] || 0);
        break;
      
      case 'progression':
        comparison = (a.progressionPercentage || 0) - (b.progressionPercentage || 0);
        break;
      
      case 'lastTransaction':
        const dateA = a.lastTransactionDate ? new Date(a.lastTransactionDate).getTime() : 0;
        const dateB = b.lastTransactionDate ? new Date(b.lastTransactionDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
    }
    
    return ascending ? comparison : -comparison;
  });
  
  return sorted;
}

// ========================================
// 🎯 HELPERS RAPIDES
// ========================================

/**
 * Récupère les personnes avec des signaux d'alerte
 */
export function getPeopleWithAlerts(people: PersonRelation[]): PersonRelation[] {
  return people.filter(
    p =>
      p.arbitrageSignal === 'REDUIRE' ||
      p.arbitrageSignal === 'SURVEILLER' ||
      p.trend === 'AGGRAVATION'
  );
}

/**
 * Récupère les personnes en amélioration
 */
export function getPeopleInProgress(people: PersonRelation[]): PersonRelation[] {
  return people.filter(p => p.trend === 'AMELIORATION');
}

/**
 * Récupère les personnes sans objectif défini
 */
export function getPeopleWithoutObjectives(people: PersonRelation[]): PersonRelation[] {
  return people.filter(p => !p.targetObjective);
}
