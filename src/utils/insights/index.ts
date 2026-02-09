/**
 * 🧠 INSIGHTS INTELLIGENTS - Sans IA Externe
 * 
 * Système complet de détection de patterns et d'analyse financière
 * basé sur des algorithmes statistiques avancés.
 * 
 * Fonctionnalités :
 * - Projection fin de mois (régression linéaire)
 * - Détection d'anomalies (Z-score & IQR)
 * - Détection de dépenses récurrentes (pattern matching)
 */

export * from '@/utils/insights/statistics';
export * from '@/utils/insights/projection';
export * from '@/utils/insights/anomaly-detection';
export * from '@/utils/insights/recurring-detection';

// Types partagés
export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  merchant?: string;
  paymentMethod?: string;
  tags?: string[];
}
