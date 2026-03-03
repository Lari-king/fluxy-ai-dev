/**
 * 🧠 TYPES - INTELLIGENCE & RÈGLES
 * Version complète et harmonisée pour la modularisation.
 */

import { Transaction } from '@/features/transactions/types';

// ============================================================================
// ACTIONS DÉCLENCHÉES (Pour RulesCenterPanel & RulesRightPanel)
// ============================================================================

export interface RuleActions {
  alertMessage?: string;
  markAsAnomaly?: boolean;
  sendNotification?: boolean; // Utilisé par le moteur d'alerte
  notifyUser?: boolean;       // Utilisé par le RightPanel et Settings
  autoTag?: string;
  preventDefault?: boolean;
  preventTransaction?: boolean;
  suggestAction?: string;
}

// ============================================================================
// CONDITIONS PAR TYPE DE RÈGLE (Versions complètes)
// ============================================================================

export interface KeywordDetectionConditions {
  keywords: string[];
  caseSensitive?: boolean;
  keywordMatchMode?: 'any' | 'all';
}

export interface CategoryBudgetConditions {
  category?: string;      // ID ou Nom de la catégorie
  subCategory?: string;   // Pour la gestion hiérarchique
  maxAmount?: number;     // Le seuil
  value?: number;         // Alias de compatibilité
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  operator?: string;      // ex: 'greater_than'
}

export interface MerchantAmountConditions {
  merchant?: string;
  merchantName?: string;
  merchantKeywords?: string[];
  amount?: number;
  value?: number;
  expectedAmount?: number;
  expectedAmountTolerance?: number; // En pourcentage
}

export interface MerchantFrequencyConditions {
  merchantKeywords: string[];
  maxFrequency?: number;
  frequencyPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface TimeRangeConditions {
  startTime?: string; // Format HH:MM
  endTime?: string;   // Format HH:MM
  timeRangeMaxAmount?: number;
  timeRangePeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface RecurringVarianceConditions {
  recurringDescription: string;
  expectedAmount?: number;
  maxVariancePercent?: number;
}

export interface PersonFlowConditions {
  personName: string;
  flowType?: 'incoming' | 'outgoing';
  minAmount?: number;
}

/**
 * Union type pour toutes les conditions.
 * 'any' permet aux formulaires existants de ne pas casser pendant la migration.
 */
export type RuleConditions = 
  | KeywordDetectionConditions
  | CategoryBudgetConditions
  | MerchantAmountConditions
  | MerchantFrequencyConditions
  | TimeRangeConditions
  | RecurringVarianceConditions
  | PersonFlowConditions
  | any;

// ============================================================================
// ENUMS ET SÉVÉRITÉ
// ============================================================================

export type RuleConditionType = 
  | 'keyword_detection'
  | 'category_budget'
  | 'merchant_frequency'
  | 'merchant_amount'
  | 'time_range'
  | 'recurring_variance'
  | 'person_flow';

export type RuleSeverity = 'error' | 'warning' | 'info';

export type RulePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ============================================================================
// RÈGLE (L'objet central)
// ============================================================================

export interface Rule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  type: RuleConditionType | string; // Flexible pour la transition
  conditions: RuleConditions;
  severity: RuleSeverity;
  actions?: RuleActions;
  createdAt?: string;
  updatedAt?: string;
  triggeredCount?: number;
  lastTriggeredAt?: string;
}

// ============================================================================
// VIOLATIONS ET RÉSULTATS
// ============================================================================

export interface RuleViolation {
  id: string;
  ruleId: string;
  rule: Rule;
  transaction: Transaction;
  violationDate: Date;
  message: string;
  severity: RuleSeverity;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  context?: any;
}

export interface RuleMatchResult {
  isViolation: boolean;
  message?: string;
  context?: any; 
}

export interface RuleAnalysisResult {
  ruleId: string;
  isViolated: boolean;
  message?: string;
  value?: number;
}

// ============================================================================
// STATISTIQUES (Pour le monitoring)
// ============================================================================

export interface RuleStats {
  ruleId: string;
  totalMatches: number;
  totalAmount: number;
  lastMatch?: Date;
  violationsCount: number;
  acknowledgedCount: number;
}