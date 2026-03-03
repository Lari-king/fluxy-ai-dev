import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { enrichPeopleData } from '../engine/enrichment';

export function usePeopleEngine() {
  const { people, transactions } = useData();

  // On mémorise le calcul pour éviter de tout recalculer au moindre scroll
  const result = useMemo(() => {
    if (!people.length) return { enrichedPeople: [], scores: null };
    
    return enrichPeopleData(people, transactions);
  }, [people, transactions]);

  return {
    people: result.enrichedPeople,
    scores: result.scores,
    count: result.enrichedPeople.length
  };
}