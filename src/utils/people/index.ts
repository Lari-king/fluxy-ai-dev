/**
 * 🎯 INDEX - SYSTÈME RELATIONNEL PEOPLE
 * 
 * Point d'entrée unique pour tous les utilitaires People
 * Facilite les imports et maintient une API claire
 */

// ========================================
// 📊 CALCULATEURS
// ========================================

// Fonctions existantes (rétrocompatibles)
export {
    calculatePersonStats,
    enrichPeopleWithStats,
    getTransactionsForPerson,
    // Types existants
    type Person,
    type PersonWithStats,
  } from '../people-calculator';
  
  // Nouvelles fonctions avancées
  export {
    aggregateTransactionsForPerson,
    calculateTrend,
    calculateDependance,
    calculateProgression,
    enrichPersonWithCalculations,
    enrichAllPeople,
    clearAggregationCache,
    getAggregationForPerson,
    // Bridge ancien ↔ nouveau
    personToPersonRelation,
    personWithStatsToPersonRelation,
    enrichPeopleWithStatsV2,
    // Types
    type TransactionAggregation,
  } from '../people-calculator';
  
  // ========================================
  // 🎯 SCORES
  // ========================================
  
  export {
    calculateLibertéFinanciereScore,
    calculateResilienceHumaineScore,
    calculatePeopleScores,
    interpretLibertéScore,
    interpretResilienceScore,
    generateRecommendations,
  } from '../people-scores';
  
  // ========================================
  // 🤖 MOTEUR DSL
  // ========================================
  
  export {
    executeRulesForPerson,
    enrichWithArbitrageSignals,
    enrichAllWithArbitrageSignals,
    validateRule,
    mergeRules,
    generateRuleStats,
    createCondition,
    createRule,
    // Types
    type RuleStats,
  } from '../people-dsl-engine';
  
  // ========================================
  // 🚀 ORCHESTRATEUR
  // ========================================
  
  export {
    enrichPeoplePipeline,
    enrichPeopleWithCache,
    clearAllCaches,
    filterPeople,
    sortPeople,
    getPeopleWithAlerts,
    getPeopleInProgress,
    getPeopleWithoutObjectives,
    // Types
    type EnrichmentContext,
    type EnrichmentResult,
    type PeopleFilter,
    type SortCriteria,
  } from '../people-enrichment';
  
  // ========================================
  // 🔄 MIGRATION
  // ========================================
  
  export {
    migrateLegacyPerson,
    migrateLegacyPeople,
    migrateIfNeeded,
    needsMigration,
    sanitizePersonForSave,
    sanitizePeopleForSave,
  } from '../people-migration';
  
  // ========================================
  // ⚙️ CONFIGURATION
  // ========================================
  
  export {
    DEPENDANCE_THRESHOLDS,
    LIBERTE_SCORE_CONFIG,
    RESILIENCE_SCORE_CONFIG,
    DEFAULT_ARBITRAGE_RULES,
    CONTRIBUTION_TYPE_CONFIG,
    TIME_BENEFIT_CONFIG,
    TREND_CONFIG,
    ARBITRAGE_SIGNAL_CONFIG,
    COACHING_QUESTIONS,
    DEFAULT_MONTHLY_INCOME,
    TREND_CALCULATION_MONTHS,
    DEFAULT_PERSON_VALUES,
    calculateDependanceLevel,
  } from '../../constants/people-config';
  
  // ========================================
  // 📘 TYPES CENTRAUX
  // ========================================
  
  export {
    // Enums
    ContributionType,
    TimeBenefit,
    TargetObjective,
    DependanceLevel,
    Trend,
    ProgressionState,
    ArbitrageSignal,
    PersonType,
    ScenarioVariableType,
    // Interfaces
    type PersonRelation,
    type LibertéFinanciereScore,
    type ResilienceHumaineScore,
    type PeopleScores,
    type ArbitrageRule,
    type RuleCondition,
    type ScenarioChange,
    type ScenarioResult,
    type PeopleExport,
    type CircleConfig,
    // Labels
    CONTRIBUTION_TYPE_LABELS,
    TIME_BENEFIT_LABELS,
    TARGET_OBJECTIVE_LABELS,
    DEPENDANCE_LEVEL_LABELS,
    TREND_LABELS,
    PROGRESSION_STATE_LABELS,
    DEFAULT_CIRCLES,
  } from '../../../types/people';
  