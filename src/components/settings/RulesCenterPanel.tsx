/**
 * 📝 RULES CENTER PANEL - REFONTE COMPLÈTE 2026
 * * Améliorations :
 * - Formulaire aéré avec plus d'espace
 * - Scroll optimisé (overflow-y-auto sur le body uniquement)
 * - Inputs plus grands et lisibles
 * - Spacing généreux
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { Rule, RuleConditionType, RuleSeverity, RuleConditions, RuleActions } from '@/features/intelligence/types';

import { RuleTypeSelector } from '@/components/settings/RuleTypeSelector';
import { CategoryBudgetForm } from '@/components/settings/rule-forms/CategoryBudgetForm';
import { MerchantFrequencyForm } from '@/components/settings/rule-forms/MerchantFrequencyForm';
import { MerchantAmountForm } from '@/components/settings/rule-forms/MerchantAmountForm';
import { KeywordDetectionForm } from '@/components/settings/rule-forms/KeywordDetectionForm';
import { TimeRangeForm } from '@/components/settings/rule-forms/TimeRangeForm';
import { RecurringVarianceForm } from '@/components/settings/rule-forms/RecurringVarianceForm';
import { PersonFlowForm } from '@/components/settings/rule-forms/PersonFlowForm';

interface RulesCenterPanelProps {
  selectedRule: Rule | null;
  onSave: (rule: Partial<Rule>) => void;
  onCancel: () => void;
  onNewRule?: () => void;
  isCreating: boolean;
}

const INITIAL_ACTIONS: RuleActions = {
  markAsAnomaly: true,
  sendNotification: false,
  autoTag: '',
  preventDefault: false,
};

export function RulesCenterPanel({
  selectedRule,
  onSave,
  onCancel,
  onNewRule,
  isCreating,
}: RulesCenterPanelProps) {
  
  const [step, setStep] = useState<'type' | 'config'>(isCreating ? 'type' : 'config');
  
  const [formData, setFormData] = useState<Partial<Rule>>({
    name: '',
    description: '',
    enabled: true,
    type: 'category_budget',
    severity: 'warning',
    conditions: {},
    actions: INITIAL_ACTIONS,
  });

  // Synchronisation avec la règle sélectionnée ou le mode création
  useEffect(() => {
    if (selectedRule && !isCreating) {
      setFormData({
        ...selectedRule,
        actions: selectedRule.actions || INITIAL_ACTIONS
      });
      setStep('config');
    } else if (isCreating) {
      setStep('type');
      setFormData({
        name: '',
        description: '',
        enabled: true,
        type: 'category_budget',
        severity: 'warning',
        conditions: {},
        actions: INITIAL_ACTIONS,
      });
    }
  }, [selectedRule, isCreating]);

  const handleTypeSelect = useCallback((type: RuleConditionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      conditions: {},
      // Pré-remplissage du nom basé sur le type si vide
      name: prev.name || `Nouvelle règle ${type.replace('_', ' ')}`
    }));
    setStep('config');
  }, []);

  const handleConditionsChange = useCallback((conditions: RuleConditions) => {
    setFormData(prev => ({ ...prev, conditions }));
  }, []);

  const handleActionsChange = useCallback((updates: Partial<RuleActions>) => {
    setFormData(prev => ({ 
      ...prev, 
      actions: { ...(prev.actions || INITIAL_ACTIONS), ...updates } 
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.name || !formData.type) return;
    onSave(formData);
  }, [formData, onSave]);

  const isValid = useMemo(() => {
    return !!(formData.name && formData.name.trim().length > 2 && formData.type);
  }, [formData.name, formData.type]);

  const renderConditionsForm = useCallback(() => {
    if (!formData.type) return null;

    const props = {
      conditions: formData.conditions || {},
      onChange: handleConditionsChange,
    };

    switch (formData.type) {
      case 'category_budget': return <CategoryBudgetForm {...props} />;
      case 'merchant_frequency': return <MerchantFrequencyForm {...props} />;
      case 'merchant_amount': return <MerchantAmountForm {...props} />;
      case 'keyword_detection': return <KeywordDetectionForm {...props} />;
      case 'time_range': return <TimeRangeForm {...props} />;
      case 'recurring_variance': return <RecurringVarianceForm {...props} />;
      case 'person_flow': return <PersonFlowForm {...props} />;
      default: return null;
    }
  }, [formData.type, formData.conditions, handleConditionsChange]);

  // Vue d'attente quand rien n'est sélectionné
  if (!isCreating && !selectedRule) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg px-8"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-cyan-400" />
          </div>
          <h3 className="text-xl font-medium text-white/90 mb-3">
            Sélectionnez une règle
          </h3>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            Choisissez une règle dans la liste de gauche pour la modifier,<br />
            ou créez-en une nouvelle pour commencer.
          </p>
          <button 
            onClick={() => onNewRule?.()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl px-6 py-3 text-sm font-medium transition-all shadow-lg shadow-cyan-500/25 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Créer une nouvelle règle
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden">
      
      {/* Header - FIXE */}
      <div className="bg-black border-b border-white/10 p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white/90">
              {isCreating ? 'Nouvelle règle personnalisée' : formData.name}
            </h2>
            <p className="text-xs text-white/40 mt-1">
              {step === 'type' ? 'Étape 1 : Choisissez le type d\'analyse' : 'Étape 2 : Paramétrage des conditions'}
            </p>
          </div>

          <button 
            onClick={onCancel}
            className="p-2.5 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white/90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body - SCROLLABLE */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 max-w-4xl mx-auto">
          
          <AnimatePresence mode="wait">
            {step === 'type' && isCreating ? (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <RuleTypeSelector 
                  selectedType={formData.type || null}
                  onSelectType={handleTypeSelect} 
                />
              </motion.div>
            ) : (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Section : Infos générales */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-medium text-white/90">Informations générales</h3>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Nom de la règle *</label>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Alerte Frais Bancaires"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Description (optionnel)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Pourquoi avez-vous créé cette règle ?"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/30 resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Sévérité</label>
                      <select
                        value={formData.severity}
                        onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as RuleSeverity }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
                      >
                        <option value="info" className="bg-[#0A0A0A]">🔵 Information</option>
                        <option value="warning" className="bg-[#0A0A0A]">⚠️ Avertissement</option>
                        <option value="error" className="bg-[#0A0A0A]">🔴 Critique</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col justify-end">
                      <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                        <span className="text-sm font-medium text-white/90">État</span>
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
                          className={`relative w-12 h-6 rounded-full transition-all ${
                            formData.enabled ? 'bg-cyan-500' : 'bg-white/20'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.enabled ? 'translate-x-6' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section : Conditions Dynamiques */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-medium text-white/90">Conditions de détection</h3>
                  </div>
                  {renderConditionsForm()}
                </div>

                {/* Section : Actions */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-medium text-white/90">Comportement du moteur</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleActionsChange({ markAsAnomaly: !formData.actions?.markAsAnomaly })}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        formData.actions?.markAsAnomaly ? 'bg-cyan-500/10 border-cyan-500/50 text-white' : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                    >
                      <span className="text-sm font-medium">Anomalie visuelle</span>
                      {formData.actions?.markAsAnomaly && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </button>

                    <button
                      onClick={() => handleActionsChange({ sendNotification: !formData.actions?.sendNotification })}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        formData.actions?.sendNotification ? 'bg-blue-500/10 border-blue-500/50 text-white' : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                    >
                      <span className="text-sm font-medium">Notification push</span>
                      {formData.actions?.sendNotification && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer - FIXE */}
      <div className="bg-black border-t border-white/10 p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
          >
            Annuler
          </button>

          <div className="flex items-center gap-3">
            {step === 'config' && isCreating && (
              <button
                onClick={() => setStep('type')}
                className="px-5 py-2.5 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
              >
                ← Type de règle
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                isValid
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCreating ? 'Finaliser la création' : 'Appliquer les modifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}