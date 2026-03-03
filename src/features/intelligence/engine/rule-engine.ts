/**
 * 🧠 MOTEUR DE RÈGLES - VERSION HARMONISÉE
 */
import { Transaction } from '@/features/transactions/types';
import { Rule, RuleViolation } from '../types';

const normalize = (str: string) => (str || "").toLowerCase().trim();

export interface RuleMatchResult {
  isViolation: boolean;
  message?: string;
}

export function evaluateRule(rule: Rule, transaction: Transaction): RuleMatchResult {
  if (!rule.enabled) return { isViolation: false };

  const { type, conditions } = rule;
  const amount = Math.abs(transaction.amount);

  switch (type) {
    case 'category_budget':
      // ✅ Correction : Cast sécurisé pour accéder aux propriétés spécifiques
      const budgetCond = conditions as any; 
      if (budgetCond.category && transaction.category === budgetCond.category) {
        const limit = budgetCond.maxAmount || budgetCond.value;
        if (limit && amount > limit) {
          return {
            isViolation: true,
            message: `Limite de ${limit}€ dépassée pour la catégorie ${transaction.category}.`
          };
        }
      }
      break;

    case 'merchant_amount':
      const merchantCond = conditions as any;
      const targetMerchant = merchantCond.merchant || merchantCond.merchantName;
      const threshold = merchantCond.amount || merchantCond.value;
      
      if (targetMerchant && normalize(transaction.description).includes(normalize(targetMerchant))) {
        if (threshold && amount > threshold) {
          return {
            isViolation: true,
            message: `Seuil de ${threshold}€ dépassé chez ${targetMerchant}.`
          };
        }
      }
      break;

    case 'keyword_detection':
      const kwCond = conditions as any;
      if (kwCond.keywords && kwCond.keywords.length > 0) {
        const desc = normalize(transaction.description);
        const foundKeyword = kwCond.keywords.find((kw: string) => desc.includes(normalize(kw)));
        if (foundKeyword) {
          return {
            isViolation: true,
            message: `Mot-clé détecté : "${foundKeyword}".`
          };
        }
      }
      break;

    default:
      return { isViolation: false };
  }

  return { isViolation: false };
}

export function evaluateAllRules(rules: Rule[], transactions: Transaction[]): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const activeRules = rules.filter(r => r.enabled);

  for (const rule of activeRules) {
    for (const tx of transactions) {
      if (tx.isHidden) continue;
      const result = evaluateRule(rule, tx);
      if (result.isViolation) {
        violations.push({
          id: `v-${rule.id}-${tx.id}-${Date.now()}`,
          ruleId: rule.id,
          rule: rule,               // Core structure
          transaction: tx,          // Core structure
          violationDate: new Date(), // Core name
          message: result.message || "Alerte de sécurité",
          severity: rule.severity,
          acknowledged: false
        });
      }
    }
  }
  return violations;
}
