/**
 * 🤖 MOTEUR DSL - RÈGLES D'ARBITRAGE AUTOMATIQUE
 * 
 * Exécute les règles DSL pour générer des signaux d'arbitrage
 * 
 * Philosophie :
 * - Le moteur ne prend JAMAIS de décisions
 * - Il produit uniquement des SIGNAUX
 * - Logique déterministe, sans IA
 * - Extensible pour règles utilisateur
 * 
 * ⚡ Performance : O(m × n) où m = nombre de règles, n = nombre de personnes
 * Avec optimisation : O(n) si les règles sont bien indexées
 */

import {
    PersonRelation,
    ArbitrageRule,
    ArbitrageSignal,
    RuleCondition,
    DependanceLevel,
    Trend,
    TimeBenefit,
    ContributionType,
    ProgressionState,
    PersonType,
  } from '../../types/people';
  import { DEFAULT_ARBITRAGE_RULES } from '../constants/people-config';
  
  // ========================================
  // 🔍 ÉVALUATION DES CONDITIONS
  // ========================================
  
  /**
   * Évalue une condition DSL pour une personne
   * 
   * @param person - Relation à évaluer
   * @param condition - Condition DSL
   * @returns true si la condition est satisfaite
   */
  function evaluateCondition(person: PersonRelation, condition: RuleCondition): boolean {
    const { field, operator, value } = condition;
    
    // Récupérer la valeur du champ sur la personne
    const fieldValue = person[field];
    
    // Si le champ n'existe pas, la condition échoue
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }
    
    // Évaluation selon l'opérateur
    switch (operator) {
      case 'EQUALS':
        return fieldValue === value;
      
      case 'IN':
        if (Array.isArray(value)) {
          return value.includes(fieldValue);
        }
        return false;
      
      case 'GT':
        if (typeof value === 'number' && typeof fieldValue === 'number') {
          return fieldValue > value;
        }
        return false;
      
      case 'LT':
        if (typeof value === 'number' && typeof fieldValue === 'number') {
          return fieldValue < value;
        }
        return false;
      
      default:
        return false;
    }
  }
  
  /**
   * Évalue toutes les conditions d'une règle (AND logique)
   * 
   * @param person - Relation à évaluer
   * @param conditions - Tableau de conditions
   * @returns true si TOUTES les conditions sont satisfaites
   */
  function evaluateRuleConditions(person: PersonRelation, conditions: RuleCondition[]): boolean {
    return conditions.every(condition => evaluateCondition(person, condition));
  }
  
  // ========================================
  // ⚙️ EXÉCUTION DES RÈGLES
  // ========================================
  
  /**
   * Résultat de l'exécution d'une règle
   */
  interface RuleExecutionResult {
    ruleId: string;
    ruleName: string;
    matched: boolean;
    signal?: ArbitrageSignal;
    message?: string;
  }
  
  /**
   * Exécute une règle pour une personne
   * 
   * @param person - Relation à évaluer
   * @param rule - Règle DSL
   * @returns Résultat de l'exécution
   */
  function executeRule(person: PersonRelation, rule: ArbitrageRule): RuleExecutionResult {
    // Si la règle est désactivée, elle ne s'applique pas
    if (!rule.active) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        matched: false,
      };
    }
    
    // Évaluer les conditions
    const matched = evaluateRuleConditions(person, rule.conditions);
    
    if (matched) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        matched: true,
        signal: rule.signal,
        message: rule.message,
      };
    }
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: false,
    };
  }
  
  /**
   * Exécute toutes les règles pour une personne
   * 
   * Si plusieurs règles matchent, on prend celle avec la priorité la plus haute
   * 
   * @param person - Relation à évaluer
   * @param rules - Règles DSL à exécuter
   * @returns Signal et message (ou undefined si aucune règle ne matche)
   */
  export function executeRulesForPerson(
    person: PersonRelation,
    rules: ArbitrageRule[] = DEFAULT_ARBITRAGE_RULES
  ): { signal?: ArbitrageSignal; message?: string } {
    // Exécuter toutes les règles
    const results = rules.map(rule => executeRule(person, rule));
    
    // Filtrer les règles qui ont matché
    const matchedResults = results.filter(r => r.matched);
    
    // Si aucune règle ne matche
    if (matchedResults.length === 0) {
      return {};
    }
    
    // Si plusieurs règles matchent, prendre celle avec la priorité la plus haute
    // (on trie par priorité croissante, donc la première = priorité la plus haute)
    const sortedByPriority = matchedResults.sort((a, b) => {
      const ruleA = rules.find(r => r.id === a.ruleId);
      const ruleB = rules.find(r => r.id === b.ruleId);
      return (ruleA?.priority || 999) - (ruleB?.priority || 999);
    });
    
    const topResult = sortedByPriority[0];
    
    return {
      signal: topResult.signal,
      message: topResult.message,
    };
  }
  
  // ========================================
  // 📦 ENRICHISSEMENT AVEC ARBITRAGE
  // ========================================
  
  /**
   * Enrichit une personne avec les signaux d'arbitrage
   * 
   * @param person - Relation déjà enrichie avec indicateurs
   * @param rules - Règles DSL à exécuter
   * @returns Relation avec signaux d'arbitrage
   */
  export function enrichWithArbitrageSignals(
    person: PersonRelation,
    rules: ArbitrageRule[] = DEFAULT_ARBITRAGE_RULES
  ): PersonRelation {
    const { signal, message } = executeRulesForPerson(person, rules);
    
    return {
      ...person,
      arbitrageSignal: signal,
      arbitrageMessage: message,
    };
  }
  
  /**
   * Enrichit toutes les personnes avec les signaux d'arbitrage
   * 
   * ⚡ Performance : O(m × n) où m = règles, n = personnes
   * 
   * @param people - Relations déjà enrichies avec indicateurs
   * @param rules - Règles DSL à exécuter
   * @returns Relations avec signaux d'arbitrage
   */
  export function enrichAllWithArbitrageSignals(
    people: PersonRelation[],
    rules: ArbitrageRule[] = DEFAULT_ARBITRAGE_RULES
  ): PersonRelation[] {
    return people.map(person => enrichWithArbitrageSignals(person, rules));
  }
  
  // ========================================
  // 🔧 GESTION DES RÈGLES UTILISATEUR
  // ========================================
  
  /**
   * Valide une règle DSL avant de l'ajouter
   * 
   * @param rule - Règle à valider
   * @returns { valid: boolean, errors: string[] }
   */
  export function validateRule(rule: ArbitrageRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Vérifier l'ID
    if (!rule.id || rule.id.trim() === '') {
      errors.push('L\'ID de la règle est requis');
    }
    
    // Vérifier le nom
    if (!rule.name || rule.name.trim() === '') {
      errors.push('Le nom de la règle est requis');
    }
    
    // Vérifier les conditions
    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push('Au moins une condition est requise');
    } else {
      rule.conditions.forEach((condition, index) => {
        if (!condition.field) {
          errors.push(`Condition ${index + 1}: le champ est requis`);
        }
        if (!condition.operator) {
          errors.push(`Condition ${index + 1}: l'opérateur est requis`);
        }
        if (condition.value === undefined || condition.value === null) {
          errors.push(`Condition ${index + 1}: la valeur est requise`);
        }
      });
    }
    
    // Vérifier le signal
    if (!rule.signal) {
      errors.push('Le signal est requis');
    }
    
    // Vérifier le message
    if (!rule.message || rule.message.trim() === '') {
      errors.push('Le message est requis');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Fusionne les règles par défaut avec les règles utilisateur
   * 
   * Les règles utilisateur peuvent override les règles par défaut (même ID)
   * 
   * @param customRules - Règles définies par l'utilisateur
   * @returns Règles fusionnées
   */
  export function mergeRules(customRules: ArbitrageRule[]): ArbitrageRule[] {
    const ruleMap = new Map<string, ArbitrageRule>();
    
    // Ajouter les règles par défaut
    DEFAULT_ARBITRAGE_RULES.forEach(rule => {
      ruleMap.set(rule.id, rule);
    });
    
    // Ajouter/Override avec les règles utilisateur
    customRules.forEach(rule => {
      ruleMap.set(rule.id, rule);
    });
    
    return Array.from(ruleMap.values());
  }
  
  // ========================================
  // 📊 STATISTIQUES SUR LES RÈGLES
  // ========================================
  
  /**
   * Statistiques d'exécution des règles
   */
  export interface RuleStats {
    totalRules: number;
    activeRules: number;
    matchedPeople: number;
    signalBreakdown: Record<ArbitrageSignal, number>;
    topMatchedRules: Array<{ ruleId: string; ruleName: string; matches: number }>;
  }
  
  /**
   * Génère des statistiques sur l'exécution des règles
   * 
   * Utile pour comprendre quelles règles sont les plus déclenchées
   * 
   * @param people - Relations enrichies avec signaux
   * @param rules - Règles exécutées
   * @returns Statistiques
   */
  export function generateRuleStats(
    people: PersonRelation[],
    rules: ArbitrageRule[] = DEFAULT_ARBITRAGE_RULES
  ): RuleStats {
    const signalBreakdown: Record<ArbitrageSignal, number> = {
      [ArbitrageSignal.REDUIRE]: 0,
      [ArbitrageSignal.SURVEILLER]: 0,
      [ArbitrageSignal.ASSUMER]: 0,
      [ArbitrageSignal.RENFORCER]: 0,
      [ArbitrageSignal.PROTEGER]: 0,
    };
    
    const ruleMatches = new Map<string, number>();
    
    // Compter les signaux et les règles matchées
    people.forEach(person => {
      if (person.arbitrageSignal) {
        signalBreakdown[person.arbitrageSignal]++;
      }
      
      // Identifier quelle règle a matché (en ré-exécutant)
      const results = rules.map(rule => ({
        rule,
        result: executeRule(person, rule),
      }));
      
      results
        .filter(r => r.result.matched)
        .forEach(r => {
          const count = ruleMatches.get(r.rule.id) || 0;
          ruleMatches.set(r.rule.id, count + 1);
        });
    });
    
    // Top règles matchées
    const topMatchedRules = Array.from(ruleMatches.entries())
      .map(([ruleId, matches]) => {
        const rule = rules.find(r => r.id === ruleId);
        return {
          ruleId,
          ruleName: rule?.name || 'Unknown',
          matches,
        };
      })
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 5);
    
    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.active).length,
      matchedPeople: people.filter(p => p.arbitrageSignal).length,
      signalBreakdown,
      topMatchedRules,
    };
  }
  
  // ========================================
  // 🎯 HELPERS POUR CRÉATION DE RÈGLES
  // ========================================
  
  /**
   * Helper pour créer une condition rapidement
   */
  export function createCondition(
    field: RuleCondition['field'],
    operator: RuleCondition['operator'],
    value: RuleCondition['value']
  ): RuleCondition {
    return { field, operator, value };
  }
  
  /**
   * Helper pour créer une règle rapidement
   */
  export function createRule(
    id: string,
    name: string,
    conditions: RuleCondition[],
    signal: ArbitrageSignal,
    message: string,
    priority: number = 999,
    active: boolean = true
  ): ArbitrageRule {
    return {
      id,
      name,
      priority,
      conditions,
      signal,
      message,
      active,
    };
  }
  