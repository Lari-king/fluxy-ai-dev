/**
 * 🏪 FORMULAIRE - FRÉQUENCE COMMERÇANT
 */

import React from 'react';
import { RuleConditions } from '@/types/rules';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface MerchantFrequencyFormProps {
  conditions: RuleConditions;
  onChange: (conditions: RuleConditions) => void;
}

export function MerchantFrequencyForm({ conditions, onChange }: MerchantFrequencyFormProps) {
  const [keywordInput, setKeywordInput] = React.useState('');

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const keywords = conditions.merchantKeywords || [];
    if (!keywords.includes(keywordInput.trim())) {
      onChange({
        ...conditions,
        merchantKeywords: [...keywords, keywordInput.trim()]
      });
    }
    setKeywordInput('');
  };

  const removeKeyword = (keyword: string) => {
    const keywords = conditions.merchantKeywords || [];
    onChange({
      ...conditions,
      merchantKeywords: keywords.filter(k => k !== keyword)
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="merchantKeywords">Mots-clés du commerçant *</Label>
        <div className="flex gap-2">
          <Input
            id="merchantKeywords"
            type="text"
            placeholder="Ex: UBER EATS, DELIVEROO..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
          />
          <button
            type="button"
            onClick={addKeyword}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            Ajouter
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Ajoutez des mots-clés pour identifier le commerçant (ex: UBER, DELIVEROO)
        </p>
        
        {conditions.merchantKeywords && conditions.merchantKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {conditions.merchantKeywords.map(keyword => (
              <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                {keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxFrequency">Fréquence maximale *</Label>
          <Input
            id="maxFrequency"
            type="number"
            min="1"
            placeholder="2"
            value={conditions.maxFrequency || ''}
            onChange={(e) => onChange({ ...conditions, maxFrequency: parseInt(e.target.value) || 1 })}
          />
          <p className="text-xs text-gray-500">Nombre max de transactions autorisées</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequencyPeriod">Période *</Label>
          <Select
            value={conditions.frequencyPeriod || 'weekly'}
            onValueChange={(value: any) => onChange({ ...conditions, frequencyPeriod: value })}
          >
            <SelectTrigger id="frequencyPeriod">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">par jour</SelectItem>
              <SelectItem value="weekly">par semaine</SelectItem>
              <SelectItem value="monthly">par mois</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">La période de temps</p>
        </div>
      </div>

      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
        <p className="text-sm text-purple-700 dark:text-purple-300">
          💡 <strong>Exemple :</strong> Avec les mots-clés "UBER EATS", une fréquence de 2 et une période hebdomadaire,
          vous serez alerté si vous commandez plus de 2 fois par semaine.
        </p>
      </div>
    </div>
  );
}
