// src/features/people/components/cards/PersonCard.tsx

import { motion } from 'framer-motion';
import { Edit, Trash2, TrendingUp, Target, User, Building2 } from 'lucide-react';

// Types (Importés de base.ts)
import {
  PersonRelation,
  ProgressionState,
  TargetObjective,
  PersonType,
} from '@/features/people/types/base';

// Configuration / Labels (Importés de config.ts)
import { TARGET_OBJECTIVE_LABELS } from '@/features/people/constants/config';

interface PersonCardProps {
  person: PersonRelation;
  circleLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
}

export function PersonCard({ person, circleLabel, onEdit, onDelete, onViewDetail }: PersonCardProps) {
  // Calcul de l'âge si applicable (pour les personnes physiques)
  const age = person.birthDate
    ? new Date().getFullYear() - new Date(person.birthDate).getFullYear()
    : null;

  // Couleurs et états dynamiques
  const impactColor = (person.totalImpact ?? 0) >= 0 ? '#10b981' : '#ef4444';
  const hasObjective = Boolean(person.targetObjective);
  const isMorale = person.personType === PersonType.MORALE;

  return (
    <motion.div
      className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/10"
      style={{
        background: '#1a1b23',
        height: '360px',
      }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onViewDetail}
    >
      {/* 🖼️ BACKGROUND / AVATAR FULL-SIZE */}
      <div className="absolute inset-0">
        {person.avatar ? (
          <img 
            src={person.avatar} 
            alt={person.name}
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${person.color || '#3b82f6'} 0%, #111827 100%)`,
              opacity: 0.8 
            }}
          >
            {isMorale ? (
              <Building2 className="w-20 h-20 text-white/20" />
            ) : (
              <span className="text-white text-6xl font-black opacity-20">
                {person.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
        
        {/* Overlay Dégradé pour lisibilité du texte */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(10, 11, 15, 1) 0%, rgba(10, 11, 15, 0.6) 30%, rgba(0, 0, 0, 0) 100%)'
          }}
        />
      </div>

      {/* 🏷️ BADGE CERCLE (Top Left) */}
      <div className="absolute top-4 left-4">
        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md bg-black/40 text-white border border-white/10">
          {circleLabel}
        </span>
      </div>

      {/* ⚙️ ACTIONS (Top Right) */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-9 h-9 rounded-xl backdrop-blur-md bg-white/10 flex items-center justify-center text-white hover:bg-white/20 border border-white/10 transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-9 h-9 rounded-xl backdrop-blur-md bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/40 border border-red-500/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 📝 INFOS CONTENU (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-4">
        
        {/* Identité */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isMorale ? <Building2 className="w-3 h-3 text-slate-400" /> : <User className="w-3 h-3 text-slate-400" />}
            <h3 className="text-xl font-bold text-white tracking-tight truncate">{person.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            <span>{person.relationship}</span>
            {age && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>{age} ans</span>
              </>
            )}
          </div>
        </div>

        {/* Impact Financier */}
        <div className="flex items-center justify-between">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-xl border"
            style={{
              backgroundColor: (person.totalImpact ?? 0) >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: (person.totalImpact ?? 0) >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
            }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: impactColor }} />
            <span className="text-base font-bold text-white tabular-nums">
              {person.totalImpact && person.totalImpact >= 0 ? '+' : ''}
              {Math.abs(person.totalImpact ?? 0).toLocaleString('fr-FR')}€
            </span>
          </div>
          
          {person.transactionCount !== undefined && (
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              {person.transactionCount} opérations
            </span>
          )}
        </div>

        {/* Objectif & Barre de Progression */}
        {hasObjective && person.targetObjective && person.progressionPercentage !== undefined && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  {TARGET_OBJECTIVE_LABELS[person.targetObjective as TargetObjective]}
                </span>
              </div>
              <span className="text-xs font-black text-white tabular-nums">
                {Math.round(person.progressionPercentage)}%
              </span>
            </div>
            
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(person.progressionPercentage, 100)}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                style={{
                  background: 
                    person.progressionState === ProgressionState.EN_AVANCE ? '#10b981'
                    : person.progressionState === ProgressionState.NEUTRE ? '#6366f1'
                    : person.progressionState === ProgressionState.EN_RETARD ? '#f59e0b'
                    : '#ef4444'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}