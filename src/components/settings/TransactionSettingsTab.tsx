/**
 * ⚙️ TRANSACTION SETTINGS TAB - VERSION 2026
 * 
 * Configuration optimisée :
 * - Détection d'anomalies (5 types)
 * - Détection de récurrences
 * - Performance avec useMemo/useCallback
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Info, 
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Copy,
  Calendar,
  Repeat,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useTransactionSettings } from '@/contexts/TransactionSettingsContext';

const DEFAULT_SETTINGS = {
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
  },
  recurring: {
    enabled: true,
    minOccurrences: 3,
    maxCoefficientVariation: 30,
    minConfidence: 50,
    activeMultiplier: 2,
    typeTolerance: 3,
  },
  lastUpdated: new Date().toISOString(),
};

export function TransactionSettingsTab() {
  let contextSettings: any, contextUpdateSettings: any, contextResetToDefaults: any;
  
  try {
    const context = useTransactionSettings();
    contextSettings = context.settings;
    contextUpdateSettings = context.updateSettings;
    contextResetToDefaults = context.resetToDefaults;
  } catch (error) {
    console.warn('TransactionSettingsContext non disponible');
  }

  const [localSettings, setLocalSettings] = useState(contextSettings || DEFAULT_SETTINGS);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general']));

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (contextUpdateSettings) {
      contextUpdateSettings(localSettings);
    }
    toast.success('Paramètres sauvegardés !', {
      description: 'Les nouveaux seuils seront appliqués immédiatement',
    });
  }, [localSettings, contextUpdateSettings]);

  const handleReset = useCallback(() => {
    if (contextResetToDefaults) {
      contextResetToDefaults();
    }
    setLocalSettings(DEFAULT_SETTINGS);
    toast.success('Paramètres réinitialisés');
  }, [contextResetToDefaults]);

  const updateAnomalySetting = useCallback((key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      anomaly: { ...prev.anomaly, [key]: value },
    }));
  }, []);

  const updateRecurringSetting = useCallback((key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      recurring: { ...prev.recurring, [key]: value },
    }));
  }, []);

  const anomalySections = useMemo(() => [
    {
      id: 'amount',
      title: 'Montant Anormal',
      icon: TrendingUp,
      color: 'cyan',
      fields: [
        { key: 'amountZScoreThreshold', label: 'Seuil Z-score', type: 'number', step: 0.1, min: 1, max: 5, default: 2.5, help: 'Écarts-types au-dessus de la moyenne' },
        { key: 'amountMinHistory', label: 'Historique minimum', type: 'number', min: 2, max: 20, default: 5, help: 'Transactions minimum par catégorie' },
        { key: 'amountZScoreHigh', label: 'Sévérité High', type: 'number', step: 0.1, min: 2, max: 10, default: 4 },
        { key: 'amountZScoreMedium', label: 'Sévérité Medium', type: 'number', step: 0.1, min: 1.5, max: 8, default: 3 },
      ]
    },
    {
      id: 'category',
      title: 'Catégorie Inhabituelle',
      icon: Copy,
      color: 'purple',
      fields: [
        { key: 'categoryMinHistory', label: 'Historique minimum', type: 'number', min: 2, max: 10, default: 3, help: 'Transactions minimum pour analyser' },
        { key: 'categoryUnusualThreshold', label: 'Seuil inhabituel (%)', type: 'number', min: 5, max: 50, default: 20, help: 'Catégorie < X% des txns = inhabituelle' },
      ]
    },
    {
      id: 'frequency',
      title: 'Fréquence Anormale',
      icon: Calendar,
      color: 'orange',
      fields: [
        { key: 'frequencyZScoreThreshold', label: 'Seuil Z-score', type: 'number', step: 0.1, min: 1, max: 5, default: 3, help: 'Trop de transactions en une journée' },
        { key: 'frequencyZScoreHigh', label: 'Sévérité High', type: 'number', step: 0.1, min: 2, max: 10, default: 4 },
      ]
    },
    {
      id: 'duplicate',
      title: 'Doublon Potentiel',
      icon: Copy,
      color: 'green',
      fields: [
        { key: 'duplicateWindowDays', label: 'Fenêtre (jours)', type: 'number', min: 1, max: 14, default: 3, help: 'Période pour rechercher les doublons' },
      ]
    },
    {
      id: 'location',
      title: 'Localisation Inhabituelle',
      icon: MapPin,
      color: 'blue',
      fields: [
        { key: 'locationUnusualThreshold', label: 'Seuil inhabituel (%)', type: 'number', min: 1, max: 20, default: 3, help: 'Pays < X% des txns = inhabituel' },
        { key: 'locationHighSeverityThreshold', label: 'Sévérité High (%)', type: 'number', step: 0.1, min: 0.1, max: 5, default: 1 },
      ]
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-lg font-medium text-white/90">Paramètres Transactions</h2>
            <p className="text-xs text-white/40">Configurez les algorithmes de détection</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-lg shadow-cyan-500/25"
          >
            <CheckCircle2 className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      </div>

      {/* DÉTECTION D'ANOMALIES */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/90">Détection d'Anomalies</h3>
              <p className="text-xs text-white/40">Identifiez les transactions inhabituelles</p>
            </div>
          </div>
          <button
            onClick={() => updateAnomalySetting('enabled', !localSettings.anomaly.enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              localSettings.anomaly.enabled ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${
                localSettings.anomaly.enabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {localSettings.anomaly.enabled && (
          <div className="p-4 space-y-3 border-t border-white/10">
            {/* Paramètres généraux */}
            <button
              onClick={() => toggleSection('general')}
              className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white/90">Paramètres généraux</span>
              </div>
              {expandedSections.has('general') ? (
                <ChevronUp className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/60" />
              )}
            </button>

            {expandedSections.has('general') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="pl-4 space-y-3"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60">
                    Période d'analyse (jours)
                    <span className="text-white/40 ml-2">Défaut: 30</span>
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={365}
                    value={localSettings.anomaly.lookbackDays}
                    onChange={(e) => updateAnomalySetting('lookbackDays', parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                  />
                  <p className="text-xs text-white/40">Nombre de jours à analyser pour détecter les anomalies</p>
                </div>
              </motion.div>
            )}

            {/* Sections d'anomalies */}
            {anomalySections.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <section.icon className={`w-4 h-4 text-${section.color}-400`} />
                    <span className="text-sm font-medium text-white/90">{section.title}</span>
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronUp className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  )}
                </button>

                {expandedSections.has(section.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="pl-4 pt-3 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <label className="text-xs font-medium text-white/60">
                            {field.label}
                            {field.default && (
                              <span className="text-white/40 ml-2">Défaut: {field.default}</span>
                            )}
                          </label>
                          <input
                            type={field.type}
                            step={field.step}
                            min={field.min}
                            max={field.max}
                            value={(localSettings.anomaly as any)[field.key]}
                            onChange={(e) => updateAnomalySetting(
                              field.key, 
                              field.type === 'number' ? parseFloat(e.target.value) : e.target.value
                            )}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                          />
                          {field.help && (
                            <p className="text-xs text-white/40">{field.help}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DÉTECTION DE RÉCURRENCES */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Repeat className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/90">Détection de Récurrences</h3>
              <p className="text-xs text-white/40">Identifiez les transactions répétitives</p>
            </div>
          </div>
          <button
            onClick={() => updateRecurringSetting('enabled', !localSettings.recurring.enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              localSettings.recurring.enabled ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${
                localSettings.recurring.enabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {localSettings.recurring.enabled && (
          <div className="p-4 space-y-3 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">
                  Occurrences minimales
                  <span className="text-white/40 ml-2">Défaut: 3</span>
                </label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={localSettings.recurring.minOccurrences}
                  onChange={(e) => updateRecurringSetting('minOccurrences', parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                />
                <p className="text-xs text-white/40">Nombre de transactions similaires minimum</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">
                  Confiance minimale (%)
                  <span className="text-white/40 ml-2">Défaut: 50</span>
                </label>
                <input
                  type="number"
                  min={30}
                  max={90}
                  value={localSettings.recurring.minConfidence}
                  onChange={(e) => updateRecurringSetting('minConfidence', parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                />
                <p className="text-xs text-white/40">Score de confiance minimum</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">
                  Coefficient variation max (%)
                  <span className="text-white/40 ml-2">Défaut: 30</span>
                </label>
                <input
                  type="number"
                  min={10}
                  max={50}
                  value={localSettings.recurring.maxCoefficientVariation}
                  onChange={(e) => updateRecurringSetting('maxCoefficientVariation', parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                />
                <p className="text-xs text-white/40">Régularité des intervalles requise</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">
                  Multiplicateur "Actif"
                  <span className="text-white/40 ml-2">Défaut: 2x</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={1}
                  max={5}
                  value={localSettings.recurring.activeMultiplier}
                  onChange={(e) => updateRecurringSetting('activeMultiplier', parseFloat(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                />
                <p className="text-xs text-white/40">Récurrence active si dernière txn {'<'} fréquence × X</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">
                  Tolérance type (jours)
                  <span className="text-white/40 ml-2">Défaut: ±3</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={localSettings.recurring.typeTolerance}
                  onChange={(e) => updateRecurringSetting('typeTolerance', parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                />
                <p className="text-xs text-white/40">Marge pour détecter quotidien/hebdo/mensuel</p>
              </div>
            </div>

            {/* Info box */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div className="text-xs text-purple-300">
                  <div className="font-medium mb-2">Types de récurrence détectés :</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-purple-400/70">
                    <div>• Quotidien : 1 jour</div>
                    <div>• Hebdomadaire : 7 jours</div>
                    <div>• Bihebdomadaire : 14 jours</div>
                    <div>• Mensuel : 30 jours</div>
                    <div>• Trimestriel : 90 jours</div>
                    <div>• Annuel : 365 jours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-white/40">
        Dernière modification : {new Date(localSettings.lastUpdated).toLocaleString('fr-FR')}
      </div>
    </div>
  );
}
