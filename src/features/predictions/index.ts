// 1. Types
export type { 
  MonthEndProjection, 
  RecurringPrediction,
  DailyGoal 
} from './services/projection';

export type {
  BehavioralAxis,
  BehavioralProfile,
  BehavioralAnomaly
} from './logic/BehavioralAnalyzer';

// 2. Services & Moteurs
export { predictionService } from './services/predictionService';
export { 
  calculateMonthEndProjection, 
  calculateDailyGoal,
  getBehavior 
} from './services/projection';

export {
  getCategoryBehavioralProfile,
  analyzeBehavior,
  calculateBudgetResilience
} from './logic/BehavioralAnalyzer';

// 3. Components
export { ProjectionCard } from './components/ProjectionCard';
export { ProjectionDetailsModal } from './components/ProjectionDetailsModal';

// 4. Hook Principal
export { usePredictions } from './hooks/use-predictions';
