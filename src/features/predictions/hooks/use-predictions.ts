import { useState, useEffect } from 'react';
import type { Transaction } from '@/features/transactions/types';
import { predictionService } from '../services/predictionService';
import { calculateMonthEndProjection, type MonthEndProjection } from '../services/projection';

/**
 * 🔮 HOOK USE-PREDICTIONS
 * Orchestre la détection des patterns via le Worker et le calcul de projection final.
 */
export function usePredictions(transactions: Transaction[], balance: number) {
  const [projection, setProjection] = useState<MonthEndProjection | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      setIsAnalyzing(true);
      
      // 1. On récupère les patterns (via Worker/Service)
      predictionService.getPredictions(transactions, balance, (workerResults: any) => {
        
        try {
          // 2. Calcul de la projection
          // On passe 'undefined' pour le 3ème argument (settings) 
          // pour mettre workerResults au 4ème argument (preCalculatedPatterns)
          const fullProjection = calculateMonthEndProjection(
            transactions,
            balance,
            undefined, // Argument 3: settings (Optionnel)
            workerResults // Argument 4: preCalculatedPatterns (C'est ici qu'ils vont !)
          );

          setProjection(fullProjection);
        } catch (error) {
          console.error("[usePredictions] Erreur lors du calcul de projection:", error);
        } finally {
          setIsAnalyzing(false);
        }
      });
    } else {
      setProjection(null);
    }
  }, [transactions, balance]);

  return { 
    projection, 
    isAnalyzing,
    // Pour la compatibilité avec l'UI qui attendrait "predictions"
    predictions: projection?.details.recurringPredictions || [] 
  };
}