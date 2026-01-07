/**
 * 🧑‍🤝‍🧑 FORMULAIRE - FLUX DE FONDS (Avancé)
 */

import React from 'react';
import { RuleConditions } from '../../../types/rules';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { AlertTriangle } from 'lucide-react';

interface PersonFlowFormProps {
  conditions: RuleConditions;
  onChange: (conditions: RuleConditions) => void;
}

export function PersonFlowForm({ conditions, onChange }: PersonFlowFormProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
          <div className="text-sm text-orange-700 dark:text-orange-300">
            <p className="mb-2">
              <strong>Module en développement</strong>
            </p>
            <p>
              Les règles de flux de fonds nécessitent le module "Personnes & Impact" qui sera 
              implémenté dans une prochaine version. Cette règle permettra de surveiller les 
              transferts entre personnes (ex: loyer du père).
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 opacity-50 pointer-events-none">
        <Label htmlFor="fromPersonId">Personne émettrice</Label>
        <Input
          id="fromPersonId"
          type="text"
          placeholder="Ex: Père"
          value={conditions.fromPersonId || ''}
          onChange={(e) => onChange({ ...conditions, fromPersonId: e.target.value })}
          disabled
        />
        <p className="text-xs text-gray-500">La personne qui envoie l'argent</p>
      </div>

      <div className="space-y-2 opacity-50 pointer-events-none">
        <Label htmlFor="toPersonId">Personne destinataire</Label>
        <Input
          id="toPersonId"
          type="text"
          placeholder="Ex: Propriétaire"
          value={conditions.toPersonId || ''}
          onChange={(e) => onChange({ ...conditions, toPersonId: e.target.value })}
          disabled
        />
        <p className="text-xs text-gray-500">La personne qui doit recevoir l'argent</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 pointer-events-none">
        <div className="space-y-2">
          <Label htmlFor="expectedAmount">Montant attendu (€)</Label>
          <Input
            id="expectedAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="624.00"
            value={conditions.expectedAmount || ''}
            onChange={(e) => onChange({ ...conditions, expectedAmount: parseFloat(e.target.value) || 0 })}
            disabled
          />
          <p className="text-xs text-gray-500">Le montant exact ou approximatif</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxDelayDays">Délai maximum (jours)</Label>
          <Input
            id="maxDelayDays"
            type="number"
            min="1"
            placeholder="7"
            value={conditions.maxDelayDays || ''}
            onChange={(e) => onChange({ ...conditions, maxDelayDays: parseInt(e.target.value) || 7 })}
            disabled
          />
          <p className="text-xs text-gray-500">Temps max entre réception et envoi</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-50 pointer-events-none">
        <div>
          <Label htmlFor="mustFollowTransaction">Transaction consécutive obligatoire</Label>
          <p className="text-xs text-gray-500">Vérifier qu'une transaction suit</p>
        </div>
        <Switch
          id="mustFollowTransaction"
          checked={conditions.mustFollowTransaction || false}
          onCheckedChange={(checked) => onChange({ ...conditions, mustFollowTransaction: checked })}
          disabled
        />
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg opacity-50">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>Exemple d'usage :</strong> "Si je reçois 624€ de mon père (loyer), 
          je dois envoyer 624€ au propriétaire dans les 7 jours maximum."
        </p>
      </div>
    </div>
  );
}
