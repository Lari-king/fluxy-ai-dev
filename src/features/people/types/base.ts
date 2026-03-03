// src/features/people/types/base.ts

/**
 * ENUMS DE BASE
 */
export enum PersonType {
    PHYSIQUE = 'PHYSIQUE',
    MORALE = 'MORALE'
  }
  
  export enum ContributionType {
    SURVIE = 'SURVIE',
    SECURITE = 'SECURITE',
    CROISSANCE = 'CROISSANCE',
    CONFORT = 'CONFORT',
    PLAISIR = 'PLAISIR',
    EVITEMENT = 'EVITEMENT',
  }
  
  export enum TargetObjective {
    REDUIRE = 'REDUIRE',
    STABILISER = 'STABILISER',
    ASSUMER = 'ASSUMER',
    TRANSFORMER = 'TRANSFORMER',
    RENFORCER = 'RENFORCER',
  }
  
  /**
   * ENUMS D'INTELLIGENCE & CALCULS
   */
  export enum ProgressionState {
    EN_AVANCE = 'EN_AVANCE',
    NEUTRE = 'NEUTRE',
    EN_RETARD = 'EN_RETARD',
    CRITIQUE = 'CRITIQUE'
  }
  
  export enum DependanceLevel {
    FAIBLE = 'FAIBLE',
    MODEREE = 'MODEREE',
    FORTE = 'FORTE',
    CRITIQUE = 'CRITIQUE'
  }
  
  export enum Trend {
    UP = 'UP',
    DOWN = 'DOWN',
    STABLE = 'STABLE'
  }
  
  export enum ArbitrageSignal {
    REDUIRE = 'REDUIRE',
    SURVEILLER = 'SURVEILLER',
    RENFORCER = 'RENFORCER',
    NEUTRE = 'NEUTRE'
  }
  
  /**
   * INTERFACES
   */
  export interface ArbitrageRule {
    id: string;
    name: string;
    priority: number;
    conditions: {
      field: keyof PersonRelation;
      operator: 'EQUALS' | 'IN' | 'GREATER_THAN' | 'LESS_THAN';
      value: any;
    }[];
    signal: ArbitrageSignal;
    message: string;
    active: boolean;
  }
  
  export interface PersonRelation {
    id: string;
    name: string;
    avatar?: string;
    circle: 'direct' | 'extended' | 'large' | string;
    relationship: string;
    color: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    notes?: string;
    personType: PersonType;
    contributionType?: ContributionType;
    
    // Objectifs
    targetObjective?: TargetObjective;
    targetMonthlyAmount?: number;
    targetDate?: string;
    
    // Champs financiers calculés
    totalImpact?: number;
    income?: number;
    expenses?: number;
    transactionCount?: number;
    averageTransaction?: number;
    lastTransactionDate?: string;
    lastTransactionAmount?: number;
    
    // Intelligence calculée (Moteur de coaching)
    dependanceLevel?: DependanceLevel;
    trend?: Trend;
    progressionPercentage?: number;
    progressionState?: ProgressionState;
    arbitrageSignal?: ArbitrageSignal;
    arbitrageMessage?: string;
  }
  
  /**
   * Optionnel : Interface pour les scores globaux du Dashboard
   */
  export interface PeopleScores {
    liberte: {
      total: number;
      pillars: {
        value: number;
        max: number;
        label: string;
      }[];
    };
    resilience: {
      total: number;
      pillars: {
        value: number;
        max: number;
        label: string;
      }[];
    };
  }