/**
 * 🎯 SYSTÈME DE RÈGLES PERSONNALISÉES - VERSION AMÉLIORÉE 2026
 * * Types discriminés par `type` pour un meilleur typage et autocomplétion.
 */

import { Transaction } from '@/contexts/DataContext';

/**
 * Types de règles disponibles
 */
export type RuleConditionType =
  | 'category_budget'
  | 'merchant_frequency'
  | 'merchant_amount'
  | 'person_flow'
  | 'time_range'
  | 'recurring_variance'
  | 'keyword_detection';

/**
 * Niveau de sévérité
 */
export type RuleSeverity = 'info' | 'warning' | 'error';

/**
 * Périodes temporelles
 */
export type RulePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Opérateurs de comparaison pour montants
 */
export type ComparisonOperator =
  | 'greater_than'
  | 'greater_or_equal'
  | 'less_than'
  | 'less_or_equal'
  | 'equal'
  | 'not_equal';

/**
 * Conditions de base communes
 */
export interface BaseConditions {
  includeCategories?: string[];
  excludeCategories?: string[];
  minAmount?: number;
  countries?: string[];
  accountIds?: string[];
}

/**
 * Conditions spécifiques par type de règle
 */
export interface CategoryBudgetConditions extends BaseConditions {
  category?: string;
  subCategory?: string;
  maxAmount: number;
  period: RulePeriod;
  operator?: ComparisonOperator;
}

export interface MerchantFrequencyConditions extends BaseConditions {
  merchantKeywords: string[];
  merchantExact?: string;
  maxFrequency: number;
  frequencyPeriod: RulePeriod;
}

export interface MerchantAmountConditions extends BaseConditions {
  merchantKeywords: string[];
  merchantExact?: string;
  merchantMaxAmount: number;
  expectedAmount?: number;              // Requis par ruleEngine.ts
  expectedAmountTolerance?: number;     // Requis par ruleEngine.ts
  operator?: ComparisonOperator;
}

export interface PersonFlowConditions extends BaseConditions {
  fromPersonId?: string;
  toPersonId?: string;
  personName?: string;
  flowType: 'incoming' | 'outgoing';
  expectedAmount?: number;
  expectedAmountTolerance?: number;
  maxDelayDays?: number;
  mustFollowTransaction?: boolean;
}

export interface TimeRangeConditions extends BaseConditions {
  startTime: string;
  endTime: string;
  daysOfWeek?: number[];
  timeRangeMaxAmount?: number;
  timeRangePeriod?: RulePeriod;
}

export interface RecurringVarianceConditions extends BaseConditions {
  recurringPatternId?: string;
  recurringDescription?: string;
  expectedAmount?: number;              // Requis par ruleEngine.ts
  maxVariancePercent?: number;
  minVariancePercent?: number;
  checkIncrease?: boolean;
  checkDecrease?: boolean;
}

export interface KeywordDetectionConditions extends BaseConditions {
  keywords: string[];
  keywordMatchMode?: 'any' | 'all';
  caseSensitive?: boolean;
  keywordSeverityMap?: Record<string, RuleSeverity>;
}

/**
 * Union discriminée des conditions selon le type de règle
 */
export type RuleConditions =
  | CategoryBudgetConditions
  | MerchantFrequencyConditions
  | MerchantAmountConditions
  | PersonFlowConditions
  | TimeRangeConditions
  | RecurringVarianceConditions
  | KeywordDetectionConditions;

/**
 * Définition complète d'une règle
 */
export interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: RuleConditionType;
  severity: RuleSeverity;
  conditions: RuleConditions;
  actions: RuleActions;
  createdAt: string;
  updatedAt: string;
  triggeredCount: number;
  lastTriggeredAt?: string;
  stats?: {
    totalViolations: number;
    lastMonthViolations: number;
    averageViolationAmount?: number;
  };
}

/**
 * Actions déclenchées par une violation
 */
export interface RuleActions {
  alertMessage?: string;
  markAsAnomaly?: boolean;
  notifyUser?: boolean;
  preventTransaction?: boolean;
  suggestAction?: string;
  customActions?: Array<{
    type: string;
    payload: any;
  }>;
}

/**
 * Violation détectée
 */
export interface RuleViolation {
  id: string;
  ruleId: string;
  rule: Rule;
  transaction: Transaction;
  violationDate: Date;
  message: string;
  severity: RuleSeverity;
  context?: {
    [key: string]: any;
  };
  acknowledged?: boolean;
  acknowledgedAt?: string;
  resolved?: boolean;
  resolvedAt?: string;
  notes?: string;
}

/**
 * Résumé global des violations
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
 * Statistiques par règle
 */
export interface RuleStatistics {
  ruleId: string;
  ruleName: string;
  enabled: boolean;
  totalTriggers: number;
  lastTriggered?: Date;
  averageTriggersPerMonth: number;
  violationsByMonth: Record<string, number>;
  affectedTransactions: number;
  estimatedSavings?: number;
  effectiveness: number;
}

/**
 * Configuration globale du moteur de règles
 */
export interface RulesConfiguration {
  enabled: boolean;
  autoEvaluate: boolean;
  notificationsEnabled: boolean;
  strictMode: boolean;
  evaluationFrequency: 'realtime' | 'daily' | 'manual';
  maxViolationsHistory: number;
  defaultSeverity: RuleSeverity;
}