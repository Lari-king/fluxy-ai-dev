// recurring-worker.ts
import { detectRecurringPatterns } from './recurring-detection';

let isBusy = false;

self.onmessage = function (e) {
  if (isBusy) return; // Ignore si un calcul est déjà en cours
  
  const { transactions, recurringSettings } = e.data;
  
  try {
    isBusy = true;
    const start = performance.now();
    
    const result = detectRecurringPatterns(transactions, recurringSettings);
    
    const end = performance.now();
    // Ce log te confirmera si on est bien sous les 100ms
    console.log(`[WORKER] 🔥 Détection CPU : ${(end - start).toFixed(2)}ms`);
    
    self.postMessage({ success: true, result });
  } catch (err) {
    self.postMessage({ success: false, error: "Erreur Worker" });
  } finally {
    isBusy = false;
  }
};