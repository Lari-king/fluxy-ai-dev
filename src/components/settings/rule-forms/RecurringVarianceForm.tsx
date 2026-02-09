/**
 * 🔁 FORMULAIRE - VARIATION ABONNEMENT
 */

import React from 'react';
import { RuleConditions } from '@/types/rules';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface RecurringVarianceFormProps {
  conditions: RuleConditions;
  onChange: (conditions: RuleConditions) => void;
}

export function RecurringVarianceForm({ conditions, onChange }: RecurringVarianceFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recurringDescription">Description de l'abonnement *</Label>
        <Input
          id="recurringDescription"
          type="text"
          placeholder="Ex: NETFLIX, SPOTIFY, SALLE DE SPORT..."
          value={conditions.recurringDescription || ''}
          onChange={(e) => onChange({ ...conditions, recurringDescription: e.target.value })}
        />
        <p className="text-xs text-gray-500">
          Mot-clé pour identifier l'abonnement dans les transactions
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxVariancePercent">Variation maximale autorisée (%)</Label>
        <Input
          id="maxVariancePercent"
          type="number"
          min="0"
          max="100"
          step="0.1"
          placeholder="5.0"
          value={conditions.maxVariancePercent || ''}
          onChange={(e) => onChange({ ...conditions, maxVariancePercent: parseFloat(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500">
          Alerter si le montant varie de plus de ce pourcentage
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <Label htmlFor="checkIncrease">Détecter les augmentations</Label>
            <p className="text-xs text-gray-500">Alerter si le prix augmente</p>
          </div>
          <Switch
            id="checkIncrease"
            checked={conditions.checkIncrease !== false}
            onCheckedChange={(checked) => onChange({ ...conditions, checkIncrease: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <Label htmlFor="checkDecrease">Détecter les diminutions</Label>
            <p className="text-xs text-gray-500">Alerter si le prix baisse</p>
          </div>
          <Switch
            id="checkDecrease"
            checked={conditions.checkDecrease || false}
            onCheckedChange={(checked) => onChange({ ...conditions, checkDecrease: checked })}
          />
        </div>
      </div>

      <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
        <p className="text-sm text-pink-700 dark:text-pink-300">
          💡 <strong>Exemple :</strong> Avec "NETFLIX", variation max 5% et détection des augmentations,
          vous serez alerté si Netflix passe de 13,49€ à 14,16€ (+5%) ou plus (inflation silencieuse).
        </p>
      </div>

      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          ⚠️ <strong>Note :</strong> Cette règle nécessite d'avoir au moins 2 mois d'historique de l'abonnement
          pour détecter les variations.
        </p>
      </div>
    </div>
  );
}
