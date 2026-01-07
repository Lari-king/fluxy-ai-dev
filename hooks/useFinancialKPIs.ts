import { useMemo } from 'react';
import { useData, Transaction } from '../contexts/DataContext';
import { formatCurrency, formatPercentage } from '../src/utils/format'; // Utilisation des types format

// Définition de base pour l'entité compte (doit correspondre à Entity dans DataContext)
interface Account {
  id: string;
  balance: number;
  [key: string]: any;
}

interface FinancialKPIs {
  netWorth: number;
  netWorthFormatted: string;
  rollingCashFlow: number; // Renommé pour plus de précision (période glissante)
  rollingCashFlowFormatted: string;
  savingsRate: number;
  savingsRateFormatted: string;
  isLoading: boolean;
  totalIncomeRolling: number; // Ajout pour le widget
  totalExpensesRolling: number; // Ajout pour le widget
}

/**
 * Hook pour calculer les indicateurs de performance clés (KPIs) financiers.
 * Utilise useData pour accéder aux comptes et transactions.
 * Calcule les métriques sur une fenêtre glissante de 90 jours pour les flux.
 * * @returns {FinancialKPIs} Les métriques financières calculées.
 */
export const useFinancialKPIs = (): FinancialKPIs => {
  const { accounts, transactions, loading } = useData();

  const KPIs = useMemo(() => {
    if (loading || !accounts || !transactions) {
      return {
        netWorth: 0,
        netWorthFormatted: formatCurrency(0),
        rollingCashFlow: 0,
        rollingCashFlowFormatted: formatCurrency(0),
        savingsRate: 0,
        savingsRateFormatted: formatPercentage(0),
        isLoading: true,
        totalIncomeRolling: 0,
        totalExpensesRolling: 0,
      };
    }

    // --- 1. Calcul de la Valeur Nette (Net Worth) ---
    const netWorth = (accounts as Account[]).reduce((sum, acc) => sum + acc.balance, 0);

    // --- 2. Calcul du Flux de Trésorerie Glissant (Rolling Cash Flow) ---
    
    // Fenêtre glissante: 90 jours (3 mois) pour une meilleure stabilité
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    // Comparaison avec la date ISO simplifiée (YYYY-MM-DD)
    const ninetyDaysAgoISO = ninetyDaysAgo.toISOString().split('T')[0];

    // Filtrer et sommer les transactions des 90 derniers jours
    const recentTransactions = (transactions as Transaction[]).filter(
      t => t.date && t.date >= ninetyDaysAgoISO
    );
    
    // Sépération des flux pour le calcul du Taux d'Épargne et le Cash Flow
    const totalIncomeRolling = recentTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpensesRolling = Math.abs(recentTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
      
    const rollingCashFlow = totalIncomeRolling - totalExpensesRolling;
    
    // --- 3. Calcul du Taux d'Épargne (Savings Rate) ---
    
    let savingsRate = 0;
    if (totalIncomeRolling > 0) {
      // Taux d'épargne = (Revenu - Dépenses) / Revenu * 100
      savingsRate = ((totalIncomeRolling - totalExpensesRolling) / totalIncomeRolling) * 100;
      
      // Limiter à 100% pour éviter les taux bizarres dus aux gros dépôts
      savingsRate = Math.min(100, savingsRate);
    }
    
    // --- Formatage ---
    // Utilisation de la nouvelle fonction formatCurrency (précision 0 pour les grands nombres)
    const netWorthFormatted = formatCurrency(netWorth, 'fr-FR', 0); 
    const rollingCashFlowFormatted = formatCurrency(rollingCashFlow, 'fr-FR', 0);
    const savingsRateFormatted = formatPercentage(savingsRate); // Utilise maintenant la nouvelle fonction

    return {
      netWorth,
      netWorthFormatted,
      rollingCashFlow,
      rollingCashFlowFormatted,
      savingsRate,
      savingsRateFormatted,
      isLoading: loading,
      totalIncomeRolling,
      totalExpensesRolling,
    };
  }, [accounts, transactions, loading]);

  return KPIs;
};