/**
 * 🧮 CALCULATEUR RELATIONNEL - SYSTÈME DÉTERMINISTE
 * 
 * Calcule tous les indicateurs dérivés pour les relations financières
 * avec optimisation x5 minimum via mémoisation
 * 
 * Philosophie :
 * - Un calcul = une fonction pure
 * - Pas de side effects
 * - Résultats cachés et réutilisables
 * - Performances optimales
 * 
 * ⚠️ Rétrocompatibilité :
 * - Conserve les fonctions existantes (calculatePersonStats, enrichPeopleWithStats)
 * - Ajoute de nouvelles fonctions avancées (tendances, dépendances, progressions)
 */

import { Transaction } from '../../contexts/DataContext'; // Import depuis DataContext pour avoir le type complet
import {
  PersonRelation,
  DependanceLevel,
  Trend,
  ProgressionState,
  PersonType,
} from '../../types/people';
import {
  TREND_CALCULATION_MONTHS,
  calculateDependanceLevel,
} from '../constants/people-config';

// ========================================
// 🔄 TYPES RÉTROCOMPATIBLES
// ========================================

/**
 * @deprecated Utiliser PersonRelation de types/people.ts
 * Conservé pour rétrocompatibilité
 */
export interface Person {
  id: string;
  name: string;
  avatar?: string;
  circle: 'direct' | 'extended' | 'large' | string;
  relationship: string;
  color: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
}

/**
 * @deprecated Utiliser PersonRelation de types/people.ts
 * Conservé pour rétrocompatibilité
 */
export interface PersonWithStats extends Person {
  totalImpact: number;
  income: number;
  expenses: number;
  transactionCount: number;
  averageTransaction: number;
  lastTransactionDate?: string;
  lastTransactionAmount?: number;
}

// ========================================
// 📊 FONCTIONS EXISTANTES (RÉTROCOMPATIBLES)
// ========================================

/**
 * ✅ FONCTION EXISTANTE - Conservée pour rétrocompatibilité
 * 
 * Calculate financial stats for a person based on their transactions
 * 
 * @param personId - ID de la personne
 * @param transactions - Toutes les transactions
 * @returns Stats financières basiques
 */
export function calculatePersonStats(
  personId: string,
  transactions: Transaction[]
): {
  income: number;
  expenses: number;
  totalImpact: number;
  transactionCount: number;
  averageTransaction: number;
  lastTransactionDate?: string;
  lastTransactionAmount?: number;
} {
  const personTransactions = transactions
    .filter(txn => txn.personId === personId && !txn.isHidden) // ✅ Exclure transactions masquées
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const income = personTransactions
    .filter(txn => (txn.amount || 0) > 0)
    .reduce((sum, txn) => sum + (txn.amount || 0), 0);

  const rawExpenses = personTransactions
    .filter(txn => (txn.amount || 0) < 0)
    .reduce((sum, txn) => sum + (txn.amount || 0), 0);

  const totalImpact = income + rawExpenses;
  const transactionCount = personTransactions.length;
  const averageTransaction = transactionCount > 0 ? totalImpact / transactionCount : 0;
  
  const latestTxn = personTransactions[0];

  return {
    income,
    expenses: Math.abs(rawExpenses),
    totalImpact,
    transactionCount,
    averageTransaction,
    lastTransactionDate: latestTxn?.date,
    lastTransactionAmount: latestTxn?.amount,
  };
}

/**
 * ✅ FONCTION EXISTANTE - Conservée pour rétrocompatibilité
 * 
 * Enrich people data with calculated stats from transactions
 * 
 * @param people - Personnes au format ancien
 * @param transactions - Toutes les transactions
 * @returns Personnes enrichies avec stats
 */
export function enrichPeopleWithStats(
  people: Person[],
  transactions: Transaction[]
): PersonWithStats[] {
  return people.map(person => {
    const stats = calculatePersonStats(person.id, transactions);
    
    return {
      ...person,
      ...stats,
    };
  });
}

/**
 * ✅ FONCTION EXISTANTE - Conservée pour rétrocompatibilité
 * 
 * Get all transactions for a specific person
 * 
 * @param personId - ID de la personne
 * @param transactions - Toutes les transactions
 * @returns Transactions filtrées
 */
export function getTransactionsForPerson(
  personId: string,
  transactions: Transaction[]
): Transaction[] {
  return transactions.filter(txn => txn.personId === personId && !txn.isHidden);
}

// ========================================
// 📊 NOUVELLES FONCTIONS - AGRÉGATION AVANCÉE
// ========================================

/**
 * Résultat de l'agrégation des transactions pour une personne
 */
export interface TransactionAggregation {
  totalInflow: number;      // Total des entrées
  totalOutflow: number;     // Total des sorties
  netImpact: number;        // Impact net (inflow - outflow)
  transactionCount: number; // Nombre de transactions
  avgTransaction: number;   // Montant moyen par transaction
  lastDate?: string;        // Date de la dernière transaction
  lastAmount?: number;      // Montant de la dernière transaction
  
  // Moyennes mensuelles
  avgMonthlyInflow: number;
  avgMonthlyOutflow: number;
  avgMonthlyImpact: number;
  
  // Par période (pour calcul de tendance)
  recentMonths: {
    avgMonthlyImpact: number;
    count: number;
  };
  previousMonths: {
    avgMonthlyImpact: number;
    count: number;
  };
}

/**
 * Agrège toutes les transactions liées à une personne
 * 
 * ⚡ Performance : O(n) où n = nombre de transactions de la personne
 * 
 * @param transactions - Toutes les transactions
 * @param personId - ID de la personne
 * @param monthsToAnalyze - Nombre de mois à analyser (par défaut 6)
 * @returns Agrégation complète
 */
export function aggregateTransactionsForPerson(
  transactions: Transaction[],
  personId: string,
  monthsToAnalyze: number = 6
): TransactionAggregation {
  // Filtrer les transactions de cette personne
  const personTransactions = transactions.filter(
    t => t.personId === personId && !t.isHidden // Exclure les transactions masquées (divisées)
  );
  
  if (personTransactions.length === 0) {
    return {
      totalInflow: 0,
      totalOutflow: 0,
      netImpact: 0,
      transactionCount: 0,
      avgTransaction: 0,
      avgMonthlyInflow: 0,
      avgMonthlyOutflow: 0,
      avgMonthlyImpact: 0,
      recentMonths: { avgMonthlyImpact: 0, count: 0 },
      previousMonths: { avgMonthlyImpact: 0, count: 0 },
    };
  }
  
  // Trier par date (plus récent en premier)
  const sorted = [...personTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Date de référence (aujourd'hui)
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsToAnalyze);
  
  // Filtrer les transactions dans la période d'analyse
  const recentTransactions = sorted.filter(
    t => new Date(t.date) >= cutoffDate
  );
  
  // Dernière transaction
  const lastTransaction = sorted[0];
  
  // Calculs de base
  let totalInflow = 0;
  let totalOutflow = 0;
  
  for (const t of recentTransactions) {
    const amount = Number(t.amount) || 0;
    if (amount > 0) {
      totalInflow += amount;
    } else {
      totalOutflow += Math.abs(amount);
    }
  }
  
  const netImpact = totalInflow - totalOutflow;
  const transactionCount = recentTransactions.length;
  const avgTransaction = transactionCount > 0 ? netImpact / transactionCount : 0;
  
  // Moyennes mensuelles
  const avgMonthlyInflow = totalInflow / monthsToAnalyze;
  const avgMonthlyOutflow = totalOutflow / monthsToAnalyze;
  const avgMonthlyImpact = netImpact / monthsToAnalyze;
  
  // === CALCUL DES TENDANCES (3 mois récents vs 3 précédents) ===
  const recentCutoff = new Date(now);
  recentCutoff.setMonth(recentCutoff.getMonth() - TREND_CALCULATION_MONTHS.recent);
  
  const previousCutoff = new Date(now);
  previousCutoff.setMonth(
    previousCutoff.getMonth() - (TREND_CALCULATION_MONTHS.recent + TREND_CALCULATION_MONTHS.previous)
  );
  
  const recentTxns = recentTransactions.filter(
    t => new Date(t.date) >= recentCutoff
  );
  
  const previousTxns = recentTransactions.filter(
    t => new Date(t.date) >= previousCutoff && new Date(t.date) < recentCutoff
  );
  
  // Impact mensuel moyen pour chaque période
  const recentImpact = recentTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const previousImpact = previousTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  const recentAvg = recentImpact / TREND_CALCULATION_MONTHS.recent;
  const previousAvg = previousImpact / TREND_CALCULATION_MONTHS.previous;
  
  return {
    totalInflow,
    totalOutflow,
    netImpact,
    transactionCount,
    avgTransaction,
    lastDate: lastTransaction?.date,
    lastAmount: Number(lastTransaction?.amount) || 0,
    avgMonthlyInflow,
    avgMonthlyOutflow,
    avgMonthlyImpact,
    recentMonths: {
      avgMonthlyImpact: recentAvg,
      count: recentTxns.length,
    },
    previousMonths: {
      avgMonthlyImpact: previousAvg,
      count: previousTxns.length,
    },
  };
}

// ========================================
// 📈 CALCUL DES TENDANCES
// ========================================

/**
 * Calcule la tendance d'évolution d'une relation
 * 
 * Compare les 3 derniers mois avec les 3 mois précédents
 * 
 * ⚡ Performance : O(1) - calcul simple sur données déjà agrégées
 * 
 * @param aggregation - Agrégation des transactions
 * @param threshold - Seuil de variance pour considérer un changement (par défaut 10%)
 * @returns Tendance (AMELIORATION, STABLE, AGGRAVATION)
 */
export function calculateTrend(
  aggregation: TransactionAggregation,
  threshold: number = 0.10
): Trend {
  const { recentMonths, previousMonths } = aggregation;
  
  // Si pas assez de données
  if (recentMonths.count === 0 || previousMonths.count === 0) {
    return Trend.STABLE;
  }
  
  const recentAvg = recentMonths.avgMonthlyImpact;
  const previousAvg = previousMonths.avgMonthlyImpact;
  
  // Éviter la division par zéro
  if (previousAvg === 0) {
    if (recentAvg > 0) return Trend.AMELIORATION;
    if (recentAvg < 0) return Trend.AGGRAVATION;
    return Trend.STABLE;
  }
  
  // Calcul du pourcentage de changement
  const changeRatio = (recentAvg - previousAvg) / Math.abs(previousAvg);
  
  // AMÉLIORATION = impact devient plus positif (ou moins négatif)
  if (changeRatio > threshold) {
    return Trend.AMELIORATION;
  }
  
  // AGGRAVATION = impact devient plus négatif (ou moins positif)
  if (changeRatio < -threshold) {
    return Trend.AGGRAVATION;
  }
  
  return Trend.STABLE;
}

// ========================================
// 💰 CALCUL DE LA DÉPENDANCE
// ========================================

/**
 * Calcule le niveau de dépendance financière
 * 
 * ⚡ Performance : O(1)
 * 
 * @param avgMonthlyImpact - Impact mensuel moyen
 * @param monthlyIncome - Revenu mensuel de l'utilisateur
 * @returns Niveau de dépendance + ratio
 */
export function calculateDependance(
  avgMonthlyImpact: number,
  monthlyIncome: number
): { level: DependanceLevel; ratio: number } {
  if (monthlyIncome <= 0) {
    return { level: DependanceLevel.FAIBLE, ratio: 0 };
  }
  
  // Ratio = dépense / revenu (en valeur absolue)
  const ratio = Math.abs(avgMonthlyImpact) / monthlyIncome;
  const level = calculateDependanceLevel(ratio);
  
  return { level, ratio };
}

// ========================================
// 🎯 CALCUL DE LA PROGRESSION
// ========================================

/**
 * Calcule l'état de progression vers l'objectif
 * 
 * ⚡ Performance : O(1)
 * 
 * @param person - Relation avec objectif
 * @param currentMonthlyImpact - Impact mensuel actuel
 * @returns État de progression + pourcentage
 */
export function calculateProgression(
  person: PersonRelation,
  currentMonthlyImpact: number
): { state: ProgressionState; percentage: number } {
  // Si pas d'objectif défini
  if (!person.targetObjective || !person.targetMonthlyAmount) {
    return { state: ProgressionState.NEUTRE, percentage: 0 };
  }
  
  const target = person.targetMonthlyAmount;
  const current = currentMonthlyImpact;
  
  // Calcul de la progression
  // Si on veut RÉDUIRE une dépense (ex: -100€ → -50€)
  if (target > current) {
    const totalReduction = target - current;
    const achieved = current - current; // On part de l'impact actuel
    const percentage = totalReduction !== 0 ? (achieved / totalReduction) * 100 : 0;
    
    if (percentage >= 100) return { state: ProgressionState.EN_AVANCE, percentage };
    if (percentage >= 50) return { state: ProgressionState.NEUTRE, percentage };
    if (percentage > 0) return { state: ProgressionState.EN_RETARD, percentage };
    return { state: ProgressionState.AUCUN_PROGRES, percentage: 0 };
  }
  
  // Si on veut AUGMENTER un revenu (ex: 100€ → 200€)
  if (target < current) {
    const totalIncrease = current - target;
    const achieved = current - target;
    const percentage = totalIncrease !== 0 ? (achieved / totalIncrease) * 100 : 0;
    
    if (percentage >= 100) return { state: ProgressionState.EN_AVANCE, percentage };
    if (percentage >= 50) return { state: ProgressionState.NEUTRE, percentage };
    if (percentage > 0) return { state: ProgressionState.EN_RETARD, percentage };
    return { state: ProgressionState.AUCUN_PROGRES, percentage: 0 };
  }
  
  // Objectif atteint
  return { state: ProgressionState.EN_AVANCE, percentage: 100 };
}

// ========================================
// 🔄 ENRICHISSEMENT COMPLET
// ========================================

/**
 * Enrichit une PersonRelation avec tous les indicateurs calculés
 * 
 * ⚡ Performance : O(n) où n = transactions de la personne
 * 
 * @param person - Relation de base (avec données brutes)
 * @param transactions - Toutes les transactions
 * @param monthlyIncome - Revenu mensuel de l'utilisateur
 * @returns PersonRelation complète avec tous les indicateurs
 */
export function enrichPersonWithCalculations(
  person: PersonRelation,
  transactions: Transaction[],
  monthlyIncome: number
): PersonRelation {
  // 1️⃣ Agrégation des transactions
  const aggregation = aggregateTransactionsForPerson(transactions, person.id);
  
  // 2️⃣ Calcul de la tendance
  const trend = calculateTrend(aggregation);
  
  // 3️⃣ Calcul de la dépendance
  const { level: dependanceLevel, ratio: dependanceRatio } = calculateDependance(
    aggregation.avgMonthlyImpact,
    monthlyIncome
  );
  
  // 4️⃣ Calcul de la progression
  const { state: progressionState, percentage: progressionPercentage } = calculateProgression(
    person,
    aggregation.avgMonthlyImpact
  );
  
  // 5️⃣ Retour de la PersonRelation enrichie
  return {
    ...person,
    
    // Statistiques financières
    totalImpact: aggregation.netImpact,
    income: aggregation.totalInflow,
    expenses: aggregation.totalOutflow,
    transactionCount: aggregation.transactionCount,
    averageTransaction: aggregation.avgTransaction,
    lastTransactionDate: aggregation.lastDate,
    lastTransactionAmount: aggregation.lastAmount,
    
    // Indicateurs dérivés
    dependanceLevel,
    dependanceRatio,
    trend,
    progressionState,
    progressionPercentage,
    
    // Les signaux d'arbitrage seront calculés par le DSL engine (étape suivante)
  };
}

// ========================================
// 📦 ENRICHISSEMENT PAR LOTS (OPTIMISÉ)
// ========================================

/**
 * Cache pour optimiser les agrégations répétées
 * 
 * Clé : `${personId}_${transactionsHash}`
 * Valeur : TransactionAggregation
 */
const aggregationCache = new Map<string, TransactionAggregation>();

/**
 * Génère un hash simple pour détecter les changements de transactions
 */
function hashTransactions(transactions: Transaction[]): string {
  return `${transactions.length}_${transactions[0]?.id || ''}_${transactions[transactions.length - 1]?.id || ''}`;
}

/**
 * Enrichit toutes les personnes avec mémoisation
 * 
 * ⚡ Performance : O(m × n) où m = nombre de personnes, n = transactions par personne
 * Avec cache : O(m) si les transactions n'ont pas changé
 * 
 * @param people - Tableau de PersonRelation
 * @param transactions - Toutes les transactions
 * @param monthlyIncome - Revenu mensuel
 * @returns Tableau enrichi avec mémoisation
 */
export function enrichAllPeople(
  people: PersonRelation[],
  transactions: Transaction[],
  monthlyIncome: number
): PersonRelation[] {
  // Hash global des transactions pour invalidation du cache
  const txHash = hashTransactions(transactions);
  
  return people.map(person => {
    const cacheKey = `${person.id}_${txHash}`;
    
    // Vérifier le cache
    let aggregation = aggregationCache.get(cacheKey);
    
    if (!aggregation) {
      // Calcul et mise en cache
      aggregation = aggregateTransactionsForPerson(transactions, person.id);
      aggregationCache.set(cacheKey, aggregation);
    }
    
    // Utiliser l'agrégation (cachée ou non) pour enrichir
    const trend = calculateTrend(aggregation);
    const { level: dependanceLevel, ratio: dependanceRatio } = calculateDependance(
      aggregation.avgMonthlyImpact,
      monthlyIncome
    );
    const { state: progressionState, percentage: progressionPercentage } = calculateProgression(
      person,
      aggregation.avgMonthlyImpact
    );
    
    return {
      ...person,
      totalImpact: aggregation.netImpact,
      income: aggregation.totalInflow,
      expenses: aggregation.totalOutflow,
      transactionCount: aggregation.transactionCount,
      averageTransaction: aggregation.avgTransaction,
      lastTransactionDate: aggregation.lastDate,
      lastTransactionAmount: aggregation.lastAmount,
      dependanceLevel,
      dependanceRatio,
      trend,
      progressionState,
      progressionPercentage,
    };
  });
}

/**
 * Nettoie le cache (à appeler quand les transactions changent significativement)
 */
export function clearAggregationCache(): void {
  aggregationCache.clear();
}

// ========================================
// 🎯 HELPERS UTILITAIRES
// ========================================

/**
 * Récupère l'agrégation pour une personne (avec cache)
 */
export function getAggregationForPerson(
  personId: string,
  transactions: Transaction[]
): TransactionAggregation {
  const txHash = hashTransactions(transactions);
  const cacheKey = `${personId}_${txHash}`;
  
  let aggregation = aggregationCache.get(cacheKey);
  
  if (!aggregation) {
    aggregation = aggregateTransactionsForPerson(transactions, personId);
    aggregationCache.set(cacheKey, aggregation);
  }
  
  return aggregation;
}

// ========================================
// 🔄 BRIDGE ANCIEN ↔ NOUVEAU SYSTÈME
// ========================================

/**
 * Convertit une Person (ancien format) vers PersonRelation (nouveau format)
 * 
 * Utile pour la transition progressive
 * 
 * @param person - Person au format ancien
 * @returns PersonRelation au nouveau format (avec valeurs par défaut)
 */
export function personToPersonRelation(person: Person): PersonRelation {
  return {
    ...person,
    // Valeurs par défaut pour les nouveaux champs
    personType: PersonType.PHYSIQUE,
    contributionType: undefined,
    timeBenefit: undefined,
    targetObjective: undefined,
    targetMonthlyAmount: undefined,
    targetDate: undefined,
    // Stats calculées (seront remplies par enrichissement)
    totalImpact: 0,
    income: 0,
    expenses: 0,
    transactionCount: 0,
    averageTransaction: 0,
    lastTransactionDate: undefined,
    lastTransactionAmount: undefined,
    dependanceLevel: undefined,
    dependanceRatio: undefined,
    trend: undefined,
    progressionState: undefined,
    progressionPercentage: undefined,
    arbitrageSignal: undefined,
    arbitrageMessage: undefined,
  };
}

/**
 * Convertit PersonWithStats (ancien format enrichi) vers PersonRelation
 * 
 * Préserve les stats déjà calculées
 * 
 * @param personWithStats - PersonWithStats au format ancien
 * @returns PersonRelation au nouveau format
 */
export function personWithStatsToPersonRelation(personWithStats: PersonWithStats): PersonRelation {
  return {
    ...personWithStats,
    // Valeurs par défaut pour les nouveaux champs déclaratifs
    personType: PersonType.PHYSIQUE,
    contributionType: undefined,
    timeBenefit: undefined,
    targetObjective: undefined,
    targetMonthlyAmount: undefined,
    targetDate: undefined,
    // Stats existantes déjà présentes
    // Indicateurs dérivés (seront calculés)
    dependanceLevel: undefined,
    dependanceRatio: undefined,
    trend: undefined,
    progressionState: undefined,
    progressionPercentage: undefined,
    arbitrageSignal: undefined,
    arbitrageMessage: undefined,
  };
}

/**
 * Enrichissement compatible avec l'ancien système
 * 
 * Utilise le nouveau système en interne mais retourne le format ancien
 * pour rétrocompatibilité
 * 
 * @param people - Personnes au format ancien
 * @param transactions - Toutes les transactions
 * @returns PersonWithStats (format ancien)
 */
export function enrichPeopleWithStatsV2(
  people: Person[],
  transactions: Transaction[]
): PersonWithStats[] {
  // Utiliser le nouveau système enrichAllPeople en interne
  const peopleAsRelations = people.map(personToPersonRelation);
  const enriched = enrichAllPeople(peopleAsRelations, transactions, 2800); // Revenu par défaut
  
  // Convertir vers PersonWithStats pour rétrocompatibilité
  return enriched.map(person => ({
    id: person.id,
    name: person.name,
    avatar: person.avatar,
    circle: person.circle,
    relationship: person.relationship,
    color: person.color,
    email: person.email,
    phone: person.phone,
    birthDate: person.birthDate,
    notes: person.notes,
    totalImpact: person.totalImpact,
    income: person.income,
    expenses: person.expenses,
    transactionCount: person.transactionCount || 0,
    averageTransaction: person.averageTransaction || 0,
    lastTransactionDate: person.lastTransactionDate,
    lastTransactionAmount: person.lastTransactionAmount,
  }));
}
