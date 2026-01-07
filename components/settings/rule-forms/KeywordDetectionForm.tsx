/**
 * 🔍 FORMULAIRE - DÉTECTION MOTS-CLÉS
 */

import React from 'react';
import { RuleConditions } from '../../../types/rules';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import { X } from 'lucide-react';

interface KeywordDetectionFormProps {
  conditions: RuleConditions;
  onChange: (conditions: RuleConditions) => void;
}

export function KeywordDetectionForm({ conditions, onChange }: KeywordDetectionFormProps) {
  const [keywordInput, setKeywordInput] = React.useState('');

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const keywords = conditions.keywords || [];
    if (!keywords.includes(keywordInput.trim().toUpperCase())) {
      onChange({
        ...conditions,
        keywords: [...keywords, keywordInput.trim().toUpperCase()]
      });
    }
    setKeywordInput('');
  };

  const removeKeyword = (keyword: string) => {
    const keywords = conditions.keywords || [];
    onChange({
      ...conditions,
      keywords: keywords.filter(k => k !== keyword)
    });
  };

  // Suggestions de mots-clés communs
  const suggestedKeywords = [
    'AGIOS',
    'FRAIS',
    'COMMISSION',
    'PENALITE',
    'RETARD',
    'REJET',
    'COTISATION',
    'PRELEVEMEN'
  ];

  const addSuggested = (keyword: string) => {
    const keywords = conditions.keywords || [];
    if (!keywords.includes(keyword)) {
      onChange({
        ...conditions,
        keywords: [...keywords, keyword]
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="keywords">Mots-clés à détecter *</Label>
        <div className="flex gap-2">
          <Input
            id="keywords"
            type="text"
            placeholder="Ex: AGIOS, FRAIS..."
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
          Ajoutez des mots-clés à rechercher dans les libellés de transactions
        </p>
        
        {conditions.keywords && conditions.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {conditions.keywords.map(keyword => (
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

      {/* Suggestions */}
      <div className="space-y-2">
        <Label>Suggestions courantes</Label>
        <div className="flex flex-wrap gap-2">
          {suggestedKeywords.map(keyword => {
            const isAdded = conditions.keywords?.includes(keyword);
            return (
              <button
                key={keyword}
                type="button"
                onClick={() => !isAdded && addSuggested(keyword)}
                disabled={isAdded}
                className={`px-3 py-1 text-sm rounded-lg border transition-all ${
                  isAdded
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                }`}
              >
                {keyword} {isAdded && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <Label htmlFor="caseSensitive">Sensible à la casse</Label>
          <p className="text-xs text-gray-500">Différencier majuscules et minuscules</p>
        </div>
        <Switch
          id="caseSensitive"
          checked={conditions.caseSensitive || false}
          onCheckedChange={(checked) => onChange({ ...conditions, caseSensitive: checked })}
        />
      </div>

      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">
          💡 <strong>Exemple :</strong> Avec les mots-clés "AGIOS", "FRAIS", "COMMISSION",
          vous serez alerté dès qu'une transaction contient l'un de ces termes (frais bancaires cachés).
        </p>
      </div>
    </div>
  );
}
