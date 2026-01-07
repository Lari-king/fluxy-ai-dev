import { Transaction } from '../../contexts/DataContext';

class PredictionService {
  private cache: any = null;
  private worker: Worker | null = null;
  private readonly CACHE_KEY = 'prediction_cache_light';

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(
        new URL('../workers/prediction.worker.ts', import.meta.url),
        { type: 'module' } // <--- C'EST CETTE LIGNE QUI DÉBLOQUE TOUT
      );
    }
  }

  generateVersion(transactions: Transaction[]): string {
    if (!transactions || transactions.length === 0) return 'empty';
    return `${transactions.length}-${transactions[0]?.id}`;
  }

  getPredictions(transactions: Transaction[], balance: number, callback: (data: any[]) => void) {
    if (!transactions || transactions.length === 0) {
      callback([]);
      return;
    }

    const version = this.generateVersion(transactions);

    // 1. Retour immédiat si cache mémoire (Ultra-rapide)
    if (this.cache?.version === version) {
      callback(this.cache.data);
      return;
    }

    // 2. Retour rapide si LocalStorage
    const stored = localStorage.getItem(this.CACHE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === version) {
          this.cache = parsed;
          callback(parsed.data);
          return;
        }
        // Si obsolète, on peut envoyer les anciennes data en attendant le worker
        callback(parsed.data);
      } catch (e) {
        localStorage.removeItem(this.CACHE_KEY);
      }
    }

    // 3. Calcul via Web Worker (Non-bloquant)
    if (this.worker) {
      this.worker.onmessage = (e) => {
        // Sécurité : on vérifie que le worker a bien renvoyé des prédictions
        if (e.data && e.data.predictions) {
          const results = e.data.predictions;
          this.cache = { version, data: results };
          localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
          callback(results);
        }
      };
      this.worker.postMessage({ transactions, balance });
    }
  }
}

export const predictionService = new PredictionService();