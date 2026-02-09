/**
 * 📝 RULES CENTER PANEL - REFONTE COMPLÈTE 2026
 * 
 * Améliorations :
 * - Formulaire aéré avec plus d'espace
 * - Scroll optimisé (overflow-y-auto sur le body uniquement)
 * - Inputs plus grands et lisibles
 * - Spacing généreux
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { Rule, RuleConditionType, RuleSeverity, RuleConditions, RuleActions } from '@/types/rules';

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
    actions: {
      markAsAnomaly: true,
      notifyUser: false,
      preventTransaction: false,
      alertMessage: '',
    } as RuleActions,
  });

  useEffect(() => {
    if (selectedRule && !isCreating) {
      setFormData(selectedRule);
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
        actions: {
          markAsAnomaly: true,
          notifyUser: false,
          preventTransaction: false,
          alertMessage: '',
        } as RuleActions,
      });
    }
  }, [selectedRule, isCreating]);

  const handleTypeSelect = useCallback((type: RuleConditionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      conditions: {},
    }));
    setStep('config');
  }, []);

  const handleConditionsChange = useCallback((conditions: RuleConditions) => {
    setFormData(prev => ({ ...prev, conditions }));
  }, []);

  const handleActionsChange = useCallback((actions: RuleActions) => {
    setFormData(prev => ({ ...prev, actions }));
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.name) return;
    onSave(formData);
  }, [formData, onSave]);

  const isValid = useMemo(() => !!formData.name, [formData.name]);

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

  // Vue vide
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
              {isCreating ? 'Nouvelle règle personnalisée' : selectedRule?.name}
            </h2>
            <p className="text-xs text-white/40 mt-1">
              {step === 'type' ? 'Étape 1 : Choisissez le type' : 'Étape 2 : Configuration'}
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

      {/* Body - SCROLL ICI UNIQUEMENT */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-8 max-w-4xl mx-auto">
          
          <AnimatePresence mode="wait">
            {/* ÉTAPE 1 : Type */}
            {step === 'type' && isCreating && (
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
            )}

            {/* ÉTAPE 2 : Configuration */}
            {step === 'config' && (
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

                  {/* Nom */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Nom de la règle *</label>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Limite Restaurants 150€/mois"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Description (optionnel)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Décrivez l'objectif de cette règle..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/30 resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Sévérité */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Niveau de sévérité</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as RuleSeverity }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                    >
                      <option value="info" className="bg-black">🔵 Information - Simple notification</option>
                      <option value="warning" className="bg-black">⚠️ Avertissement - Situation à surveiller</option>
                      <option value="error" className="bg-black">🔴 Critique - Action immédiate requise</option>
                    </select>
                  </div>

                  {/* Activer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <div className="text-sm font-medium text-white/90">Activer immédiatement</div>
                      <div className="text-xs text-white/40 mt-1">La règle sera appliquée à toutes les transactions</div>
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className={`relative w-14 h-7 rounded-full transition-all ${
                        formData.enabled ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                          formData.enabled ? 'translate-x-7' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Section : Conditions */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-medium text-white/90">Conditions de déclenchement</h3>
                  </div>

                  {renderConditionsForm()}
                </div>

                {/* Section : Actions */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-medium text-white/90">Actions automatiques</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-white/90">Marquer comme anomalie</div>
                        <div className="text-xs text-white/40 mt-1">Apparaîtra dans la section Insights</div>
                      </div>
                      <button
                        onClick={() => handleActionsChange({
                          ...formData.actions!,
                          markAsAnomaly: !formData.actions?.markAsAnomaly,
                        })}
                        className={`relative w-14 h-7 rounded-full transition-all ${
                          formData.actions?.markAsAnomaly ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                            formData.actions?.markAsAnomaly ? 'translate-x-7' : ''
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-white/90">Envoyer une notification</div>
                        <div className="text-xs text-white/40 mt-1">Notification push instantanée</div>
                      </div>
                      <button
                        onClick={() => handleActionsChange({
                          ...formData.actions!,
                          notifyUser: !formData.actions?.notifyUser,
                        })}
                        className={`relative w-14 h-7 rounded-full transition-all ${
                          formData.actions?.notifyUser ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                            formData.actions?.notifyUser ? 'translate-x-7' : ''
                          }`}
                        />
                      </button>
                    </div>
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
                ← Précédent
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
              {isCreating ? 'Créer la règle' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
