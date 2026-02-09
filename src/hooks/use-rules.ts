import { useMemo, useRef } from 'react';
import { evaluateAllRules } from '@/utils/ruleEngine';
import { Transaction } from '@/contexts/DataContext';
import { Rule, RuleViolation } from '@/types/rules';

const CACHE_EXPIRY = 30000; 

export function useRules(rules: Rule[], transactions: Transaction[]) {
  const cacheRef = useRef(new Map<string, { violations: RuleViolation[], timestamp: number }>());

  return useMemo(() => {
    const activeRules = rules.filter(r => r.enabled);
    // Clé de cache basée sur la longueur pour être ultra rapide
    const cacheKey = `${activeRules.length}-${transactions.length}-${transactions[0]?.id}`;
    
    const cached = cacheRef.current.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
      return cached.violations;
    }

    const violations = evaluateAllRules(activeRules, transactions);
    cacheRef.current.set(cacheKey, { violations, timestamp: Date.now() });
    
    return violations;
  }, [rules, transactions]);
}