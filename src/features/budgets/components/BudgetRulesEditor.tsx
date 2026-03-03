import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Tag, User, Hash, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BudgetRule, BudgetRuleType } from '@/types/budget';

interface BudgetRulesEditorProps {
  rules: BudgetRule[];
  onChange: (rules: BudgetRule[]) => void;
  categories: Array<{ id: string; name: string }>;
  people: Array<{ id: string; name: string }>;
}

export function BudgetRulesEditor({ rules, onChange, categories, people }: BudgetRulesEditorProps) {
  const [editingRules, setEditingRules] = useState<BudgetRule[]>(rules);

  const handleAddRule = () => {
    const newRule: BudgetRule = {
      type: 'category',
      value: categories[0]?.name || '',
    };
    const updated = [...editingRules, newRule];
    setEditingRules(updated);
    onChange(updated);
  };

  const handleRemoveRule = (index: number) => {
    const updated = editingRules.filter((_, i) => i !== index);
    setEditingRules(updated);
    onChange(updated);
  };

  const handleRuleChange = (index: number, updates: Partial<BudgetRule>) => {
    const updated = editingRules.map((rule, i) => 
      i === index ? { ...rule, ...updates } : rule
    );
    setEditingRules(updated);
    onChange(updated);
  };

  const getRuleIcon = (type: BudgetRuleType) => {
    switch (type) {
      case 'category': return Tag;
      case 'person': return User;
      case 'keyword': return Hash;
      case 'amount': return DollarSign;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Règles de liaison automatique</Label>
        <Button
          type="button"
          onClick={handleAddRule}
          size="sm"
          variant="outline"
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Ajouter une règle
        </Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {editingRules.map((rule, index) => {
            const Icon = getRuleIcon(rule.type);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex gap-2 items-start bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <Icon className="w-4 h-4 mt-2 text-gray-500" />
                
                <div className="flex-1 space-y-2">
                  {/* Rule Type */}
                  <Select
                    value={rule.type}
                    onValueChange={(value) => {
                      const type = value as BudgetRuleType;
                      let defaultValue: string | number = '';
                      let operator: BudgetRule['operator'] = undefined;
                      
                      switch (type) {
                        case 'category':
                          defaultValue = categories[0]?.name || '';
                          break;
                        case 'person':
                          defaultValue = people[0]?.id || '';
                          break;
                        case 'keyword':
                          defaultValue = '';
                          operator = 'contains';
                          break;
                        case 'amount':
                          defaultValue = 0;
                          operator = 'greaterThan';
                          break;
                      }
                      
                      handleRuleChange(index, { type, value: defaultValue, operator });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">Par catégorie</SelectItem>
                      <SelectItem value="person">Par personne</SelectItem>
                      <SelectItem value="keyword">Par mot-clé</SelectItem>
                      <SelectItem value="amount">Par montant</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Rule Value */}
                  <div className="flex gap-2">
                    {rule.type === 'category' && (
                      <Select
                        value={rule.value as string}
                        onValueChange={(value) => handleRuleChange(index, { value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choisir une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {rule.type === 'person' && (
                      <Select
                        value={rule.value as string}
                        onValueChange={(value) => handleRuleChange(index, { value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choisir une personne" />
                        </SelectTrigger>
                        <SelectContent>
                          {people.map(person => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {rule.type === 'keyword' && (
                      <>
                        <Select
                          value={rule.operator || 'contains'}
                          onValueChange={(value) => handleRuleChange(index, { operator: value as any })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contains">Contient</SelectItem>
                            <SelectItem value="equals">Égal à</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={rule.value as string}
                          onChange={(e) => handleRuleChange(index, { value: e.target.value })}
                          placeholder="Mot-clé..."
                          className="flex-1"
                        />
                      </>
                    )}

                    {rule.type === 'amount' && (
                      <>
                        <Select
                          value={rule.operator || 'greaterThan'}
                          onValueChange={(value) => handleRuleChange(index, { operator: value as any })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="greaterThan">Plus de</SelectItem>
                            <SelectItem value="lessThan">Moins de</SelectItem>
                            <SelectItem value="equals">Égal à</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          value={rule.value}
                          onChange={(e) => handleRuleChange(index, { value: parseFloat(e.target.value) || 0 })}
                          placeholder="Montant..."
                          className="flex-1"
                        />
                      </>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => handleRemoveRule(index)}
                  size="icon"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {editingRules.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            Aucune règle définie. Les transactions seront liées par catégorie par défaut.
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200">
        💡 <strong>Astuce :</strong> Une transaction sera liée à ce budget si elle correspond à au moins une des règles définies.
      </div>
    </div>
  );
}
