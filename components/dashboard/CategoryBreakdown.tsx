import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'; // Importation UI standard
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../src/utils/format';
import { Skeleton } from '../ui/skeleton';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string; 
  [key: string]: any;
}

// Couleurs pré-définies pour les catégories (Palette Tailwind/Shadcn)
const CATEGORY_COLORS = [
  '#ef4444', // Red (Dépenses primaires)
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald (Revenus)
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#a855f7', // Purple
  '#06b6d4', // Cyan
];

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

/**
 * Affiche la répartition des transactions (dépenses ou revenus) par catégorie sur les 30 derniers jours.
 */
export const CategoryBreakdown: React.FC = () => {
  const { transactions, loading } = useData();

  // État local pour basculer entre Dépenses et Revenus (par défaut, on affiche les Dépenses)
  const [mode, setMode] = React.useState<'expenses' | 'income'>('expenses');

  const processedData = useMemo(() => {
    if (loading || !transactions) return [];

    const txs = transactions as Transaction[];
    
    // Déterminer la date de début de la fenêtre de 30 jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString().split('T')[0];

    const recentTransactions = txs.filter(t => t.date >= thirtyDaysAgoISO);
    
    // Filtrer selon le mode (Dépenses = montant < 0, Revenus = montant > 0)
    const filteredTxs = recentTransactions.filter(t => 
      mode === 'expenses' ? t.amount < 0 : t.amount > 0
    );

    // Regrouper par catégorie
    const categoryMap = new Map<string, number>();
    let totalAmount = 0;

    for (const tx of filteredTxs) {
      const category = tx.category || 'Non catégorisé';
      // Prendre la valeur absolue pour les dépenses
      const amount = Math.abs(tx.amount); 
      
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + amount);
      totalAmount += amount;
    }

    // Convertir en tableau pour Recharts et assigner les couleurs
    const data: CategoryData[] = Array.from(categoryMap.entries())
      .sort(([, a], [, b]) => b - a) // Trier par montant décroissant
      .map(([name, value], index) => ({
        name,
        value: parseFloat(value.toFixed(2)),
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }));
      
    // Ajouter le pourcentage à chaque élément pour le tooltip
    return data.map(item => ({
      ...item,
      percentage: ((item.value / totalAmount) * 100).toFixed(1) + '%',
      totalAmount
    }));

  }, [transactions, loading, mode]);
  
  const totalDisplay = processedData.length > 0 ? processedData[0].totalAmount : 0;
  const chartTitle = mode === 'expenses' ? 'Répartition des Dépenses' : 'Répartition des Revenus';

  if (loading) {
    return (
      <Card className="h-[400px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }
  
  // Custom Tooltip pour Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2 text-xs bg-white border rounded shadow dark:bg-gray-800 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white" style={{ color: data.color }}>{data.name}</p>
          <p className="text-gray-600 dark:text-gray-400">Montant: {formatCurrency(data.value)}</p>
          <p className="text-gray-600 dark:text-gray-400">Pourcentage: {data.percentage}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="h-[450px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">
          {chartTitle} (30j)
        </CardTitle>
        <div className="flex space-x-2">
            <button
                onClick={() => setMode('expenses')}
                className={`flex items-center gap-1 p-2 rounded-full transition-colors ${mode === 'expenses' ? 'bg-red-500/10 text-red-600 dark:bg-red-400/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Afficher les Dépenses"
            >
                <ArrowDown className="h-4 w-4" />
            </button>
            <button
                onClick={() => setMode('income')}
                className={`flex items-center gap-1 p-2 rounded-full transition-colors ${mode === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Afficher les Revenus"
            >
                <ArrowUp className="h-4 w-4" />
            </button>
        </div>
      </CardHeader>
      <CardContent className="h-[380px] flex flex-col items-center justify-center">
        {processedData.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Aucune donnée de {mode === 'expenses' ? 'dépenses' : 'revenus'} pour les 30 derniers jours.</p>
        ) : (
            <div className="w-full h-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                        <Pie
                            data={processedData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            fill="#8884d8"
                            labelLine={false}
                            label={false}
                        >
                            {processedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        {/* Centre du graphique (Total) */}
                        <text 
                            x="50%" 
                            y="50%" 
                            textAnchor="middle" 
                            dominantBaseline="middle" 
                            className="text-2xl font-bold dark:text-white"
                        >
                            {formatCurrency(totalDisplay)}
                        </text>
                    </PieChart>
                </ResponsiveContainer>
                
                <div className="w-full mt-4 h-[30%] overflow-auto">
                    <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ paddingTop: '10px' }}
                        payload={processedData.map(item => ({
                            value: `${item.name} (${item.percentage})`,
                            type: 'square',
                            color: item.color,
                        }))}
                    />
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};