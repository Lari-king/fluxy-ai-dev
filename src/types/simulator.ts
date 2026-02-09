// Simulator types and interfaces

export type IncomeSourceType = 'salary' | 'entrepreneurship' | 'investment' | 'scholarship' | 'rental' | 'other';
export type GoalType = 'monthly_income' | 'net_worth' | 'savings_target';

export interface IncomeSource {
  id: string;
  name: string;
  type: IncomeSourceType;
  amount: number; // Monthly amount
  growthRate?: number; // Annual growth rate (e.g., 0.03 for 3%)
  startMonth?: number; // When this income starts (0 = now)
  projects?: BusinessProject[]; // For entrepreneurship
}

export interface BusinessProject {
  id: string;
  name: string;
  monthlyRevenue: number;
  startMonth: number;
  growthRate?: number;
}

export interface SimulationGoal {
  id: string;
  type: GoalType;
  name: string;
  targetAmount: number;
  description: string;
}

export interface SimulationState {
  // Base state
  currentBalance: number;
  totalPatrimoine: number;
  
  // Income sources
  incomeSources: IncomeSource[];
  
  // Expenses
  fixedExpenses: number; // Monthly
  variableExpenses: number; // Monthly or as % of income
  variableExpensesType: 'fixed' | 'percentage';
  
  // Investment parameters
  investmentRate: number; // % of net savings to invest
  annualReturn: number; // Expected annual return on investments
  
  // Goals
  goals: SimulationGoal[];
}

export interface SimulationResult {
  month: number;
  balance: number;
  patrimoine: number;
  totalNetWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  cumulativeSavings: number;
}
