// src/features/people/constants/config.ts
import { 
    ContributionType, 
    TargetObjective, 
    PersonType,
    DependanceLevel,
    ArbitrageSignal,
    ArbitrageRule 
  } from '../types/base';
  
  // --- LABELS (Utiles pour l'UI) ---
  export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string> = {
    [ContributionType.SURVIE]: 'Survie',
    [ContributionType.SECURITE]: 'Sécurité',
    [ContributionType.CROISSANCE]: 'Croissance',
    [ContributionType.CONFORT]: 'Confort',
    [ContributionType.PLAISIR]: 'Plaisir',
    [ContributionType.EVITEMENT]: 'Évitement',
  };
  
  export const TARGET_OBJECTIVE_LABELS: Record<TargetObjective, string> = {
    [TargetObjective.REDUIRE]: 'Réduire',
    [TargetObjective.STABILISER]: 'Stabiliser',
    [TargetObjective.ASSUMER]: 'Assumer',
    [TargetObjective.TRANSFORMER]: 'Transformer',
    [TargetObjective.RENFORCER]: 'Renforcer',
  };
  
  // --- CONFIGURATION DU SCORE & CALCULS ---
  export const DEFAULT_MONTHLY_INCOME = 2800;
  
  export const DEPENDANCE_THRESHOLDS = {
    FAIBLE: 0.05,
    MODEREE: 0.15,
  } as const;
  
  export const LIBERTE_SCORE_CONFIG = {
    pilier1: { maxPoints: 40, seuils: { excellent: 0.30, bon: 0.50, moyen: 0.70 } },
    pilier2: { maxPoints: 30, seuils: { excellent: 0.05, bon: 0.15, moyen: 0.30 } },
    pilier3: { maxPoints: 30, seuils: { excellent: 0.70, bon: 0.40, moyen: 0.10 } },
  };
  
  // --- RÈGLES D'ARBITRAGE ---
  export const DEFAULT_ARBITRAGE_RULES: ArbitrageRule[] = [
    {
      id: 'R01',
      name: 'Arbitrage confort/long terme',
      priority: 1,
      conditions: [
        { field: 'dependanceLevel', operator: 'IN', value: [DependanceLevel.MODEREE, DependanceLevel.FORTE] },
        { field: 'personType', operator: 'EQUALS', value: PersonType.MORALE },
      ],
      signal: ArbitrageSignal.REDUIRE,
      message: 'Relation confortable mais pénalisante à long terme',
      active: true,
    }
  ];
  
  // --- QUESTIONS COACHING ---
  export const COACHING_QUESTIONS = [
    "Quelle relation te coûte le plus mentalement, au-delà de l'argent ?",
    "Laquelle soutient ton futur sans reconnaissance immédiate ?",
    "Que se passerait-il si tu ne changeais rien pendant 3 ans ?",
    "Quelle relation aimerais-tu transformer en priorité ?",
    "Y a-t-il une dépense que tu fais par habitude plutôt que par choix ?"
  ];