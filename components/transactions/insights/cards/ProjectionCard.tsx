/**
 * 📊 PROJECTION CARD - VERSION COHÉRENTE 2026
 * 
 * Design unifié :
 * - Tailles cohérentes avec les autres cards
 * - Spacing rationalisé
 * - Hero clair avec résultat focal
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../../../src/utils/format';

interface ProjectionCardProps {
  projection: any;
  transactions: any[];
  onShowDetails: () => void;
}

export const ProjectionCard = memo(function ProjectionCard({ 
  projection, 
  onShowDetails 
}: ProjectionCardProps) {
  
  const TrendIcon = projection.trend === 'improving' 
    ? TrendingUp 
    : projection.trend === 'declining' 
    ? TrendingDown 
    : Minus;

  return (
    <motion.button
      onClick={onShowDetails}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group w-full text-left relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300"
    >
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-all" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <TrendIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm text-white/90 font-medium">Projection Fin de Mois</h3>
              <p className="text-xs text-white/40">{projection.daysRemaining} jours restants</p>
            </div>
          </div>
          
          <ChevronRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Résultat principal */}
        <div className="mb-4">
          <span 
            className="text-3xl font-light tracking-tight block"
            style={{ 
              color: projection.projectedBalance >= 0 
                ? 'rgb(34, 197, 94)' 
                : 'rgb(239, 68, 68)' 
            }}
          >
            {formatCurrency(projection.projectedBalance)}
          </span>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${projection.confidence}%` }}
              />
            </div>
            <span className="text-xs text-white/40">{projection.confidence}%</span>
          </div>
        </div>

        {/* Micro KPIs */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
            <p className="text-xs text-white/50 mb-1">Revenus</p>
            <p className="text-sm text-green-400 font-medium">
              +{formatCurrency(projection.expectedRevenue)}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
            <p className="text-xs text-white/50 mb-1">Dépenses</p>
            <p className="text-sm text-red-400 font-medium">
              -{formatCurrency(projection.expectedExpenses)}
            </p>
          </div>
        </div>

        {/* Risques */}
        {projection.risks?.length > 0 && (
          <div className="pt-3 border-t border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-orange-400">Risque{projection.risks.length > 1 ? 's' : ''}</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
              {projection.risks[0]}
            </p>
          </div>
        )}

        {/* Tips */}
        {projection.personalizedTips?.length > 0 && !projection.risks?.length && (
          <div className="pt-3 border-t border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-400">Conseil</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
              {projection.personalizedTips[0]}
            </p>
          </div>
        )}
      </div>
    </motion.button>
  );
});
