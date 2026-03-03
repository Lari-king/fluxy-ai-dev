/**
 * 🎯 RULES CONTEXT - VERSION R.A.S.P STABILISÉE
 * Intègre le moteur de calcul et expose les règles au reste de l'application
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
// ✅ CORRECTION : Tous les types viennent du module intelligence (source unique)
import { Rule, RuleViolation, RuleConditionType } from '@/features/intelligence/types';
import { useData } from '@/contexts/DataContext'; 
import { evaluateAllRules } from '@/features/intelligence/engine/rule-engine';
import { toast } from 'sonner';

// ============================================================================
// TYPES ADDITIONNELS POUR LE CONTEXT
// ============================================================================

export interface RulesConfiguration {
  enabled: boolean;
  autoEvaluate: boolean;
  notificationsEnabled: boolean;
  strictMode: boolean;
  evaluationFrequency: 'realtime' | 'manual';
  maxViolationsHistory: number;
  defaultSeverity: 'error' | 'warning' | 'info';
}

export interface ViolationsSummary {
  totalViolations: number;
  byRuleType: Record<RuleConditionType, number>;
  bySeverity: { info: number; warning: number; error: number };
  mostViolatedRules: any[];
  recentViolations: RuleViolation[];
  oldestUnacknowledged?: RuleViolation;
}

const DEFAULT_CONFIGURATION: RulesConfiguration = {
  enabled: true,
  autoEvaluate: true,
  notificationsEnabled: true,
  strictMode: false,
  evaluationFrequency: 'realtime',
  maxViolationsHistory: 1000,
  defaultSeverity: 'warning',
};

interface RulesContextType {
  rules: Rule[];
  violations: RuleViolation[];
  configuration: RulesConfiguration;
  isEvaluating: boolean;
  addRule: (ruleData: any) => Promise<void>;
  updateRule: (id: string, updates: Partial<Rule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  refreshViolations: () => void;
  getViolationsSummary: () => ViolationsSummary;
  updateConfiguration: (updates: Partial<RulesConfiguration>) => void;
  acknowledgeViolation: (id: string) => void;
}

const RulesContext = createContext<RulesContextType | undefined>(undefined);

export function RulesProvider({ children }: { children: React.ReactNode }) {
  // Récupération des données depuis le DataContext
  const { rules: rawRules = [], transactions = [], updateRules, loading: dataLoading } = useData();
  
  const [violations, setViolations] = useState<RuleViolation[]>([]);
  const [configuration, setConfiguration] = useState<RulesConfiguration>(DEFAULT_CONFIGURATION);
  const [isEvaluating, setIsEvaluating] = useState(false);

  /**
   * Lance l'évaluation des règles sur les transactions
   */
  const runEvaluation = useCallback(() => {
    if (!configuration.enabled || dataLoading || !rawRules.length) {
      if (!rawRules.length) setViolations([]);
      return;
    }

    setIsEvaluating(true);
    
    // Petit délai pour éviter de bloquer le thread principal
    const timer = setTimeout(() => {
      try {
        const results = evaluateAllRules(rawRules, transactions);
        setViolations(results || []);
      } catch (err) {
        console.error("❌ RASP Engine Error:", err);
      } finally {
        setIsEvaluating(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [rawRules, transactions, configuration.enabled, dataLoading]);

  // Ré-évaluer dès que les règles ou les transactions changent
  useEffect(() => {
    if (configuration.autoEvaluate) {
      runEvaluation();
    }
  }, [runEvaluation, configuration.autoEvaluate]);

  const addRule = useCallback(async (ruleData: any) => {
    const newRule: Rule = {
      ...ruleData,
      id: `rule_${Date.now()}`,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggeredCount: 0,
    };
    
    await updateRules([...rawRules, newRule]);
    toast.success("Règle ajoutée");
  }, [rawRules, updateRules]);

  const updateRule = useCallback(async (id: string, updates: Partial<Rule>) => {
    const updated = rawRules.map(r => 
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    );
    await updateRules(updated);
  }, [rawRules, updateRules]);

  const deleteRule = useCallback(async (id: string) => {
    await updateRules(rawRules.filter(r => r.id !== id));
    toast.info("Règle supprimée");
  }, [rawRules, updateRules]);

  const acknowledgeViolation = useCallback((id: string) => {
    setViolations(prev => prev.map(v => v.id === id ? { ...v, acknowledged: true } : v));
  }, []);

  const getViolationsSummary = useCallback((): ViolationsSummary => {
    const bySeverity = { info: 0, warning: 0, error: 0 };
    const byRuleType: Record<RuleConditionType, number> = {
      category_budget: 0,
      merchant_frequency: 0,
      merchant_amount: 0,
      person_flow: 0,
      time_range: 0,
      recurring_variance: 0,
      keyword_detection: 0
    };

    violations.forEach(v => {
      if (v.severity in bySeverity) {
        bySeverity[v.severity as keyof typeof bySeverity]++;
      }
      const type = v.rule.type;
      if (type in byRuleType) {
        byRuleType[type as RuleConditionType]++;
      }
    });

    return {
      totalViolations: violations.length,
      byRuleType,
      bySeverity,
      mostViolatedRules: [],
      recentViolations: violations.slice(0, 5),
      oldestUnacknowledged: violations.find(v => !v.acknowledged)
    };
  }, [violations]);

  const value = useMemo(() => ({
    rules: rawRules,
    violations, 
    configuration, 
    isEvaluating, 
    addRule, 
    updateRule, 
    deleteRule,
    refreshViolations: runEvaluation,
    getViolationsSummary,
    updateConfiguration: (u: Partial<RulesConfiguration>) => setConfiguration(c => ({ ...c, ...u })),
    acknowledgeViolation
  }), [rawRules, violations, configuration, isEvaluating, addRule, updateRule, deleteRule, runEvaluation, getViolationsSummary, acknowledgeViolation]);

  return <RulesContext.Provider value={value}>{children}</RulesContext.Provider>;
}

export const useRules = () => {
  const context = useContext(RulesContext);
  if (!context) throw new Error('useRules must be used within RulesProvider');
  return context;
};