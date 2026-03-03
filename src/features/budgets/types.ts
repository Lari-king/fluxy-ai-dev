/**
 * 📊 BUDGET TYPES - NEURO BANK
 */

import { Transaction } from '@/contexts/DataContext';

// Types de règles disponibles pour l'attribution automatique
export type BudgetRuleType = 'category' | 'person' | 'keyword' | 'amount';

// Opérateurs logiques pour les règles complexes
export type BudgetRuleOperator = 'equals' | 'contains' | 'greaterThan' | 'lessThan';

/**
 * Définit une règle spécifique permettant d'associer 
 * une transaction à une enveloppe budgétaire.
 */
export interface BudgetRule {
  type: BudgetRuleType;
  value: string | number; // Nom de catégorie, ID personne, mot-clé ou montant
  operator?: BudgetRuleOperator;
}

/**
 * Interface principale d'un Budget (Enveloppe)
 */
export interface Budget {
  id: string;
  name: string;
  category: string;
  allocated: number; // Montant prévu (ex: 500€)
  spent: number;     // Montant consommé (calculé dynamiquement)
  icon: string;      // Emoji ou identifiant d'icône
  color: string;     // Code couleur hexadécimal
  rules?: BudgetRule[]; // Liste de règles optionnelles
  
  // Paramètres temporels
  period?: 'weekly' | 'monthly' | 'yearly';
  month?: string;    // Format YYYY-MM (ex: "2025-02")
  startDate?: string;
  endDate?: string;
  
  // Métadonnées optionnelles pour le suivi
  description?: string;
  isAutomatic?: boolean; // Si le budget est géré par l'IA
}

/**
 * Interface pour les données enrichies utilisées dans l'UI
 * (Utile pour le hook useBudgets)
 */
export interface EnrichedBudget extends Budget {
  progress: number;      // Pourcentage de consommation (0-100+)
  remaining: number;     // Ce qu'il reste à dépenser
  isOverspent: boolean;  // Si le budget a été dépassé
  transactionsCount: number; // Nombre de transactions liées
}

/**
 * Props pour les composants de formulaires
 */
export interface BudgetFormProps {
  budget?: Budget | null;
  onClose: () => void;
  onSave: (budget: Budget) => void;
  categories: Array<{ id: string; name: string }>;
  people: Array<{ id: string; name: string }>;
}