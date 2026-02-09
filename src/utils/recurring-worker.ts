// src/utils/recurring-worker.ts
self.onmessage = async function (e) {
    const { transactions, recurringSettings } = e.data;
  
    try {
      // Import avec chemin absolu (Vite alias @ = src/)
      const { detectRecurringPatterns } = await import('@/utils/insights/recurring-detection');
  
      console.log('[WORKER] Début détection récurrences –', transactions.length, 'transactions');
  
      const result = detectRecurringPatterns(transactions, recurringSettings);
  
      console.log('[WORKER] Fin détection – patterns trouvés :', result.patterns.length);
  
      self.postMessage({ success: true, result });
    } catch (err) {
      console.error('[WORKER] Erreur :', err);
      self.postMessage({ success: false, error: (err as Error).message || 'Erreur inconnue' });
    }
  };