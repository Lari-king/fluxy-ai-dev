/**
 * 🎯 DEBOUNCE DE VALEURS
 * 
 * Retarde la mise à jour d'une valeur pour éviter les recalculs répétés
 * Utile pour les transactions qui changent fréquemment
 */

import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
