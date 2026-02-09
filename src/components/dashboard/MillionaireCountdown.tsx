import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Transaction } from '@/utils/csv-parser';
import { filterCompletedTransactions } from '@/utils/transaction-helpers';

interface MillionaireCountdownProps {
  currentNetWorth: number;
  transactions: Transaction[];
  patrimoine: any[];
}

export function MillionaireCountdown({ 
  currentNetWorth,
  transactions,
  patrimoine = []
}: MillionaireCountdownProps) {
  // ✅ Memoize all calculations to prevent memory buildup
  const totalPatrimoine = React.useMemo(() => {
    return patrimoine.reduce((sum, asset) => sum + (asset.value || 0), 0);
  }, [patrimoine]);
  
  const completedTransactions = React.useMemo(() => {
    return filterCompletedTransactions(transactions);
  }, [transactions]);
  
  // Helper to convert recurring transactions to monthly amount
  const toMonthlyAmount = React.useCallback((amount: number, frequency?: string) => {
    if (!frequency) return amount; // Assume monthly if no frequency
    switch (frequency) {
      case 'monthly': return amount;
      case 'quarterly': return amount / 3;
      case 'yearly': return amount / 12;
      case 'weekly': return amount * 4.33; // Average weeks per month
      default: return amount;
    }
  }, []);

  const recurringIncome = React.useMemo(() => {
    return completedTransactions
      .filter(t => t.amount > 0 && t.isRecurring)
      .reduce((sum, t) => sum + toMonthlyAmount(t.amount, t.frequency), 0);
  }, [completedTransactions, toMonthlyAmount]);
    
  const recurringExpenses = React.useMemo(() => {
    return Math.abs(completedTransactions
      .filter(t => t.amount < 0 && t.isRecurring)
      .reduce((sum, t) => sum + toMonthlyAmount(t.amount, t.frequency), 0));
  }, [completedTransactions, toMonthlyAmount]);
  
  const totalNetWorth = React.useMemo(() => {
    return currentNetWorth + totalPatrimoine;
  }, [currentNetWorth, totalPatrimoine]);
  
  const monthlyGrowth = React.useMemo(() => {
    return recurringIncome - recurringExpenses;
  }, [recurringIncome, recurringExpenses]);
  
  const annualReturn = 0.07; // 7% annual return on investments
  
  // Calculate months to millionaire
  const target = 1000000;
  const monthsToMillionaire = React.useMemo(() => {
    return calculateMonthsToTarget(totalNetWorth, monthlyGrowth, annualReturn, target);
  }, [totalNetWorth, monthlyGrowth, annualReturn, target]);
  
  const yearsToMillionaire = (monthsToMillionaire / 12).toFixed(1);
  
  const targetDate = React.useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToMillionaire);
    return date;
  }, [monthsToMillionaire]);

  // Calculate for different scenarios
  const optimisticMonths = React.useMemo(() => {
    return calculateMonthsToTarget(totalNetWorth, monthlyGrowth * 1.5, annualReturn + 0.03, target);
  }, [totalNetWorth, monthlyGrowth, annualReturn, target]);
  
  const pessimisticMonths = React.useMemo(() => {
    return calculateMonthsToTarget(totalNetWorth, monthlyGrowth * 0.7, annualReturn - 0.02, target);
  }, [totalNetWorth, monthlyGrowth, annualReturn, target]);

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 backdrop-blur-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
          <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          Millionnaire en...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-5xl mb-1 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent"
          >
            {yearsToMillionaire}
          </motion.div>
          <p className="text-base text-gray-700 dark:text-gray-300">années</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {targetDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span className="text-xs text-green-700 dark:text-green-400">Scénario optimiste</span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">{(optimisticMonths / 12).toFixed(1)} ans</span>
          </div>
          
          <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-xs text-blue-700 dark:text-blue-400">Scénario actuel</span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">{yearsToMillionaire} ans</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <span className="text-xs text-orange-700 dark:text-orange-400">Scénario prudent</span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">{(pessimisticMonths / 12).toFixed(1)} ans</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto space-y-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between mb-1">
              <span>Patrimoine actuel:</span>
              <span className="font-medium">{totalNetWorth.toLocaleString('fr-FR')}€</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Revenus récurrents:</span>
              <span className="font-medium text-green-600">+{recurringIncome.toLocaleString('fr-FR')}€/mois</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Dépenses fixes:</span>
              <span className="font-medium text-red-600">-{recurringExpenses.toLocaleString('fr-FR')}€/mois</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
            <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <p>
              Épargne: {Math.max(0, monthlyGrowth).toLocaleString('fr-FR')}€/mois + {(annualReturn * 100).toFixed(0)}% rendement annuel
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate months to reach target with compound growth
function calculateMonthsToTarget(
  currentValue: number,
  monthlyContribution: number,
  annualReturn: number,
  target: number
): number {
  const monthlyRate = annualReturn / 12;
  let value = currentValue;
  let months = 0;
  const maxMonths = 600; // Safety limit (50 years)

  while (value < target && months < maxMonths) {
    value = value * (1 + monthlyRate) + monthlyContribution;
    months++;
  }

  return months;
}
