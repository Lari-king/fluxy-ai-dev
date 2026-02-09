import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Tag, DollarSign, FileText, Calendar, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Scenario {
  id: string;
  name: string;
  description: string;
  type: 'income' | 'expense' | 'saving' | 'investment';
  impact: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
  startMonth: number;
  icon: string;
  color: string;
}

interface ScenarioFormDialogProps {
  scenario?: Scenario | null;
  onClose: () => void;
  onSave: (scenario: Scenario) => void;
}

const availableIcons = [
  { emoji: '💰', label: 'Argent' },
  { emoji: '🏠', label: 'Maison' },
  { emoji: '🚗', label: 'Voiture' },
  { emoji: '📈', label: 'Investissement' },
  { emoji: '🎁', label: 'Prime' },
  { emoji: '💼', label: 'Travail' },
  { emoji: '🎓', label: 'Formation' },
  { emoji: '✈️', label: 'Voyage' },
  { emoji: '👶', label: 'Enfant' },
  { emoji: '💍', label: 'Mariage' },
  { emoji: '🎮', label: 'Loisirs' },
  { emoji: '🏥', label: 'Santé' },
];

const availableColors = [
  { value: '#10B981', label: 'Vert' },
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EC4899', label: 'Rose' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#14B8A6', label: 'Turquoise' },
  { value: '#6366F1', label: 'Indigo' },
];

export function ScenarioFormDialog({ scenario, onClose, onSave }: ScenarioFormDialogProps) {
  const [formData, setFormData] = useState<Scenario>(
    scenario || {
      id: Date.now().toString(),
      name: '',
      description: '',
      type: 'income',
      impact: 0,
      frequency: 'monthly',
      startMonth: 0,
      icon: '💰',
      color: '#10B981',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const isEditing = !!scenario;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl flex items-center gap-3">
              <Sparkles className="w-7 h-7" />
              {isEditing ? 'Modifier le scénario' : 'Créer un scénario'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Nom du scénario
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-50 dark:bg-gray-800 border-2"
                placeholder="Ex: Augmentation de salaire..."
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-50 dark:bg-gray-800 border-2 min-h-[80px]"
                placeholder="Décrivez le scénario..."
              />
            </div>

            {/* Impact et Fréquence */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impact" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Impact (€)
                </Label>
                <Input
                  id="impact"
                  type="number"
                  step="1"
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-50 dark:bg-gray-800 border-2"
                  placeholder="500 ou -500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency" className="flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Fréquence
                </Label>
                <select
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="yearly">Annuel</option>
                  <option value="one-time">Ponctuel</option>
                </select>
              </div>
            </div>

            {/* Mois de début */}
            <div className="space-y-2">
              <Label htmlFor="startMonth" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Début (mois)
              </Label>
              <Input
                id="startMonth"
                type="number"
                min="0"
                max="23"
                value={formData.startMonth}
                onChange={(e) => setFormData({ ...formData, startMonth: parseInt(e.target.value) || 0 })}
                className="bg-gray-50 dark:bg-gray-800 border-2"
                required
              />
              <p className="text-xs text-gray-500">0 = immédiatement, 6 = dans 6 mois</p>
            </div>

            {/* Icône */}
            <div className="space-y-2">
              <Label>Icône</Label>
              <div className="grid grid-cols-6 gap-2">
                {availableIcons.map((icon) => (
                  <button
                    key={icon.emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: icon.emoji })}
                    className={`p-3 text-3xl rounded-xl border-2 transition-all hover:scale-110 ${
                      formData.icon === icon.emoji
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    title={icon.label}
                  >
                    {icon.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Couleur */}
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="grid grid-cols-8 gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-10 h-10 rounded-xl border-4 transition-all hover:scale-110 ${
                      formData.color === color.value
                        ? 'border-white dark:border-gray-900 shadow-xl ring-2 ring-offset-2'
                        : 'border-transparent'
                    }`}
                    style={{ 
                      backgroundColor: color.value,
                      '--tw-ring-color': formData.color === color.value ? color.value : undefined
                    }as React.CSSProperties}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Aperçu */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Aperçu</div>
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg ring-4 ring-offset-2"
                  style={{ 
                    backgroundColor: formData.color,
                    '--tw-ring-color': `${formData.color}40`
                  }as React.CSSProperties}
                >
                  {formData.icon}
                </div>
                <div className="flex-1">
                  <div className="text-xl mb-1">{formData.name || 'Nom du scénario'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {formData.description || 'Description'}
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      formData.impact >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {formData.impact >= 0 ? '+' : ''}{formData.impact} €
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                      {formData.frequency === 'monthly' ? 'Mensuel' : formData.frequency === 'yearly' ? 'Annuel' : 'Ponctuel'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-2"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
          >
            {isEditing ? 'Enregistrer' : 'Créer le scénario'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
