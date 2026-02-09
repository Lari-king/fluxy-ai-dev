import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { ChangeAlert } from '@/utils/insights/change-detection';

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
  changes: ChangeAlert[];
  onMonthClick?: (month: string) => void;
}

const COLORS = [
  '#9333ea', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#f97316', // orange
  '#14b8a6', // teal
];

export function TimelineEvolution({ data, categories, changes, onMonthClick }: TimelineEvolutionProps) {
  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    return data.map(monthData => {
      const formatted: any = {
        month: formatMonth(monthData.month as string),
        fullMonth: monthData.month,
      };

      categories.forEach(cat => {
        formatted[cat.name] = monthData[cat.id] || 0;
      });

      return formatted;
    });
  }, [data, categories]);

  // Grouper les changements par mois pour afficher des marqueurs
  const changesByMonth = useMemo(() => {
    const map = new Map<string, ChangeAlert[]>();
    changes.forEach(change => {
      if (!map.has(change.month)) {
        map.set(change.month, []);
      }
      map.get(change.month)!.push(change);
    });
    return map;
  }, [changes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      <div className="mb-6">
        <h3 className="text-xl mb-2 text-white">
          📊 Évolution Temporelle des Catégories
        </h3>
        <p className="text-white/60 text-sm">
          Visualisation de l'évolution de vos dépenses sur 12 mois. Cliquez sur un mois pour plus de détails.
        </p>
      </div>

      {/* Alertes de changement */}
      {changes.length > 0 && (
        <div className="mb-6 space-y-2">
          <h4 className="text-sm text-white/80 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Changements détectés ({changes.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto scrollbar-thin">
            {changes.slice(0, 6).map((change, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10"
              >
                {change.type === 'spike' ? (
                  <TrendingUp className="w-4 h-4 text-red-400 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
                <span className="text-white/90 truncate">
                  {formatMonth(change.month)} : {change.category}
                </span>
                <span className={`ml-auto font-medium ${change.type === 'spike' ? 'text-red-400' : 'text-green-400'}`}>
                  {change.type === 'spike' ? '+' : ''}{change.percent}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Graphique */}
      <div className="w-full h-96 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {categories.map((cat, idx) => (
                <linearGradient key={cat.id} id={`gradient-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="month"
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              tickFormatter={(value) => `${value}€`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
              }}
              formatter={(value: any) => [`${Math.round(value)}€`, '']}
              labelFormatter={(label) => `Mois : ${label}`}
            />
            <Legend
              wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }}
              iconType="rect"
            />
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

      {/* Légende des changements */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-red-400" />
              <span>Hausse significative (&gt;30%)</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-green-400" />
              <span>Baisse significative (&gt;30%)</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}
