import { AnimatePresence } from 'framer-motion';

// 1. Import du cerveau (Logique) via alias absolu
import { useUltraIntelligence } from '@/features/ultra-intelligence/hooks/useUltraIntelligence';

// 2. Import des différents états (Corps/Vues) via alias absolus
import { UltraInsightsView } from '@/features/ultra-intelligence/components/views/UltraInsightsView';
import { UltraInsightsActivation } from '@/features/ultra-intelligence/components/states/UltraInsightsActivation';
import { EmptyStateUltraInsights } from '@/features/ultra-intelligence/components/states/EmptyStateUltraInsights';

interface UltraInsightsProps {
  onBack: () => void;
}

/**
 * COMPOSANT RACINE DU MODULE
 * Rôle : Chef d'orchestre des états d'affichage.
 */
export function UltraInsights({ onBack }: UltraInsightsProps) {
  const { 
    isActivated, 
    setIsActivated, 
    stats 
  } = useUltraIntelligence();

  // ÉCRAN 1 : Si l'utilisateur n'a pas encore activé l'IA
  if (!isActivated) {
    return (
      <AnimatePresence mode="wait">
        <UltraInsightsActivation 
          onActivate={() => setIsActivated(true)} 
          onCancel={onBack} 
        />
      </AnimatePresence>
    );
  }

  // ÉCRAN 2 : Si l'IA est activée mais qu'il n'y a pas assez de données pour travailler
  if (!stats.hasEnoughData) {
    return (
      <EmptyStateUltraInsights 
        transactionCount={stats.transactionCount} 
        monthsCovered={stats.monthsCovered}
        onImportClick={onBack}
      />
    );
  }

  // ÉCRAN 3 : La vue complète
  return <UltraInsightsView onBack={onBack} />;
}