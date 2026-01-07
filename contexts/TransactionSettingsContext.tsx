/**
 * 🎛️ TRANSACTION SETTINGS CONTEXT - VERSION 2025 COMPLÈTE
 * 
 * Gère les paramètres pour :
 * - Détection d'anomalies (incl. impulsivité week-end)
 * - Détection de récurrences (incl. variation saisonnière)
 * - Projection (inflation + conseils démographiques)
 * 
 * Persistance : IndexedDB
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AnomalySettings {
  enabled: boolean;
  lookbackDays: number;

  // Montants anormaux
  amountZScoreThreshold: number;
  amountZScoreHigh: number;
  amountZScoreMedium: number;
  amountMinHistory: number;

  // Catégories inhabituelles
  categoryMinHistory: number;
  categoryUnusualThreshold: number;

  // Fréquence anormale
  frequencyZScoreThreshold: number;
  frequencyZScoreHigh: number;

  // Doublons
  duplicateWindowDays: number;

  // Localisation
  locationUnusualThreshold: number;
  locationHighSeverityThreshold: number;

  // 🆕 2025 : Détection des dépenses impulsives (week-end)
  impulsiveEnabled?: boolean;                    // défaut : true
  impulsiveThresholdMultiplier?: number;         // défaut : 1.2 (+20%)
}

export interface RecurringSettings {
  enabled: boolean;
  minOccurrences: number;
  maxCoefficientVariation: number;
  minConfidence: number;
  activeMultiplier: number;
  typeTolerance: number;

  // Flux Smart (sémantique)
  useSemanticSimilarity?: boolean;
  semanticMinScore?: number;

  // 🆕 2025 : Variation saisonnière
  seasonalEnabled?: boolean;                     // défaut : true
  seasonalTolerance?: number;                    // seuil % pour alerte (défaut : 15%)
}

export interface ProjectionSettings {
  // 🆕 2025 : Paramètres pour projection personnalisée
  inflationFactor?: number;                      // défaut : 1.05 (+5% Deloitte)
  userAge?: number;                              // pour conseils Gen Z (PwC)
}

export interface TransactionSettings {
  anomaly: AnomalySettings;
  recurring: RecurringSettings;
  projection?: ProjectionSettings;               // optionnel pour rétrocompatibilité
  lastUpdated: string;
}

const DEFAULT_SETTINGS: TransactionSettings = {
  anomaly: {
    enabled: true,
    lookbackDays: 30,
    amountZScoreThreshold: 2.5,
    amountZScoreHigh: 4,
    amountZScoreMedium: 3,
    amountMinHistory: 5,
    categoryMinHistory: 3,
    categoryUnusualThreshold: 20,
    frequencyZScoreThreshold: 3,
    frequencyZScoreHigh: 4,
    duplicateWindowDays: 3,
    locationUnusualThreshold: 3,
    locationHighSeverityThreshold: 1,

    // Nouveaux paramètres impulsivité
    impulsiveEnabled: true,
    impulsiveThresholdMultiplier: 1.2, // +20%
  },
  recurring: {
    enabled: true,
    minOccurrences: 3,
    maxCoefficientVariation: 30,
    minConfidence: 50,
    activeMultiplier: 2,
    typeTolerance: 3,
    useSemanticSimilarity: true,
    semanticMinScore: 70,

    // Nouveaux paramètres saisonniers
    seasonalEnabled: true,
    seasonalTolerance: 15, // alerte si >15% de variation
  },
  projection: {
    inflationFactor: 1.05, // +5% par défaut (Deloitte 2025)
    userAge: undefined,    // à remplir par l'utilisateur si voulu
  },
  lastUpdated: new Date().toISOString(),
};

interface TransactionSettingsContextType {
  settings: TransactionSettings;
  updateSettings: (newSettings: Partial<TransactionSettings>) => void;
  resetToDefaults: () => void;
}

const TransactionSettingsContext = createContext<TransactionSettingsContextType | undefined>(undefined);

export function TransactionSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TransactionSettings>(DEFAULT_SETTINGS);

  // Chargement depuis IndexedDB au démarrage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('transactionSettings');

      request.onsuccess = () => {
        if (request.result) {
          // Fusion intelligente : on garde les anciens params + on ajoute les nouveaux si manquants
          const loaded = request.result;
          const merged: TransactionSettings = {
            ...DEFAULT_SETTINGS,
            ...loaded,
            anomaly: { ...DEFAULT_SETTINGS.anomaly, ...loaded.anomaly },
            recurring: { ...DEFAULT_SETTINGS.recurring, ...loaded.recurring },
            projection: { ...DEFAULT_SETTINGS.projection, ...loaded.projection },
            lastUpdated: loaded.lastUpdated || new Date().toISOString(),
          };
          setSettings(merged);
        }
      };

      request.onerror = () => {
        console.warn('Impossible de charger les paramètres transaction – utilisation des valeurs par défaut');
      };
    } catch (error) {
      console.error('Erreur IndexedDB (chargement paramètres) :', error);
    }
  };

  const saveSettings = async (newSettings: TransactionSettings) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      store.put(newSettings, 'transactionSettings');
    } catch (error) {
      console.error('Erreur IndexedDB (sauvegarde paramètres) :', error);
    }
  };

  const updateSettings = (newSettings: Partial<TransactionSettings>) => {
    const updated: TransactionSettings = {
      ...settings,
      ...newSettings,
      anomaly: { ...settings.anomaly, ...(newSettings.anomaly || {}) },
      recurring: { ...settings.recurring, ...(newSettings.recurring || {}) },
      projection: { ...settings.projection, ...(newSettings.projection || {}) },
      lastUpdated: new Date().toISOString(),
    };
    setSettings(updated);
    saveSettings(updated);
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  };

  return (
    <TransactionSettingsContext.Provider value={{ settings, updateSettings, resetToDefaults }}>
      {children}
    </TransactionSettingsContext.Provider>
  );
}

export function useTransactionSettings() {
  const context = useContext(TransactionSettingsContext);
  if (!context) {
    throw new Error('useTransactionSettings must be used within TransactionSettingsProvider');
  }
  return context;
}

// Ouverture IndexedDB
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FluxDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    };
  });
}