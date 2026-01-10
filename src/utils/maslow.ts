/**
 * 🧠 MASLOW ANALYSIS UTILITIES
 * 
 * Analyse financière basée sur la pyramide de Maslow
 * Permet de comprendre l'équilibre de vie à travers les dépenses
 */

export type MaslowLevel = 'SURVIE' | 'SÉCURITÉ' | 'APPARTENANCE' | 'ESTIME' | 'ACCOMPLISSEMENT';

export interface MaslowCategory {
  level: MaslowLevel;
  order: number;
  color: string;
  gradient: string;
  icon: string;
  description: string;
}

export interface MaslowAnalysis {
  level: MaslowLevel;
  amount: number;
  percentage: number;
  transactionCount: number;
  categories: string[];
  status: 'danger' | 'warning' | 'optimal' | 'excellent';
  recommendation: string;
}

export interface MaslowScore {
  overall: number; // 0-100
  balance: number; // 0-100 (équilibre pyramidal)
  progression: number; // 0-100 (montée vers accomplissement)
  stability: number; // 0-100 (solidité de la base)
  analyses: MaslowAnalysis[];
  insights: string[];
  actions: string[];
}

// ========================================
// CONFIGURATION DES NIVEAUX MASLOW
// ========================================
export const MASLOW_LEVELS: Record<MaslowLevel, MaslowCategory> = {
  'SURVIE': {
    level: 'SURVIE',
    order: 1,
    color: '#EF4444',
    gradient: 'from-red-500 to-rose-500',
    icon: 'home',
    description: 'Besoins physiologiques essentiels : logement, nourriture, santé'
  },
  'SÉCURITÉ': {
    level: 'SÉCURITÉ',
    order: 2,
    color: '#F59E0B',
    gradient: 'from-orange-500 to-amber-500',
    icon: 'shield',
    description: 'Protection et stabilité : mobilité, prévoyance, équipement'
  },
  'APPARTENANCE': {
    level: 'APPARTENANCE',
    order: 3,
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-500',
    icon: 'users',
    description: 'Relations sociales : famille, amis, culture, communauté'
  },
  'ESTIME': {
    level: 'ESTIME',
    order: 4,
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-violet-500',
    icon: 'star',
    description: 'Confiance et reconnaissance : apparence, confort, loisirs'
  },
  'ACCOMPLISSEMENT': {
    level: 'ACCOMPLISSEMENT',
    order: 5,
    color: '#10B981',
    gradient: 'from-emerald-500 to-green-500',
    icon: 'trophy',
    description: 'Réalisation de soi : formation, investissement, impact'
  }
};

// ========================================
// RATIOS RECOMMANDÉS (en % du total dépenses)
// ========================================
export const RECOMMENDED_RATIOS: Record<MaslowLevel, { min: number; optimal: number; max: number }> = {
  'SURVIE': { min: 20, optimal: 30, max: 45 },
  'SÉCURITÉ': { min: 15, optimal: 20, max: 30 },
  'APPARTENANCE': { min: 10, optimal: 20, max: 30 },
  'ESTIME': { min: 5, optimal: 15, max: 25 },
  'ACCOMPLISSEMENT': { min: 5, optimal: 15, max: 30 }
};

// ========================================
// MAPPING CATÉGORIES → NIVEAUX MASLOW
// ========================================
export const CATEGORY_TO_MASLOW: Record<string, MaslowLevel> = {
  // SURVIE
  'ABRI & ÉNERGIE': 'SURVIE',
  'NUTRITION VITALE': 'SURVIE',
  'SANTÉ & INTÉGRITÉ': 'SURVIE',
  
  // SÉCURITÉ
  'MOBILITÉ TRAVAIL': 'SÉCURITÉ',
  'PRÉVOYANCE & RISQUES': 'SÉCURITÉ',
  'CONNECTIVITÉ FONCTIONNELLE': 'SÉCURITÉ',
  'ÉQUIPEMENT DOMESTIQUE': 'SÉCURITÉ',
  
  // APPARTENANCE
  'RÉSEAU SOCIAL & AMITIÉS': 'APPARTENANCE',
  'CERCLE FAMILIAL': 'APPARTENANCE',
  'CULTURE & MÉDIAS': 'APPARTENANCE',
  'SPORT & COLLECTIF': 'APPARTENANCE',
  
  // ESTIME
  'APPARENCE & ESTIME': 'ESTIME',
  'CONFORT & TEMPS': 'ESTIME',
  'HOBBIES & PASSIONS': 'ESTIME',
  'VOYAGES EXCEPTIONNELS': 'ESTIME',
  
  // ACCOMPLISSEMENT
  'FORMATION & SAVOIR': 'ACCOMPLISSEMENT',
  'INVESTISSEMENT ACTIF': 'ACCOMPLISSEMENT',
  'PROJETS PERSONNELS': 'ACCOMPLISSEMENT',
  'PHILANTHROPIE': 'ACCOMPLISSEMENT',
  'TRANSMISSION & HÉRITAGE': 'ACCOMPLISSEMENT'
};

// ========================================
// ANALYSE DES TRANSACTIONS
// ========================================

// Cache pour éviter les recalculs
let analysisCache: { 
  key: string; 
  result: MaslowScore;
} | null = null;

export function analyzeMaslowDistribution(
  transactions: any[],
  categories: any[]
): MaslowScore {
  // Créer une clé de cache basée sur le nombre de transactions et catégories
  const cacheKey = `${transactions.length}_${categories.length}`;
  
  // Vérifier le cache
  if (analysisCache && analysisCache.key === cacheKey) {
    console.log('✅ Using cached Maslow analysis');
    return analysisCache.result;
  }
  
  console.log('🔄 Computing new Maslow analysis...');
  
  // Grouper les transactions par niveau Maslow
  const levelData: Record<MaslowLevel, { amount: number; count: number; categories: Set<string> }> = {
    'SURVIE': { amount: 0, count: 0, categories: new Set() },
    'SÉCURITÉ': { amount: 0, count: 0, categories: new Set() },
    'APPARTENANCE': { amount: 0, count: 0, categories: new Set() },
    'ESTIME': { amount: 0, count: 0, categories: new Set() },
    'ACCOMPLISSEMENT': { amount: 0, count: 0, categories: new Set() }
  };

  let totalAmount = 0;

  transactions.forEach(transaction => {
    if (!transaction.category || transaction.category === 'Non classifié') return;
    
    // Trouver le niveau Maslow de cette catégorie
    const maslowLevel = CATEGORY_TO_MASLOW[transaction.category];
    if (!maslowLevel) return;

    const amount = Math.abs(transaction.amount);
    totalAmount += amount;

    levelData[maslowLevel].amount += amount;
    levelData[maslowLevel].count += 1;
    levelData[maslowLevel].categories.add(transaction.category);
  });

  // Calculer les pourcentages et analyses
  const analyses: MaslowAnalysis[] = Object.entries(levelData).map(([level, data]) => {
    const percentage = totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0;
    const recommended = RECOMMENDED_RATIOS[level as MaslowLevel];
    
    let status: 'danger' | 'warning' | 'optimal' | 'excellent' = 'optimal';
    let recommendation = '';

    if (percentage < recommended.min) {
      status = level === 'SURVIE' || level === 'SÉCURITÉ' ? 'danger' : 'warning';
      recommendation = `Augmentez vos dépenses en ${level.toLowerCase()} (actuellement ${percentage.toFixed(1)}%, recommandé ${recommended.optimal}%)`;
    } else if (percentage > recommended.max) {
      status = level === 'SURVIE' ? 'warning' : 'optimal';
      recommendation = `Optimisez vos dépenses en ${level.toLowerCase()} (actuellement ${percentage.toFixed(1)}%, recommandé ${recommended.optimal}%)`;
    } else if (percentage >= recommended.optimal - 5 && percentage <= recommended.optimal + 5) {
      status = 'excellent';
      recommendation = `Excellent équilibre en ${level.toLowerCase()}`;
    } else {
      status = 'optimal';
      recommendation = `Bon équilibre en ${level.toLowerCase()}`;
    }

    return {
      level: level as MaslowLevel,
      amount: data.amount,
      percentage,
      transactionCount: data.count,
      categories: Array.from(data.categories),
      status,
      recommendation
    };
  });

  // Calculer les scores
  const stability = calculateStability(analyses);
  const balance = calculateBalance(analyses);
  const progression = calculateProgression(analyses);
  const overall = (stability * 0.4 + balance * 0.3 + progression * 0.3);

  // Générer des insights
  const insights = generateInsights(analyses, overall);
  const actions = generateActions(analyses);

  const result = {
    overall: Math.round(overall),
    balance: Math.round(balance),
    progression: Math.round(progression),
    stability: Math.round(stability),
    analyses,
    insights,
    actions
  };
  
  // Mettre en cache
  analysisCache = { key: cacheKey, result };
  
  return result;
}

// ========================================
// CALCUL DE STABILITÉ (base solide)
// ========================================
function calculateStability(analyses: MaslowAnalysis[]): number {
  const survie = analyses.find(a => a.level === 'SURVIE');
  const securite = analyses.find(a => a.level === 'SÉCURITÉ');
  
  if (!survie || !securite) return 0;

  const survieScore = survie.percentage >= 20 && survie.percentage <= 45 ? 100 : 
                     survie.percentage < 20 ? survie.percentage / 20 * 100 :
                     100 - ((survie.percentage - 45) / 30 * 50);

  const securiteScore = securite.percentage >= 15 && securite.percentage <= 30 ? 100 :
                       securite.percentage < 15 ? securite.percentage / 15 * 100 :
                       100 - ((securite.percentage - 30) / 20 * 50);

  return (survieScore + securiteScore) / 2;
}

// ========================================
// CALCUL D'ÉQUILIBRE (pyramide harmonieuse)
// ========================================
function calculateBalance(analyses: MaslowAnalysis[]): number {
  let score = 0;
  let count = 0;

  analyses.forEach(analysis => {
    const recommended = RECOMMENDED_RATIOS[analysis.level];
    const deviation = Math.abs(analysis.percentage - recommended.optimal);
    const maxDeviation = 30; // écart max toléré
    const itemScore = Math.max(0, 100 - (deviation / maxDeviation * 100));
    
    score += itemScore;
    count++;
  });

  return count > 0 ? score / count : 0;
}

// ========================================
// CALCUL DE PROGRESSION (montée pyramide)
// ========================================
function calculateProgression(analyses: MaslowAnalysis[]): number {
  const appartenance = analyses.find(a => a.level === 'APPARTENANCE');
  const estime = analyses.find(a => a.level === 'ESTIME');
  const accomplissement = analyses.find(a => a.level === 'ACCOMPLISSEMENT');

  if (!appartenance || !estime || !accomplissement) return 0;

  // Plus on investit dans les niveaux supérieurs, meilleur est le score
  const progressionScore = (
    appartenance.percentage * 0.3 +
    estime.percentage * 0.3 +
    accomplissement.percentage * 0.4
  );

  // Idéalement, on veut 40-50% dans ces 3 niveaux combinés
  return Math.min(100, (progressionScore / 45) * 100);
}

// ========================================
// GÉNÉRATION D'INSIGHTS
// ========================================
function generateInsights(analyses: MaslowAnalysis[], overall: number): string[] {
  const insights: string[] = [];

  const survie = analyses.find(a => a.level === 'SURVIE');
  const accomplissement = analyses.find(a => a.level === 'ACCOMPLISSEMENT');

  // Insight général
  if (overall >= 80) {
    insights.push('🌟 Excellent équilibre de vie ! Vos finances reflètent une hiérarchie de besoins optimale.');
  } else if (overall >= 60) {
    insights.push('✅ Bon équilibre général. Quelques ajustements pourraient améliorer votre bien-être.');
  } else if (overall >= 40) {
    insights.push('⚠️ Déséquilibre détecté. Vos dépenses ne suivent pas une pyramide de Maslow harmonieuse.');
  } else {
    insights.push('🚨 Attention : vos finances indiquent un déséquilibre important dans votre qualité de vie.');
  }

  // Insight sur la base
  if (survie && survie.percentage > 50) {
    insights.push('💡 Vous êtes en mode "survie" (>50% de vos dépenses). Cherchez à optimiser vos coûts fixes.');
  } else if (survie && survie.percentage < 20) {
    insights.push('⚠️ Attention : vos dépenses de survie sont très faibles (<20%). Assurez-vous d\'avoir une base solide.');
  }

  // Insight sur l'accomplissement
  if (accomplissement && accomplissement.percentage < 5) {
    insights.push('📈 Aucun investissement en accomplissement. Considérez 5-10% pour votre croissance personnelle.');
  } else if (accomplissement && accomplissement.percentage > 20) {
    insights.push('🚀 Excellent ! Vous investissez activement dans votre développement et votre impact.');
  }

  return insights;
}

// ========================================
// GÉNÉRATION D'ACTIONS RECOMMANDÉES
// ========================================
function generateActions(analyses: MaslowAnalysis[]): string[] {
  const actions: string[] = [];

  analyses.forEach(analysis => {
    const recommended = RECOMMENDED_RATIOS[analysis.level];
    
    if (analysis.percentage < recommended.min) {
      switch (analysis.level) {
        case 'SURVIE':
          actions.push('🏠 Renforcez vos dépenses essentielles (logement, santé, nourriture)');
          break;
        case 'SÉCURITÉ':
          actions.push('🛡️ Augmentez votre sécurité financière (épargne de précaution, assurances)');
          break;
        case 'APPARTENANCE':
          actions.push('👥 Investissez dans vos relations (sorties, famille, culture)');
          break;
        case 'ESTIME':
          actions.push('⭐ Accordez-vous du temps pour vous (loisirs, apparence, confort)');
          break;
        case 'ACCOMPLISSEMENT':
          actions.push('🎯 Commencez à investir dans votre avenir (formation, épargne long terme)');
          break;
      }
    } else if (analysis.percentage > recommended.max) {
      switch (analysis.level) {
        case 'SURVIE':
          actions.push('💰 Optimisez vos coûts fixes pour libérer du budget');
          break;
        case 'SÉCURITÉ':
          actions.push('📊 Rationalisez vos dépenses de sécurité');
          break;
        case 'ESTIME':
          actions.push('🔍 Réduisez les dépenses de confort non essentielles');
          break;
      }
    }
  });

  // Actions générales
  if (actions.length === 0) {
    actions.push('✅ Continuez sur cette voie, votre équilibre est optimal');
  }

  return actions.slice(0, 5); // Max 5 actions
}

// ========================================
// HELPER : Obtenir le niveau Maslow d'une catégorie
// ========================================
export function getMaslowLevelForCategory(categoryName: string): MaslowLevel | null {
  return CATEGORY_TO_MASLOW[categoryName] || null;
}

// ========================================
// HELPER : Obtenir toutes les catégories d'un niveau
// ========================================
export function getCategoriesForLevel(level: MaslowLevel): string[] {
  return Object.entries(CATEGORY_TO_MASLOW)
    .filter(([_, l]) => l === level)
    .map(([cat, _]) => cat);
}