// 1. Export du composant principal
export { InsightsPanel } from './components/InsightsPanel';

// 2. Export du hook cerveau (au cas où tu en aurais besoin ailleurs)
export { useGlobalIntelligence } from './hooks/use-global-intelligence';

// 3. Types spécifiques au module Insights
export interface GlobalIntelligenceState {
  isSyncing: boolean;
  isEmpty: boolean;
  // Tu peux ajouter ici d'autres types si nécessaire
}
