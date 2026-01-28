/**
 * 💰 FORMULAIRE - BUDGET PAR CATÉGORIE
 * 
 * ⚡ OPTIMISATIONS PERFORMANCE :
 * - État local pour les inputs numériques (évite re-renders à chaque frappe)
 * - Update parent seulement au blur/enter
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RuleConditions, RulePeriod } from '../../../types/rules';
import { useData } from '../../../contexts/DataContext';

interface CategoryBudgetFormProps {
  conditions: RuleConditions;
  onChange: (conditions: RuleConditions) => void;
}

export function CategoryBudgetForm({ conditions, onChange }: CategoryBudgetFormProps) {
  // ✅ Utiliser les VRAIES catégories depuis DataContext
  const { categories } = useData();

  // ⚡ OPTIMISATION : Local State pour les inputs numériques
  // On évite de faire remonter l'info au parent à chaque frappe, seulement au blur ou enter
  const [localAmount, setLocalAmount] = useState<string>(conditions.maxAmount?.toString() || '');

  // Synchroniser si le parent change (reset form)
  useEffect(() => {
    setLocalAmount(conditions.maxAmount?.toString() || '');
  }, [conditions.maxAmount]);

  const handleAmountBlur = useCallback(() => {
    const val = parseFloat(localAmount);
    if (!isNaN(val) && val !== conditions.maxAmount) {
      onChange({ ...conditions, maxAmount: val });
    }
  }, [localAmount, conditions, onChange]);
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-white/60 mb-2">Catégorie *</label>
        <select
          value={conditions.category || ''}
          onChange={(e) => onChange({ ...conditions, category: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
        >
          <option value="">Sélectionner une catégorie</option>
          {categories
            .filter(cat => !cat.parentId) // Catégories principales seulement
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">Montant maximum (€) *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="300.00"
          value={localAmount}
          onChange={(e) => setLocalAmount(e.target.value)} // ⚡ Mise à jour locale rapide
          onBlur={handleAmountBlur} // ⚡ Mise à jour parent coûteuse uniquement à la fin
          onKeyDown={(e) => e.key === 'Enter' && handleAmountBlur()}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">Période</label>
        <div className="grid grid-cols-3 gap-3">
          {(['daily', 'weekly', 'monthly'] as RulePeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ ...conditions, period: p })}
              className={`px-4 py-3 rounded-xl border transition-all ${
                conditions.period === p
                  ? 'bg-purple-600/20 border-purple-500/50 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              {p === 'daily' ? 'Jour' : p === 'weekly' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
        <p className="text-sm text-blue-300">
          💡 <strong>Exemple :</strong> Limite de 300€/mois dans la catégorie Restaurant
        </p>
      </div>
    </div>
  );
}
