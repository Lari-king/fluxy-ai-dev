/**
 * 📊 HOOK USE-ANALYTICS
 * Point d'entrée pour la détection automatique (Anomalies & Intelligence Artificielle locale).
 */

import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useTransactionSettings } from '@/contexts/TransactionSettingsContext';
import { detectAnomalies } from '../engine/anomaly-core';
import { Anomaly } from '../types';

export function useAnalytics() {
  const { transactions, loading } = useData();
  const { settings } = useTransactionSettings();

  // 1. Détection des anomalies (Mémorisé)
  const anomalies = useMemo(() => {
    if (loading || !transactions.length || !settings.anomaly?.enabled) {
      return [];
    }

    // On ne passe que les transactions non masquées au moteur
    const activeTransactions = transactions.filter(t => !t.isHidden);
    
    return detectAnomalies(activeTransactions, settings.anomaly);
  }, [transactions, settings.anomaly, loading]);

  // 2. Résumé statistique
  const summary = useMemo(() => ({
    count: anomalies.length,
    highSeverityCount: anomalies.filter(a => a.severity === 'high').length,
    hasAnomalies: anomalies.length > 0,
    lastAnalysis: new Date().toISOString()
  }), [anomalies]);

  return {
    anomalies,
    summary,
    loading,
    settings: settings.anomaly
  };
}