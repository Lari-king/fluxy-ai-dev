/**
 * 🎯 RULE EDITOR MODAL - VERSION 2026 (Fallback)
 * 
 * Modal harmonisé - utilisé si nécessaire :
 * - Couleurs moins saturées
 * - Contrastes optimisés
 * - Design cohérent
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRules } from '@/contexts/RulesContext';
import { Rule, RuleConditionType, RuleSeverity, RuleConditions, RuleActions } from '@/types/rules';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { RuleTypeSelector } from '@/components/settings/RuleTypeSelector';
import { CategoryBudgetForm } from '@/components/settings/rule-forms/CategoryBudgetForm';
import { MerchantFrequencyForm } from '@/components/settings/rule-forms/MerchantFrequencyForm';
import { MerchantAmountForm } from '@/components/settings/rule-forms/MerchantAmountForm';
import { KeywordDetectionForm } from '@/components/settings/rule-forms/KeywordDetectionForm';
import { TimeRangeForm } from '@/components/settings/rule-forms/TimeRangeForm';
import { RecurringVarianceForm } from '@/components/settings/rule-forms/RecurringVarianceForm';
import { PersonFlowForm } from '@/components/settings/rule-forms/PersonFlowForm';

interface RuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRule: Rule | null;
}

export function RuleEditorModal({ isOpen, onClose, editingRule }: RuleEditorModalProps) {
  const { addRule, updateRule } = useRules();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: RuleConditionType | null;
    severity: RuleSeverity;
    enabled: boolean;
    conditions: RuleConditions;
    actions: RuleActions;
  }>({
    name: '',
    description: '',
    type: null,
    severity: 'warning',
    enabled: true,
    conditions: {},
    actions: {
      markAsAnomaly: true,
      notifyUser: true
    }
  });

  useEffect(() => {
    if (editingRule) {
      setFormData({
        name: editingRule.name,
        description: editingRule.description,
        type: editingRule.type,
        severity: editingRule.severity,
        enabled: editingRule.enabled,
        conditions: editingRule.conditions,
        actions: editingRule.actions
      });
      setStep(2);
    } else {
      setFormData({
        name: '',
        description: '',
        type: null,
        severity: 'warning',
        enabled: true,
        conditions: {},
        actions: {
          markAsAnomaly: true,
          notifyUser: true
        }
      });
      setStep(1);
    }
  }, [editingRule, isOpen]);

  const handleClose = useCallback(() => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      type: null,
      severity: 'warning',
      enabled: true,
      conditions: {},
      actions: {
        markAsAnomaly: true,
        notifyUser: true
      }
    });
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Le nom de la règle est requis');
        return;
      }
      if (!formData.type) {
        toast.error('Le type de règle est requis');
        return;
      }

      if (editingRule) {
        await updateRule(editingRule.id, {
          name: formData.name,
          description: formData.description,
          severity: formData.severity,
          enabled: formData.enabled,
          conditions: formData.conditions,
          actions: formData.actions
        });
        toast.success('Règle mise à jour');
      } else {
        await addRule({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          severity: formData.severity,
          enabled: formData.enabled,
          conditions: formData.conditions,
          actions: formData.actions
        });
        toast.success('Règle créée');
      }

      handleClose();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [formData, editingRule, updateRule, addRule, handleClose]);

  const canGoNext = useCallback(() => {
    if (step === 1) return formData.type !== null;
    if (step === 2) return formData.name.trim() !== '';
    return true;
  }, [step, formData]);

  const renderConditionsForm = useCallback(() => {
    if (!formData.type) return null;

    const props = {
      conditions: formData.conditions,
      onChange: (conditions: RuleConditions) => setFormData({ ...formData, conditions })
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
  }, [formData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-medium text-white/90">
              {editingRule ? 'Modifier la règle' : 'Nouvelle règle'}
            </h2>
            <p className="text-xs text-white/40 mt-1">
              {step === 1 && 'Choisissez le type de règle'}
              {step === 2 && 'Configurez les conditions'}
              {step === 3 && 'Définissez les actions'}
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white/90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        {!editingRule && (
          <div className="flex items-center justify-center gap-2 px-6 py-4 border-b border-white/10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  s === step
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white/40'
                }`}>
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 rounded transition-colors ${
                    s < step ? 'bg-green-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <AnimatePresence mode="wait">
            {step === 1 && !editingRule && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <RuleTypeSelector
                  selectedType={formData.type}
                  onSelectType={(type) => setFormData({ ...formData, type })}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Nom *</label>
                    <input
                      type="text"
                      placeholder="Ex: Limite Restaurants"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Description</label>
                    <textarea
                      placeholder="Décrivez l'objectif..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/30 resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-sm font-medium text-white/90 mb-3">Conditions</h4>
                    {renderConditionsForm()}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60">Sévérité *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as RuleSeverity })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="info" className="bg-black">🔵 Information</option>
                    <option value="warning" className="bg-black">⚠️ Avertissement</option>
                    <option value="error" className="bg-black">🔴 Critique</option>
                  </select>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-white/90">Actions automatiques</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/90">Marquer comme anomalie</div>
                      <div className="text-xs text-white/40">Dans Insights</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.actions.markAsAnomaly || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        actions: { ...formData.actions, markAsAnomaly: e.target.checked }
                      })}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/90">Notifier</div>
                      <div className="text-xs text-white/40">Push notification</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.actions.notifyUser || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        actions: { ...formData.actions, notifyUser: e.target.checked }
                      })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/10">
          <div>
            {step > 1 && !editingRule && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
            >
              Annuler
            </button>

            {step < 3 && !editingRule ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  canGoNext()
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canGoNext()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  canGoNext()
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-lg shadow-green-500/25'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                {editingRule ? 'Mettre à jour' : 'Créer'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
