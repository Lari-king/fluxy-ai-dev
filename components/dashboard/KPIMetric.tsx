import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'; // Assumer que ces composants shadcn/ui sont disponibles

interface KPIMetricProps {
  title: string;
  value: string;
  changeValue?: string;
  isPositive?: boolean; // Pour indiquer si la valeur est "bonne" (vert) ou "mauvaise" (rouge)
  isLoading?: boolean;
  icon: React.ElementType; // L'icône de lucide-react à utiliser
}

/**
 * Affiche une carte de métrique clé (KPI) avec un titre, une valeur et une tendance optionnelle.
 */
export const KPIMetric: React.FC<KPIMetricProps> = ({
  title,
  value,
  changeValue,
  isPositive = true,
  isLoading = false,
  icon: Icon,
}) => {
  const colorClass = isPositive ? 'text-emerald-500' : 'text-red-500';

  if (isLoading) {
    return (
      <Card className="h-full animate-pulse">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-10 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold dark:text-white truncate">
          {value}
        </div>
        {changeValue && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${colorClass}`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {changeValue}
            <span className="text-gray-500 dark:text-gray-400 ml-1">vs mois dernier</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};