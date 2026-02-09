/**
 * ⚙️ CONFIGURATION - SYSTÈME RELATIONNEL FINANCIER
 * 
 * Constantes, seuils et règles par défaut pour le calcul
 * des indicateurs et scores du système People
 */

import {
    ContributionType,
    TimeBenefit,
    TargetObjective,
    DependanceLevel,
    Trend,
    ProgressionState,
    ArbitrageSignal,
    ArbitrageRule,
    PersonType,
  } from '../types/people';
  
  // ========================================
  // 🎯 SEUILS DE DÉPENDANCE
  // ========================================
  
  /**
   * Seuils pour calculer le niveau de dépendance
   * Basé sur le ratio (dépense mensuelle / revenu mensuel)
   */
  export const DEPENDANCE_THRESHOLDS = {
    FAIBLE: 0.05,    // < 5% du revenu
    MODEREE: 0.15,   // 5-15% du revenu
    // > 15% = FORTE
  } as const;
  
  /**
   * Calcule le niveau de dépendance en fonction du ratio
   */
  export function calculateDependanceLevel(ratio: number): DependanceLevel {
    if (ratio < DEPENDANCE_THRESHOLDS.FAIBLE) {
      return DependanceLevel.FAIBLE;
    } else if (ratio < DEPENDANCE_THRESHOLDS.MODEREE) {
      return DependanceLevel.MODEREE;
    } else {
      return DependanceLevel.FORTE;
    }
  }
  
  // ========================================
  // 📊 CALCUL DES SCORES
  // ========================================
  
  /**
   * Configuration pour le score de Liberté Financière
   */
  export const LIBERTE_SCORE_CONFIG = {
    pilier1: {
      maxPoints: 40,
      seuils: {
        excellent: 0.30,  // < 30% de charges rigides = 40 pts
        bon: 0.50,        // 30-50% = 30 pts
        moyen: 0.70,      // 50-70% = 15 pts
        // > 70% = 0 pts
      },
    },
    pilier2: {
      maxPoints: 30,
      seuils: {
        excellent: 0.05,  // < 5% de dépendances pénalisantes = 30 pts
        bon: 0.15,        // 5-15% = 20 pts
        moyen: 0.30,      // 15-30% = 10 pts
        // > 30% = 0 pts
      },
    },
    pilier3: {
      maxPoints: 30,
      seuils: {
        excellent: 0.70,  // > 70% de relations en amélioration = 30 pts
        bon: 0.40,        // 40-70% = 20 pts
        moyen: 0.10,      // 10-40% = 10 pts
        // < 10% = 0 pts
      },
    },
  } as const;
  
  /**
   * Configuration pour le score de Résilience Humaine
   */
  export const RESILIENCE_SCORE_CONFIG = {
    pilier1: {
      maxPoints: 30,
      seuils: {
        excellent: 0.80,  // > 80% de relations avec contribution définie = 30 pts
        bon: 0.50,        // 50-80% = 20 pts
        // < 50% = 10 pts
      },
    },
    pilier2: {
      maxPoints: 30,
      seuils: {
        excellent: 0.60,  // > 60% de relations avec objectif = 30 pts
        bon: 0.30,        // 30-60% = 20 pts
        // < 30% = 10 pts
      },
    },
    pilier3: {
      maxPoints: 40,
      seuils: {
        excellent: 0.70,  // > 70% de relations en amélioration = 40 pts
        bon: 0.40,        // 40-70% = 25 pts
        // < 40% = 10 pts
      },
    },
  } as const;
  
  // ========================================
  // 🤖 RÈGLES D'ARBITRAGE PAR DÉFAUT
  // ========================================
  
  /**
   * Règles DSL d'arbitrage automatique
   * 
   * Ces règles produisent des signaux, jamais de décisions
   */
  export const DEFAULT_ARBITRAGE_RULES: ArbitrageRule[] = [
    // Règle 1 : Relations confortables mais pénalisantes
    {
      id: 'R01',
      name: 'Arbitrage confort/long terme',
      priority: 1,
      conditions: [
        { field: 'dependanceLevel', operator: 'IN', value: [DependanceLevel.MODEREE, DependanceLevel.FORTE] },
        { field: 'timeBenefit', operator: 'EQUALS', value: TimeBenefit.COURT_POSITIF_LONG_NEGATIF },
        { field: 'personType', operator: 'EQUALS', value: PersonType.MORALE },
      ],
      signal: ArbitrageSignal.REDUIRE,
      message: 'Relation confortable mais pénalisante à long terme',
      active: true,
    },
    
    // Règle 2 : Relations vertueuses à renforcer
    {
      id: 'R02',
      name: 'Renforcer la croissance',
      priority: 2,
      conditions: [
        { field: 'contributionType', operator: 'EQUALS', value: ContributionType.CROISSANCE },
        { field: 'trend', operator: 'EQUALS', value: Trend.AMELIORATION },
      ],
      signal: ArbitrageSignal.RENFORCER,
      message: 'Effort aligné avec ton futur',
      active: true,
    },
    
    // Règle 3 : Protection relations humaines
    {
      id: 'R03',
      name: 'Protéger relations humaines',
      priority: 3,
      conditions: [
        { field: 'personType', operator: 'EQUALS', value: PersonType.PHYSIQUE },
        { field: 'contributionType', operator: 'IN', value: [ContributionType.SURVIE, ContributionType.SECURITE] },
      ],
      signal: ArbitrageSignal.ASSUMER,
      message: 'Relation humaine structurante',
      active: true,
    },
    
    // Règle 4 : Détection d'aggravation
    {
      id: 'R04',
      name: 'Alerte aggravation',
      priority: 1,
      conditions: [
        { field: 'trend', operator: 'EQUALS', value: Trend.AGGRAVATION },
        { field: 'progressionState', operator: 'EQUALS', value: ProgressionState.EN_RETARD },
      ],
      signal: ArbitrageSignal.SURVEILLER,
      message: 'Cette relation mérite ton attention',
      active: true,
    },
    
    // Règle 5 : Relations d'évitement
    {
      id: 'R05',
      name: 'Question évitement',
      priority: 2,
      conditions: [
        { field: 'contributionType', operator: 'EQUALS', value: ContributionType.EVITEMENT },
        { field: 'dependanceLevel', operator: 'IN', value: [DependanceLevel.MODEREE, DependanceLevel.FORTE] },
      ],
      signal: ArbitrageSignal.SURVEILLER,
      message: 'Est-ce vraiment nécessaire ?',
      active: true,
    },
  ];
  
  // ========================================
  // 🎨 ICÔNES ET COULEURS PAR TYPE
  // ========================================
  
  /**
   * Configuration visuelle pour les types de contribution
   */
  export const CONTRIBUTION_TYPE_CONFIG = {
    [ContributionType.SURVIE]: {
      color: 'from-red-500 to-orange-500',
      bgLight: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-600',
      icon: '🔥',
      emoji: '🍞',
    },
    [ContributionType.SECURITE]: {
      color: 'from-blue-500 to-cyan-500',
      bgLight: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-600',
      icon: '🛡️',
      emoji: '🏠',
    },
    [ContributionType.CROISSANCE]: {
      color: 'from-green-500 to-emerald-500',
      bgLight: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-600',
      icon: '🌱',
      emoji: '📈',
    },
    [ContributionType.CONFORT]: {
      color: 'from-purple-500 to-indigo-500',
      bgLight: 'bg-purple-50 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-600',
      icon: '✨',
      emoji: '🛋️',
    },
    [ContributionType.PLAISIR]: {
      color: 'from-pink-500 to-rose-500',
      bgLight: 'bg-pink-50 dark:bg-pink-950/20',
      border: 'border-pink-200 dark:border-pink-800',
      textColor: 'text-pink-600',
      icon: '🎉',
      emoji: '😊',
    },
    [ContributionType.EVITEMENT]: {
      color: 'from-gray-500 to-slate-500',
      bgLight: 'bg-gray-50 dark:bg-gray-950/20',
      border: 'border-gray-200 dark:border-gray-800',
      textColor: 'text-gray-600',
      icon: '⚠️',
      emoji: '🚫',
    },
  } as const;
  
  /**
   * Configuration visuelle pour les bénéfices temporels
   */
  export const TIME_BENEFIT_CONFIG = {
    [TimeBenefit.COURT_TERME]: {
      color: 'text-orange-600',
      icon: '⏱️',
    },
    [TimeBenefit.LONG_TERME]: {
      color: 'text-blue-600',
      icon: '🌱',
    },
    [TimeBenefit.COURT_POSITIF_LONG_NEGATIF]: {
      color: 'text-yellow-600',
      icon: '⚠️',
    },
    [TimeBenefit.COURT_NEGATIF_LONG_POSITIF]: {
      color: 'text-green-600',
      icon: '💎',
    },
  } as const;
  
  /**
   * Configuration visuelle pour les tendances
   */
  export const TREND_CONFIG = {
    [Trend.AMELIORATION]: {
      color: 'text-green-600',
      bgLight: 'bg-green-50 dark:bg-green-950/20',
      icon: '📈',
      emoji: '✅',
    },
    [Trend.STABLE]: {
      color: 'text-blue-600',
      bgLight: 'bg-blue-50 dark:bg-blue-950/20',
      icon: '➖',
      emoji: '⏸️',
    },
    [Trend.AGGRAVATION]: {
      color: 'text-red-600',
      bgLight: 'bg-red-50 dark:bg-red-950/20',
      icon: '📉',
      emoji: '⚠️',
    },
  } as const;
  
  /**
   * Configuration visuelle pour les signaux d'arbitrage
   */
  export const ARBITRAGE_SIGNAL_CONFIG = {
    [ArbitrageSignal.REDUIRE]: {
      color: 'text-orange-600',
      bgLight: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: '📉',
    },
    [ArbitrageSignal.SURVEILLER]: {
      color: 'text-yellow-600',
      bgLight: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: '👁️',
    },
    [ArbitrageSignal.ASSUMER]: {
      color: 'text-blue-600',
      bgLight: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: '🤝',
    },
    [ArbitrageSignal.RENFORCER]: {
      color: 'text-green-600',
      bgLight: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-800',
      icon: '💪',
    },
    [ArbitrageSignal.PROTEGER]: {
      color: 'text-purple-600',
      bgLight: 'bg-purple-50 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: '🛡️',
    },
  } as const;
  
  // ========================================
  // 📝 QUESTIONS OUVERTES (EXPORT COACHING)
  // ========================================
  
  /**
   * Questions pour l'export coaching/thérapeutique
   */
  export const COACHING_QUESTIONS = [
    'Quelle relation te coûte le plus mentalement, au-delà de l\'argent ?',
    'Laquelle soutient ton futur sans reconnaissance immédiate ?',
    'Que se passerait-il si tu ne changeais rien pendant 3 ans ?',
    'Quelle relation aimerais-tu transformer en priorité ?',
    'Y a-t-il une dépense que tu fais par habitude plutôt que par choix ?',
    'Quelle personne ou relation financière apporte le plus de stabilité dans ta vie ?',
    'Si ton revenu baissait de 30%, quelle relation protégerais-tu en priorité ?',
  ] as const;
  
  // ========================================
  // ⚙️ PARAMÈTRES PAR DÉFAUT
  // ========================================
  
  /**
   * Revenu mensuel par défaut (si non défini par l'utilisateur)
   */
  export const DEFAULT_MONTHLY_INCOME = 2800;
  
  /**
   * Nombre de mois pour le calcul de tendance
   */
  export const TREND_CALCULATION_MONTHS = {
    recent: 3,    // 3 derniers mois
    previous: 3,  // 3 mois précédents
  } as const;
  
  /**
   * Valeurs par défaut pour une nouvelle personne
   */
  export const DEFAULT_PERSON_VALUES = {
    personType: PersonType.PHYSIQUE,
    contributionType: undefined,
    timeBenefit: undefined,
    targetObjective: TargetObjective.STABILISER,
    color: '#3B82F6',
    circle: 'direct',
  } as const;
  