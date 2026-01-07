/**
 * 🎯 MOTEUR DE RÈGLES
 * 
 * Évalue les règles personnalisées sur les transactions
 * Retourne les transactions qui correspondent aux conditions
 */

import { Rule, RuleConditions, RuleViolation } from '@/types/rules';
import { Transaction } from 'src/utils/csv-parser';
import { stringEquals, stringIncludes } from './stringUtils';

export interface RuleMatchResult {
  matches: boolean;
  reason?: string;
}

/**
 * Évalue une seule transaction par rapport à une règle
 */
export function evaluateRule(rule: Rule, transaction: Transaction): RuleMatchResult {
  if (!rule.enabled) {
    return { matches: false, reason: 'Règle désactivée' };
  }

  const conditions = rule.conditions;

  switch (rule.type) {
    case 'keyword_detection':
      return evaluateKeywordDetection(conditions, transaction);
    
    case 'category_budget':
      return evaluateCategoryBudget(conditions, transaction);
    
    case 'merchant_frequency':
      return evaluateMerchantFrequency(conditions, transaction);
    
    case 'merchant_amount':
      return evaluateMerchantAmount(conditions, transaction);
    
    case 'time_range':
      return evaluateTimeRange(conditions, transaction);
    
    case 'recurring_variance':
      return evaluateRecurringVariance(conditions, transaction);
    
    case 'person_flow':
      return evaluatePersonFlow(conditions, transaction);
    
    default:
      return { matches: false, reason: 'Type de règle inconnu' };
  }
}

/**
 * Évalue toutes les règles sur toutes les transactions et retourne les violations
 */
export function evaluateAllRules(rules: Rule[], transactions: Transaction[]): RuleViolation[] {
  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    for (const transaction of transactions) {
      const result = evaluateRule(rule, transaction);
      
      if (result.matches) {
        // Créer une violation
        const violation: RuleViolation = {
          id: `${rule.id}-${transaction.id}-${Date.now()}`,
          ruleId: rule.id,
          rule: rule,
          transaction: transaction,
          violationDate: new Date(),
          message: result.reason || `Règle "${rule.name}" déclenchée`,
          severity: rule.severity,
          acknowledged: false,
        };

        violations.push(violation);
      }
    }
  }

  return violations;
}

/**
 * Filtre les transactions qui correspondent à une règle
 */
export function filterTransactionsByRule(rule: Rule, transactions: Transaction[]): Transaction[] {
  return transactions.filter(transaction => {
    const result = evaluateRule(rule, transaction);
    return result.matches;
  });
}

/**
 * Compte les transactions qui correspondent à une règle
 */
export function countMatchingTransactions(rule: Rule, transactions: Transaction[]): number {
  return filterTransactionsByRule(rule, transactions).length;
}

/**
 * Calcule le montant total des transactions qui correspondent
 */
export function sumMatchingTransactions(rule: Rule, transactions: Transaction[]): number {
  const matching = filterTransactionsByRule(rule, transactions);
  return matching.reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

// ============================================================================
// ÉVALUATEURS PAR TYPE DE RÈGLE
// ============================================================================

/**
 * 🔍 DÉTECTION MOTS-CLÉS
 */
function evaluateKeywordDetection(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const keywords = conditions.keywords || [];
  if (keywords.length === 0) {
    return { matches: false, reason: 'Aucun mot-clé défini' };
  }

  const description = transaction.description || '';
  const caseSensitive = conditions.caseSensitive || false;

  const searchText = caseSensitive ? description : description.toUpperCase();

  for (const keyword of keywords) {
    const searchKeyword = caseSensitive ? keyword : keyword.toUpperCase();
    
    if (searchText.includes(searchKeyword)) {
      return { 
        matches: true, 
        reason: `Mot-clé trouvé: ${keyword}` 
      };
    }
  }

  return { matches: false, reason: 'Aucun mot-clé trouvé' };
}

/**
 * 💰 BUDGET PAR CATÉGORIE
 * 
 * Comparaison intelligente :
 * 1. Si égalité exacte → match
 * 2. Si catégorie règle incluse dans catégorie transaction → match
 * 
 * Exemples :
 * - "Loisirs" matche "Loisirs et Sorties" ✅
 * - "Transports" matche "Transports et Véhicules" ✅
 * - "Loisirs et Sorties" matche "Loisirs et Sorties" ✅
 */
function evaluateCategoryBudget(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const category = conditions.category;
  const maxAmount = conditions.maxAmount;

  if (!category) {
    // console.log('❌ Catégorie non définie dans la règle');
    return { matches: false, reason: 'Catégorie non définie' };
  }

  // 🔍 Comparaison intelligente : égalité exacte OU inclusion
  const exactMatch = stringEquals(transaction.category, category);
  const inclusionMatch = stringIncludes(transaction.category, category);
  const categoryMatches = exactMatch || inclusionMatch;

  // 🔍 DEBUG - Log détaillé de la comparaison (DÉSACTIVÉ pour performance)
  // console.log('🔍 evaluateCategoryBudget - Comparaison détaillée:', {
  //   ruleCategory: category,
  //   transactionCategory: transaction.category,
  //   transactionDesc: transaction.description?.substring(0, 50),
  //   transactionAmount: transaction.amount,
  //   maxAmount: maxAmount,
  //   exactMatch: exactMatch,
  //   inclusionMatch: inclusionMatch,
  //   finalMatch: categoryMatches
  // });

  if (!categoryMatches) {
    // console.log('❌ Catégories ne matchent pas');
    return { matches: false, reason: 'Catégorie différente' };
  }

  // console.log('✅ Catégorie match !', { category, matchType: exactMatch ? 'exact' : 'inclusion' });

  // Si un montant max est défini, vérifier le montant
  if (maxAmount !== undefined && maxAmount > 0) {
    const amount = Math.abs(transaction.amount);
    if (amount < maxAmount) {
      // console.log('❌ Montant sous le seuil:', { amount, maxAmount });
      return { matches: false, reason: 'Montant sous le seuil' };
    }
  }

  // console.log('✅✅ TRANSACTION MATCH COMPLÈTE !');
  return { 
    matches: true, 
    reason: `Catégorie: ${category}` 
  };
}

/**
 * 🏪 FRÉQUENCE MARCHAND
 */
function evaluateMerchantFrequency(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const merchantKeywords = conditions.merchantKeywords;

  if (!merchantKeywords || merchantKeywords.length === 0) {
    return { matches: false, reason: 'Mots-clés marchand non définis' };
  }

  const description = (transaction.description || '').toUpperCase();

  // Vérifier si au moins un mot-clé correspond
  for (const keyword of merchantKeywords) {
    const searchKeyword = keyword.toUpperCase();
    if (description.includes(searchKeyword)) {
      return { 
        matches: true, 
        reason: `Marchand détecté: ${keyword}` 
      };
    }
  }

  return { matches: false, reason: 'Marchand différent' };
}

/**
 * 💵 MONTANT MARCHAND
 */
function evaluateMerchantAmount(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const merchantKeywords = conditions.merchantKeywords;
  const expectedAmount = conditions.expectedAmount;
  const tolerance = conditions.expectedAmountTolerance || 0;

  if (!merchantKeywords || merchantKeywords.length === 0 || expectedAmount === undefined) {
    return { matches: false, reason: 'Marchand ou montant non défini' };
  }

  // Vérifier le marchand
  const description = (transaction.description || '').toUpperCase();
  let merchantFound = false;

  for (const keyword of merchantKeywords) {
    const searchKeyword = keyword.toUpperCase();
    if (description.includes(searchKeyword)) {
      merchantFound = true;
      break;
    }
  }

  if (!merchantFound) {
    return { matches: false, reason: 'Marchand différent' };
  }

  // Vérifier le montant avec tolérance (en %)
  const amount = Math.abs(transaction.amount);
  const toleranceAmount = (expectedAmount * tolerance) / 100;
  const minAmount = expectedAmount - toleranceAmount;
  const maxAmount = expectedAmount + toleranceAmount;

  if (amount >= minAmount && amount <= maxAmount) {
    return { 
      matches: true, 
      reason: `Marchand détecté, Montant: ${amount.toFixed(2)}` 
    };
  }

  return { 
    matches: false, 
    reason: `Montant hors tolérance (attendu: ${expectedAmount} ± ${tolerance}%)` 
  };
}

/**
 * ⏰ PLAGE HORAIRE
 */
function evaluateTimeRange(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const startTime = conditions.startTime;
  const endTime = conditions.endTime;

  if (!startTime || !endTime) {
    return { matches: false, reason: 'Plage horaire non définie' };
  }

  // Extraire l'heure de la transaction
  const transactionDate = new Date(transaction.date);
  const transactionTime = transactionDate.toTimeString().substring(0, 5); // "HH:MM"

  if (transactionTime >= startTime && transactionTime <= endTime) {
    return { 
      matches: true, 
      reason: `Heure: ${transactionTime}` 
    };
  }

  return { 
    matches: false, 
    reason: `Heure hors plage (${transactionTime})` 
  };
}

/**
 * 📊 VARIANCE RÉCURRENTE
 */
function evaluateRecurringVariance(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const recurringDescription = conditions.recurringDescription;
  const expectedAmount = conditions.expectedAmount;
  const maxVariancePercent = conditions.maxVariancePercent || 0;

  if (!recurringDescription) {
    return { matches: false, reason: 'Description abonnement non définie' };
  }

  // Vérifier si la transaction correspond à l'abonnement
  const description = (transaction.description || '').toUpperCase();
  const searchDescription = recurringDescription.toUpperCase();

  if (!description.includes(searchDescription)) {
    return { matches: false, reason: 'Abonnement différent' };
  }

  // Si un montant attendu est défini, vérifier la variance
  if (expectedAmount !== undefined && expectedAmount > 0) {
    const amount = Math.abs(transaction.amount);
    const variance = Math.abs(amount - expectedAmount);
    const variancePercentage = (variance / expectedAmount) * 100;

    if (variancePercentage > maxVariancePercent) {
      return { 
        matches: true, 
        reason: `Variance: ${variancePercentage.toFixed(1)}% (${amount.toFixed(2)}€ vs ${expectedAmount.toFixed(2)}€)` 
      };
    }

    return { 
        matches: false, 
        reason: `Variance acceptable (${variancePercentage.toFixed(1)}%)` 
      };
  }

  // Si pas de montant attendu, juste détecter la présence
  return { 
    matches: true, 
    reason: `Abonnement détecté: ${recurringDescription}` 
  };
}

/**
 * 👤 FLUX PERSONNE
 */
function evaluatePersonFlow(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const personName = conditions.personName;
  const flowType = conditions.flowType; // 'incoming' | 'outgoing'
  const minAmount = conditions.minAmount || 0;

  if (!personName) {
    return { matches: false, reason: 'Personne non définie' };
  }

  // Vérifier le nom de la personne dans la description
  const description = (transaction.description || '').toUpperCase();
  const searchName = personName.toUpperCase();

  if (!description.includes(searchName)) {
    return { matches: false, reason: 'Personne différente' };
  }

  // Vérifier le type de flux
  if (flowType === 'incoming' && transaction.amount <= 0) {
    return { matches: false, reason: 'Flux sortant au lieu d\'entrant' };
  }

  if (flowType === 'outgoing' && transaction.amount >= 0) {
    return { matches: false, reason: 'Flux entrant au lieu de sortant' };
  }

  // Vérifier le montant minimum
  const amount = Math.abs(transaction.amount);
  if (amount < minAmount) {
    return { matches: false, reason: `Montant sous le minimum (${minAmount})` };
  }

  return { 
    matches: true, 
    reason: `Personne: ${personName}, Flux: ${flowType}` 
  };
}