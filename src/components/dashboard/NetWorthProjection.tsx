import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

type TimeRange = '30d' | '90d' | '1y' | '5y' | '10y';

const timeRanges = [
  { value: '30d' as TimeRange, label: 'J+30' },
  { value: '90d' as TimeRange, label: 'J+90' },
  { value: '1y' as TimeRange, label: 'J+365' },
  { value: '5y' as TimeRange, label: '5 ans' },
  { value: '10y' as TimeRange, label: '10 ans' },
];

// Mock data generation function
function generateProjectionData(range: TimeRange) {
  const currentBalance = 2500; // Starting balance
  const monthlyIncome = 3200;
  const monthlyExpenses = 2800;
  const monthlyGrowth = monthlyIncome - monthlyExpenses;

  let points: { date: string; value: number }[] = [];
  
  switch (range) {
    case '30d':
      for (let i = 0; i <= 30; i += 5) {
        points.push({
          date: `J+${i}`,
          value: currentBalance + (monthlyGrowth / 30) * i + Math.random() * 200 - 100,
        });
      }
      break;
    case '90d':
      for (let i = 0; i <= 90; i += 15) {
        points.push({
          date: `J+${i}`,
          value: currentBalance + (monthlyGrowth / 30) * i + Math.random() * 500 - 250,
        });
      }
      break;
    case '1y':
      for (let i = 0; i <= 12; i++) {
        points.push({
          date: `M+${i}`,
          value: currentBalance + monthlyGrowth * i + Math.random() * 800 - 400,
        });
      }
      break;
    case '5y':
      for (let i = 0; i <= 60; i += 6) {
        const compound = 1.05; // 5% annual growth
        points.push({
          date: `M+${i}`,
          value: (currentBalance + monthlyGrowth * i) * Math.pow(compound, i / 12),
        });
      }
      break;
    case '10y':
      for (let i = 0; i <= 120; i += 12) {
        const compound = 1.05;
        points.push({
          date: `A+${i / 12}`,
          value: (currentBalance + monthlyGrowth * i) * Math.pow(compound, i / 12),
        });
      }
      break;
  }

  return points;
}

export function NetWorthProjection() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  
  // ✅ Memoize data generation to prevent memory buildup
  const data = React.useMemo(() => generateProjectionData(timeRange), [timeRange]);

  const currentValue = React.useMemo(() => data[0]?.value || 0, [data]);
  const finalValue = React.useMemo(() => data[data.length - 1]?.value || 0, [data]);
  const change = React.useMemo(() => finalValue - currentValue, [finalValue, currentValue]);
  const changePercent = React.useMemo(() => ((change / Math.abs(currentValue)) * 100).toFixed(1), [change, currentValue]);

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Solde Net Projeté</CardTitle>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList className="h-8">
              {timeRanges.map((range) => (
                <TabsTrigger 
                  key={range.value} 
                  value={range.value}
                  className="text-xs px-2 h-7"
                >
                  {range.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <motion.span 
              key={finalValue}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl"
            >
              {finalValue.toLocaleString('fr-FR', { 
                style: 'currency', 
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </motion.span>
            <div className={`flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm">
                {change >= 0 ? '+' : ''}{changePercent}%
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Projection basée sur tes revenus et dépenses actuels
          </p>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => [
                value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
                'Solde'
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={false}
              fill="url(#colorValue)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
