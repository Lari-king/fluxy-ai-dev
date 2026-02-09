import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Target, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ✅ IMPORT OFFICIEL : Nous importons maintenant le type Goal de DataContext
// Ceci garantit que l'interface Goal est la même partout.
import { Goal } from '@/contexts/DataContext';

// --- REMARQUE : L'interface Goal locale a été supprimée. ---

interface GoalFormDialogProps {
  goal?: Goal | null;
  onClose: () => void;
  // Le type Goal est maintenant compatible avec Goals.tsx
  onSave: (goal: Goal) => void;
}

const availableIcons = [
  { emoji: '💰', label: 'Épargne' },
  { emoji: '🏠', label: 'Immobilier' },
  { emoji: '🚗', label: 'Véhicule' },
  { emoji: '✈️', label: 'Voyage' },
  { emoji: '📚', label: 'Éducation' },
  { emoji: '💍', label: 'Mariage' },
  { emoji: '👶', label: 'Famille' },
  { emoji: '🎓', label: 'Formation' },
  { emoji: '💼', label: 'Entreprise' },
  { emoji: '🎮', label: 'Loisirs' },
  { emoji: '🏋️', label: 'Sport' },
  { emoji: '🎸', label: 'Hobby' },
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

const categories = [
  'Épargne',
  'Immobilier',
  'Voyage',
  'Transport',
  'Éducation',
  'Famille',
  'Loisirs',
  'Autre'
];

// Fonction utilitaire pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split('T')[0];

export function GoalFormDialog({ goal, onClose, onSave }: GoalFormDialogProps) {
  const [formData, setFormData] = useState<Goal>(
    // Utiliser la décomposition pour s'assurer que si 'goal' est présent,
    // tous les champs nécessaires du DataContext sont inclus.
    goal || {
      // Les champs de base
      id: Date.now().toString(),
      name: '',
      description: '',
      current: 0,
      target: 0,
      
      // Les champs UI (qui viennent du DataContext)
      deadline: '',
      icon: '💰',
      color: '#10B981',
      category: 'Épargne',
      
      // Les champs DataContext stricts (avec valeurs par défaut)
      startDate: getTodayDate(), 
      endDate: '', // Sera mis à jour par Goals.tsx si nécessaire
      status: 'in-progress', // ✅ CORRIGÉ: Utilise la valeur littérale stricte
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const isEditing = !!goal;

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
        <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl flex items-center gap-3">
              <Target className="w-7 h-7" />
              {isEditing ? 'Modifier l\'objectif' : 'Créer un objectif'}
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
                Nom de l'objectif
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-50 dark:bg-gray-800 border-2"
                placeholder="Ex: Voyage au Japon, Achat maison..."
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
                placeholder="Décrivez votre objectif..."
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Catégorie
              </Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Montants */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Montant actuel (€)
                </Label>
                <Input
                  id="current"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.current}
                  onChange={(e) => setFormData({ ...formData, current: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-50 dark:bg-gray-800 border-2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Objectif (€)
                </Label>
                <Input
                  id="target"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-50 dark:bg-gray-800 border-2"
                  required
                />
              </div>
            </div>

            {/* Date limite */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date limite
              </Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30 shadow-lg'
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
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-lg ring-4 ring-offset-2"
                  style={{ 
                    backgroundColor: formData.color,
                    '--tw-ring-color': `${formData.color}40`
                  }as React.CSSProperties}
                >
                  {formData.icon}
                </div>
                <div className="flex-1">
                  <div className="text-xl mb-1">{formData.name || 'Nom de l\'objectif'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.description || 'Description'}
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-xl p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression</span>
                  <span style={{ color: formData.color }}>
                    {formData.target > 0 ? ((formData.current / formData.target) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: formData.target > 0 ? `${Math.min((formData.current / formData.target) * 100, 100)}%` : '0%',
                      backgroundColor: formData.color
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{formData.current} €</span>
                  <span>{formData.target} €</span>
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
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            {isEditing ? 'Enregistrer les modifications' : 'Créer l\'objectif'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}