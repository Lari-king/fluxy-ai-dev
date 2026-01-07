import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { comparePeriods } from '../../src/utils/insights/period-comparator';
import type { Transaction } from '../../src/utils/csv-parser';
import type { Category } from '../../contexts/DataContext';

interface PeriodComparisonProps {
  transactions: Transaction[];
  categories: Category[];
}

export function PeriodComparison({ transactions, categories }: PeriodComparisonProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedPeriodType, setSelectedPeriodType] = useState<'6months' | '1year' | 'custom'>('6months');

  // Calculer la date de split automatiquement
  const splitDate = useMemo(() => {
    if (!transactions || transactions.length === 0) return new Date();
    
    const sortedDates = transactions
      .map(t => new Date(t.date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    const latestDate = sortedDates[0];
    const split = new Date(latestDate);
    
    if (selectedPeriodType === '6months') {
      split.setMonth(split.getMonth() - 6);
    } else if (selectedPeriodType === '1year') {
      split.setFullYear(split.getFullYear() - 1);
    }
    
    return split;
  }, [transactions, selectedPeriodType]);

  // Calculer les comparaisons
  const comparisons = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    return comparePeriods(
      transactions,
      splitDate,
      categories.map(cat => ({ id: cat.id, name: cat.name }))
    );
  }, [transactions, categories, splitDate]);

  // Période label
  const periodLabel = useMemo(() => {
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
    const splitMonth = months[splitDate.getMonth()];
    const splitYear = splitDate.getFullYear();
    
    return `Avant vs Après ${splitMonth} ${splitYear}`;
  }, [splitDate]);

  // Filtrer et trier les comparaisons
  const displayComparisons = useMemo(() => {
    const sorted = [...comparisons].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    return showAll ? sorted : sorted.slice(0, 8);
  }, [comparisons, showAll]);

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    return displayComparisons.map(comp => ({
      category: comp.categoryName.length > 15 
        ? comp.categoryName.substring(0, 15) + '...' 
        : comp.categoryName,
      fullName: comp.categoryName,
      before: comp.before,
      after: comp.after,
      change: comp.change,
    }));
  }, [displayComparisons]);

  // Calculer les statistiques globales
  const stats = useMemo(() => {
    const totalBefore = comparisons.reduce((sum, c) => sum + c.before, 0);
    const totalAfter = comparisons.reduce((sum, c) => sum + c.after, 0);
    const totalChange = totalBefore > 0 ? ((totalAfter - totalBefore) / totalBefore) * 100 : 0;

    return {
      totalBefore: Math.round(totalBefore),
      totalAfter: Math.round(totalAfter),
      totalChange: Math.round(totalChange),
      increases: comparisons.filter(c => c.change > 5).length,
      decreases: comparisons.filter(c => c.change < -5).length,
    };
  }, [comparisons]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6"
    >
      <div className="mb-6">
        <h3 className="text-xl mb-2 text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Comparaison de Périodes
        </h3>
        <p className="text-white/60 text-sm">
          {periodLabel}
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Période 1</div>
          <div className="text-lg text-white">{stats.totalBefore}€</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Période 2</div>
          <div className="text-lg text-white">{stats.totalAfter}€</div>
        </div>
        <div className={`bg-white/5 rounded-lg p-3 border ${
          stats.totalChange > 0 ? 'border-red-500/30' : 'border-green-500/30'
        }`}>
          <div className="text-xs text-white/60 mb-1">Évolution</div>
          <div className={`text-lg flex items-center gap-1 ${
            stats.totalChange > 0 ? 'text-red-400' : stats.totalChange < 0 ? 'text-green-400' : 'text-white'
          }`}>
            {stats.totalChange > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : stats.totalChange < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            {Math.abs(stats.totalChange)}%
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Catégories</div>
          <div className="text-lg text-white flex gap-2">
            <span className="text-red-400">{stats.increases}↑</span>
            <span className="text-green-400">{stats.decreases}↓</span>
          </div>
        </div>
      </div>

      {/* Graphique en barres */}
      <div className="w-full h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="category"
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
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
              labelFormatter={(label) => chartData.find(d => d.category === label)?.fullName || label}
              formatter={(value: any) => [`${Math.round(value)}€`, '']}
            />
            <Bar dataKey="before" fill="rgba(168, 85, 247, 0.5)" name="Période 1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="after" name="Période 2" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.change > 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(34, 197, 94, 0.7)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Liste détaillée */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm text-white/80">Détails par catégorie</h4>
          {comparisons.length > 8 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              {showAll ? 'Voir moins' : `Voir tout (${comparisons.length})`}
            </button>
          )}
        </div>

        {displayComparisons.map((comp, idx) => (
          <motion.div
            key={comp.categoryId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
          >
            <div className="flex-1">
              <div className="text-sm text-white mb-1">{comp.categoryName}</div>
              <div className="text-xs text-white/60">
                {comp.before}€ → {comp.after}€
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                comp.change > 0 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : comp.change < 0
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10'
              }`}>
                {comp.change > 0 ? '+' : ''}{comp.change}%
              </div>

              {comp.change > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-400" />
              ) : comp.change < 0 ? (
                <TrendingDown className="w-4 h-4 text-green-400" />
              ) : (
                <Minus className="w-4 h-4 text-white/60" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}