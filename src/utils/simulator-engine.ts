import { SimulationState, SimulationResult, IncomeSource, BusinessProject } from '../../types/simulator';

/**
 * Run financial simulation for a given number of months
 */
export function runSimulation(state: SimulationState, months: number): SimulationResult[] {
  const results: SimulationResult[] = [];
  
  let currentBalance = state.currentBalance;
  let currentPatrimoine = state.totalPatrimoine;
  let cumulativeSavings = 0;
  
  for (let month = 0; month < months; month++) {
    // Calculate income for this month
    const monthlyIncome = calculateMonthlyIncome(state.incomeSources, month);
    
    // Calculate expenses
    const monthlyExpenses = state.variableExpensesType === 'percentage'
      ? state.fixedExpenses + (monthlyIncome * state.variableExpenses / 100)
      : state.fixedExpenses + state.variableExpenses;
    
    // Net savings this month
    const monthlySavings = monthlyIncome - monthlyExpenses;
    cumulativeSavings += monthlySavings;
    
    // Apply investment returns (monthly compound)
    const monthlyReturn = state.annualReturn / 12;
    const investmentGrowth = currentPatrimoine * monthlyReturn;
    
    // Update balance and patrimoine
    currentBalance += monthlySavings;
    const amountToInvest = monthlySavings * (state.investmentRate / 100);
    if (amountToInvest > 0) {
      currentBalance -= amountToInvest;
      currentPatrimoine += amountToInvest;
    }
    currentPatrimoine += investmentGrowth;
    
    results.push({
      month,
      balance: Math.round(currentBalance),
      patrimoine: Math.round(currentPatrimoine),
      totalNetWorth: Math.round(currentBalance + currentPatrimoine),
      monthlyIncome: Math.round(monthlyIncome),
      monthlyExpenses: Math.round(monthlyExpenses),
      monthlySavings: Math.round(monthlySavings),
      cumulativeSavings: Math.round(cumulativeSavings),
    });
  }
  
  return results;
}

/**
 * Calculate total monthly income from all sources at a given month
 */
function calculateMonthlyIncome(sources: IncomeSource[], month: number): number {
  let total = 0;
  
  for (const source of sources) {
    // Check if source has started
    if (source.startMonth && month < source.startMonth) {
      continue;
    }
    
    const monthsSinceStart = source.startMonth ? month - source.startMonth : month;
    
    // Apply growth rate (compound annual growth)
    const growthMultiplier = source.growthRate 
      ? Math.pow(1 + source.growthRate, monthsSinceStart / 12)
      : 1;
    
    // For entrepreneurship, sum all projects
    if (source.type === 'entrepreneurship' && source.projects) {
      for (const project of source.projects) {
        if (month >= project.startMonth) {
          const projectMonths = month - project.startMonth;
          const projectGrowth = project.growthRate
            ? Math.pow(1 + project.growthRate, projectMonths / 12)
            : 1;
          total += project.monthlyRevenue * projectGrowth;
        }
      }
    } else {
      total += source.amount * growthMultiplier;
    }
  }
  
  return total;
}

/**
 * Calculate when a monthly income goal will be reached
 */
export function calculateMonthsToIncomeGoal(
  state: SimulationState,
  targetMonthlyIncome: number
): number {
  const maxMonths = 600; // 50 years max
  
  for (let month = 0; month < maxMonths; month++) {
    const monthlyIncome = calculateMonthlyIncome(state.incomeSources, month);
    const monthlyExpenses = state.variableExpensesType === 'percentage'
      ? state.fixedExpenses + (monthlyIncome * state.variableExpenses / 100)
      : state.fixedExpenses + state.variableExpenses;
    
    const netIncome = monthlyIncome - monthlyExpenses;
    
    if (netIncome >= targetMonthlyIncome) {
      return month;
    }
  }
  
  return maxMonths;
}

/**
 * Calculate when a net worth goal will be reached
 */
export function calculateMonthsToNetWorthGoal(
  state: SimulationState,
  targetNetWorth: number
): number {
  const results = runSimulation(state, 600); // Run for max 50 years
  
  for (const result of results) {
    if (result.totalNetWorth >= targetNetWorth) {
      return result.month;
    }
  }
  
  return 600;
}

/**
 * Calculate how much to save monthly to reach a net worth goal by a target month
 */
export function calculateRequiredMonthlySavings(
  currentNetWorth: number,
  targetNetWorth: number,
  months: number,
  annualReturn: number,
  investmentRate: number = 100
): number {
  // Using future value of annuity formula
  // FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
  // Solving for PMT: PMT = (FV - PV(1+r)^n) * r / ((1+r)^n - 1)
  
  const monthlyRate = annualReturn / 12;
  const futureValueOfCurrentWealth = currentNetWorth * Math.pow(1 + monthlyRate, months);
  const remainingNeeded = targetNetWorth - futureValueOfCurrentWealth;
  
  if (remainingNeeded <= 0) {
    return 0; // Already have enough
  }
  
  if (monthlyRate === 0) {
    return remainingNeeded / months;
  }
  
  const monthlySavingsNeeded = 
    (remainingNeeded * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);
  
  return Math.round(monthlySavingsNeeded);
}
