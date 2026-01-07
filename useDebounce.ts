import { useRef, useCallback } from 'react';

/**
 * Hook pour debouncer les appels de fonction
 * Utile pour éviter les appels API multiples simultanés
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { debouncedCallback, cancel };
}

/**
 * Hook pour créer un verrou sur les appels de fonction
 * Empêche les appels simultanés d'une même fonction
 */
export function useLock() {
  const isLockedRef = useRef(false);

  const withLock = useCallback(
    async <T,>(fn: () => Promise<T>, lockName: string = 'default'): Promise<T | null> => {
      if (isLockedRef.current) {
        console.log(`⏸️ ${lockName}: Appel ignoré (verrouillé)`);
        return null;
      }

      isLockedRef.current = true;
      console.log(`🔒 ${lockName}: Verrouillage activé`);

      try {
        const result = await fn();
        return result;
      } finally {
        isLockedRef.current = false;
        console.log(`🔓 ${lockName}: Verrouillage désactivé`);
      }
    },
    []
  );

  return { withLock, isLocked: () => isLockedRef.current };
}
