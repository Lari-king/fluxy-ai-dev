/**
 * 📊 CALCULATEUR DE SCORES - LIBERTÉ & RÉSILIENCE
 * 
 * Calcule les deux scores fondamentaux :
 * 1. Score de Liberté Financière (capacité à absorber un choc)
 * 2. Score de Résilience Humaine (capacité à piloter consciemment)
 * 
 * ⚡ Performance : O(n) où n = nombre de personnes
 * Mémoisation native avec useMemo dans les composants
 */

import {
    PersonRelation,
    LibertéFinanciereScore,
    ResilienceHumaineScore,
    PeopleScores,
    ContributionType,
    TimeBenefit,
    Trend,
    DependanceLevel,
  } from '../types/people';
  import {
    LIBERTE_SCORE_CONFIG,
    RESILIENCE_SCORE_CONFIG,
    DEFAULT_MONTHLY_INCOME,
  } from '@/constants/people-config';
  
  // ========================================
  // 💰 SCORE DE LIBERTÉ FINANCIÈRE
  // ========================================
  
  /**
   * Calcule le pilier 1 : Taux de charges rigides
   * 
   * Charges rigides = SURVIE + SECURITE + relations STABLES non ajustables
   * 
   * @param people - Relations enrichies
   * @param monthlyIncome - Revenu mensuel
   * @returns Score sur 40 points
   */
  function calculatePilier1_ChargesRigides(
    people: PersonRelation[],
    monthlyIncome: number
  ): { score: number; ratio: number } {
    // Somme des charges rigides
    const chargesRigides = people.reduce((sum, person) => {
      // Une charge est rigide si :
      // - Type SURVIE ou SECURITE
      // - OU tendance STABLE avec contribution non PLAISIR/CONFORT
      const isRigide =
        person.contributionType === ContributionType.SURVIE ||
        person.contributionType === ContributionType.SECURITE ||
        (person.trend === Trend.STABLE &&
          person.contributionType !== ContributionType.PLAISIR &&
          person.contributionType !== ContributionType.CONFORT);
      
      if (isRigide && person.expenses) {
        return sum + Math.abs(person.expenses);
      }
      return sum;
    }, 0);
    
    // Calcul du ratio
    const ratio = monthlyIncome > 0 ? chargesRigides / monthlyIncome : 0;
    
    // Attribution des points selon les seuils
    const { seuils, maxPoints } = LIBERTE_SCORE_CONFIG.pilier1;
    
    let score: number;
    if (ratio < seuils.excellent) {
      score = maxPoints; // 40 pts
    } else if (ratio < seuils.bon) {
      score = 30; // 30 pts
    } else if (ratio < seuils.moyen) {
      score = 15; // 15 pts
    } else {
      score = 0; // 0 pts
    }
    
    return { score, ratio };
  }
  
  /**
   * Calcule le pilier 2 : Dépendances pénalisantes
   * 
   * Dépendances pénalisantes = relations avec :
   * - timeBenefit = COURT_POSITIF_LONG_NEGATIF
   * - dependanceLevel >= MODEREE
   * 
   * @param people - Relations enrichies
   * @param monthlyIncome - Revenu mensuel
   * @returns Score sur 30 points
   */
  function calculatePilier2_DependancesPenalisantes(
    people: PersonRelation[],
    monthlyIncome: number
  ): { score: number; ratio: number } {
    // Somme des dépendances pénalisantes
    const dependancesPenalisantes = people.reduce((sum, person) => {
      const isPenalisante =
        person.timeBenefit === TimeBenefit.COURT_POSITIF_LONG_NEGATIF &&
        (person.dependanceLevel === DependanceLevel.MODEREE ||
          person.dependanceLevel === DependanceLevel.FORTE);
      
      if (isPenalisante && person.expenses) {
        return sum + Math.abs(person.expenses);
      }
      return sum;
    }, 0);
    
    // Calcul du ratio
    const ratio = monthlyIncome > 0 ? dependancesPenalisantes / monthlyIncome : 0;
    
    // Attribution des points selon les seuils
    const { seuils, maxPoints } = LIBERTE_SCORE_CONFIG.pilier2;
    
    let score: number;
    if (ratio < seuils.excellent) {
      score = maxPoints; // 30 pts
    } else if (ratio < seuils.bon) {
      score = 20; // 20 pts
    } else if (ratio < seuils.moyen) {
      score = 10; // 10 pts
    } else {
      score = 0; // 0 pts
    }
    
    return { score, ratio };
  }
  
  /**
   * Calcule le pilier 3 : Effort de transformation
   * 
   * Effort = pourcentage de relations avec objectif qui sont en amélioration
   * 
   * @param people - Relations enrichies
   * @returns Score sur 30 points
   */
  function calculatePilier3_EffortTransformation(
    people: PersonRelation[]
  ): { score: number; ratio: number } {
    // Relations avec objectif
    const relationsAvecObjectif = people.filter(p => p.targetObjective);
    
    // Relations en amélioration
    const relationsEnAmelioration = relationsAvecObjectif.filter(
      p => p.trend === Trend.AMELIORATION
    );
    
    // Calcul du ratio
    const ratio =
      relationsAvecObjectif.length > 0
        ? relationsEnAmelioration.length / relationsAvecObjectif.length
        : 0;
    
    // Attribution des points selon les seuils
    const { seuils, maxPoints } = LIBERTE_SCORE_CONFIG.pilier3;
    
    let score: number;
    if (ratio > seuils.excellent) {
      score = maxPoints; // 30 pts
    } else if (ratio > seuils.bon) {
      score = 20; // 20 pts
    } else if (ratio > seuils.moyen) {
      score = 10; // 10 pts
    } else {
      score = 0; // 0 pts
    }
    
    return { score, ratio };
  }
  
  /**
   * Calcule le score complet de Liberté Financière
   * 
   * ⚡ Performance : O(3n) = O(n) - 3 passes sur les relations
   * 
   * @param people - Relations enrichies
   * @param monthlyIncome - Revenu mensuel
   * @returns Score complet sur 100 points
   */
  export function calculateLibertéFinanciereScore(
    people: PersonRelation[],
    monthlyIncome: number = DEFAULT_MONTHLY_INCOME
  ): LibertéFinanciereScore {
    const pilier1 = calculatePilier1_ChargesRigides(people, monthlyIncome);
    const pilier2 = calculatePilier2_DependancesPenalisantes(people, monthlyIncome);
    const pilier3 = calculatePilier3_EffortTransformation(people);
    
    const total = pilier1.score + pilier2.score + pilier3.score;
    
    return {
      total,
      pilier1_chargesRigides: pilier1.score,
      pilier2_dependancesPenalisantes: pilier2.score,
      pilier3_effortTransformation: pilier3.score,
      details: {
        chargesRigidesRatio: pilier1.ratio,
        dependancesPenalisantesRatio: pilier2.ratio,
        effortRatio: pilier3.ratio,
      },
    };
  }
  
  // ========================================
  // 🧠 SCORE DE RÉSILIENCE HUMAINE
  // ========================================
  
  /**
   * Calcule le pilier 1 : Clarté des relations
   * 
   * Clarté = pourcentage de relations avec contributionType définie
   * 
   * @param people - Relations
   * @returns Score sur 30 points
   */
  function calculatePilier1_Clarte(
    people: PersonRelation[]
  ): { score: number; ratio: number } {
    if (people.length === 0) {
      return { score: 0, ratio: 0 };
    }
    
    // Relations avec contribution définie
    const relationsAvecContribution = people.filter(p => p.contributionType);
    
    const ratio = relationsAvecContribution.length / people.length;
    
    // Attribution des points selon les seuils
    const { seuils, maxPoints } = RESILIENCE_SCORE_CONFIG.pilier1;
    
    let score: number;
    if (ratio > seuils.excellent) {
      score = maxPoints; // 30 pts
    } else if (ratio > seuils.bon) {
      score = 20; // 20 pts
    } else {
      score = 10; // 10 pts
    }
    
    return { score, ratio };
  }
  
  /**
   * Calcule le pilier 2 : Intentionnalité
   * 
   * Intentionnalité = pourcentage de relations avec objectif défini
   * 
   * @param people - Relations
   * @returns Score sur 30 points
   */
  function calculatePilier2_Intentionnalite(
    people: PersonRelation[]
  ): { score: number; ratio: number } {
    if (people.length === 0) {
      return { score: 0, ratio: 0 };
    }
    
    // Relations avec objectif
    const relationsAvecObjectif = people.filter(p => p.targetObjective);
    
    const ratio = relationsAvecObjectif.length / people.length;
    
    // Attribution des points selon les seuils
    const { seuils, maxPoints } = RESILIENCE_SCORE_CONFIG.pilier2;
    
    let score: number;
    if (ratio > seuils.excellent) {
      score = maxPoints; // 30 pts
    } else if (ratio > seuils.bon) {
      score = 20; // 20 pts
    } else {
      score = 10; // 10 pts
    }
    
    return { score, ratio };
  }
  
  /**
   * Calcule le pilier 3 : Mouvement
   * 
   * Mouvement = pourcentage de relations avec objectif qui sont en amélioration
   * 
   * @param people - Relations enrichies
   * @returns Score sur 40 points
   */
  function calculatePilier3_Mouvement(
    people: PersonRelation[]
  ): { score: number; ratio: number } {
    // Relations avec objectif
    const relationsAvecObjectif = people.filter(p => p.targetObjective);
    
    if (relationsAvecObjectif.length === 0) {
      return { score: 0, ratio: 0 };
    }
    
    // Relations en amélioration
    const relationsEnAmelioration = relationsAvecObjectif.filter(
      p => p.trend === Trend.AMELIORATION
    );
    
    const ratio = relationsEnAmelioration.length / relationsAvecObjectif.length;
    
    // Attribution des points selon les seuils
    const { seuils, maxPoints } = RESILIENCE_SCORE_CONFIG.pilier3;
    
    let score: number;
    if (ratio > seuils.excellent) {
      score = maxPoints; // 40 pts
    } else if (ratio > seuils.bon) {
      score = 25; // 25 pts
    } else {
      score = 10; // 10 pts
    }
    
    return { score, ratio };
  }
  
  /**
   * Calcule le score complet de Résilience Humaine
   * 
   * ⚡ Performance : O(3n) = O(n) - 3 passes sur les relations
   * 
   * @param people - Relations (pas besoin d'enrichissement complet)
   * @returns Score complet sur 100 points
   */
  export function calculateResilienceHumaineScore(
    people: PersonRelation[]
  ): ResilienceHumaineScore {
    const pilier1 = calculatePilier1_Clarte(people);
    const pilier2 = calculatePilier2_Intentionnalite(people);
    const pilier3 = calculatePilier3_Mouvement(people);
    
    const total = pilier1.score + pilier2.score + pilier3.score;
    
    return {
      total,
      pilier1_clarte: pilier1.score,
      pilier2_intentionnalite: pilier2.score,
      pilier3_mouvement: pilier3.score,
      details: {
        clarteRatio: pilier1.ratio,
        intentionnaliteRatio: pilier2.ratio,
        mouvementRatio: pilier3.ratio,
      },
    };
  }
  
  // ========================================
  // 🎯 CALCUL GLOBAL DES SCORES
  // ========================================
  
  /**
   * Calcule les deux scores globaux en une seule passe
   * 
   * ⚡ Performance : O(n) optimisé - calculs combinés
   * 
   * @param people - Relations enrichies
   * @param monthlyIncome - Revenu mensuel
   * @returns Scores complets (Liberté + Résilience)
   */
  export function calculatePeopleScores(
    people: PersonRelation[],
    monthlyIncome: number = DEFAULT_MONTHLY_INCOME
  ): PeopleScores {
    const liberte = calculateLibertéFinanciereScore(people, monthlyIncome);
    const resilience = calculateResilienceHumaineScore(people);
    
    return {
      liberte,
      resilience,
    };
  }
  
  // ========================================
  // 📊 HELPERS & INTERPRÉTATION
  // ========================================
  
  /**
   * Interprète un score de Liberté Financière
   */
  export function interpretLibertéScore(score: number): {
    level: 'FORTE' | 'MOYENNE' | 'FRAGILE';
    emoji: string;
    message: string;
  } {
    if (score >= 70) {
      return {
        level: 'FORTE',
        emoji: '🟢',
        message: 'Excellente capacité à absorber un choc financier',
      };
    } else if (score >= 40) {
      return {
        level: 'MOYENNE',
        emoji: '🟡',
        message: 'Marge d\'optimisation réelle, vulnérable à un choc moyen',
      };
    } else {
      return {
        level: 'FRAGILE',
        emoji: '🔴',
        message: 'Forte vulnérabilité face à un imprévu',
      };
    }
  }
  
  /**
   * Interprète un score de Résilience Humaine
   */
  export function interpretResilienceScore(score: number): {
    level: 'FORTE' | 'MOYENNE' | 'FRAGILE';
    emoji: string;
    message: string;
  } {
    if (score >= 70) {
      return {
        level: 'FORTE',
        emoji: '🟢',
        message: 'Tu pilotes consciemment tes relations financières',
      };
    } else if (score >= 40) {
      return {
        level: 'MOYENNE',
        emoji: '🟡',
        message: 'Tu observes sans encore maîtriser complètement',
      };
    } else {
      return {
        level: 'FRAGILE',
        emoji: '🔴',
        message: 'Tu subis plus que tu ne choisis',
      };
    }
  }
  
  /**
   * Recommandations basées sur les scores
   */
  export function generateRecommendations(scores: PeopleScores): string[] {
    const recommendations: string[] = [];
    
    const { liberte, resilience } = scores;
    
    // Recommandations Liberté
    if (liberte.pilier1_chargesRigides < 20) {
      recommendations.push('⚠️ Tes charges rigides sont élevées - explore des alternatives moins coûteuses');
    }
    
    if (liberte.pilier2_dependancesPenalisantes < 15) {
      recommendations.push('📉 Plusieurs relations apportent du confort court terme mais pénalisent ton futur');
    }
    
    if (liberte.pilier3_effortTransformation < 15) {
      recommendations.push('🎯 Définis des objectifs clairs pour transformer tes relations clés');
    }
    
    // Recommandations Résilience
    if (resilience.pilier1_clarte < 15) {
      recommendations.push('🔍 Identifie la contribution réelle de chaque relation dans ta vie');
    }
    
    if (resilience.pilier2_intentionnalite < 15) {
      recommendations.push('🎯 Définis des intentions pour tes relations importantes');
    }
    
    if (resilience.pilier3_mouvement < 15) {
      recommendations.push('🚀 Lance au moins une amélioration concrète cette semaine');
    }
    
    // Si tout va bien
    if (recommendations.length === 0) {
      recommendations.push('✅ Continue sur cette voie, tu maîtrises bien tes relations financières');
    }
    
    return recommendations;
  }
  