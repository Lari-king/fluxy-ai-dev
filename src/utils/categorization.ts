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
  field: 'category' | 'person' | 'tags';
  value: string | string[];
}

export function applyRules(transactions: Transaction[], rules: Rule[]): Transaction[] {
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

function matchesAllConditions(transaction: Transaction, conditions: Condition[]): boolean {
  return conditions.every(condition => matchesCondition(transaction, condition));
}

function matchesCondition(transaction: Transaction, condition: Condition): boolean {
  const fieldValue = transaction[condition.field];
  
  if (fieldValue === undefined) return false;

  switch (condition.operator) {
    case 'contains':
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        const haystack = condition.caseSensitive ? fieldValue : fieldValue.toLowerCase();
        const needle = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
        return haystack.includes(needle);
      }
      return false;

    case 'equals':
      if (condition.caseSensitive === false && typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return fieldValue.toLowerCase() === condition.value.toLowerCase();
      }
      return fieldValue === condition.value;

    case 'starts_with':
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        const str = condition.caseSensitive ? fieldValue : fieldValue.toLowerCase();
        const prefix = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
        return str.startsWith(prefix);
      }
      return false;

    case 'ends_with':
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        const str = condition.caseSensitive ? fieldValue : fieldValue.toLowerCase();
        const suffix = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
        return str.endsWith(suffix);
      }
      return false;

    case 'greater_than':
      if (typeof fieldValue === 'number' && typeof condition.value === 'number') {
        return fieldValue > condition.value;
      }
      return false;

    case 'less_than':
      if (typeof fieldValue === 'number' && typeof condition.value === 'number') {
        return fieldValue < condition.value;
      }
      return false;

    default:
      return false;
  }
}

function applyActions(transaction: Transaction, actions: Action[]): Transaction {
  let updated = { ...transaction };

  for (const action of actions) {
    switch (action.field) {
      case 'category':
        updated.category = action.value as string;
        break;
      case 'person':
        updated.person = action.value as string;
        break;
      case 'tags':
        if (Array.isArray(action.value)) {
          updated.tags = [...(updated.tags || []), ...action.value];
        } else {
          updated.tags = [...(updated.tags || []), action.value as string];
        }
        break;
    }
  }

  return updated;
}

// Pre-defined rules examples
export const defaultRules: Rule[] = [
  {
    id: 'rule_1',
    name: 'MAM Garde enfant',
    conditions: [
      { field: 'description', operator: 'contains', value: 'MAM', caseSensitive: false }
    ],
    actions: [
      { field: 'category', value: 'famille' },
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
      { field: 'category', value: 'dette' },
      { field: 'tags', value: ['crédit'] }
    ],
    priority: 100,
    enabled: true,
  },
  {
    id: 'rule_3',
    name: 'Apple Services',
    conditions: [
      { field: 'description', operator: 'contains', value: 'apple.com', caseSensitive: false }
    ],
    actions: [
      { field: 'category', value: 'plaisir' },
      { field: 'tags', value: ['abonnement', 'apple'] }
    ],
    priority: 90,
    enabled: true,
  },
  {
    id: 'rule_4',
    name: 'Courses alimentaires',
    conditions: [
      { field: 'description', operator: 'contains', value: 'carrefour', caseSensitive: false }
    ],
    actions: [
      { field: 'category', value: 'alimentation' },
      { field: 'tags', value: ['courses'] }
    ],
    priority: 80,
    enabled: true,
  },
];
