import { useState, useEffect, useMemo, useRef } from 'react';
import type { Transaction } from '@/features/transactions/types';
import type { RecurringDetectionResult } from '../engine/recurring-detection';

/**
 * 🚀 HOOK : useRecurring (Version Finale Haute Performance)
 * - Déportation du calcul lourd dans un Web Worker.
 * - Debounce de 400ms pour éviter les calculs inutiles pendant la saisie/filtre.
 * - Data Thinning : Transfert ultra-léger des transactions vers le Worker.
 */
export function useRecurring(transactions: Transaction[]) {
  const [detectionResult, setDetectionResult] = useState<RecurringDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // 1. Initialisation unique du Worker (au montage du composant)
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../engine/recurring-worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e) => {
      if (e.data.success) {
        setDetectionResult(e.data.result);
      }
      setIsLoading(false);
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // 2. Déclenchement de l'analyse avec Debounce & Allègement des données
  useEffect(() => {
    if (transactions.length === 0) {
      setDetectionResult(null);
      return;
    }

    // ⏳ DEBOUNCE : On attend 400ms de stabilité pour lancer le worker
    const handler = setTimeout(() => {
      if (workerRef.current) {
        setIsLoading(true);

        // 🧹 DATA THINNING : On nettoie les transactions avant l'envoi
        // On ne passe que le strict nécessaire (id, desc, amount, date)
        // Cela réduit la taille du message de ~70% et évite de copier des objets complexes
        const leanTransactions = transactions.map(({ id, description, amount, date }) => ({
          id,
          description,
          amount,
          date
        }));

        workerRef.current.postMessage({
          transactions: leanTransactions,
          recurringSettings: {
            enabled: true,
            minOccurrences: 2,
            maxCoefficientVariation: 0.2,
            minConfidence: 70, 
            activeMultiplier: 1.5,
            typeTolerance: 0.1,
            useSemanticSimilarity: true,
            semanticMinScore: 70
          }
        });
      }
    }, 400);

    return () => clearTimeout(handler);
    // On surveille la longueur et l'ID de la première transaction pour détecter un changement de set
  }, [transactions.length, transactions[0]?.id]);

  // 3. Transformation des Patterns en Subscriptions (Consommation rapide pour l'UI)
// ✅ REMPLACER PAR UNE DÉRIVATION DU WORKER
const subscriptions = useMemo(() => {
  if (!detectionResult?.patterns) return [];
  
  return detectionResult.patterns.map(pattern => ({
    id: pattern.id,
    mainTransaction: pattern.transactions[0],
    allTransactions: pattern.transactions,
    stats: {
       // Utilise les stats déjà calculées par le worker !
       averageAmount: pattern.averageAmount,
       count: pattern.transactions.length
    }
  }));
}, [detectionResult]);

  // 4. Export des données consolidées
  return useMemo(() => ({
    // Patterns venant de l'IA (Worker)
    patterns: detectionResult?.patterns || [],
    monthlyRecurringAmount: detectionResult?.monthlyRecurringAmount || 0,
    summary: detectionResult?.summary || 'Analyse en cours...',
    
    // Groupes formatés pour les listes
    subscriptions,
    
    isLoading,
    
    // Métriques rapides pour les compteurs
    totalCount: detectionResult?.patterns?.length || 0,
    activeCount: detectionResult?.patterns?.filter(p => p.isActive).length || 0
  }), [detectionResult, subscriptions, isLoading]);
}