/**
 * 🎯 RULES SETTINGS TAB - REFONTE COMPLÈTE 2026
 * * Layout identique à Transactions :
 * - Pas d'onglets en haut (filtres dans CommandBar)
 * - 3 panneaux bien équilibrés
 * - Scroll optimisé
 * - Actions directes (pas de dropdown)
 */

import { useState, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext'; // Import crucial : la source de vérité
import { useRules } from '@/contexts/RulesContext';
import { Rule } from '@/types/rules';
import { toast } from 'sonner';

import { RulesCommandBar } from '@/components/settings/RulesCommandBar';
import { RulesLeftPanel } from '@/components/settings/RulesLeftPanel';
import { RulesCenterPanel } from '@/components/settings/RulesCenterPanel';
import { RulesRightPanel } from '@/components/settings/RulesRightPanel';

export function RulesSettingsTab() {
  // 🟢 On récupère les données brutes depuis le DataContext
  const { rules = [] } = useData(); 
  
  // 🔵 On récupère les actions depuis le RulesContext
  const { 
    addRule,
    updateRule,
    deleteRule,
  } = useRules();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // 🔍 Règles filtrées basées sur la recherche et les filtres d'état
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
        // Suppression de l'ID pour la création
        const { id, ...newRuleData } = ruleData as any;
        await addRule(newRuleData);
        toast.success('Règle créée !');
        setIsCreating(false);
        setSelectedRuleId(null);
      } else if (selectedRule) {
        await updateRule(selectedRule.id, ruleData);
        toast.success('Règle mise à jour !');
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  }, [isCreating, selectedRule, addRule, updateRule]);

  const handleCancelEdit = useCallback(() => {
    setIsCreating(false);
    setSelectedRuleId(null);
  }, []);

  // ⚡ Correction : On utilise updateRule au lieu de toggleRule qui n'existe plus
  const handleToggleRule = useCallback(async (ruleId: string, enabled: boolean) => {
    try {
      await updateRule(ruleId, { enabled });
      toast.success(enabled ? 'Règle activée' : 'Règle désactivée');
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Erreur lors de la modification');
    }
  }, [updateRule]);

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
      
      {/* Command Bar : Recherche, Filtres et Bouton "Nouvelle règle" */}
      <RulesCommandBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNewRule={handleNewRule}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalRules={rules.length}
        enabledRules={enabledRules}
      />

      {/* Layout 3 panneaux */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel : Liste des règles existantes */}
        <div style={{ width: '440px', flexShrink: 0 }}>
          <RulesLeftPanel
            rules={filteredRules}
            selectedRuleId={selectedRuleId}
            onSelectRule={handleSelectRule}
            onToggleRule={handleToggleRule}
            onDeleteRule={handleDeleteRule}
          />
        </div>

        {/* Center Panel : Formulaire d'édition ou de création */}
        <div className="flex-1 min-w-0">
          <RulesCenterPanel
            selectedRule={isCreating ? null : selectedRule}
            onSave={handleSaveRule}
            onCancel={handleCancelEdit}
            onNewRule={handleNewRule}
            isCreating={isCreating}
          />
        </div>

        {/* Right Panel : Preview en temps réel de l'impact de la règle */}
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

export function RulesDiagnostic() {
  const { rules: dataRules } = useData();
  const { rules: contextRules } = useRules() as any; // On force pour voir si la propriété existe

  return (
    <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-black border border-cyan-500 rounded-lg text-[10px] font-mono text-cyan-400 max-w-xs shadow-2xl">
      <h4 className="font-bold border-b border-cyan-500/30 mb-2 uppercase">Diagnostic Système</h4>
      <div className="space-y-1">
        <p>1. DataContext Rules: <span className="text-white">{dataRules?.length || 0}</span></p>
        <p>2. RulesContext Rules: <span className="text-white">{contextRules?.length || 0}</span></p>
        <p>3. Data Loading: <span className="text-white">{useData().loading ? 'OUI' : 'NON'}</span></p>
      </div>
      {(!dataRules || dataRules.length === 0) && (
        <p className="mt-2 text-red-400">⚠️ Erreur : Aucune donnée dans DataContext !</p>
      )}
    </div>
  );
}