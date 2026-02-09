import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, TrendingUp, Target, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  PersonRelation,
  ProgressionState,
  TargetObjective,
  TARGET_OBJECTIVE_LABELS,
} from '@/types/people';

interface PersonCardProps {
  person: PersonRelation;
  circleLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
}

export function PersonCard({ person, circleLabel, onEdit, onDelete, onViewDetail }: PersonCardProps) {
  const age = person.birthDate
    ? new Date().getFullYear() - new Date(person.birthDate).getFullYear()
    : null;

  const impactColor = person.totalImpact >= 0 ? '#10b981' : '#ef4444';
  const hasObjective = Boolean(person.targetObjective);

  return (
    <motion.div
      className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/10"
      style={{
        background: '#1a1b23',
        height: '360px',
      }}
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onViewDetail}
    >
      {/* Photo en plein format */}
      <div className="absolute inset-0">
        {person.avatar ? (
          <img 
            src={person.avatar} 
            alt={person.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: person.color || '#3b82f6' }}
          >
            <span className="text-white text-5xl font-bold opacity-30">
              {person.name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Gradient overlay optimisé pour lisibilité */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0.1) 70%, transparent 100%)'
          }}
        />
      </div>

      {/* Badge cercle en haut à gauche */}
      <div className="absolute top-3 left-3">
        <span 
          className="inline-block px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md"
          style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
        >
          {circleLabel}
        </span>
      </div>

      {/* Actions au hover (top right) */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          style={{ background: 'rgba(255, 255, 255, 0.2)' }}
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          style={{ background: 'rgba(239, 68, 68, 0.3)' }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Informations en bas (overlay) - VERSION COMPACTE */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2.5">
        {/* Nom + Relation */}
        <div>
          <h3 className="text-lg font-bold text-white mb-0.5 truncate">{person.name}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="truncate">{person.relationship}</span>
            {age && (
              <>
                <span>•</span>
                <span>{age} ans</span>
              </>
            )}
          </div>
        </div>

        {/* Impact total - Compact */}
        <div 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md"
          style={{
            background: person.totalImpact >= 0 
              ? 'rgba(16, 185, 129, 0.25)' 
              : 'rgba(239, 68, 68, 0.25)',
            border: `1px solid ${person.totalImpact >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
          }}
        >
          <TrendingUp 
            className="w-3.5 h-3.5" 
            style={{ color: impactColor }}
          />
          <span className="text-sm font-bold text-white tabular-nums">
            {person.totalImpact >= 0 ? '+' : ''}{Math.abs(person.totalImpact ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€
          </span>
        </div>

        {/* Objectif + Progression - Version ultra compacte */}
        {hasObjective && person.targetObjective && person.progressionPercentage !== undefined && (
          <div 
            className="backdrop-blur-md rounded-lg p-2"
            style={{ background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Target className="w-3 h-3 text-purple-300" />
                <span className="text-[10px] font-medium text-purple-200 uppercase tracking-wider truncate">
                  {TARGET_OBJECTIVE_LABELS[person.targetObjective as TargetObjective]}
                </span>
              </div>
              <span className="text-xs font-bold text-white tabular-nums">
                {Math.round(person.progressionPercentage)}%
              </span>
            </div>
            
            {/* Barre de progression mini */}
            <div 
              className="h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.2)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(person.progressionPercentage, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: 
                    person.progressionState === ProgressionState.EN_AVANCE ? '#10b981'
                    : person.progressionState === ProgressionState.NEUTRE ? '#3b82f6'
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
