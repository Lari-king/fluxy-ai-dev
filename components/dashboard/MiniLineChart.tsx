import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent } from '../ui/card'; // Assumer que ces composants shadcn/ui sont disponibles
import { formatCurrency } from '../../src/utils/format'; // Assumer que ce chemin est correct

interface TimeSeriesData {
  date: string; // Format court ex: "Mar 24"
  value: number;
}

interface MiniLineChartProps {
  data: TimeSeriesData[];
  title: string;
  color?: string;
  isLoading?: boolean;
}

/**
 * Affiche un graphique en ligne minimaliste pour les tendances rapides.
 */
export const MiniLineChart: React.FC<MiniLineChartProps> = ({
  data,
  title,
  color = '#4f46e5', // Indigo-600 par défaut
  isLoading = false,
}) => {
  if (isLoading || data.length === 0) {
    return (
      <Card className="h-48 flex items-center justify-center">
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse">Chargement...</div>
      </Card>
    );
  }

  const lastValue = data.length > 0 ? data[data.length - 1].value : 0;
  const isPositiveTrend = data.length > 1 ? lastValue > data[0].value : true;
  const trendColor = isPositiveTrend ? 'text-emerald-500' : 'text-red-500';

  return (
    <Card className="h-48 group hover:shadow-lg transition-all duration-300">
      <CardContent className="pt-4 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          <span className={`text-lg font-bold ${trendColor} dark:text-white`}>
            {formatCurrency(lastValue, 0)}
          </span>
        </div>

        <div className="h-32 w-full -mb-4 -mx-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                name={title}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2 text-xs bg-white border rounded shadow dark:bg-gray-700 dark:border-gray-600">
                        <p className="text-gray-500 dark:text-gray-400">{payload[0].payload.date}</p>
                        <p className="font-semibold" style={{ color: color }}>{formatCurrency(payload[0].value)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};