/**
 * 🎯 RULES SETTINGS TAB - REFONTE COMPLÈTE 2026
 * 
 * Layout identique à Transactions :
 * - Pas d'onglets en haut (filtres dans CommandBar)
 * - 3 panneaux bien équilibrés
 * - Scroll optimisé
 * - Actions directes (pas de dropdown)
 */

import { useState, useMemo, useCallback } from 'react';
import { useRules } from '../../contexts/RulesContext';
import { Rule } from '../../types/rules';
import { toast } from 'sonner';

import { RulesCommandBar } from './RulesCommandBar';
import { RulesLeftPanel } from './RulesLeftPanel';
import { RulesCenterPanel } from './RulesCenterPanel';
import { RulesRightPanel } from './RulesRightPanel';

export function RulesSettingsTab() {
  const { 
    rules, 
    addRule,
    updateRule,
    toggleRule, 
    deleteRule,
  } = useRules();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Règles filtrées
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const matchesSearch = !searchTerm || 
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = 
        activeFilter === 'all' ||
        (activeFilter === 'enabled' && rule.enabled) ||
        (activeFilter === 'disabled' && !rule.enabled);

      return matchesSearch && matchesFilter;
    });
  }, [rules, searchTerm, activeFilter]);

  const selectedRule = useMemo(() => {
    return rules.find(r => r.id === selectedRuleId) || null;
  }, [rules, selectedRuleId]);

  const enabledRules = useMemo(() => 
    rules.filter(r => r.enabled).length,
    [rules]
  );

  const handleNewRule = useCallback(() => {
    setSelectedRuleId(null);
    setIsCreating(true);
  }, []);

  const handleSelectRule = useCallback((ruleId: string | null) => {
    if (ruleId === null) {
      handleNewRule();
    } else {
      setSelectedRuleId(ruleId);
      setIsCreating(false);
    }
  }, [handleNewRule]);

  const handleSaveRule = useCallback(async (ruleData: Partial<Rule>) => {
    try {
      if (isCreating) {
        await addRule(ruleData as Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>);
        toast.success('Règle créée !');
        setIsCreating(false);
        setSelectedRuleId(null);
      } else if (selectedRule) {
        await updateRule(selectedRule.id, ruleData);
        toast.success('Règle mise à jour !');
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  }, [isCreating, selectedRule, addRule, updateRule]);

  const handleCancelEdit = useCallback(() => {
    setIsCreating(false);
    setSelectedRuleId(null);
  }, []);

  const handleToggleRule = useCallback(async (ruleId: string, enabled: boolean) => {
    try {
      await toggleRule(ruleId);
      toast.success(enabled ? 'Règle activée' : 'Règle désactivée');
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Erreur lors de la modification');
    }
  }, [toggleRule]);

  const handleDeleteRule = useCallback(async (ruleId: string) => {
    try {
      await deleteRule(ruleId);
      toast.success('Règle supprimée');
      if (selectedRuleId === ruleId) {
        setSelectedRuleId(null);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [selectedRuleId, deleteRule]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black">
      
      {/* Command Bar - SANS ONGLETS, juste filtres et actions */}
      <RulesCommandBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNewRule={handleNewRule}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalRules={rules.length}
        enabledRules={enabledRules}
      />

      {/* Layout 3 panneaux - LARGEURS OPTIMISÉES */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel : Liste (440px - plus large pour confort) */}
        <div style={{ width: '440px', flexShrink: 0 }}>
          <RulesLeftPanel
            rules={filteredRules}
            selectedRuleId={selectedRuleId}
            onSelectRule={handleSelectRule}
            onToggleRule={handleToggleRule}
            onDeleteRule={handleDeleteRule}
          />
        </div>

        {/* Center Panel : Formulaire (flex, prend le reste) */}
        <div className="flex-1 min-w-0">
          <RulesCenterPanel
            selectedRule={isCreating ? null : selectedRule}
            onSave={handleSaveRule}
            onCancel={handleCancelEdit}
            onNewRule={handleNewRule}
            isCreating={isCreating}
          />
        </div>

        {/* Right Panel : Preview (440px - plus large pour détails) */}
        <div style={{ width: '440px', flexShrink: 0 }}>
          <RulesRightPanel
            rule={isCreating ? null : selectedRule}
            isCreating={isCreating}
          />
        </div>

      </div>
    </div>
  );
}
