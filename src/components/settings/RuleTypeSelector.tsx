/**
 * 🎯 RULE TYPE SELECTOR - VERSION 2026
 * 
 * Sélection intelligente du type de règle :
 * - Cards interactives avec gradients
 * - Preview des exemples
 * - Performance optimisée
 */

import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RuleConditionType } from '@/types/rules';
import { 
  Wallet, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Clock, 
  RefreshCw, 
  Search,
  Sparkles
} from 'lucide-react';

interface RuleType {
  id: RuleConditionType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  example: string;
  tags: string[];
}

const RULE_TYPES: RuleType[] = [
  {
    id: 'category_budget',
    label: 'Budget Catégorie',
    description: 'Plafond de dépenses par catégorie',
    icon: Wallet,
    gradient: 'from-cyan-500/5 to-blue-500/5',
    example: 'Max 150€/mois en Restaurants',
    tags: ['budget', 'catégorie', 'mensuel']
  },
  {
    id: 'merchant_frequency',
    label: 'Fréquence Commerçant',
    description: 'Limiter les achats répétés',
    icon: ShoppingCart,
    gradient: 'from-purple-500/5 to-pink-500/5',
    example: 'Max 2×/semaine chez Uber Eats',
    tags: ['fréquence', 'commerçant', 'hebdo']
  },
  {
    id: 'merchant_amount',
    label: 'Montant Commerçant',
    description: 'Plafond par commerçant',
    icon: DollarSign,
    gradient: 'from-green-500/5 to-emerald-500/5',
    example: 'Max 50€/semaine chez Uber Eats',
    tags: ['montant', 'commerçant', 'hebdo']
  },
  {
    id: 'person_flow',
    label: 'Flux de Fonds',
    description: 'Vérifier les transferts automatiques',
    icon: Users,
    gradient: 'from-orange-500/5 to-red-500/5',
    example: 'Si je reçois 624€, transférer au Proprio sous 7j',
    tags: ['transfert', 'personne', 'loyer']
  },
  {
    id: 'time_range',
    label: 'Plage Horaire',
    description: 'Contrôler par période',
    icon: Clock,
    gradient: 'from-indigo-500/5 to-blue-500/5',
    example: 'Max 220€ le week-end 18h-23h',
    tags: ['horaire', 'période', 'week-end']
  },
  {
    id: 'recurring_variance',
    label: 'Variation Abonnement',
    description: 'Détecter les augmentations',
    icon: RefreshCw,
    gradient: 'from-pink-500/5 to-rose-500/5',
    example: 'Netflix ne doit pas varier de +5%',
    tags: ['abonnement', 'récurrent', 'variation']
  },
  {
    id: 'keyword_detection',
    label: 'Détection Mots-clés',
    description: 'Alerter sur des termes spécifiques',
    icon: Search,
    gradient: 'from-red-500/5 to-pink-500/5',
    example: 'Alerter si AGIOS, FRAIS, COMMISSION',
    tags: ['mots-clés', 'alerte', 'frais']
  },
];

interface RuleTypeSelectorProps {
  selectedType: RuleConditionType | null;
  onSelectType: (type: RuleConditionType) => void;
}

export function RuleTypeSelector({ selectedType, onSelectType }: RuleTypeSelectorProps) {
  
  const handleSelect = useCallback((typeId: RuleConditionType) => {
    onSelectType(typeId);
  }, [onSelectType]);

  const ruleTypes = useMemo(() => RULE_TYPES, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-5 h-5 text-cyan-400" />
        <div>
          <h3 className="text-lg font-medium text-white/90">Choisissez le type de règle</h3>
          <p className="text-xs text-white/40">Sélectionnez le contrôle à mettre en place</p>
        </div>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ruleTypes.map((type, index) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;

          return (
            <motion.button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-xl border text-left transition-all group ${
                isSelected
                  ? 'border-cyan-500/50 bg-gradient-to-br ' + type.gradient + ' shadow-lg shadow-cyan-500/20'
                  : 'border-white/10 bg-white/5 hover:border-cyan-500/30 hover:bg-white/10'
              }`}
            >
              {/* Gradient background subtil */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

              <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2.5 rounded-lg transition-all ${
                  isSelected 
                    ? 'bg-cyan-500/20 border border-cyan-500/30' 
                    : 'bg-white/5 border border-white/10 group-hover:bg-white/10'
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${
                    isSelected ? 'text-cyan-400' : 'text-white/60 group-hover:text-white/90'
                  }`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-sm font-medium transition-colors ${
                      isSelected ? 'text-cyan-400' : 'text-white/90'
                    }`}>
                      {type.label}
                    </h4>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/50"
                      />
                    )}
                  </div>
                  
                  <p className="text-xs text-white/60 mb-2 leading-relaxed">
                    {type.description}
                  </p>

                  {/* Example badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                    isSelected 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'bg-white/5 text-white/40'
                  }`}>
                    <Sparkles className="w-3 h-3" />
                    <span className="italic">{type.example}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {type.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                          isSelected 
                            ? 'bg-cyan-500/20 text-cyan-400' 
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/50"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Info box */}
      <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <div className="flex gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div className="text-xs text-cyan-300">
            <div className="font-medium mb-1">Conseil intelligent</div>
            <div className="text-cyan-400/70">
              Commencez par les règles de <strong>Budget Catégorie</strong> pour contrôler vos dépenses,
              puis ajoutez des règles de <strong>Fréquence</strong> pour limiter les achats impulsifs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}