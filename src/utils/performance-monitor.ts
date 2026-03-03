/**
 * 🚀 Performance Monitor v2 - Ultra-Lightweight
 * Optimisé pour zéro impact CPU/Ventilation.
 */

import { useEffect, useRef } from 'react';

// Configuration
const ENABLE_MONITORING = process.env.NODE_ENV === 'development';
const RENDER_THRESHOLD = 30;    // Seuil d'alerte (rendus par fenêtre)
const TIME_WINDOW = 5000;       // Fenêtre de 5 secondes
const MEMORY_CHECK_MS = 60000;  // 1 minute (suffisant pour détecter une fuite)

// Stockage statique hors-composant pour éviter les re-renders
const stats = new Map<string, { total: number; timestamps: number[] }>();

/**
 * 🔥 Hook : useRenderTracker
 * Analyse les rendus sans ralentir le composant.
 */
export function useRenderTracker(componentName: string) {
  useEffect(() => {
    if (!ENABLE_MONITORING) return;

    const now = Date.now();
    let data = stats.get(componentName);

    if (!data) {
      data = { total: 0, timestamps: [] };
      stats.set(componentName, data);
    }

    data.total++;
    data.timestamps.push(now);

    // Nettoyage intelligent : On ne filtre que si on dépasse une certaine taille
    if (data.timestamps.length > RENDER_THRESHOLD * 2) {
      data.timestamps = data.timestamps.filter(ts => now - ts < TIME_WINDOW);
    }

    // Alerte critique : Trop de rendus détectés
    if (data.timestamps.length > RENDER_THRESHOLD) {
      // On utilise requestIdleCallback pour ne pas bloquer le thread principal
      const triggerWarning = () => {
        console.warn(`⚠️ PERFORMANCE CRITIQUE: ${componentName} (> ${RENDER_THRESHOLD} renders en ${TIME_WINDOW/1000}s)`);
        // On vide pour ne pas spammer l'alerte
        data!.timestamps = [];
      };

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(triggerWarning);
      } else {
        setTimeout(triggerWarning, 1);
      }
    }
  }, [componentName]); // ✅ Correction : Uniquement si le nom change
}

/**
 * 💾 Mesure de la mémoire optimisée
 */
export function logMemoryUsage() {
  if (!ENABLE_MONITORING || typeof window === 'undefined') return;
  
  const perf = window.performance as any;
  if (perf && perf.memory) {
    const { usedJSHeapSize, jsHeapSizeLimit } = perf.memory;
    const usedMB = Math.round(usedJSHeapSize / 1048576);
    const limitMB = Math.round(jsHeapSizeLimit / 1048576);
    const usagePercent = (usedMB / limitMB) * 100;

    // On ne log que si c'est important (> 50% ou toutes les minutes)
    if (usagePercent > 80) {
      console.error(`🚨 MÉMOIRE CRITIQUE: ${usedMB}MB / ${limitMB}MB (${usagePercent.toFixed(1)}%)`);
    } else {
      // Log discret en groupe pour ne pas polluer la console
      console.debug(`💾 Memory: ${usedMB}MB`);
    }
  }
}

/**
 * ⏱️ Mesure des calculs lourds
 */
export function useCalculationTracker(calculationName: string) {
  const start = () => {
    if (!ENABLE_MONITORING) return 0;
    return performance.now();
  };

  const end = (startTime: number) => {
    if (!ENABLE_MONITORING || startTime === 0) return;
    const duration = performance.now() - startTime;
    
    if (duration > 16.6) { // Plus d'une frame à 60fps
      console.warn(`⏱️ CALCUL LOURD: [${calculationName}] ${duration.toFixed(2)}ms`);
    }
  };

  return { start, end };
}

// Stats globales pour la console
export const getRenderStats = () => Object.fromEntries(stats);

if (ENABLE_MONITORING && typeof window !== 'undefined') {
  // ✅ INITIALISATION UNIQUE
  (window as any).fluxStats = getRenderStats;

  // Check mémoire toutes les minutes au lieu de 30s
  const memInterval = setInterval(logMemoryUsage, MEMORY_CHECK_MS);
  
  // Nettoyage automatique des stats globales toutes les 5 minutes pour éviter les fuites
  const cleanInterval = setInterval(() => stats.clear(), 300000);

  // Nettoyage si le module est déchargé (HMR)
  if ((import.meta as any).hot) {
    (import.meta as any).hot.dispose(() => {
      clearInterval(memInterval);
      clearInterval(cleanInterval);
    });
  }
}