/**
 * 🏷️ FORMULAIRE - BUDGET PAR CATÉGORIE
 */

import React from 'react';
import { RuleConditions } from '../../../types/rules';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { useData } from '../../../contexts/DataContext';

interface CategoryBudgetFormProps {
  conditions: RuleConditions;
  onChange: (conditions: RuleConditions) => void;
}

export function CategoryBudgetForm({ conditions, onChange }: CategoryBudgetFormProps) {
  // ✅ Utiliser les VRAIES catégories depuis DataContext
  const { categories } = useData();
  
  // Trier les catégories alphabétiquement par leur nom
  const sortedCategories = [...categories].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie *</Label>
          <Select
            value={conditions.category || ''}
            onValueChange={(value) => onChange({ ...conditions, category: value })}
          >
            <SelectTrigger 
              id="category"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            >
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              {sortedCategories.map(cat => (
                <SelectItem 
                  key={cat.id} 
                  value={cat.name}
                  className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">La catégorie à surveiller</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAmount">Montant maximum (€) *</Label>
          <Input
            id="maxAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="150.00"
            value={conditions.maxAmount || ''}
            onChange={(e) => onChange({ ...conditions, maxAmount: parseFloat(e.target.value) || 0 })}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500">Le budget à ne pas dépasser</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="period">Période *</Label>
        <Select
          value={conditions.period || 'monthly'}
          onValueChange={(value: any) => onChange({ ...conditions, period: value })}
        >
          <SelectTrigger 
            id="period"
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            <SelectItem value="daily" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Journalière</SelectItem>
            <SelectItem value="weekly" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Hebdomadaire</SelectItem>
            <SelectItem value="monthly" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Mensuelle</SelectItem>
            <SelectItem value="yearly" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Annuelle</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Sur quelle période vérifier</p>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>Astuce :</strong> Cette règle détectera toutes les transactions de la catégorie sélectionnée 
          dont le montant dépasse le seuil défini sur la période choisie.
        </p>
      </div>
    </div>
  );
}