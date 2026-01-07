import { calculateMonthEndProjection } from '../utils/insights/projection';

const workerScope = self as any;

workerScope.onmessage = (e: MessageEvent) => {
  const { transactions, balance } = e.data;

  try {
    // 1. Calcul complet via ta logique de projection.ts
    const projection = calculateMonthEndProjection(transactions, balance);
    
    // 2. On renvoie TOUT l'objet recurringPredictions sans le tronquer.
    // Ton panel de droite a besoin de 'type', 'occurrences', etc.
    const predictions = projection.details.recurringPredictions;
    
    console.log(`[Worker] Analyse terminée : ${predictions.length} récurrences trouvées.`);
    
    workerScope.postMessage({ predictions });
  } catch (error) {
    console.error("❌ Erreur interne au Worker:", error);
    workerScope.postMessage({ predictions: [], error: error.message });
  }
};