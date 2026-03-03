/**
 * 🎯 MODULE RECURRING - FAÇADE D'EXPOSITION
 * Centralise les types, la logique métier et les composants UI.
 */

// 1. Types
export type { 
  RecurringDetectionResult, 
  RecurringPattern 
} from './engine/recurring-detection';

export type { 
  SimilarTransaction 
} from './engine/recurring-matcher';

// 2. Moteur & Logique (Fuzzy Matching & Groupement)
export { groupRecurringTransactions } from './engine/recurring-matcher';
export { 
  getRecurringGroupStats, 
  formatRecurringPeriod 
} from './engine/recurring-group-helpers';
export { detectRecurringPatterns } from './engine/recurring-detection';

// 3. Components UI
export { RecurringCard } from './components/RecurringCard';
// On exporte avec l'alias pour garder la cohérence du nommage externe
export { RecurringTransactionMatchDialog as RecurringMatchDialog } from './components/RecurringMatchDialog';

// 4. Hook Principal
// C'est le point d'entrée unique pour consommer ce module dans les pages
export { useRecurring } from './hooks/use-recurring';
