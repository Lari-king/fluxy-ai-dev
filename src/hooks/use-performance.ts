import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ⚡ DEBOUNCE DE VALEUR
 * Retarde la mise à jour d'une valeur (ex: barre de recherche)
 */
export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * ⚡ DEBOUNCE DE FONCTION
 * Empêche une fonction de s'exécuter trop souvent
 */
export function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number = 300) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { debouncedCallback, cancel };
}

/**
 * 🔒 MUTEX / LOCK
 * Empêche l'exécution simultanée d'une fonction asynchrone (ex: double clic sur Sauvegarder)
 */
export function useLock() {
  const isLockedRef = useRef(false);
  const withLock = useCallback(async <T>(fn: () => Promise<T>, name: string = 'lock'): Promise<T | null> => {
    if (isLockedRef.current) return null;
    isLockedRef.current = true;
    try {
      return await fn();
    } finally {
      isLockedRef.current = false;
    }
  }, []);
  return { withLock };
}