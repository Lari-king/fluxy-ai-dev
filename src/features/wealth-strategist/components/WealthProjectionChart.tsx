// src/features/wealth-strategist/components/WealthProjectionChart.tsx
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useWealthAnalysis } from '../hooks/useWealthAnalysis';
import { calculateWealthProjection } from '../utils/projections';
import { formatCurrency } from '@/utils/format';

export function WealthProjectionChart() {
  const { currentNetWorth, investmentCapacity } = useWealthAnalysis();

  // On simule une projection sur 10 ans avec un rendement prudent de 7%
  const data = useMemo(() => {
    return calculateWealthProjection(currentNetWorth, investmentCapacity, 0.07, 10);
  }, [currentNetWorth, investmentCapacity]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPatrimoine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          interval={4}
        />
        <YAxis 
          hide 
          domain={['dataMin - 10000', 'auto']} 
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white dark:bg-gray-900 p-4 border rounded-xl shadow-xl">
                  <p className="text-xs text-gray-500 mb-1">{payload[0].payload.month}</p>
                  <p className="text-sm font-bold text-blue-600">
                    Total : {formatCurrency(payload[0].value as number)} €
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Dont investi : {formatCurrency(payload[0].payload.investi)} €
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="patrimoine"
          stroke="#3B82F6"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorPatrimoine)"
        />
        <Area
          type="monotone"
          dataKey="investi"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="transparent"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}