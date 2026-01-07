/**
 * 🎯 SYSTÈME DE RÈGLES PERSONNALISÉES
 * 
 * Définit les types pour le moteur de règles qui permet aux utilisateurs
 * de créer des règles personnalisées pour détecter des anomalies spécifiques.
 */

import { Transaction } from '../contexts/DataContext';

/**
 * Types de conditions de règles disponibles
 */
export type RuleConditionType = 
  | 'category_budget'        // Plafond budgétaire par catégorie
  | 'merchant_frequency'     // Fréquence maximale chez un commerçant
  | 'merchant_amount'        // Montant maximum chez un commerçant
  | 'person_flow'            // Flux de fonds entre personnes (ex: loyer père)
  | 'time_range'             // Dépenses dans une plage horaire/jour
  | 'recurring_variance'     // Variation d'un abonnement récurrent
  | 'keyword_detection';     // Détection de mots-clés (AGIOS, FRAIS, etc.)

/**
 * Niveau de sévérité d'une règle
 */
export type RuleSeverity = 'info' | 'warning' | 'error';

/**
 * Période de temps pour les règles
 */
export type RulePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Opérateur de comparaison pour les montants
 */
export type ComparisonOperator = 
  | 'greater_than'      // >
  | 'greater_or_equal'  // >=
  | 'less_than'         // <
  | 'less_or_equal'     // <=
  | 'equal'             // =
  | 'not_equal';        // !=

/**
 * Définition complète d'une règle personnalisée
 */
export interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: RuleConditionType;
  severity: RuleSeverity;
  
  // Conditions spécifiques selon le type de règle
  conditions: RuleConditions;
  
  // Actions à exécuter quand la règle est violée
  actions: RuleActions;
  
  // Métadonnées
  createdAt: string;
  updatedAt: string;
  triggeredCount: number;          // Nombre de fois que la règle a été déclenchée
  lastTriggeredAt?: string;        // Dernière date de déclenchement
  
  // Statistiques optionnelles
  stats?: {
    totalViolations: number;
    lastMonthViolations: number;
    averageViolationAmount?: number;
  };
}

/**
 * Conditions d'une règle (union de tous les types possibles)
 */
export interface RuleConditions {
  // ========================================
  // 🏷️ CATEGORY_BUDGET
  // ========================================
  category?: string;                    // "Restaurants", "Transport", etc.
  maxAmount?: number;                   // Montant maximum autorisé
  period?: RulePeriod;                  // Période (daily, weekly, monthly, yearly)
  operator?: ComparisonOperator;        // Opérateur de comparaison
  
  // ========================================
  // 🏪 MERCHANT_FREQUENCY & MERCHANT_AMOUNT
  // ========================================
  merchantKeywords?: string[];          // Mots-clés pour identifier le commerçant
  merchantExact?: string;               // Nom exact du commerçant (normalisé)
  maxFrequency?: number;                // Nombre max de transactions
  frequencyPeriod?: RulePeriod;         // Période pour la fréquence
  merchantMaxAmount?: number;           // Montant max chez ce commerçant
  
  // ========================================
  // 🧑‍🤝‍🧑 PERSON_FLOW (Règles de flux de fonds)
  // ========================================
  fromPersonId?: string;                // ID de la personne émettrice
  toPersonId?: string;                  // ID de la personne destinataire
  personName?: string;                  // Nom de la personne (version simplifiée)
  flowType?: 'incoming' | 'outgoing';   // Type de flux (simplifié)
  expectedAmount?: number;              // Montant attendu
  expectedAmountTolerance?: number;     // Tolérance en % (ex: 5% = ±5%)
  maxDelayDays?: number;                // Délai max en jours entre réception et envoi
  mustFollowTransaction?: boolean;      // Si true, vérifie qu'une transaction suit
  
  // ========================================
  // ⏰ TIME_RANGE (Règles temporelles)
  // ========================================
  startTime?: string;                   // Heure de début (format "HH:mm", ex: "18:00")
  endTime?: string;                     // Heure de fin (format "HH:mm", ex: "23:59")
  daysOfWeek?: number[];                // Jours de la semaine (0=Dimanche, 6=Samedi)
  timeRangeMaxAmount?: number;          // Montant max dans cette plage
  timeRangePeriod?: RulePeriod;         // Période pour le time range
  
  // ========================================
  // 🔁 RECURRING_VARIANCE (Abonnements)
  // ========================================
  recurringPatternId?: string;          // ID du pattern récurrent détecté
  recurringDescription?: string;        // Description de l'abonnement
  maxVariancePercent?: number;          // Variation max en % (ex: 5%)
  minVariancePercent?: number;          // Variation min en % (détection de baisse)
  checkIncrease?: boolean;              // Vérifier les augmentations
  checkDecrease?: boolean;              // Vérifier les diminutions
  
  // ========================================
  // 🔍 KEYWORD_DETECTION (Détection de mots)
  // ========================================
  keywords?: string[];                  // Liste de mots-clés à détecter
  keywordMatchMode?: 'any' | 'all';     // "any" = au moins 1, "all" = tous
  caseSensitive?: boolean;              // Sensible à la casse
  keywordSeverityMap?: Record<string, RuleSeverity>; // Sévérité par mot-clé
  
  // ========================================
  // 🌍 Filtres additionnels (tous types)
  // ========================================
  includeCategories?: string[];         // Limiter à ces catégories
  excludeCategories?: string[];         // Exclure ces catégories
  minAmount?: number;                   // Montant minimum de transaction
  countries?: string[];                 // Limiter à ces pays
  accountIds?: string[];                // Limiter à ces comptes
}

/**
 * Actions à exécuter quand une règle est violée
 */
export interface RuleActions {
  alertMessage?: string;                // Message personnalisé de l'alerte
  markAsAnomaly?: boolean;              // Marquer comme anomalie dans le système
  notifyUser?: boolean;                 // Envoyer une notification (futur)
  preventTransaction?: boolean;         // Bloquer la transaction (futur - mode strict)
  suggestAction?: string;               // Suggestion d'action (ex: "Réduire les sorties restaurant")
  customActions?: {                     // Actions personnalisées (futur)
    type: string;
    payload: any;
  }[];
}

/**
 * Violation d'une règle détectée sur une transaction
 */
export interface RuleViolation {
  id: string;                           // ID unique de la violation
  ruleId: string;                       // ID de la règle violée
  rule: Rule;                           // Règle complète (pour affichage)
  transaction: Transaction;             // Transaction qui a violé la règle
  violationDate: Date;                  // Date de détection de la violation
  message: string;                      // Message descriptif de la violation
  severity: RuleSeverity;               // Sévérité héritée de la règle
  
  // Contexte de la violation (données additionnelles)
  context?: {
    // Pour category_budget
    categoryTotal?: number;             // Total dépensé dans la catégorie
    categoryBudget?: number;            // Budget alloué
    categoryPercentUsed?: number;       // % du budget utilisé
    
    // Pour merchant_frequency
    merchantTransactionCount?: number;  // Nombre de transactions chez ce commerçant
    merchantMaxFrequency?: number;      // Fréquence max autorisée
    
    // Pour person_flow
    expectedTransaction?: Transaction;  // Transaction attendue (loyer)
    delayDays?: number;                 // Délai en jours
    
    // Pour time_range
    timeRangeTotal?: number;            // Total dépensé dans la plage
    timeRangeLimit?: number;            // Limite autorisée
    
    // Pour recurring_variance
    previousAmount?: number;            // Montant précédent
    currentAmount?: number;             // Montant actuel
    variance?: number;                  // Variation en %
    
    // Autres données
    [key: string]: any;
  };
  
  // Statut de la violation
  acknowledged?: boolean;               // L'utilisateur a pris connaissance
  acknowledgedAt?: string;              // Date de prise de connaissance
  resolved?: boolean;                   // Violation résolue
  resolvedAt?: string;                  // Date de résolution
  notes?: string;                       // Notes de l'utilisateur
}

/**
 * Résumé des violations pour une période donnée
 */
export interface ViolationsSummary {
  totalViolations: number;
  byRuleType: Record<RuleConditionType, number>;
  bySeverity: Record<RuleSeverity, number>;
  mostViolatedRules: Array<{
    ruleId: string;
    ruleName: string;
    count: number;
  }>;
  recentViolations: RuleViolation[];
  oldestUnacknowledged?: RuleViolation;
}

/**
 * Statistiques d'une règle
 */
export interface RuleStatistics {
  ruleId: string;
  ruleName: string;
  enabled: boolean;
  totalTriggers: number;
  lastTriggered?: Date;
  averageTriggersPerMonth: number;
  violationsByMonth: Record<string, number>; // "2025-01": 5
  affectedTransactions: number;
  estimatedSavings?: number;              // Économies estimées grâce à la règle
  effectiveness: number;                   // Score d'efficacité 0-100
}

/**
 * Configuration globale du système de règles
 */
export interface RulesConfiguration {
  enabled: boolean;                        // Activer/désactiver tout le système
  autoEvaluate: boolean;                   // Évaluer automatiquement les nouvelles transactions
  notificationsEnabled: boolean;           // Activer les notifications
  strictMode: boolean;                     // Mode strict (bloquer les transactions)
  evaluationFrequency: 'realtime' | 'daily' | 'manual'; // Fréquence d'évaluation
  maxViolationsHistory: number;            // Nombre max de violations à conserver
  defaultSeverity: RuleSeverity;           // Sévérité par défaut
}