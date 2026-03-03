/**
 * 🔄 PREDICTION WORKER - Web Worker pour calculs lourds
 * Déporte les calculs de détection de patterns récurrents dans un thread séparé
 * pour éviter de bloquer l'UI principale (utile pour >5000 transactions)
 */

// ✅ Import relatif corrigé pour remonter vers recurring/engine
import { detectRecurringPatterns } from '../../recurring/engine/recurring-detection';

self.onmessage = function (e) {
  const { transactions, recurringSettings } = e.data;

  try {
    const result = detectRecurringPatterns(transactions, recurringSettings);
    self.postMessage({ success: true, result });
  } catch (err) {
    self.postMessage({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Erreur inconnue' 
    });
  }
};
