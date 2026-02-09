/**
 * 🏔️ MASLOW PYRAMID VISUALIZATION - OPTIMIZED VERSION
 * 
 * Performance optimisée avec mémoisation et cache
 * Design horizontal inspiré du LeftPanel
 */

import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Shield, 
  Users, 
  Star, 
  Trophy,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Target,
  Activity
} from 'lucide-react';
import { 
  analyzeMaslowDistribution, 
  MASLOW_LEVELS,
  type MaslowLevel 
} from '@/utils/maslow';

interface MaslowPyramidProps {
  transactions: any[];
  categories: any[];
  compact?: boolean;
}

const LEVEL_ICONS: Record<MaslowLevel, any> = {
  'SURVIE': Home,
  'SÉCURITÉ': Shield,
  'APPARTENANCE': Users,
  'ESTIME': Star,
  'ACCOMPLISSEMENT': Trophy
};

// Composant mémorisé pour chaque barre de niveau
const LevelBar = memo(({ 
  level, 
  percentage, 
  color, 
  gradient, 
  index 
}: { 
  level: string; 
  percentage: number; 
  color: string; 
  gradient: string; 
  index: number;
}) => {
  const Icon = LEVEL_ICONS[level as MaslowLevel];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${color}20`, borderColor: `${color}50`, borderWidth: '1px' }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <span className="text-xs font-medium text-white/80">{level}</span>
        </div>
        <span className="text-sm font-light text-white/90">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${gradient}`}
        />
      </div>
    </div>
  );
});

LevelBar.displayName = 'LevelBar';

// Composant mémorisé pour les scores
const ScoreCard = memo(({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string;
}) => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-lg ${color}/10 border ${color}/30`} style={{ borderWidth: '1px' }}>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <span className="text-xs text-white/60">{label}</span>
    </div>
    <div className="text-2xl font-light text-white/90">
      {value}<span className="text-sm text-white/40">/100</span>
    </div>
  </div>
));

ScoreCard.displayName = 'ScoreCard';

export const MaslowPyramid = memo(function MaslowPyramid({ 
  transactions, 
  categories 
}: MaslowPyramidProps) {
  // Mémoisation de l'analyse complète avec dépendances précises
  const analysis = useMemo(() => {
    console.log('🧠 Calcul Maslow analysis...');
    return analyzeMaslowDistribution(transactions, categories);
  }, [transactions.length, categories.length]); // Seulement si le nombre change, pas à chaque modification

  // Mémoisation du tri des analyses
  const sortedAnalyses = useMemo(() => 
    [...analysis.analyses].sort((a, b) => 
      MASLOW_LEVELS[b.level].order - MASLOW_LEVELS[a.level].order
    ),
    [analysis.analyses]
  );

  // Mémoisation du statut global
  const overallStatus = useMemo(() => {
    if (analysis.overall >= 80) return { color: 'text-green-400', bgColor: 'bg-green-500', icon: CheckCircle2, label: 'Excellent' };
    if (analysis.overall >= 60) return { color: 'text-cyan-400', bgColor: 'bg-cyan-500', icon: TrendingUp, label: 'Bon' };
    if (analysis.overall >= 40) return { color: 'text-orange-400', bgColor: 'bg-orange-500', icon: AlertCircle, label: 'Moyen' };
    return { color: 'text-red-400', bgColor: 'bg-red-500', icon: AlertCircle, label: 'Attention' };
  }, [analysis.overall]);

  const StatusIcon = overallStatus.icon;

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* COLONNE GAUCHE : Scores + Pyramide */}
      <div className="space-y-4">
        {/* Score global principal */}
        <div className="bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 border border-purple-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${overallStatus.bgColor}/20 border ${overallStatus.bgColor}/30`} style={{ borderWidth: '1px' }}>
                <StatusIcon className={`w-5 h-5 ${overallStatus.color}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-white/90">Équilibre Maslow</div>
                <div className="text-xs text-white/40">{overallStatus.label}</div>
              </div>
            </div>
            <div className="text-4xl font-light text-white/90">{analysis.overall}</div>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analysis.overall}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full ${overallStatus.bgColor}`}
            />
          </div>
        </div>

        {/* Sous-scores en grille */}
        <div className="grid grid-cols-3 gap-3">
          <ScoreCard icon={Activity} label="Global" value={analysis.overall} color="text-cyan-400 bg-cyan-500 border-cyan-500" />
          <ScoreCard icon={Shield} label="Stabilité" value={analysis.stability} color="text-purple-400 bg-purple-500 border-purple-500" />
          <ScoreCard icon={TrendingUp} label="Progression" value={analysis.progression} color="text-green-400 bg-green-500 border-green-500" />
        </div>

        {/* Pyramide avec barres horizontales */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-xs font-medium text-white/60 mb-4">Répartition par niveau</div>
          <div className="space-y-3">
            {sortedAnalyses.map((item, index) => {
              const config = MASLOW_LEVELS[item.level];
              return (
                <LevelBar
                  key={item.level}
                  level={item.level}
                  percentage={item.percentage}
                  color={config.color}
                  gradient={config.gradient}
                  index={index}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* COLONNE DROITE : Insights + Actions + Détails */}
      <div className="space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2" style={{ maxHeight: '600px' }}>
        {/* Insights */}
        {analysis.insights.length > 0 && (
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/90">Insights</span>
            </div>
            <div className="space-y-2">
              {analysis.insights.map((insight, index) => (
                <div key={index} className="text-xs text-white/70 leading-relaxed flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions recommandées */}
        {analysis.actions.length > 0 && (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white/90">Actions recommandées</span>
            </div>
            <div className="space-y-2">
              {analysis.actions.map((action, index) => (
                <div key={index} className="text-xs text-white/70 leading-relaxed flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Détails par niveau - Version compacte */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-white/60 mb-2">Détails par niveau</div>
          {sortedAnalyses.map((item) => {
            const config = MASLOW_LEVELS[item.level];
            const Icon = LEVEL_ICONS[item.level];
            
            return (
              <div 
                key={item.level} 
                className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${config.color}20`, borderColor: `${config.color}50`, borderWidth: '1px' }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white/90">{item.level}</div>
                      <div className="text-[10px] text-white/40">{item.transactionCount} trans. • {item.categories.length} cat.</div>
                    </div>
                  </div>
                  <div className="text-sm font-light text-white/90">{item.percentage.toFixed(1)}%</div>
                </div>
                
                <div className="text-[10px] text-white/60 leading-relaxed">{item.recommendation}</div>
                
                {item.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.categories.slice(0, 2).map(cat => (
                      <span 
                        key={cat}
                        className="text-[9px] px-1.5 py-0.5 rounded border"
                        style={{ 
                          backgroundColor: `${config.color}10`,
                          borderColor: `${config.color}30`,
                          color: config.color
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                    {item.categories.length > 2 && (
                      <span className="text-[9px] px-1.5 py-0.5 text-white/40">
                        +{item.categories.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
