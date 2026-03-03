// src/features/people/components/forms/PersonForm.tsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, User, Building2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

// Types & Enums
import {
  PersonType,
  ContributionType,
  TargetObjective,
  PersonRelation,
} from '@/features/people/types/base';

// Configuration & Labels
import {
  CONTRIBUTION_TYPE_LABELS,
  TARGET_OBJECTIVE_LABELS
} from '@/features/people/constants/config';

interface PersonFormProps {
  person?: PersonRelation;
  onClose: () => void;
  onSave: (person: PersonRelation) => void;
}

const PRESET_COLORS = ['#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];
const RELATIONSHIPS = ['Conjoint(e)', 'Enfant', 'Parent', 'Frère/Sœur', 'Ami(e)', 'Associé(e)', 'Entreprise', 'Abonnement IA', 'Autre'];

export function PersonForm({ person, onClose, onSave }: PersonFormProps) {
  const [formData, setFormData] = useState<Partial<PersonRelation>>(
    person || {
      name: '',
      personType: PersonType.PHYSIQUE,
      relationship: '',
      circle: 'direct',
      color: PRESET_COLORS[0],
      targetObjective: TargetObjective.STABILISER,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.relationship) return;
    onSave(formData as PersonRelation);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#1a1b23] w-full max-w-2xl rounded-[32px] shadow-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1f2029]">
          <div>
            <h2 className="text-xl font-bold text-white">
              {person ? 'Modifier la relation' : 'Nouvelle relation'}
            </h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-black mt-1">
              Configuration du profil financier
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <Tabs defaultValue="identity" className="w-full">
          <div className="px-6 bg-[#1f2029]">
            <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-12 p-0 gap-6">
              <TabsTrigger value="identity" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 rounded-none border-b-2 border-transparent px-0 text-[10px] font-black uppercase tracking-widest">Identité</TabsTrigger>
              <TabsTrigger value="strategy" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 rounded-none border-b-2 border-transparent px-0 text-[10px] font-black uppercase tracking-widest">Stratégie & Objectifs</TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <TabsContent value="identity" className="mt-0 space-y-6 outline-none">
              <div className="flex gap-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 border-2 border-white/10 shadow-xl">
                      <AvatarImage src={formData.avatar} />
                      <AvatarFallback className="bg-[#2d2e3a] text-2xl text-gray-400">
                        {formData.name?.charAt(0) || <User />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${formData.color === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Main Fields */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-500">Type</Label>
                      <Select 
                        value={formData.personType} 
                        onValueChange={(v: PersonType) => setFormData({ ...formData, personType: v })}
                      >
                        <SelectTrigger className="bg-[#2d2e3a] border-white/10 h-12 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PersonType.PHYSIQUE}>Personne Physique</SelectItem>
                          <SelectItem value={PersonType.MORALE}>Entité / Entreprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-500">Relation</Label>
                      <Select 
                        value={formData.relationship} 
                        onValueChange={(v) => setFormData({ ...formData, relationship: v })}
                      >
                        <SelectTrigger className="bg-[#2d2e3a] border-white/10 h-12 text-white">
                          <SelectValue placeholder="Lien" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIPS.map(rel => (
                            <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Nom complet ou Raison sociale</Label>
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Jean Dupont ou Netflix"
                      className="bg-[#2d2e3a] border-white/10 h-12 text-white text-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-500">Notes & Contexte</Label>
                <Textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-[#2d2e3a] border-white/10 min-h-[100px] text-white"
                  placeholder="Détails sur la nature de la relation..."
                />
              </div>
            </TabsContent>

            <TabsContent value="strategy" className="mt-0 space-y-6 outline-none">
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-indigo-400">Type de Contribution</Label>
                    <Select 
                      value={formData.contributionType} 
                      onValueChange={(v: ContributionType) => setFormData({ ...formData, contributionType: v })}
                    >
                      <SelectTrigger className="bg-[#2d2e3a] border-white/10 h-12 text-white">
                        <SelectValue placeholder="Impact" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTRIBUTION_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key as ContributionType}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-indigo-400">Objectif 2026</Label>
                    <Select 
                      value={formData.targetObjective} 
                      onValueChange={(v: TargetObjective) => setFormData({ ...formData, targetObjective: v })}
                    >
                      <SelectTrigger className="bg-[#2d2e3a] border-white/10 h-12 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TARGET_OBJECTIVE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key as TargetObjective}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Budget mensuel cible (€)</Label>
                    <Input 
                      type="number" 
                      value={formData.targetMonthlyAmount || ''} 
                      onChange={e => setFormData({ ...formData, targetMonthlyAmount: Number(e.target.value) })} 
                      className="bg-[#2d2e3a] border-white/10 h-12 !text-indigo-400 font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Date d'échéance</Label>
                    <Input 
                      type="date" 
                      value={formData.targetDate || ''} 
                      onChange={e => setFormData({ ...formData, targetDate: e.target.value })} 
                      className="bg-[#2d2e3a] border-white/10 h-12 !text-white" 
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </form>
        </Tabs>

        <div className="p-6 border-t border-white/5 bg-[#1f2029] flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 text-gray-500 uppercase text-[10px] font-black tracking-widest hover:bg-white/5">
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white uppercase text-[10px] font-black tracking-widest shadow-lg shadow-indigo-600/30 transition-all active:scale-95">
            <Check className="w-4 h-4 mr-2" />
            {person ? 'Valider les modifications' : 'Enregistrer la relation'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}