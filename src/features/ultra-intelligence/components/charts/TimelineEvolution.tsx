import { useMemo } from 'react'; // React supprimé ici car inutilisé directement (TS6133)
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

// ✅ Import corrigé vers le bon chemin et le bon type
import type { BehavioralAnomaly } from '@/features/predictions/logic/BehavioralAnalyzer';

interface TimelineEvolutionProps {
  data: Array<{
    month: string;
    [category: string]: number | string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  // ✅ On utilise maintenant le type Anomaly du BehavioralAnalyzer
  changes: BehavioralAnomaly[];
  onMonthClick?: (month: string) => void;
}

const COLORS = [
  '#9333ea', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316', '#14b8a6',
];

function formatMonthShort(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('fr-FR', { month: 'short' });
}

function formatFullMonth(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const result = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function TimelineEvolution({ data, categories, changes, onMonthClick }: TimelineEvolutionProps) {
  
  const chartData = useMemo(() => {
    return data.map(monthData => {
      const formatted: Record<string, any> = {
        month: formatMonthShort(monthData.month as string),
        fullLabel: formatFullMonth(monthData.month as string),
        rawMonth: monthData.month,
      };
      categories.forEach(cat => {
        formatted[cat.name] = monthData[cat.id] || 0;
      });
      return formatted;
    });
  }, [data, categories]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      <div className="mb-6">
        <h3 className="text-xl mb-2 text-white flex items-center gap-2">
          <span>📊</span> Évolution Temporelle des Catégories
        </h3>
        <p className="text-white/60 text-sm">
          Analyse de vos dépenses sur les 12 derniers mois.
        </p>
      </div>

      {/* Alertes de changement */}
      {changes.length > 0 && (
        <div className="mb-6 space-y-2">
          <h4 className="text-sm text-white/80 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Anomalies comportementales ({changes.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto scrollbar-thin pr-2">
            {changes.slice(0, 10).map((anomaly, idx) => (
              <motion.div
                key={`${anomaly.transaction.id}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10"
              >
                {anomaly.score > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-400 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
                <span className="text-white/90 truncate">
                  <span className="font-semibold">{anomaly.transaction.category}</span> : {anomaly.reason}
                </span>
                <span className={`ml-auto font-medium ${anomaly.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`}>
                  {Math.round(anomaly.score)}z
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Graphique */}
      <div className="w-full h-80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && onMonthClick) {
                onMonthClick(state.activePayload[0].payload.rawMonth);
              }
            }}
          >
            <defs>
              {categories.map((cat, idx) => (
                <linearGradient key={cat.id} id={`gradient-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="rgba(255,255,255,0.4)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.4)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              tickFormatter={(value) => `${value}€`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
              }}
              formatter={(value: number) => [`${value.toLocaleString()} €`, '']}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullLabel || label}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />
            {categories.map((cat, idx) => (
              <Area
                key={cat.id}
                type="monotone"
                dataKey={cat.name}
                stackId="1"
                stroke={COLORS[idx % COLORS.length]}
                fill={`url(#gradient-${cat.id})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}