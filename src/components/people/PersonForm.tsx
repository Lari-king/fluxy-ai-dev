import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, User } from 'lucide-react'; // Nettoyage des icônes inutilisées
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  PersonType,
  ContributionType,
  TargetObjective,
  ProgressionState,
  CONTRIBUTION_TYPE_LABELS,
  TARGET_OBJECTIVE_LABELS,
  PersonRelation,
} from '@/types/people';

interface PersonFormProps {
  person?: PersonRelation;
  onClose: () => void;
  onSave: (person: PersonRelation) => void;
}

const PRESET_COLORS = ['#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];
const RELATIONSHIPS = ['Conjoint(e)', 'Enfant', 'Parent', 'Frère/Sœur', 'Ami(e)', 'Associé(e)', 'Entreprise', 'Abonnement IA', 'Autre'];

export function PersonForm({ person, onClose, onSave }: PersonFormProps) {
  const [activeTab, setActiveTab] = useState('identity');
  
  const [formData, setFormData] = useState({
    name: person?.name || '',
    // Correction de l'erreur TS : on utilise l'accès dynamique
    originalName: (person as any)?.originalName || person?.name || '',
    relationship: person?.relationship || '',
    circle: person?.circle || 'direct', 
    color: person?.color || PRESET_COLORS[0],
    email: person?.email || '',
    phone: person?.phone || '',
    birthDate: person?.birthDate || '',
    notes: person?.notes || '',
    personType: person?.personType || PersonType.PHYSIQUE,
    contributionType: person?.contributionType || ContributionType.SECURITE,
    targetObjective: person?.targetObjective || TargetObjective.STABILISER,
    targetMonthlyAmount: person?.targetMonthlyAmount || 0,
    targetDate: person?.targetDate || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(person?.avatar || '');

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const impact = Math.abs(person?.totalImpact || 0);
    const target = formData.targetMonthlyAmount || 0;
    const percentage = target > 0 ? Math.min(Math.round((impact / target) * 100), 100) : 0;

    onSave({
      ...person,
      ...formData,
      id: person?.id || `person_${crypto.randomUUID()}`,
      avatar: avatarPreview,
      totalImpact: person?.totalImpact || 0,
      progressionPercentage: percentage,
      progressionState: percentage >= 100 ? ProgressionState.EN_AVANCE : ProgressionState.NEUTRE,
    } as PersonRelation);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div 
          initial={{ scale: 0.95, y: 20 }} 
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="relative z-[101] bg-[#1a1b23] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-white"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-[#1f2029] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="w-16 h-16 border-2" style={{ borderColor: formData.color }}>
                  <AvatarImage src={avatarPreview} className="object-cover" />
                  <AvatarFallback style={{ backgroundColor: formData.color }} className="text-xl font-bold text-white">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : <User />}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer border-2 border-[#1a1b23] hover:bg-indigo-500 transition-colors z-10">
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                </label>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{person ? 'Modifier le profil' : 'Nouvelle relation'}</h2>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                  ID: {person?.id ? person.id.slice(0, 18) : 'Génération auto'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"><X /></button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="bg-[#1f2029] border-b border-white/5 rounded-none h-12 px-6 justify-start gap-8">
              <TabsTrigger value="identity" className="data-[state=active]:text-indigo-400 border-b-2 border-transparent data-[state=active]:border-indigo-400 rounded-none px-0 text-[10px] font-black uppercase tracking-widest text-gray-500">Identité</TabsTrigger>
              <TabsTrigger value="contribution" className="data-[state=active]:text-indigo-400 border-b-2 border-transparent data-[state=active]:border-indigo-400 rounded-none px-0 text-[10px] font-black uppercase tracking-widest text-gray-500">Impact</TabsTrigger>
              <TabsTrigger value="objectives" className="data-[state=active]:text-indigo-400 border-b-2 border-transparent data-[state=active]:border-indigo-400 rounded-none px-0 text-[10px] font-black uppercase tracking-widest text-gray-500">Objectifs</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#1a1b23] custom-scrollbar">
              
              <TabsContent value="identity" className="space-y-6 mt-0 outline-none">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-wider">Désignation</Label>
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="bg-[#2d2e3a] border-white/10 h-12 !text-white placeholder:text-gray-600" 
                      placeholder="Nom ou Raison Sociale" required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Nature</Label>
                    <Select value={formData.personType} onValueChange={(v: PersonType) => setFormData({...formData, personType: v})}>
                      <SelectTrigger className="bg-[#2d2e3a] border-white/10 h-12 !text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1f2029] border-white/10 !text-white z-[110]" position="popper">
                        <SelectItem value={PersonType.PHYSIQUE}>👤 Physique</SelectItem>
                        <SelectItem value={PersonType.MORALE}>🏢 Morale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Relation</Label>
                    <Select value={formData.relationship} onValueChange={v => setFormData({...formData, relationship: v})}>
                      <SelectTrigger className="bg-[#2d2e3a] border-white/10 h-12 !text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1f2029] border-white/10 !text-white z-[110]" position="popper">
                        {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Email</Label>
                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-[#2d2e3a] border-white/10 h-12 !text-white" placeholder="contact@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Contact</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-[#2d2e3a] border-white/10 h-12 !text-white" placeholder="+33..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-500">Notes confidentielles</Label>
                  <Textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    className="bg-[#2d2e3a] border-white/10 min-h-[100px] !text-white resize-none" 
                  />
                </div>
              </TabsContent>

              <TabsContent value="contribution" className="space-y-4 mt-0 outline-none">
                <div className="grid grid-cols-1 gap-3">
                  {Object.values(ContributionType).map((type) => (
                    <button 
                      key={type} type="button" 
                      onClick={() => setFormData({...formData, contributionType: type})}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${formData.contributionType === type ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.15)]' : 'bg-[#2d2e3a] border-white/5 opacity-40 hover:opacity-100'}`}
                    >
                      <span className="text-2xl">{(type === 'SURVIE' && '🛡️') || (type === 'SECURITE' && '🏠') || (type === 'CROISSANCE' && '📈') || '✨'}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{CONTRIBUTION_TYPE_LABELS[type]}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Impact de flux financier</p>
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="objectives" className="space-y-6 mt-0 outline-none">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-gray-500 block tracking-widest">Objectif Stratégique</Label>
                  <Select value={formData.targetObjective} onValueChange={(v: TargetObjective) => setFormData({...formData, targetObjective: v})}>
                    <SelectTrigger className="bg-[#2d2e3a] border-white/10 h-12 !text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1f2029] border-white/10 !text-white z-[110]" position="popper">
                      {Object.entries(TARGET_OBJECTIVE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-500">Montant Cible (€)</Label>
                      <Input 
                        type="number" 
                        value={formData.targetMonthlyAmount || ''} 
                        onChange={e => setFormData({...formData, targetMonthlyAmount: Number(e.target.value)})} 
                        className="bg-[#2d2e3a] border-white/10 h-12 !text-indigo-400 font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-500">Date d'échéance</Label>
                      <Input type="date" value={formData.targetDate} onChange={e => setFormData({...formData, targetDate: e.target.value})} className="bg-[#2d2e3a] border-white/10 h-12 !text-white" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </form>

            <div className="p-6 border-t border-white/5 bg-[#1f2029] flex gap-3">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1 text-gray-500 uppercase text-[10px] font-black tracking-widest hover:bg-white/5">Annuler</Button>
              <Button onClick={handleSubmit} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white uppercase text-[10px] font-black tracking-widest shadow-lg shadow-indigo-600/30 transition-all active:scale-95">
                {person ? 'Valider les modifications' : 'Enregistrer la relation'}
              </Button>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}