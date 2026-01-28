/**
 * 🧬 TYPES & ENUMS - SYSTÈME RELATIONNEL FINANCIER
 * 
 * Fondations typologiques pour transformer l'écran People en
 * véritable "OS de lucidité financière"
 * 
 * Philosophie :
 * - Données brutes ≠ données calculées
 * - Une personne = une relation orientée vers un but
 * - Pas de jugement, uniquement des structures
 */

// ========================================
// 1️⃣ DIMENSIONS FONDAMENTALES
// ========================================

/**
 * Type de contribution d'une relation dans votre vie
 * 
 * SURVIE : Besoins vitaux, incompressibles
 * SECURITE : Stabilité, protection, prévoyance
 * CROISSANCE : Développement, investissement futur
 * CONFORT : Amélioration du quotidien sans être vital
 * PLAISIR : Bien-être immédiat, gratification
 * EVITEMENT : Dépense pour éviter une contrainte
 */
export enum ContributionType {
  SURVIE = 'SURVIE',
  SECURITE = 'SECURITE',
  CROISSANCE = 'CROISSANCE',
  CONFORT = 'CONFORT',
  PLAISIR = 'PLAISIR',
  EVITEMENT = 'EVITEMENT',
}

/**
 * Temporalité du bénéfice de la relation
 * 
 * Permet de détecter les tensions entre court et long terme
 */
export enum TimeBenefit {
  /** Bénéfice uniquement à court terme */
  COURT_TERME = 'COURT_TERME',
  
  /** Bénéfice uniquement à long terme */
  LONG_TERME = 'LONG_TERME',
  
  /** Bénéfice court terme MAIS pénalisant long terme (ex: abonnement superflu) */
  COURT_POSITIF_LONG_NEGATIF = 'COURT_POSITIF_LONG_NEGATIF',
  
  /** Coût court terme MAIS bénéfique long terme (ex: formation) */
  COURT_NEGATIF_LONG_POSITIF = 'COURT_NEGATIF_LONG_POSITIF',
}

/**
 * Objectif intentionnel pour cette relation
 * 
 * Ce n'est PAS un budget, c'est une intention relationnelle
 */
export enum TargetObjective {
  /** Diminuer l'impact financier de cette relation */
  REDUIRE = 'REDUIRE',
  
  /** Maintenir l'état actuel */
  STABILISER = 'STABILISER',
  
  /** Accepter consciemment sans chercher à modifier */
  ASSUMER = 'ASSUMER',
  
  /** Transformer la nature de la relation */
  TRANSFORMER = 'TRANSFORMER',
  
  /** Augmenter l'investissement dans cette relation */
  RENFORCER = 'RENFORCER',
}

// ========================================
// 2️⃣ INDICATEURS DÉRIVÉS (CALCULÉS)
// ========================================

/**
 * Niveau de dépendance financière
 * 
 * Calculé automatiquement :
 * - FAIBLE : < 5% du revenu mensuel
 * - MODEREE : 5-15% du revenu
 * - FORTE : > 15% du revenu
 */
export enum DependanceLevel {
  FAIBLE = 'FAIBLE',
  MODEREE = 'MODEREE',
  FORTE = 'FORTE',
}

/**
 * Tendance d'évolution de la relation (3 derniers mois vs 3 précédents)
 */
export enum Trend {
  AMELIORATION = 'AMELIORATION',
  STABLE = 'STABLE',
  AGGRAVATION = 'AGGRAVATION',
}

/**
 * État de progression vers l'objectif défini
 */
export enum ProgressionState {
  EN_AVANCE = 'EN_AVANCE',
  NEUTRE = 'NEUTRE',
  EN_RETARD = 'EN_RETARD',
  AUCUN_PROGRES = 'AUCUN_PROGRES',
}

/**
 * Signal d'arbitrage automatique (DSL)
 * 
 * Ce n'est PAS une décision, juste un signal
 */
export enum ArbitrageSignal {
  REDUIRE = 'REDUIRE',
  SURVEILLER = 'SURVEILLER',
  ASSUMER = 'ASSUMER',
  RENFORCER = 'RENFORCER',
  PROTEGER = 'PROTEGER',
}

// ========================================
// 3️⃣ INTERFACE PERSONNE ENRICHIE
// ========================================

/**
 * Type de personne (influence les règles d'arbitrage)
 */
export enum PersonType {
  PHYSIQUE = 'PHYSIQUE', // Personne réelle (famille, amis)
  MORALE = 'MORALE',     // Entreprise, organisation, service
}

/**
 * Extension de Person avec les nouvelles dimensions
 * 
 * ⚠️ Règle importante :
 * - Les champs `contribution*`, `target*`, `personType` sont DECLARATIFS (saisis par l'utilisateur)
 * - Les champs `dependance*`, `trend`, `progression*`, `arbitrage*` sont CALCULES
 */
export interface PersonRelation {
  // === DONNÉES DE BASE (existantes) ===
  id: string;
  name: string;
  avatar?: string;
  circle: string; // Peut être n'importe quelle chaîne (cercles personnalisés)
  relationship: string;
  color: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
  
  // === TYPE DE PERSONNE ===
  personType: PersonType;
  
  // === DIMENSIONS DÉCLARATIVES (saisies par l'utilisateur) ===
  contributionType?: ContributionType;
  timeBenefit?: TimeBenefit;
  targetObjective?: TargetObjective;
  targetMonthlyAmount?: number; // Montant cible mensuel (peut être négatif pour dépense)
  targetDate?: string; // Date horizon au format ISO
  
  // === STATISTIQUES CALCULÉES (NE PAS SAUVEGARDER EN BASE) ===
  // Ces champs sont calculés dynamiquement par people-calculator
  totalImpact: number;
  income: number;
  expenses: number;
  transactionCount?: number;
  averageTransaction?: number;
  lastTransactionDate?: string;
  lastTransactionAmount?: number;
  
  // === INDICATEURS DÉRIVÉS (CALCULÉS) ===
  dependanceLevel?: DependanceLevel;
  dependanceRatio?: number; // Pourcentage du revenu mensuel
  trend?: Trend;
  progressionState?: ProgressionState;
  progressionPercentage?: number; // Pourcentage de progression vers l'objectif
  
  // === SIGNAUX D'ARBITRAGE (CALCULÉS PAR DSL) ===
  arbitrageSignal?: ArbitrageSignal;
  arbitrageMessage?: string;
}

// ========================================
// 4️⃣ SCORES GLOBAUX
// ========================================

/**
 * Score de liberté financière (0-100)
 * 
 * Mesure la capacité à absorber un choc sans dégrader sa trajectoire
 * 
 * Composé de 3 piliers :
 * - Taux de charges rigides (40 pts)
 * - Dépendances pénalisantes (30 pts)
 * - Effort de transformation (30 pts)
 */
export interface LibertéFinanciereScore {
  total: number; // 0-100
  pilier1_chargesRigides: number; // 0-40
  pilier2_dependancesPenalisantes: number; // 0-30
  pilier3_effortTransformation: number; // 0-30
  
  // Détails pour chaque pilier
  details: {
    chargesRigidesRatio: number; // % du revenu en charges rigides
    dependancesPenalisantesRatio: number; // % du revenu en dépendances pénalisantes
    effortRatio: number; // % de relations en amélioration
  };
}

/**
 * Score de résilience humaine (0-100)
 * 
 * Mesure la capacité à piloter consciemment ses relations financières
 * INDÉPENDANT des montants d'argent
 * 
 * Composé de 3 piliers :
 * - Clarté des relations (30 pts)
 * - Intentionnalité (30 pts)
 * - Mouvement (40 pts)
 */
export interface ResilienceHumaineScore {
  total: number; // 0-100
  pilier1_clarte: number; // 0-30
  pilier2_intentionnalite: number; // 0-30
  pilier3_mouvement: number; // 0-40
  
  // Détails pour chaque pilier
  details: {
    clarteRatio: number; // % de relations avec contribution définie
    intentionnaliteRatio: number; // % de relations avec objectif
    mouvementRatio: number; // % de relations en amélioration
  };
}

/**
 * Scores globaux de l'écran People
 */
export interface PeopleScores {
  liberte: LibertéFinanciereScore;
  resilience: ResilienceHumaineScore;
}

// ========================================
// 5️⃣ DSL - RÈGLES D'ARBITRAGE
// ========================================

/**
 * Condition d'une règle DSL
 */
export interface RuleCondition {
  field: 'dependanceLevel' | 'trend' | 'timeBenefit' | 'contributionType' | 'progressionState' | 'personType';
  operator: 'IN' | 'EQUALS' | 'GT' | 'LT';
  value: string | string[];
}

/**
 * Règle d'arbitrage DSL
 * 
 * Format : WHEN <conditions> THEN SIGNAL <signal> MESSAGE "<message>"
 */
export interface ArbitrageRule {
  id: string;
  name: string;
  priority: number; // 1 = haute priorité
  conditions: RuleCondition[];
  signal: ArbitrageSignal;
  message: string;
  active: boolean;
}

// ========================================
// 6️⃣ MODE SCÉNARIOS
// ========================================

/**
 * Type de variable modifiable dans un scénario
 */
export enum ScenarioVariableType {
  REVENU_MENSUEL = 'REVENU_MENSUEL',
  MONTANT_RELATION = 'MONTANT_RELATION',
  DATE_OBJECTIF = 'DATE_OBJECTIF',
  STATUT_RELATION = 'STATUT_RELATION',
}

/**
 * Modification à appliquer dans un scénario
 */
export interface ScenarioChange {
  type: ScenarioVariableType;
  personId?: string; // Si modification d'une relation spécifique
  newValue: number | string | boolean;
}

/**
 * Résultat d'un scénario simulé
 */
export interface ScenarioResult {
  changes: ScenarioChange[];
  
  // Scores avant/après
  scoreBefore: PeopleScores;
  scoreAfter: PeopleScores;
  
  // Relations affectées
  relationsAffected: {
    personId: string;
    personName: string;
    changeDescription: string;
    dependanceBefore: DependanceLevel;
    dependanceAfter: DependanceLevel;
  }[];
  
  // Nouvelles règles déclenchées
  newArbitrageSignals: {
    personId: string;
    personName: string;
    signal: ArbitrageSignal;
    message: string;
  }[];
}

// ========================================
// 7️⃣ EXPORT STRUCTURÉ (COACHING)
// ========================================

/**
 * Structure d'export pour usage coaching/thérapeutique
 */
export interface PeopleExport {
  exportDate: string;
  
  // Carte relationnelle
  carteRelationnelle: {
    totalRelations: number;
    repartitionContribution: Record<ContributionType, number>;
    ratioPhysiquesMorales: { physiques: number; morales: number };
  };
  
  // Tensions structurantes
  tensionsStructurantes: {
    relationsEnAggravation: { personId: string; name: string }[];
    relationsBeneficeCourtTerme: { personId: string; name: string }[];
    zonesDependance: { personId: string; name: string; niveau: DependanceLevel }[];
  };
  
  // Intentions & trajectoires
  intentionsTrajectoires: {
    objectifsDefinis: number;
    relationsEnAmelioration: number;
    effortsConscients: { personId: string; name: string; progression: number }[];
  };
  
  // Scores
  scores: PeopleScores;
  
  // Questions ouvertes (pour coaching)
  questionsOuvertes: string[];
}

// ========================================
// 8️⃣ HELPERS & UTILITAIRES
// ========================================

/**
 * Configuration des cercles par défaut
 */
export interface CircleConfig {
  name: string;
  color: string;
  description?: string;
}

/**
 * Mapping des cercles par défaut
 */
export const DEFAULT_CIRCLES: Record<string, CircleConfig> = {
  direct: {
    name: 'Famille directe',
    color: 'from-pink-500 to-rose-500',
    description: 'Conjoint, enfants, parents',
  },
  extended: {
    name: 'Famille élargie',
    color: 'from-blue-500 to-cyan-500',
    description: 'Frères, sœurs, grands-parents',
  },
  large: {
    name: 'Grande famille',
    color: 'from-purple-500 to-indigo-500',
    description: 'Cousins, oncles, tantes',
  },
  friends: {
    name: 'Amis proches',
    color: 'from-yellow-500 to-orange-500',
    description: 'Relations amicales privilégiées',
  },
  business: {
    name: 'Affaires / Business',
    color: 'from-green-500 to-teal-500',
    description: 'Partenaires, fournisseurs',
  },
  community: {
    name: 'Communauté',
    color: 'from-indigo-500 to-blue-500',
    description: 'Associations, groupes',
  },
};

/**
 * Labels lisibles pour les enums
 */
export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string> = {
  [ContributionType.SURVIE]: 'Survie',
  [ContributionType.SECURITE]: 'Sécurité',
  [ContributionType.CROISSANCE]: 'Croissance',
  [ContributionType.CONFORT]: 'Confort',
  [ContributionType.PLAISIR]: 'Plaisir',
  [ContributionType.EVITEMENT]: 'Évitement',
};

export const TIME_BENEFIT_LABELS: Record<TimeBenefit, string> = {
  [TimeBenefit.COURT_TERME]: 'Court terme',
  [TimeBenefit.LONG_TERME]: 'Long terme',
  [TimeBenefit.COURT_POSITIF_LONG_NEGATIF]: 'Court terme + / Long terme −',
  [TimeBenefit.COURT_NEGATIF_LONG_POSITIF]: 'Court terme − / Long terme +',
};

export const TARGET_OBJECTIVE_LABELS: Record<TargetObjective, string> = {
  [TargetObjective.REDUIRE]: 'Réduire',
  [TargetObjective.STABILISER]: 'Stabiliser',
  [TargetObjective.ASSUMER]: 'Assumer',
  [TargetObjective.TRANSFORMER]: 'Transformer',
  [TargetObjective.RENFORCER]: 'Renforcer',
};

export const DEPENDANCE_LEVEL_LABELS: Record<DependanceLevel, string> = {
  [DependanceLevel.FAIBLE]: 'Faible',
  [DependanceLevel.MODEREE]: 'Modérée',
  [DependanceLevel.FORTE]: 'Forte',
};

export const TREND_LABELS: Record<Trend, string> = {
  [Trend.AMELIORATION]: 'En amélioration',
  [Trend.STABLE]: 'Stable',
  [Trend.AGGRAVATION]: 'En aggravation',
};

export const PROGRESSION_STATE_LABELS: Record<ProgressionState, string> = {
  [ProgressionState.EN_AVANCE]: 'En avance',
  [ProgressionState.NEUTRE]: 'Neutre',
  [ProgressionState.EN_RETARD]: 'En retard',
  [ProgressionState.AUCUN_PROGRES]: 'Aucun progrès',
};
