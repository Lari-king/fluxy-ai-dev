/**
 * 📊 PROJECTION CARD - VERSION HAUTE FIDÉLITÉ
 * Focus : Lisibilité instantanée du solde final et indicateurs de confiance.
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface ProjectionCardProps {
  projection: any;
  transactions: any[];
  onShowDetails: () => void;
}

export const ProjectionCard = memo(function ProjectionCard({ 
  projection, 
  onShowDetails 
}: ProjectionCardProps) {
  
  // Valeurs de sécurité si le moteur n'a pas encore fini le calcul
  const projectedBalance = projection?.projectedBalance ?? 0;
  const confidence = projection?.confidence ?? 0;
  const isNegative = projectedBalance < 0;

  // Calcul du dernier jour du mois pour l'affichage (ex: "au 31")
  const lastDayLabel = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `au ${lastDay}`;
  }, []);

  const TrendIcon = projection?.trend === 'improving' 
    ? TrendingUp 
    : projection?.trend === 'declining' 
    ? TrendingDown 
    : Minus;

  // Gestion des messages (Priorité aux risques, puis aux conseils)
  const mainInsight = projection?.risks?.[0] || projection?.personalizedTips?.[0];

  return (
    <motion.button
      onClick={onShowDetails}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group w-full text-left relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all duration-500 shadow-2xl"
    >
      {/* Background Glow Dynamique */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] transition-colors duration-700 ${
        isNegative ? 'bg-red-500/10' : 'bg-cyan-500/10'
      }`} />
      
      <div className="relative p-5">
        {/* Header : Contexte temporel & Fiabilité */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              isNegative ? 'bg-red-500/10 border-red-500/20' : 'bg-cyan-500/10 border-cyan-500/20'
            }`}>
              <TrendIcon className={`size-4 ${isNegative ? 'text-red-400' : 'text-cyan-400'}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">
                Estimation
              </p>
              <div className="flex items-center gap-1.5 text-white/90">
                <Calendar className="size-3 text-white/30" />
                <span className="text-xs font-bold">
                  {projection?.daysRemaining ?? '--'} jours restants
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
             <div className="text-[9px] font-black text-white/20 uppercase tracking-tighter mb-1">Fiabilité</div>
             <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 w-2.5 rounded-full transition-colors ${
                      i < Math.ceil(confidence / 20) 
                        ? (isNegative ? 'bg-red-500/40' : 'bg-cyan-500/40') 
                        : 'bg-white/5'
                    }`} 
                  />
                ))}
             </div>
          </div>
        </div>

        {/* Hero : Solde Projeté */}
        <div className="mb-6">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">
            Solde estimé {lastDayLabel}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-light tracking-tighter ${
              isNegative ? 'text-red-400' : 'text-white'
            }`}>
              {formatCurrency(projectedBalance)}
            </span>
            <ChevronRight className="size-4 text-white/10 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Grid KPIs : Flux attendus */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-black/20 border border-white/5 group-hover:border-white/10 transition-colors">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Entrées prévues</p>
            <p className="text-sm font-mono font-bold text-emerald-400/90">
              +{formatCurrency(projection?.expectedRevenue ?? 0)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-white/5 group-hover:border-white/10 transition-colors text-right">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Restant à débiter</p>
            <p className="text-sm font-mono font-bold text-red-400/90">
              -{formatCurrency(projection?.expectedExpenses - (projection?.details?.completedExpenses || 0) || 0)}
            </p>
          </div>
        </div>

        {/* Insight Intelligent (Risque ou Conseil) */}
        {mainInsight && (
          <div className={`mt-2 p-3 rounded-xl border flex items-start gap-3 transition-colors ${
            projection?.risks?.length > 0 
              ? 'bg-orange-500/5 border-orange-500/10 group-hover:border-orange-500/20' 
              : 'bg-cyan-500/5 border-cyan-500/10 group-hover:border-cyan-500/20'
          }`}>
            <div className="mt-0.5">
              {projection?.risks?.length > 0 
                ? <AlertTriangle className="size-3.5 text-orange-400" />
                : <Sparkles className="size-3.5 text-cyan-400" />
              }
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed font-medium line-clamp-2">
              {mainInsight}
            </p>
          </div>
        )}
      </div>

      {/* Barre de progression de confiance (très subtile en bas) */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          className={`h-full ${isNegative ? 'bg-red-500/30' : 'bg-cyan-500/30'}`}
        />
      </div>
    </motion.button>
  );
});