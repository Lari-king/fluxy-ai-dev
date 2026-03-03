import { Transaction } from '@/utils/csv-parser';

export interface Rule {
  id: string;
  name: string;
  conditions: Condition[];
  actions: Action[];
  priority: number;
  enabled: boolean;
}

export interface Condition {
  field: 'description' | 'amount' | 'date';
  operator: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with';
  value: string | number;
  caseSensitive?: boolean;
}

export interface Action {
  field: 'category' | 'subCategory' | 'person' | 'tags'; 
  value: string | string[];
}

/**
 * Applique les règles d'intelligence sur une liste de transactions
 */
export function applyRules(transactions: any[], rules: Rule[]): any[] {
  const sortedRules = [...rules]
    .filter(rule => rule.enabled)
    .sort((a, b) => b.priority - a.priority);

  return transactions.map(transaction => {
    let updatedTransaction = { ...transaction };

    for (const rule of sortedRules) {
      if (matchesAllConditions(updatedTransaction, rule.conditions)) {
        updatedTransaction = applyActions(updatedTransaction, rule.actions);
      }
    }

    return updatedTransaction;
  });
}

function matchesAllConditions(transaction: any, conditions: Condition[]): boolean {
  return conditions.every(condition => matchesCondition(transaction, condition));
}

function matchesCondition(transaction: any, condition: Condition): boolean {
  const fieldValue = transaction[condition.field];
  if (fieldValue === undefined) return false;

  // Conversion en string pour les comparaisons textuelles
  const val = String(fieldValue);
  const target = String(condition.value);

  switch (condition.operator) {
    case 'contains':
      return condition.caseSensitive ? val.includes(target) : val.toLowerCase().includes(target.toLowerCase());

    case 'equals':
      if (typeof fieldValue === 'number' && typeof condition.value === 'number') {
        return fieldValue === condition.value;
      }
      return condition.caseSensitive ? val === target : val.toLowerCase() === target.toLowerCase();

    case 'starts_with':
      return condition.caseSensitive ? val.startsWith(target) : val.toLowerCase().startsWith(target.toLowerCase());

    case 'ends_with':
      return condition.caseSensitive ? val.endsWith(target) : val.toLowerCase().endsWith(target.toLowerCase());

    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);

    case 'less_than':
      return Number(fieldValue) < Number(condition.value);

    default:
      return false;
  }
}

function applyActions(transaction: any, actions: Action[]): any {
  let updated = { ...transaction };

  for (const action of actions) {
    switch (action.field) {
      case 'category':
        updated.category = action.value as string;
        break;
      case 'subCategory':
        updated.subCategory = action.value as string;
        break;
      case 'person':
        // On gère la correspondance avec personId
        updated.personId = action.value as string;
        break;
      case 'tags':
        const currentTags = updated.tags || [];
        const newTags = Array.isArray(action.value) ? action.value : [action.value as string];
        updated.tags = Array.from(new Set([...currentTags, ...newTags]));
        break;
    }
  }

  return updated;
}

/**
 * Règles par défaut (Tes exemples originaux + corrections de sous-catégories)
 */
export const defaultRules: Rule[] = [
  {
    id: 'rule_1',
    name: 'MAM Garde enfant',
    conditions: [{ field: 'description', operator: 'contains', value: 'MAM', caseSensitive: false }],
    actions: [
      { field: 'category', value: 'Famille' },
      { field: 'tags', value: ['garde', 'enfant'] }
    ],
    priority: 100,
    enabled: true,
  },
  {
    id: 'rule_2',
    name: 'Loyer / Crédit Coop',
    conditions: [
      { field: 'description', operator: 'contains', value: 'Crédit Coop', caseSensitive: false },
      { field: 'amount', operator: 'equals', value: 230 }
    ],
    actions: [
      { field: 'category', value: 'Dette' },
      { field: 'tags', value: ['crédit'] }
    ],
    priority: 100,
    enabled: true,
  },
  {
    id: 'rule_salaire',
    name: 'Salaire Caceis',
    conditions: [{ field: 'description', operator: 'contains', value: 'CACEIS BANK', caseSensitive: false }],
    actions: [
      { field: 'category', value: 'Revenus' },
      { field: 'subCategory', value: "Salaires et revenus d'activité" }
    ],
    priority: 110,
    enabled: true,
  }
];