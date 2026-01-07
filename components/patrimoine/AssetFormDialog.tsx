import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Briefcase, Tag, DollarSign, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface Asset {
  id: string;
  name: string;
  category: string;
  value: number;
  icon: string;
  color: string;
  description?: string;
}

interface AssetFormDialogProps {
  asset?: Asset | null;
  onClose: () => void;
  onSave: (asset: Asset) => void;
}

const availableIcons = [
  { emoji: '🏠', label: 'Résidence' },
  { emoji: '🏢', label: 'Immeuble' },
  { emoji: '💰', label: 'Épargne' },
  { emoji: '📈', label: 'Actions' },
  { emoji: '🛡️', label: 'Assurance' },
  { emoji: '₿', label: 'Bitcoin' },
  { emoji: '💎', label: 'Crypto' },
  { emoji: '🚗', label: 'Véhicule' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '⌚', label: 'Luxe' },
  { emoji: '💼', label: 'Entreprise' },
  { emoji: '🏦', label: 'Compte' },
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
  'Immobilier',
  'Épargne',
  'Investissements',
  'Crypto',
  'Véhicules',
  'Objets de valeur',
  'Autres'
];

export function AssetFormDialog({ asset, onClose, onSave }: AssetFormDialogProps) {
  const [formData, setFormData] = useState<Asset>(
    asset || {
      id: Date.now().toString(),
      name: '',
      category: 'Épargne',
      value: 0,
      icon: '💰',
      color: '#10B981',
      description: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const isEditing = !!asset;

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
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl flex items-center gap-3">
              <Briefcase className="w-7 h-7" />
              {isEditing ? 'Modifier l\'actif' : 'Ajouter un actif'}
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
                Nom de l'actif
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-50 dark:bg-gray-800 border-2"
                placeholder="Ex: Résidence principale, PEA..."
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
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-50 dark:bg-gray-800 border-2 min-h-[80px]"
                placeholder="Description de l'actif..."
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

            {/* Valeur */}
            <div className="space-y-2">
              <Label htmlFor="value" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valeur actuelle (€)
              </Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="1"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
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
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-lg'
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
                <div className="text-4xl">{formData.icon}</div>
                <div className="flex-1">
                  <div className="text-xl mb-1">{formData.name || 'Nom de l\'actif'}</div>
                  {formData.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {formData.description}
                    </div>
                  )}
                  <div className="text-2xl" style={{ color: formData.color }}>
                    {formData.value.toLocaleString('fr-FR')} €
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
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isEditing ? 'Enregistrer les modifications' : 'Ajouter l\'actif'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
