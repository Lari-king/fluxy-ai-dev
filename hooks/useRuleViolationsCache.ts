/**
 * 🎯 CACHE INTELLIGENT POUR LES VIOLATIONS DE RÈGLES
 * 
 * Évite de recalculer evaluateAllRules à chaque render
 * Gain estimé : 30-50 secondes sur 10k transactions
 */

import { useMemo, useRef } from 'react';
import { Rule, RuleViolation } from '@/types/rules';
import { Transaction } from '@/contexts/DataContext';
import { evaluateAllRules } from '@/src/utils/ruleEngine';

interface CacheEntry {
  violations: RuleViolation[];
  timestamp: number;
}

const CACHE_EXPIRY_MS = 30000; // 30 secondes

export function useRuleViolationsCache(rules: Rule[], transactions: Transaction[]): RuleViolation[] {
  const cacheRef = useRef(new Map<string, CacheEntry>());
  
  return useMemo(() => {
    // Générer une clé de cache basée sur les IDs des règles et le nombre de transactions
    const rulesKey = rules
      .filter(r => r.enabled)
      .map(r => `${r.id}-${r.updatedAt || 0}`)
      .sort()
      .join(',');
    
    const transactionsKey = `${transactions.length}-${transactions[0]?.id || ''}-${transactions[transactions.length - 1]?.id || ''}`;
    const cacheKey = `${rulesKey}__${transactionsKey}`;
    
    // Vérifier le cache
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_EXPIRY_MS) {
      console.log('✅ [PERF] Cache HIT pour violations de règles', {
        nbRègles: rules.filter(r => r.enabled).length,
        nbTransactions: transactions.length,
        nbViolations: cached.violations.length,
        âgeCache: `${Math.round((now - cached.timestamp) / 1000)}s`
      });
      return cached.violations;
    }
    
    // Cache MISS - Calculer les violations
    console.time('⏱️ [PERF] evaluateAllRules');
    console.log('⏳ [PERF] Calcul des violations de règles...', {
      nbRègles: rules.filter(r => r.enabled).length,
      nbTransactions: transactions.length
    });
    
    const violations = evaluateAllRules(rules, transactions);
    
    console.timeEnd('⏱️ [PERF] evaluateAllRules');
    console.log('✅ [PERF] Violations calculées', {
      nbViolations: violations.length,
      critiques: violations.filter((v: any) => v.severity === 'error').length,
      warnings: violations.filter((v: any) => v.severity === 'warning').length,
      infos: violations.filter((v: any) => v.severity === 'info').length
    });
    
    // Stocker dans le cache
    cacheRef.current.set(cacheKey, {
      violations,
      timestamp: now
    });
    
    // Nettoyer les vieilles entrées (garder max 5 entrées)
    if (cacheRef.current.size > 5) {
      const entries = Array.from(cacheRef.current.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Supprimer les 2 plus anciennes
      for (let i = 0; i < 2; i++) {
        cacheRef.current.delete(entries[i][0]);
      }
    }
    
    return violations;
  }, [rules, transactions]);
}
