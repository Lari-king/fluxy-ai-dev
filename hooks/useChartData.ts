import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';

// Définitions de base
interface Transaction {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  [key: string]: any;
}

interface Account {
  id: string;
  balance: number;
  [key: string]: any;
}

// Données générées pour l'affichage dans les graphiques
interface TimeSeriesData {
  date: string; // Format court ex: "Mar 24"
  value: number;
}

interface ChartData {
  netWorthHistory: TimeSeriesData[];
  cashFlowHistory: TimeSeriesData[];
  isLoading: boolean;
}

/**
 * Hook pour générer les données de séries temporelles pour les graphiques du tableau de bord.
 * Génère l'historique de la valeur nette et du flux de trésorerie mensuel.
 */
export const useChartData = (): ChartData => {
  const { accounts, transactions, loading } = useData();

  const chartData = useMemo(() => {
    if (loading || !accounts || !transactions) {
      return { netWorthHistory: [], cashFlowHistory: [], isLoading: true };
    }

    const txs = transactions as Transaction[];
    const currentBalance = (accounts as Account[]).reduce((sum, acc) => sum + acc.balance, 0);

    // Trier les transactions par date
    txs.sort((a, b) => a.date.localeCompare(b.date));

    // --- 1. Historique du Flux de Trésorerie Mensuel ---
    const cashFlowByMonth = new Map<string, number>(); // Clé: YYYY-MM
    const today = new Date();
    
    // On remonte 12 mois en arrière pour la simulation
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(today.getMonth() - 12);

    for (const tx of txs) {
      const date = new Date(tx.date);
      if (date < twelveMonthsAgo) continue; // Limiter à 12 mois
      
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const currentFlow = cashFlowByMonth.get(yearMonth) || 0;
      cashFlowByMonth.set(yearMonth, currentFlow + tx.amount);
    }
    
    const cashFlowHistory: TimeSeriesData[] = Array.from(cashFlowByMonth.entries())
      .map(([yearMonth, value]) => ({
        date: new Date(yearMonth).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        value: value,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Trier à nouveau par date

    // --- 2. Historique de la Valeur Nette (simulée) ---
    // Partir de la valeur nette actuelle et "défaire" les transactions passées
    let rollingNetWorth = currentBalance;
    
    // Utiliser les 12 derniers points de données mensuels pour la Valeur Nette
    const netWorthPoints = [];
    
    // Les transactions doivent être parcourues en sens inverse pour obtenir les soldes passés
    const reversedTxs = [...txs].reverse();

    // Créer des points mensuels (simulation simplifiée)
    // On utilise la même logique YYYY-MM que pour le Cash Flow
    let currentMonthYear = '';
    
    for (const tx of reversedTxs) {
        const date = new Date(tx.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (monthYear !== currentMonthYear) {
            // Sauvegarder le point de valeur nette au début de chaque mois (fin du mois précédent)
            if (currentMonthYear) {
                netWorthPoints.unshift({
                    date: new Date(currentMonthYear).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
                    value: rollingNetWorth,
                });
            }
            currentMonthYear = monthYear;
        }

        // Retirer le montant de la transaction pour obtenir le solde AVANT cette transaction
        rollingNetWorth -= tx.amount;
    }
    
    // Ajouter le point le plus ancien (début de l'historique)
    if (currentMonthYear && netWorthPoints.length < 12) {
        netWorthPoints.unshift({
             date: new Date(currentMonthYear).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
             value: rollingNetWorth,
        });
    }

    // Le point le plus récent est toujours le solde actuel
    const currentPoint = {
        date: today.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        value: currentBalance,
    };
    
    // On s'assure que le point actuel est inclus et est le dernier
    const finalNetWorthHistory = [...netWorthPoints.filter(p => p.date !== currentPoint.date), currentPoint];
    
    // Limiter l'historique à 12 points pour éviter l'encombrement
    const netWorthHistory = finalNetWorthHistory.slice(-12);


    return {
      netWorthHistory,
      cashFlowHistory,
      isLoading: loading,
    };
  }, [accounts, transactions, loading]);

  return chartData;
};