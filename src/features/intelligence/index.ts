/**
 * 🧠 MODULE INTELLIGENCE - EXPORTS PUBLICS
 */

// Types
export type { 
    Rule, 
    RuleViolation, 
    RuleConditions,
    RuleSeverity,
    RuleConditionType,
    RuleMatchResult,
    RuleAnalysisResult,
    KeywordDetectionConditions,
    CategoryBudgetConditions,
    MerchantAmountConditions,
    MerchantFrequencyConditions,
    TimeRangeConditions,
    RecurringVarianceConditions,
    PersonFlowConditions
  } from './types';
  
  // Engine
  export { evaluateRule, evaluateAllRules } from './engine/rule-engine';
  
  // Components
  export { RuleStatusBadge } from './components/RuleStatusBadge';
  export { ViolationsCard } from './components/ViolationsCard';
  
  // Note: Pour utiliser les règles, importez useRules() depuis @/contexts/RulesContext
  