/**
 * 🎯 RULES CONTEXT - VERSION R.A.S.P STABILISÉE
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Rule, RuleViolation, RulesConfiguration, ViolationsSummary } from '@/types/rules';
import { useData } from '@/contexts/DataContext'; 
import { evaluateAllRules } from '@/utils/ruleEngine';
import { toast } from 'sonner';

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
  const { rules: rawRules = [], transactions = [], categories = [], updateRules, loading: dataLoading } = useData();
  const [violations, setViolations] = useState<RuleViolation[]>([]);
  const [configuration, setConfiguration] = useState<RulesConfiguration>(DEFAULT_CONFIGURATION);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const runEvaluation = useCallback(() => {
    if (!configuration.enabled || dataLoading || !rawRules.length) {
      if (!rawRules.length) setViolations([]);
      return;
    }

    setIsEvaluating(true);
    // Petit timeout pour laisser l'UI respirer
    const timer = setTimeout(() => {
      try {
        const results = evaluateAllRules(rawRules, transactions, categories);
        setViolations(results || []);
      } catch (err) {
        console.error("❌ RASP Engine Error:", err);
      } finally {
        setIsEvaluating(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [rawRules, transactions, configuration.enabled, dataLoading]);

  useEffect(() => {
    runEvaluation();
  }, [runEvaluation]);

  const addRule = useCallback(async (ruleData: any) => {
    console.log("➕ RASP : Création d'une règle...");
    const newRule: Rule = {
      ...ruleData,
      id: `rule_${Date.now()}`,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggeredCount: 0,
    };
    
    // On propage vers le DataContext (qui sauvegardera en local)
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
    violations.forEach(v => {
      if (bySeverity[v.severity as keyof typeof bySeverity] !== undefined) {
        bySeverity[v.severity as keyof typeof bySeverity]++;
      }
    });
    return {
      totalViolations: violations.length,
      byRuleType: {},
      bySeverity,
      mostViolatedRules: [],
      recentViolations: violations.slice(0, 5),
      oldestUnacknowledged: violations.find(v => !v.acknowledged)
    };
  }, [violations]);

  const value = useMemo(() => ({
    violations, configuration, isEvaluating, addRule, updateRule, deleteRule,
    refreshViolations: runEvaluation,
    getViolationsSummary,
    updateConfiguration: (u: any) => setConfiguration(c => ({ ...c, ...u })),
    acknowledgeViolation
  }), [violations, configuration, isEvaluating, addRule, updateRule, deleteRule, runEvaluation, getViolationsSummary, acknowledgeViolation]);

  return <RulesContext.Provider value={value}>{children}</RulesContext.Provider>;
}

export const useRules = () => {
  const context = useContext(RulesContext);
  if (!context) throw new Error('useRules must be used within RulesProvider');
  return context;
};