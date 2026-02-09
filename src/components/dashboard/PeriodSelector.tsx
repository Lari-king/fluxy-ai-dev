import React from 'react';
import { Button } from '@/components/ui/button'; // Importation UI standard

// Définition des types de période supportés
export type TimePeriod = '30d' | '90d' | '12m';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onSelectPeriod: (period: TimePeriod) => void;
  className?: string;
}

/**
 * Composant de sélection de la période d'analyse pour les graphiques.
 */
export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selectedPeriod,
  onSelectPeriod,
  className = '',
}) => {
  const periods: { label: string, value: TimePeriod }[] = [
    { label: '30 Jours', value: '30d' },
    { label: '90 Jours', value: '90d' },
    { label: '12 Mois', value: '12m' },
  ];

  return (
    <div className={`flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 text-sm ${className}`}>
      {periods.map((period) => (
        <Button
          key={period.value}
          onClick={() => onSelectPeriod(period.value)}
          variant="ghost"
          className={`px-3 py-1 rounded-md text-sm transition-colors duration-200
            ${selectedPeriod === period.value
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white font-semibold'
              : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'
            }
          `}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
};