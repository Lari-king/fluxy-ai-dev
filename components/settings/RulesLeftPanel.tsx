/**
 * 📋 RULES LEFT PANEL - REFONTE COMPLÈTE 2026
 * 
 * Améliorations :
 * - Plus large (440px)
 * - Boutons d'action DIRECTS au hover (pas de dropdown)
 * - Scroll fluide optimisé
 * - Spacing aéré
 * 
 * ⚡ OPTIMISATIONS PERFORMANCE :
 * - Mémoisation des items de liste (React.memo)
 * - Évite les re-renders inutiles
 */

import { useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Clock,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Wallet,
  ShoppingCart,
  DollarSign,
  Users,
  RefreshCw,
  Search,
  AlertTriangle
} from 'lucide-react';
import { Rule, RuleConditionType } from '../../types/rules';

const RULE_TYPE_CONFIG: Record<RuleConditionType, { icon: any; label: string }> = {
  category_budget: { icon: Wallet, label: 'Budget Catégorie' },
  merchant_frequency: { icon: Clock, label: 'Fréquence' },
  merchant_amount: { icon: DollarSign, label: 'Montant' },
  keyword_detection: { icon: Search, label: 'Mots-clés' },
  time_range: { icon: Clock, label: 'Plage Horaire' },
  recurring_variance: { icon: RefreshCw, label: 'Variation' },
  person_flow: { icon: Users, label: 'Flux Personne' },
};

interface RulesLeftPanelProps {
  rules: Rule[];
  selectedRuleId: string | null;
  onSelectRule: (ruleId: string | null) => void;
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  onDeleteRule?: (ruleId: string) => void;
}

// ⚡ OPTIMISATION : Composant Item mémorisé pour éviter les re-renders inutiles
const RuleItem = memo(({ 
  rule, 
  index,
  isSelected, 
  typeConfig, 
  onSelect, 
  onToggle, 
  onDelete 
}: { 
  rule: Rule; 
  index: number;
  isSelected: boolean; 
  typeConfig: { icon: any; label: string }; 
  onSelect: (ruleId: string) => void; 
  onToggle: (e: React.MouseEvent, ruleId: string, enabled: boolean) => void; 
  onDelete: (e: React.MouseEvent, ruleId: string, ruleName: string) => void;
}) => {
  const Icon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onSelect(rule.id)}
      className={`relative group cursor-pointer bg-white/5 border rounded-xl p-4 transition-all ${
        isSelected 
          ? 'border-cyan-500/50 bg-cyan-500/10 shadow-xl shadow-cyan-500/20' 
          : 'border-white/10 hover:border-white/20 hover:bg-white/10'
      }`}
    >
      {/* Header avec nom et toggle */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h4 className="text-sm font-medium text-white/90 truncate mb-1">
            {rule.name}
          </h4>
          {rule.description && (
            <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
              {rule.description}
            </p>
          )}
        </div>
        
        {/* Toggle Switch */}
        <button
          onClick={(e) => onToggle(e, rule.id, !rule.enabled)}
          className={`flex-shrink-0 p-2 rounded-lg transition-all ${
            rule.enabled 
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
              : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
          title={rule.enabled ? 'Désactiver' : 'Activer'}
        >
          {rule.enabled ? (
            <Power className="w-4 h-4" />
          ) : (
            <PowerOff className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Type + Sévérité */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          <Icon className="w-3.5 h-3.5" />
          <span>{typeConfig.label}</span>
        </div>

        <div className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
          rule.severity === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
          rule.severity === 'warning' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
          'bg-blue-500/10 text-blue-400 border-blue-500/30'
        }`}>
          {rule.severity === 'error' && '🔴'}
          {rule.severity === 'warning' && '⚠️'}
          {rule.severity === 'info' && '🔵'}
          <span className="ml-1 capitalize">{rule.severity}</span>
        </div>
      </div>

      {/* Actions directes au hover - BOUTONS VISIBLES */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => onDelete(e, rule.id, rule.name)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-lg text-xs text-white/60 hover:text-red-400 transition-all"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Supprimer</span>
        </button>
      </div>

      {/* Indicateur de sélection */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/50" />
      )}
    </motion.div>
  );
}, (prev, next) => {
  // ⚡ Custom comparison pour éviter les re-renders inutiles
  return (
    prev.rule.id === next.rule.id &&
    prev.rule.enabled === next.rule.enabled &&
    prev.rule.name === next.rule.name &&
    prev.isSelected === next.isSelected
  );
});

RuleItem.displayName = 'RuleItem';

export function RulesLeftPanel({
  rules,
  selectedRuleId,
  onSelectRule,
  onToggleRule,
  onDeleteRule,
}: RulesLeftPanelProps) {
  
  const stats = useMemo(() => ({
    total: rules.length,
    enabled: rules.filter(r => r.enabled).length,
    critical: rules.filter(r => r.severity === 'error' && r.enabled).length,
  }), [rules]);

  const handleToggle = useCallback((e: React.MouseEvent, ruleId: string, enabled: boolean) => {
    e.stopPropagation();
    onToggleRule(ruleId, enabled);
  }, [onToggleRule]);

  const handleDelete = useCallback((e: React.MouseEvent, ruleId: string, ruleName: string) => {
    e.stopPropagation();
    if (confirm(`Supprimer la règle "${ruleName}" ?`)) {
      onDeleteRule?.(ruleId);
    }
  }, [onDeleteRule]);

  const handleEdit = useCallback((e: React.MouseEvent, ruleId: string) => {
    e.stopPropagation();
    onSelectRule(ruleId);
  }, [onSelectRule]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-black border-r border-white/10">
      
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Target className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-medium text-white/90">Mes Règles</h2>
            <p className="text-xs text-white/40 mt-0.5">{stats.enabled}/{stats.total} actives</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="text-3xl font-light text-white/90">{stats.total}</div>
            <div className="text-xs text-white/40 mt-1">Règles totales</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-xl p-4"
          >
            <div className="text-3xl font-light text-red-400">{stats.critical}</div>
            <div className="text-xs text-red-400/60 mt-1">Critiques</div>
          </motion.div>
        </div>

        {/* Liste des règles */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
            Toutes les règles
          </h3>

          {rules.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
              <Target className="w-16 h-16 mx-auto text-white/20 mb-4" />
              <p className="text-sm text-white/60 mb-3">Aucune règle</p>
              <button
                onClick={() => onSelectRule(null)}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                + Créer ma première règle
              </button>
            </div>
          ) : (
            // ⚡ Utilisation du composant mémorisé pour éviter les re-renders inutiles
            rules.map((rule, index) => (
              <RuleItem
                key={rule.id}
                rule={rule}
                index={index}
                isSelected={rule.id === selectedRuleId}
                typeConfig={RULE_TYPE_CONFIG[rule.type]}
                onSelect={onSelectRule}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}