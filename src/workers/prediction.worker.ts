import { calculateMonthEndProjection } from '@/utils/insights/projection';

const workerScope = self as any;

workerScope.onmessage = (e: MessageEvent) => {
    const { transactions, balance } = e.data;
  
    try {
      const projection = calculateMonthEndProjection(transactions, balance);
      const predictions = projection.details.recurringPredictions.filter(p => p.confidence >= 80); // Filtre >=80%
      
      console.log(`[Worker] Analyse terminée : ${predictions.length} récurrences (filtré proba >=80%)`);
      
      workerScope.postMessage({ predictions });
    } catch (error: any) {
        console.error("❌ Erreur interne au Worker:", error);
        workerScope.postMessage({ 
            predictions: [], 
            error: error instanceof Error ? error.message : String(error) 
        });
    }
  };