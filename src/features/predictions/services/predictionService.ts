import type { Transaction } from '@/features/transactions/types';

class PredictionService {
  private cache: any = null;
  private worker: Worker | null = null;
  private readonly CACHE_KEY = 'prediction_cache_light';

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('@/features/recurring/engine/recurring-worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (error) {
        console.warn('[PredictionService] Worker non disponible:', error);
      }
    }
  }

  generateVersion(transactions: Transaction[]): string {
    if (!transactions || transactions.length === 0) return 'empty';
    // Utilise le nombre et l'ID de la dernière transaction pour invalider le cache si changement
    return `${transactions.length}-${transactions[0]?.id}`;
  }

  getPredictions(transactions: Transaction[], balance: number, callback: (data: any) => void) {
    if (!transactions || transactions.length === 0) {
      callback(null);
      return;
    }

    const version = this.generateVersion(transactions);

    // 1. Cache mémoire
    if (this.cache?.version === version) {
      callback(this.cache.data);
      return;
    }

    // 2. LocalStorage (Persistance entre sessions)
    const stored = localStorage.getItem(this.CACHE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === version) {
          this.cache = parsed;
          callback(parsed.data);
          return;
        }
      } catch (e) {
        localStorage.removeItem(this.CACHE_KEY);
      }
    }

    // 3. Calcul via Web Worker (Évite de geler l'UI)
    if (this.worker) {
      this.worker.onmessage = (e) => {
        if (e.data && e.data.success) {
          // Le worker renvoie le résultat de detectRecurringPatterns
          const results = e.data.result; 
          this.cache = { version, data: results };
          localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
          callback(results);
        }
      };

      // Envoi au worker avec les paramètres attendus par recurring-worker.ts
      this.worker.postMessage({ 
        transactions, 
        recurringSettings: {
          enabled: true,
          minOccurrences: 2,
          maxCoefficientVariation: 50,
          minConfidence: 40
        }
      });
    }
  }
}

export const predictionService = new PredictionService();