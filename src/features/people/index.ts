// 1. Types & Constantes
export * from './types/base';
// export * from './types/scores'; // SUPPRIMÉ : Inclus dans base.ts
export * from './constants/config';

// 2. Logique & Hooks
// Note : Vérifie que ces fichiers existent bien dans ces dossiers
export { usePeopleEngine } from './hooks/use-people-engine';
export { migratePerson, sanitizeForSave } from './engine/migration';

// 3. Composants
export { PersonCard } from './components/cards/PersonCard';
// export { ScoreCard } from './components/cards/ScoreCard'; // SUPPRIMÉ : Tu ne l'utilises plus
export { PersonForm } from './components/forms/PersonForm';
export { RelationsDashboard } from './components/dashboard/RelationsDashboard';
export { RelationTopology } from './components/dashboard/RelationTopology';
export { RelationDetail } from './components/detail/RelationDetail';