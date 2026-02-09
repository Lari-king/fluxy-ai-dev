/**
 * ⏰ FORMULAIRE - PLAGE HORAIRE
 */

import React from 'react';
import { RuleConditions } from '@/types/rules';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TimeRangeFormProps {
  conditions: RuleConditions;
  onChange: (conditions: RuleConditions) => void;
}

export function TimeRangeForm({ conditions, onChange }: TimeRangeFormProps) {
  const daysOfWeek = [
    { value: 0, label: 'Dimanche', short: 'Dim' },
    { value: 1, label: 'Lundi', short: 'Lun' },
    { value: 2, label: 'Mardi', short: 'Mar' },
    { value: 3, label: 'Mercredi', short: 'Mer' },
    { value: 4, label: 'Jeudi', short: 'Jeu' },
    { value: 5, label: 'Vendredi', short: 'Ven' },
    { value: 6, label: 'Samedi', short: 'Sam' },
  ];

  const toggleDay = (day: number) => {
    const days = conditions.daysOfWeek || [];
    if (days.includes(day)) {
      onChange({ ...conditions, daysOfWeek: days.filter(d => d !== day) });
    } else {
      onChange({ ...conditions, daysOfWeek: [...days, day].sort() });
    }
  };

  const selectPreset = (preset: 'weekdays' | 'weekend' | 'all') => {
    switch (preset) {
      case 'weekdays':
        onChange({ ...conditions, daysOfWeek: [1, 2, 3, 4, 5] });
        break;
      case 'weekend':
        onChange({ ...conditions, daysOfWeek: [0, 6] });
        break;
      case 'all':
        onChange({ ...conditions, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] });
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Heure de début</Label>
          <Input
            id="startTime"
            type="time"
            value={conditions.startTime || ''}
            onChange={(e) => onChange({ ...conditions, startTime: e.target.value })}
          />
          <p className="text-xs text-gray-500">Ex: 18:00</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">Heure de fin</Label>
          <Input
            id="endTime"
            type="time"
            value={conditions.endTime || ''}
            onChange={(e) => onChange({ ...conditions, endTime: e.target.value })}
          />
          <p className="text-xs text-gray-500">Ex: 23:59</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Jours de la semaine *</Label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => selectPreset('weekdays')}
            className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            Semaine
          </button>
          <button
            type="button"
            onClick={() => selectPreset('weekend')}
            className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
          >
            Week-end
          </button>
          <button
            type="button"
            onClick={() => selectPreset('all')}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Tous
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map(day => {
            const isSelected = conditions.daysOfWeek?.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  isSelected
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                }`}
              >
                <div className="text-xs">{day.short}</div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500">Sélectionnez les jours concernés</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeRangeMaxAmount">Montant maximum (€) *</Label>
        <Input
          id="timeRangeMaxAmount"
          type="number"
          min="0"
          step="0.01"
          placeholder="220.00"
          value={conditions.timeRangeMaxAmount || ''}
          onChange={(e) => onChange({ ...conditions, timeRangeMaxAmount: parseFloat(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500">Le montant à ne pas dépasser dans cette plage</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeRangePeriod">Période de calcul</Label>
        <Select
          value={conditions.timeRangePeriod || 'weekly'}
          onValueChange={(value: any) => onChange({ ...conditions, timeRangePeriod: value })}
        >
          <SelectTrigger id="timeRangePeriod">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Par jour</SelectItem>
            <SelectItem value="weekly">Par semaine</SelectItem>
            <SelectItem value="monthly">Par mois</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Calculer le total sur cette période</p>
      </div>

      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
        <p className="text-sm text-indigo-700 dark:text-indigo-300">
          💡 <strong>Exemple :</strong> Avec 18h-23h, week-end (Sam+Dim), 220€ et période hebdomadaire,
          vous serez alerté si vos dépenses du vendredi soir au dimanche soir dépassent 220€/semaine.
        </p>
      </div>
    </div>
  );
}
