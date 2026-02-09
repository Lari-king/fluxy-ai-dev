// Budget types and interfaces

export type BudgetRuleType = 'category' | 'person' | 'keyword' | 'amount';

export interface BudgetRule {
  type: BudgetRuleType;
  value: string | number; // Category name, Person ID, keyword, or amount threshold
  operator?: 'equals' | 'contains' | 'greaterThan' | 'lessThan'; // For keyword and amount rules
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  allocated: number;
  spent: number;
  icon: string;
  color: string;
  rules?: BudgetRule[]; // Rules to automatically link transactions
  period?: 'monthly' | 'yearly' | 'weekly'; // Budget period
  month?: string; // Budget month in YYYY-MM format (e.g., "2025-01")
  startDate?: string;
  endDate?: string;
}
