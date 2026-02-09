/**
 * 🎯 ORCHESTRATEUR PRINCIPAL - ENRICHISSEMENT COMPLET
 * * Combine tous les calculateurs pour produire des PersonRelation complètes
 * avec toutes les dimensions calculées
 * * ⚡ Performance : O(n) optimisé avec mémoisation et cache
 * * Architecture :
 * 1. Agrégation transactions → stats financières
 * 2. Calcul indicateurs → tendances, dépendances, progressions
 * 3. Exécution DSL → signaux d'arbitrage
 * 4. Calcul scores globaux → liberté + résilience
 */

import { Transaction } from '../contexts/DataContext';
import {
  PersonRelation,
  PeopleScores,
  ArbitrageRule,
} from '../types/people';
import {
  enrichAllPeople,
  clearAggregationCache,
} from '@/utils/people-calculator';
import {
  enrichAllWithArbitrageSignals,
} from '@/utils/people-dsl-engine';
import {
  calculatePeopleScores,
} from '@/utils/people-scores';
import { DEFAULT_MONTHLY_INCOME } from '@/constants/people-config';
import { migrateIfNeeded } from '@/utils/people-migration';

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
 * * Pipeline :
 * 1. Migration automatique (si nécessaire)
 * 2. Enrichissement avec stats financières + indicateurs
 * 3. Enrichissement avec signaux d'arbitrage
 * 4. Calcul des scores globaux
 * * ⚡ Performance : O(n) optimisé
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
 */
function calculateGlobalStats(
  people: PersonRelation[],
  transactions: Transaction[]
): EnrichmentResult['stats'] {
  // Transactions non masquées
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
  
  if (useCache && enrichmentCache.has(cacheKey)) {
    return enrichmentCache.get(cacheKey)!;
  }
  
  const result = enrichPeoplePipeline(rawPeople, context);
  
  if (useCache) {
    enrichmentCache.set(cacheKey, result);
  }
  
  return result;
}

/**
 * Nettoie tous les caches
 */
export function clearAllCaches(): void {
  enrichmentCache.clear();
  clearAggregationCache();
}

// ========================================
// 🔍 FILTRAGE ET RECHERCHE
// ========================================

export interface PeopleFilter {
  circles?: string[];
  contributionTypes?: string[];
  dependanceLevels?: string[];
  trends?: string[];
  arbitrageSignals?: string[];
  personTypes?: string[];
  searchQuery?: string;
}

export function filterPeople(
  people: PersonRelation[],
  filter: PeopleFilter
): PersonRelation[] {
  return people.filter(person => {
    if (filter.circles?.length && !filter.circles.includes(person.circle)) return false;
    
    if (filter.contributionTypes?.length && 
        (!person.contributionType || !filter.contributionTypes.includes(person.contributionType))) return false;
    
    if (filter.dependanceLevels?.length && 
        (!person.dependanceLevel || !filter.dependanceLevels.includes(person.dependanceLevel))) return false;
    
    if (filter.trends?.length && 
        (!person.trend || !filter.trends.includes(person.trend))) return false;
    
    if (filter.arbitrageSignals?.length && 
        (!person.arbitrageSignal || !filter.arbitrageSignals.includes(person.arbitrageSignal))) return false;
    
    if (filter.personTypes?.length && !filter.personTypes.includes(person.personType)) return false;
    
    if (filter.searchQuery?.trim()) {
      const query = filter.searchQuery.toLowerCase();
      const searchableText = [
        person.name,
        person.relationship,
        person.notes,
        person.email,
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) return false;
    }
    
    return true;
  });
}

// ========================================
// 📊 TRI ET CLASSEMENT
// ========================================

export type SortCriteria =
  | 'name'
  | 'totalImpact'
  | 'dependance'
  | 'trend'
  | 'progression'
  | 'lastTransaction';

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
        comparison = (trendOrder[a.trend as keyof typeof trendOrder] || 0) - 
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

export function getPeopleWithAlerts(people: PersonRelation[]): PersonRelation[] {
  return people.filter(
    p => p.arbitrageSignal === 'REDUIRE' || 
         p.arbitrageSignal === 'SURVEILLER' || 
         p.trend === 'AGGRAVATION'
  );
}

export function getPeopleInProgress(people: PersonRelation[]): PersonRelation[] {
  return people.filter(p => p.trend === 'AMELIORATION');
}

export function getPeopleWithoutObjectives(people: PersonRelation[]): PersonRelation[] {
  return people.filter(p => !p.targetObjective);
}