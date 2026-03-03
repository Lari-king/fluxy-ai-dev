export enum PersonType { PHYSIQUE = 'PHYSIQUE', MORALE = 'MORALE' }

export enum ContributionType {
  SURVIE = 'SURVIE', SECURITE = 'SECURITE', CROISSANCE = 'CROISSANCE',
  CONFORT = 'CONFORT', PLAISIR = 'PLAISIR', EVITEMENT = 'EVITEMENT'
}

export enum TargetObjective {
  REDUIRE = 'REDUIRE', STABILISER = 'STABILISER', ASSUMER = 'ASSUMER',
  TRANSFORMER = 'TRANSFORMER', RENFORCER = 'RENFORCER'
}

export enum ProgressionState {
  EN_AVANCE = 'EN_AVANCE', NEUTRE = 'NEUTRE', EN_RETARD = 'EN_RETARD', CRITIQUE = 'CRITIQUE'
}

export interface PersonRelation {
  id: string;
  name: string;
  avatar?: string;
  circle: string;
  relationship: string;
  color: string;
  personType: PersonType;
  contributionType?: ContributionType;
  targetObjective?: TargetObjective;
  targetMonthlyAmount?: number;
  // Champs calculés par l'engine
  totalImpact?: number;
  income?: number;
  expenses?: number;
  transactionCount?: number;
  dependanceLevel?: string;
  progressionPercentage?: number;
  progressionState?: ProgressionState;
  arbitrageSignal?: string;
  arbitrageMessage?: string;
}

export interface PeopleScores {
  liberte: { total: number; pillars: any[] };
  resilience: { total: number; pillars: any[] };
}