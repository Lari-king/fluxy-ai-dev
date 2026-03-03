import { Transaction } from '@/contexts/DataContext';

export type AnomalyType = 
  | 'amount'      // Montant inhabituel (Z-Score)
  | 'frequency'   // Trop de transactions d'un coup
  | 'category'    // Première fois dans cette catégorie
  | 'impulsive'   // Dépense typique du week-end / hors habitudes
  | 'duplicate';  // Doublon potentiel

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface Anomaly {
  id: string;
  transactionId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  score: number;        // Le résultat mathématique (ex: Z-Score de 3.5)
  message: string;      // Le verdict vulgarisé pour l'utilisateur
  date: string;
}

export interface AnalyticsSummary {
  suspiciousCount: number;
  anomalies: Anomaly[];
  analysisDate: string;
}