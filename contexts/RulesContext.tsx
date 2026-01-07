/**
 * 🎯 CONTEXTE DE GESTION DES RÈGLES PERSONNALISÉES
 * 
 * Gère l'état global des règles personnalisées et leur persistance dans IndexedDB.
 * Fournit les méthodes CRUD et l'évaluation des règles sur les transactions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Rule, 
  RuleViolation, 
  RulesConfiguration,
  ViolationsSummary,
  RuleStatistics,
  RuleConditionType,
  RuleSeverity
} from '../types/rules';
import { Transaction } from './DataContext';
import { evaluateAllRules, evaluateRule } from '@/src/utils/ruleEngine';

// ========================================
// 🗄️ GESTION INDEXEDDB
// ========================================

const DB_NAME = 'FluxRulesDB';
const DB_VERSION = 1;
const RULES_STORE = 'rules';
const VIOLATIONS_STORE = 'violations';
const CONFIG_STORE = 'configuration';

/**
 * Initialise la base de données IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store des règles
      if (!db.objectStoreNames.contains(RULES_STORE)) {
        const rulesStore = db.createObjectStore(RULES_STORE, { keyPath: 'id' });
        rulesStore.createIndex('type', 'type', { unique: false });
        rulesStore.createIndex('enabled', 'enabled', { unique: false });
        rulesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Store des violations
      if (!db.objectStoreNames.contains(VIOLATIONS_STORE)) {
        const violationsStore = db.createObjectStore(VIOLATIONS_STORE, { keyPath: 'id' });
        violationsStore.createIndex('ruleId', 'ruleId', { unique: false });
        violationsStore.createIndex('violationDate', 'violationDate', { unique: false });
        violationsStore.createIndex('severity', 'severity', { unique: false });
        violationsStore.createIndex('acknowledged', 'acknowledged', { unique: false });
      }

      // Store de la configuration
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Sauvegarde une règle dans IndexedDB
 */
async function saveRuleToDB(rule: Rule): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RULES_STORE], 'readwrite');
    const store = transaction.objectStore(RULES_STORE);
    const request = store.put(rule);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Charge toutes les règles depuis IndexedDB
 */
async function loadRulesFromDB(): Promise<Rule[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RULES_STORE], 'readonly');
    const store = transaction.objectStore(RULES_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Supprime une règle de IndexedDB
 */
async function deleteRuleFromDB(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RULES_STORE], 'readwrite');
    const store = transaction.objectStore(RULES_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sauvegarde une violation dans IndexedDB
 */
async function saveViolationToDB(violation: RuleViolation): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VIOLATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(VIOLATIONS_STORE);
    const request = store.put(violation);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Charge toutes les violations depuis IndexedDB
 */
async function loadViolationsFromDB(): Promise<RuleViolation[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VIOLATIONS_STORE], 'readonly');
    const store = transaction.objectStore(VIOLATIONS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const violations = request.result || [];
      // Reconvertir les dates string en Date objects
      violations.forEach(v => {
        v.violationDate = new Date(v.violationDate);
      });
      resolve(violations);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sauvegarde la configuration dans IndexedDB
 */
async function saveConfigToDB(config: RulesConfiguration): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONFIG_STORE], 'readwrite');
    const store = transaction.objectStore(CONFIG_STORE);
    const request = store.put({ ...config, id: 'main' });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Charge la configuration depuis IndexedDB
 */
async function loadConfigFromDB(): Promise<RulesConfiguration | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONFIG_STORE], 'readonly');
    const store = transaction.objectStore(CONFIG_STORE);
    const request = store.get('main');

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Supprime toutes les violations de IndexedDB
 */
async function clearViolationsFromDB(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VIOLATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(VIOLATIONS_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ========================================
// 📦 CONFIGURATION PAR DÉFAUT
// ========================================

const DEFAULT_CONFIGURATION: RulesConfiguration = {
  enabled: true,
  autoEvaluate: true,
  notificationsEnabled: true,
  strictMode: false,
  evaluationFrequency: 'realtime',
  maxViolationsHistory: 1000,
  defaultSeverity: 'warning',
};

// ========================================
// 🎯 CONTEXTE REACT
// ========================================

interface RulesContextType {
  // État
  rules: Rule[];
  violations: RuleViolation[];
  configuration: RulesConfiguration;
  isLoading: boolean;
  
  // CRUD Règles
  addRule: (rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'>) => Promise<string>;
  updateRule: (id: string, updates: Partial<Rule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  duplicateRule: (id: string) => Promise<string>;
  
  // Évaluation des règles (sera implémenté en Phase 3)
  evaluateRules: (transactions: Transaction[]) => RuleViolation[];
  evaluateSingleRule: (ruleId: string, transactions: Transaction[]) => RuleViolation[];
  
  // Gestion des violations
  acknowledgeViolation: (violationId: string) => Promise<void>;
  resolveViolation: (violationId: string, notes?: string) => Promise<void>;
  clearViolations: () => Promise<void>;
  
  // Statistiques
  getRuleStatistics: (ruleId: string) => RuleStatistics | null;
  getViolationsSummary: () => ViolationsSummary;
  
  // Configuration
  updateConfiguration: (updates: Partial<RulesConfiguration>) => Promise<void>;
}

const RulesContext = createContext<RulesContextType | undefined>(undefined);

// ========================================
// 🏗️ PROVIDER
// ========================================

export function RulesProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [violations, setViolations] = useState<RuleViolation[]>([]);
  const [configuration, setConfiguration] = useState<RulesConfiguration>(DEFAULT_CONFIGURATION);
  const [isLoading, setIsLoading] = useState(true);

  // ========================================
  // Chargement initial depuis IndexedDB
  // ========================================
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [loadedRules, loadedViolations, loadedConfig] = await Promise.all([
          loadRulesFromDB(),
          loadViolationsFromDB(),
          loadConfigFromDB(),
        ]);
        
        setRules(loadedRules);
        setViolations(loadedViolations);
        setConfiguration(loadedConfig || DEFAULT_CONFIGURATION);
      } catch (error) {
        console.error('❌ Erreur chargement règles:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  // ========================================
  // CRUD RÈGLES
  // ========================================

  /**
   * Ajoute une nouvelle règle
   */
  const addRule = useCallback(async (
    ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'>
  ): Promise<string> => {
    const now = new Date().toISOString();
    const newRule: Rule = {
      ...ruleData,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      triggeredCount: 0,
    };

    await saveRuleToDB(newRule);
    setRules(prev => [...prev, newRule]);
    
    console.log('✅ Règle créée:', newRule.name);
    return newRule.id;
  }, []);

  /**
   * Met à jour une règle existante
   */
  const updateRule = useCallback(async (id: string, updates: Partial<Rule>): Promise<void> => {
    const ruleIndex = rules.findIndex(r => r.id === id);
    if (ruleIndex === -1) {
      throw new Error(`Règle ${id} introuvable`);
    }

    const updatedRule: Rule = {
      ...rules[ruleIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await saveRuleToDB(updatedRule);
    
    setRules(prev => {
      const newRules = [...prev];
      newRules[ruleIndex] = updatedRule;
      return newRules;
    });
    
    console.log('✅ Règle mise à jour:', updatedRule.name);
  }, [rules]);

  /**
   * Supprime une règle
   */
  const deleteRule = useCallback(async (id: string): Promise<void> => {
    await deleteRuleFromDB(id);
    setRules(prev => prev.filter(r => r.id !== id));
    
    console.log('✅ Règle supprimée:', id);
  }, []);

  /**
   * Active/désactive une règle
   */
  const toggleRule = useCallback(async (id: string): Promise<void> => {
    const rule = rules.find(r => r.id === id);
    if (!rule) {
      throw new Error(`Règle ${id} introuvable`);
    }

    await updateRule(id, { enabled: !rule.enabled });
  }, [rules, updateRule]);

  /**
   * Duplique une règle existante
   */
  const duplicateRule = useCallback(async (id: string): Promise<string> => {
    const rule = rules.find(r => r.id === id);
    if (!rule) {
      throw new Error(`Règle ${id} introuvable`);
    }

    const { id: _, createdAt: __, updatedAt: ___, triggeredCount: ____, lastTriggeredAt: _____, ...ruleData } = rule;
    
    return addRule({
      ...ruleData,
      name: `${rule.name} (copie)`,
    });
  }, [rules, addRule]);

  // ========================================
  // ÉVALUATION DES RÈGLES (Placeholder - Phase 3)
  // ========================================

  /**
   * Évalue toutes les règles actives sur les transactions
   * ⚠️ Sera implémenté en Phase 3 avec le rule-engine
   */
  const evaluateRules = useCallback((transactions: Transaction[]): RuleViolation[] => {
    if (!configuration.enabled) {
      return [];
    }

    // TODO Phase 3: Implémenter le moteur d'évaluation
    console.log('🔍 Évaluation de', rules.filter(r => r.enabled).length, 'règles sur', transactions.length, 'transactions');
    
    return evaluateAllRules(rules, transactions);
  }, [rules, configuration.enabled]);

  /**
   * Évalue une seule règle sur les transactions
   */
  const evaluateSingleRule = useCallback((ruleId: string, transactions: Transaction[]): RuleViolation[] => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule || !rule.enabled) {
      return [];
    }

    // Évaluer la règle sur toutes les transactions
    console.log('🔍 Évaluation de la règle:', rule.name);
    
    return evaluateAllRules([rule], transactions);
  }, [rules]);

  // ========================================
  // GESTION DES VIOLATIONS
  // ========================================

  /**
   * Marque une violation comme "prise en compte"
   */
  const acknowledgeViolation = useCallback(async (violationId: string): Promise<void> => {
    const violation = violations.find(v => v.id === violationId);
    if (!violation) {
      throw new Error(`Violation ${violationId} introuvable`);
    }

    const updatedViolation: RuleViolation = {
      ...violation,
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
    };

    await saveViolationToDB(updatedViolation);
    
    setViolations(prev => prev.map(v => 
      v.id === violationId ? updatedViolation : v
    ));
  }, [violations]);

  /**
   * Marque une violation comme "résolue"
   */
  const resolveViolation = useCallback(async (violationId: string, notes?: string): Promise<void> => {
    const violation = violations.find(v => v.id === violationId);
    if (!violation) {
      throw new Error(`Violation ${violationId} introuvable`);
    }

    const updatedViolation: RuleViolation = {
      ...violation,
      resolved: true,
      resolvedAt: new Date().toISOString(),
      acknowledged: true,
      acknowledgedAt: violation.acknowledgedAt || new Date().toISOString(),
      notes,
    };

    await saveViolationToDB(updatedViolation);
    
    setViolations(prev => prev.map(v => 
      v.id === violationId ? updatedViolation : v
    ));
  }, [violations]);

  /**
   * Supprime toutes les violations
   */
  const clearViolations = useCallback(async (): Promise<void> => {
    await clearViolationsFromDB();
    setViolations([]);
    
    console.log('✅ Toutes les violations ont été supprimées');
  }, []);

  // ========================================
  // STATISTIQUES
  // ========================================

  /**
   * Récupère les statistiques d'une règle
   */
  const getRuleStatistics = useCallback((ruleId: string): RuleStatistics | null => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) {
      return null;
    }

    const ruleViolations = violations.filter(v => v.ruleId === ruleId);
    
    // Calculer les violations par mois
    const violationsByMonth: Record<string, number> = {};
    ruleViolations.forEach(v => {
      const monthKey = v.violationDate.toISOString().substring(0, 7); // "2025-01"
      violationsByMonth[monthKey] = (violationsByMonth[monthKey] || 0) + 1;
    });

    // Calculer la moyenne par mois
    const months = Object.keys(violationsByMonth).length || 1;
    const averageTriggersPerMonth = ruleViolations.length / months;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      enabled: rule.enabled,
      totalTriggers: rule.triggeredCount,
      lastTriggered: rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt) : undefined,
      averageTriggersPerMonth,
      violationsByMonth,
      affectedTransactions: ruleViolations.length,
      effectiveness: ruleViolations.length > 0 ? 80 : 0, // TODO: Calculer vraiment
    };
  }, [rules, violations]);

  /**
   * Génère un résumé des violations
   */
  const getViolationsSummary = useCallback((): ViolationsSummary => {
    const byRuleType: Record<RuleConditionType, number> = {
      category_budget: 0,
      merchant_frequency: 0,
      merchant_amount: 0,
      person_flow: 0,
      time_range: 0,
      recurring_variance: 0,
      keyword_detection: 0,
    };

    const bySeverity: Record<RuleSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
    };

    const ruleCountMap = new Map<string, number>();

    violations.forEach(v => {
      byRuleType[v.rule.type] = (byRuleType[v.rule.type] || 0) + 1;
      bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
      ruleCountMap.set(v.ruleId, (ruleCountMap.get(v.ruleId) || 0) + 1);
    });

    const mostViolatedRules = Array.from(ruleCountMap.entries())
      .map(([ruleId, count]) => {
        const rule = rules.find(r => r.id === ruleId);
        return {
          ruleId,
          ruleName: rule?.name || 'Règle supprimée',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentViolations = [...violations]
      .sort((a, b) => b.violationDate.getTime() - a.violationDate.getTime())
      .slice(0, 10);

    const oldestUnacknowledged = violations
      .filter(v => !v.acknowledged)
      .sort((a, b) => a.violationDate.getTime() - b.violationDate.getTime())[0];

    return {
      totalViolations: violations.length,
      byRuleType,
      bySeverity,
      mostViolatedRules,
      recentViolations,
      oldestUnacknowledged,
    };
  }, [violations, rules]);

  // ========================================
  // CONFIGURATION
  // ========================================

  /**
   * Met à jour la configuration globale
   */
  const updateConfiguration = useCallback(async (updates: Partial<RulesConfiguration>): Promise<void> => {
    const newConfig = { ...configuration, ...updates };
    await saveConfigToDB(newConfig);
    setConfiguration(newConfig);
    
    console.log('✅ Configuration mise à jour:', updates);
  }, [configuration]);

  // ========================================
  // VALEUR DU CONTEXTE
  // ========================================

  const value: RulesContextType = useMemo(() => ({
    rules,
    violations,
    configuration,
    isLoading,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    evaluateRules,
    evaluateSingleRule,
    acknowledgeViolation,
    resolveViolation,
    clearViolations,
    getRuleStatistics,
    getViolationsSummary,
    updateConfiguration,
  }), [
    rules,
    violations,
    configuration,
    isLoading,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    evaluateRules,
    evaluateSingleRule,
    acknowledgeViolation,
    resolveViolation,
    clearViolations,
    getRuleStatistics,
    getViolationsSummary,
    updateConfiguration,
  ]);

  return (
    <RulesContext.Provider value={value}>
      {children}
    </RulesContext.Provider>
  );
}

// ========================================
// 🪝 HOOK PERSONNALISÉ
// ========================================

export function useRules(): RulesContextType {
  const context = useContext(RulesContext);
  if (!context) {
    throw new Error('useRules doit être utilisé à l\'intérieur d\'un RulesProvider');
  }
  return context;
}