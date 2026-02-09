/**
 * 🌐 BENCHMARK GLOBAL - EXPOSITION DANS WINDOW
 * 
 * Expose les fonctions de benchmark dans la console du navigateur
 * pour faciliter les tests manuels.
 * 
 * Ce fichier doit être importé dans App.tsx pour être disponible.
 */

import { quickBenchmark, testThresholds } from '@/utils/insights/quick-benchmark';

// Exposer les fonctions dans window pour accès console
if (typeof window !== 'undefined') {
  (window as any).fluxSmartBenchmark = {
    quick: quickBenchmark,
    testThresholds: testThresholds,
  };
  
  console.log('🔬 Flux Smart Benchmark disponible !');
  console.log('📝 Utilisation : fluxSmartBenchmark.quick(transactions)');
}

export {};
