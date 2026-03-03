import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Wallet, Tag, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Budget } from '@/types/budget';
import { BudgetRulesEditor } from '@/features/budgets/components/BudgetRulesEditor';

interface BudgetFormDialogProps {
  budget?: Budget | null;
  onClose: () => void;
  onSave: (budget: Budget) => void;
  categories: Array<{ id: string; name: string }>;
  people: Array<{ id: string; name: string }>;
}

const availableIcons = [
  { emoji: '🍔', label: 'Alimentation' },
  { emoji: '🚗', label: 'Transport' },
  { emoji: '🏠', label: 'Logement' },
  { emoji: '⚕️', label: 'Santé' },
  { emoji: '🎮', label: 'Loisirs' },
  { emoji: '👨‍👩‍👧', label: 'Famille' },
  { emoji: '📚', label: 'Éducation' },
  { emoji: '💼', label: 'Travail' },
  { emoji: '🛍️', label: 'Shopping' },
  { emoji: '✈️', label: 'Voyages' },
  { emoji: '💰', label: 'Épargne' },
  { emoji: '📱', label: 'Abonnements' },
];

const availableColors = [
  { value: '#F59E0B', label: 'Orange' },
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#EC4899', label: 'Rose' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#10B981', label: 'Vert' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#14B8A6', label: 'Turquoise' },
  { value: '#F97316', label: 'Orange foncé' },
  { value: '#6366F1', label: 'Indigo' },
];

export function BudgetFormDialog({ budget, onClose, onSave, categories, people }: BudgetFormDialogProps) {
  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<Budget>(
    budget || {
      id: Date.now().toString(),
      name: '',
      category: '',
      allocated: 0,
      spent: 0,
      icon: '💰',
      color: '#3B82F6',
      rules: [],
      period: 'monthly',
      month: getCurrentMonth(),
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const isEditing = !!budget;

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
        <div className="bg-gradient-to-r from-orange-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl flex items-center gap-3">
              <Wallet className="w-7 h-7" />
              {isEditing ? 'Modifier l\'enveloppe' : 'Créer une enveloppe'}
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
                Nom de l'enveloppe
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, category: e.target.value })}
                className="bg-gray-50 dark:bg-gray-800 border-2"
                placeholder="Ex: Alimentation, Transport..."
                required
              />
            </div>

            {/* Mois du budget */}
            <div className="space-y-2">
              <Label htmlFor="month" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Mois du budget
              </Label>
              <Input
                id="month"
                type="month"
                value={formData.month || ''}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="bg-gray-50 dark:bg-gray-800 border-2"
                required
              />
            </div>

            {/* Montant alloué */}
            <div className="space-y-2">
              <Label htmlFor="allocated" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Budget alloué (€)
              </Label>
              <Input
                id="allocated"
                type="number"
                min="0"
                step="1"
                value={formData.allocated}
                onChange={(e) => setFormData({ ...formData, allocated: parseFloat(e.target.value) || 0 })}
                className="bg-gray-50 dark:bg-gray-800 border-2"
                required
              />
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
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg'
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
              <div className="grid grid-cols-9 gap-2">
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

            {/* Règles de liaison */}
            <div className="space-y-2">
              <BudgetRulesEditor
                rules={formData.rules || []}
                onChange={(rules) => setFormData({ ...formData, rules })}
                categories={categories}
                people={people}
              />
            </div>

            {/* Aperçu */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Aperçu</div>
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg ring-4 ring-offset-2"
                  style={{ 
                    backgroundColor: formData.color,
                    '--tw-ring-color': `${formData.color}40`
                  }as React.CSSProperties}
                >
                  {formData.icon}
                </div>
                <div>
                  <div className="text-xl mb-1">{formData.name || 'Nom de l\'enveloppe'}</div>
                  <div className="text-2xl" style={{ color: formData.color }}>
                    {formData.allocated} €
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
            className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
          >
            {isEditing ? 'Enregistrer les modifications' : 'Créer l\'enveloppe'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
