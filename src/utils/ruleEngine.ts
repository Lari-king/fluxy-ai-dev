/**
 * 🎯 MOTEUR DE RÈGLES - VERSION ULTRA-OPTIMISÉE 2026
 * Support complet de la hiérarchie Catégories > Sous-catégories
 */

import { Rule, RuleConditions, RuleViolation } from '@/types/rules';
import { Transaction } from '@/utils/csv-parser';

// Utilitaire interne pour normaliser les comparaisons de texte
export const normalize = (str: string) => (str || "").toLowerCase().trim().replace(/\s+/g, ' ');

export interface RuleMatchResult {
  matches: boolean;
  reason?: string;
}

/**
 * Évalue une seule transaction par rapport à une règle
 */
export function evaluateRule(
  rule: Rule,
  transaction: Transaction,
  categories: any[] = []
): RuleMatchResult {
  if (!rule?.enabled) {
    return { matches: false, reason: 'Règle désactivée' };
  }

  const conditions = rule.conditions;
  if (!conditions) {
    return { matches: false, reason: 'Conditions manquantes' };
  }

  let result: RuleMatchResult;

  switch (rule.type) {
    case 'keyword_detection':
      result = evaluateKeywordDetection(conditions, transaction);
      break;
    case 'category_budget':
      result = evaluateCategoryBudget(conditions, transaction, categories);
      break;
    case 'merchant_frequency':
      result = evaluateMerchantFrequency(conditions, transaction);
      break;
    case 'merchant_amount':
      result = evaluateMerchantAmount(conditions, transaction);
      break;
    case 'time_range':
      result = evaluateTimeRange(conditions, transaction);
      break;
    case 'recurring_variance':
      result = evaluateRecurringVariance(conditions, transaction);
      break;
    case 'person_flow':
      result = evaluatePersonFlow(conditions, transaction);
      break;
    default:
      result = { matches: false, reason: `Type de règle inconnu : ${rule.type}` };
  }

  return result;
}

/**
 * 💰 BUDGET PAR CATÉGORIE (HIÉRARCHIQUE)
 * ──────────────────────────────────────────────
 * Option A adaptée à la réalité : on compare transaction.category
 * avec cond.subCategory en priorité (si défini dans la règle)
 */
function evaluateCategoryBudget(
  conditions: RuleConditions,
  transaction: Transaction,
  categories: any[] = []
): RuleMatchResult {
  const cond = conditions as any; // ou CategoryBudgetConditions quand typé

  console.log('[DEBUG evaluateCategoryBudget]', {
    ruleCategory: cond.category,
    ruleSubCategory: cond.subCategory,
    txCategory: transaction.category,
    txSubCategory: transaction.subCategory || '—',  // ← on log maintenant le vrai champ
    txAmount: Math.abs(transaction.amount),
    maxAmount: cond.maxAmount,
    period: cond.period,
  });

  if (!cond.maxAmount || cond.maxAmount <= 0) {
    return { matches: false, reason: 'Budget max non défini ou invalide' };
  }

  let isMatch = false;
  let matchType = '';

  const normTxCategory = normalize(transaction.category || '');
  const normTxSubCategory = normalize(transaction.subCategory || '');

  // ──────────────────────────────────────────────
  // 1. Règle sur une sous-catégorie précise
  // ──────────────────────────────────────────────
  if (cond.subCategory) {
    const normRuleSub = normalize(cond.subCategory);

    // On compare avec transaction.subCategory si présent, sinon avec category
    if (normTxSubCategory === normRuleSub || normTxCategory === normRuleSub) {
      isMatch = true;
      matchType = `Sous-catégorie exacte : ${cond.subCategory}`;
    }
  }

  // ──────────────────────────────────────────────
  // 2. Règle sur une catégorie parent (sans subCategory dans la règle)
  // ──────────────────────────────────────────────
  else if (cond.category) {
    const normRuleCat = normalize(cond.category);

    if (normTxCategory === normRuleCat) {
      isMatch = true;
      matchType = `Catégorie principale : ${cond.category}`;
    }
    // Ou si la transaction est une sous-catégorie de ce parent
    else {
      const parentCategory = categories.find(
        c => normalize(c.name) === normRuleCat || normalize(c.id) === normRuleCat
      );

      if (parentCategory) {
        // Vérifier si tx.category est une sous-cat de parentCategory
        const txCategoryObj = categories.find(c => normalize(c.name) === normTxCategory);
        if (txCategoryObj && txCategoryObj.parentId === parentCategory.id) {
          isMatch = true;
          matchType = `${transaction.category} (sous-catégorie de ${parentCategory.name})`;
        }
        // Ou si tx.subCategory existe et appartient au parent
        else if (transaction.subCategory) {
          const txSubObj = categories.find(c => normalize(c.name) === normTxSubCategory);
          if (txSubObj && txSubObj.parentId === parentCategory.id) {
            isMatch = true;
            matchType = `${transaction.subCategory} (sous-catégorie de ${parentCategory.name})`;
          }
        }
      }
    }
  }

  if (!isMatch) {
    return { matches: false, reason: `Pas de correspondance (cat: ${transaction.category}, sub: ${transaction.subCategory || '—'})` };
  }

  const amount = Math.abs(transaction.amount);
  if (amount >= cond.maxAmount) {
    return { matches: true, reason: `${matchType} – Dépassement : ${amount.toFixed(2)}€ / ${cond.maxAmount}€` };
  }

  return { matches: false, reason: `${matchType} – Sous le seuil (${amount.toFixed(2)}€ / ${cond.maxAmount}€)` };
}

function evaluateKeywordDetection(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const cond = conditions as any;
  const keywords = cond.keywords || [];

  if (keywords.length === 0) return { matches: false, reason: 'Aucun mot-clé défini' };

  const description = transaction.description || '';
  const caseSensitive = cond.caseSensitive ?? false;

  for (const keyword of keywords) {
    const matches = caseSensitive
      ? description.includes(keyword)
      : description.toLowerCase().includes(keyword.toLowerCase());
    if (matches) return { matches: true, reason: `Mot-clé détecté : ${keyword}` };
  }

  return { matches: false, reason: 'Aucun mot-clé trouvé' };
}

function evaluateMerchantFrequency(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const cond = conditions as any;
  const keywords = cond.merchantKeywords || [];

  if (keywords.length === 0) return { matches: false, reason: 'Marchand non défini' };

  const description = (transaction.description || '').toLowerCase();
  for (const k of keywords) {
    if (description.includes(k.toLowerCase())) {
      return { matches: true, reason: `Marchand détecté : ${k}` };
    }
  }
  return { matches: false, reason: 'Marchand différent' };
}

function evaluateMerchantAmount(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const cond = conditions as any;
  const keywords = cond.merchantKeywords || [];
  const maxAmount = cond.merchantMaxAmount;

  if (keywords.length === 0 || maxAmount === undefined) {
    return { matches: false, reason: 'Conditions incomplètes' };
  }

  const description = (transaction.description || '').toLowerCase();
  const hasMerchant = keywords.some(k => description.includes(k.toLowerCase()));
  if (!hasMerchant) return { matches: false, reason: 'Marchand différent' };

  const amount = Math.abs(transaction.amount);
  if (amount > maxAmount) {
    return { matches: true, reason: `Dépassement chez marchand : ${amount.toFixed(2)}€ > ${maxAmount}€` };
  }

  return { matches: false, reason: `Montant acceptable` };
}

function evaluateTimeRange(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const cond = conditions as any;
  const { startTime, endTime } = cond;

  if (!startTime || !endTime) return { matches: false, reason: 'Plage horaire non définie' };

  const txDate = new Date(transaction.date);
  if (isNaN(txDate.getTime())) return { matches: false, reason: 'Date invalide' };

  const time = txDate.toTimeString().substring(0, 5);
  if (time >= startTime && time <= endTime) {
    return { matches: true, reason: `Transaction dans la plage ${startTime}–${endTime}` };
  }

  return { matches: false, reason: `Hors plage (${time})` };
}

function evaluateRecurringVariance(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const cond = conditions as any;
  const { recurringDescription, maxVariancePercent = 0 } = cond;

  if (!recurringDescription) return { matches: false, reason: 'Description récurrente manquante' };

  const desc = (transaction.description || '').toLowerCase();
  if (!desc.includes(recurringDescription.toLowerCase())) {
    return { matches: false, reason: 'Description différente' };
  }

  // On utilise maxVariancePercent même si warning TS
  return { matches: true, reason: 'Abonnement détecté (variance non vérifiée ici)' };
}

function evaluatePersonFlow(conditions: RuleConditions, transaction: Transaction): RuleMatchResult {
  const cond = conditions as any;
  const { personName, flowType } = cond;

  if (!personName) return { matches: false, reason: 'Nom de personne manquant' };

  const desc = (transaction.description || '').toLowerCase();
  if (!desc.includes(personName.toLowerCase())) return { matches: false, reason: 'Nom non présent' };

  if (flowType === 'incoming' && transaction.amount <= 0) return { matches: false, reason: 'Pas un revenu' };
  if (flowType === 'outgoing' && transaction.amount >= 0) return { matches: false, reason: 'Pas une dépense' };

  return { matches: true, reason: `Flux ${flowType} pour ${personName}` };
}

/**
 * Évalue toutes les règles sur toutes les transactions
 */
export function evaluateAllRules(
  rules: Rule[],
  transactions: Transaction[],
  categories: any[] = []
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    for (const transaction of transactions) {
      const result = evaluateRule(rule, transaction, categories);
      if (result.matches) {
        violations.push({
          id: `${rule.id}-${transaction.id}-${Date.now()}`,
          ruleId: rule.id,
          rule,
          transaction,
          violationDate: new Date(),
          message: result.reason || 'Règle déclenchée',
          severity: rule.severity,
          acknowledged: false,
        });
      }
    }
  }

  console.log(`[RULE ENGINE SUMMARY] ${violations.length} violation(s) détectée(s)`);
  return violations;
}

// Utilitaires inchangés
export function filterTransactionsByRule(
  rule: Rule,
  transactions: Transaction[],
  categories: any[] = []
): Transaction[] {
  return transactions.filter(t => evaluateRule(rule, t, categories).matches);
}

export function countMatchingTransactions(
  rule: Rule,
  transactions: Transaction[],
  categories: any[] = []
): number {
  return filterTransactionsByRule(rule, transactions, categories).length;
}

export function sumMatchingTransactions(
  rule: Rule,
  transactions: Transaction[],
  categories: any[] = []
): number {
  return filterTransactionsByRule(rule, transactions, categories).reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );
}