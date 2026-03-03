/**
 * ✅ HOOK DE SÉLECTION TRANSACTIONS
 * Gère la logique de sélection multiple
 */

import { useState, useCallback } from 'react';

export function useTransactionSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const set = new Set(prev);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      return Array.from(set);
    });
  }, []);

  const toggleSelectAll = useCallback((allIds: string[]) => {
    setSelectedIds(prev => {
      if (prev.length === allIds.length) {
        return [];
      } else {
        return [...allIds];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  return {
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    selectMultiple,
    selectedCount: selectedIds.length
  };
}
