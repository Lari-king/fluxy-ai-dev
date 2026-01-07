import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

// Type élargi pour inclure toutes les options de la Select ET les valeurs personnalisées (string)
export type PersonCircle = 'direct' | 'extended' | 'large' | 'friends' | 'business' | 'community' | string;

interface Person {
  id: string;
  name: string;
  avatar?: string;
  // Utilisation du type élargi
  circle: PersonCircle; 
  relationship: string;
  totalImpact: number;
  income: number;
  expenses: number;
  color: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
}

interface PersonFormProps {
  person?: Person;
  onClose: () => void;
  onSave: (person: Person) => void;
}

const PRESET_COLORS = [
  '#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6',
  '#EF4444', '#06B6D4', '#F97316', '#14B8A6', '#A855F7',
];

// Liste des cercles prédéfinis pour la logique de l'input personnalisé
const PREDEFINED_CIRCLES = ['direct', 'extended', 'large', 'friends', 'business', 'community'];

const RELATIONSHIPS = [
  'Conjoint(e)', 'Compagne', 'Compagnon', 'Épouse', 'Époux',
  'Enfant', 'Fils', 'Fille',
  'Père', 'Mère', 'Parent',
  'Frère', 'Sœur',
  'Grand-père', 'Grand-mère',
  'Oncle', 'Tante', 'Cousin', 'Cousine',
  'Neveu', 'Nièce',
  'Ami(e)', 'Autre',
];

export function PersonForm({ person, onClose, onSave }: PersonFormProps) {
  const [formData, setFormData] = useState({
    name: person?.name || '',
    relationship: person?.relationship || '',
    // formData.circle peut être n'importe quelle chaîne, y compris les options personnalisées
    circle: person?.circle || 'direct', 
    color: person?.color || PRESET_COLORS[0],
    email: person?.email || '',
    phone: person?.phone || '',
    birthDate: person?.birthDate || '',
    notes: person?.notes || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(person?.avatar || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Note: income, expenses, and totalImpact are calculated automatically from transactions
    const newPerson: Person = {
      id: person?.id || `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      relationship: formData.relationship,
      // Avec le type PersonCircle élargi, l'assignation est valide.
      circle: formData.circle, 
      color: formData.color,
      avatar: avatarPreview,
      email: formData.email,
      phone: formData.phone,
      birthDate: formData.birthDate,
      notes: formData.notes,
      // These will be calculated on the backend
      income: 0,
      expenses: 0,
      totalImpact: 0,
    };

    onSave(newPerson);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isCustomCircle = !PREDEFINED_CIRCLES.includes(formData.circle);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
            <h2 className="text-2xl">
              {person ? 'Modifier la personne' : 'Ajouter une personne'}
            </h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="space-y-6">
              {/* Avatar & Nom */}
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-24 h-24 ring-4 ring-offset-2" style={{ '--tw-ring-color': formData.color }as React.CSSProperties}>
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback style={{ backgroundColor: formData.color }} className="text-white text-2xl">
                      {formData.name.charAt(0) || <User className="w-10 h-10" />}
                    </AvatarFallback>
                  </Avatar>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Photo
                      </span>
                    </Button>
                  </label>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ex: Marie Dupont"
                      required
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="relationship">Relation *</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Sélectionner la relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIPS.map((rel) => (
                          <SelectItem key={rel} value={rel}>
                            {rel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Cercle familial */}
              <div>
                <Label htmlFor="circle">Cercle / Catégorie *</Label>
                <div className="space-y-2 mt-1.5">
                  <Select
                    value={isCustomCircle ? 'custom' : formData.circle}
                    onValueChange={(value) => {
                        // Si l'utilisateur choisit une valeur prédéfinie
                        if (PREDEFINED_CIRCLES.includes(value)) {
                            setFormData({ ...formData, circle: value });
                        } 
                        // S'il choisit l'option "Personnalisé", on ne change rien pour l'instant
                        // La valeur sera mise à jour par l'Input en dessous
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner ou créer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Famille directe</SelectItem>
                      <SelectItem value="extended">Famille élargie</SelectItem>
                      <SelectItem value="large">Grande famille</SelectItem>
                      <SelectItem value="friends">Amis proches</SelectItem>
                      <SelectItem value="business">Affaires / Business</SelectItem>
                      <SelectItem value="community">Communauté</SelectItem>
                      {/* Option pour marquer le cercle personnalisé actuel */}
                      <SelectItem value="custom" disabled={!isCustomCircle}>
                         Personnalisé: {formData.circle}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">ou créer une nouvelle catégorie:</span>
                  </div>
                  <Input
                    placeholder="ex: Équipe sportive, Voisins, Collègues..."
                    // Affiche le cercle actuel si c'est un cercle personnalisé
                    value={isCustomCircle ? formData.circle : ''}
                    onChange={(e) => setFormData({ ...formData, circle: e.target.value })}
                  />
                </div>
              </div>

              {/* Couleur */}
              <div>
                <Label>Couleur de profil</Label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
                        formData.color === color ? 'ring-4 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Note about financial impact */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Impact financier calculé automatiquement</strong>
                  <br />
                  Les revenus et dépenses de cette personne seront calculés automatiquement en fonction des transactions qui lui sont associées.
                </p>
              </div>

              {/* Coordonnées */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemple.com"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Date de naissance */}
              <div>
                <Label htmlFor="birthDate">Date de naissance</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informations supplémentaires..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center justify-end gap-3 border-t">
            <Button onClick={onClose} variant="outline">
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              {person ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}