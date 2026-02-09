import { Transaction } from '@/utils/csv-parser';
import { 
  getCategoryBehavioralProfileCached, 
  type BehavioralAxis
} from '@/utils/insights/behavioralAxes';
// 👇 Import crucial pour utiliser le même moteur que le panneau gauche
import { detectRecurringPatterns, RecurringSettings, RecurringDetectionResult } from '@/utils/insights/recurring-detection';

// --- TYPES ---
export interface RecurringPrediction {
  id?: string;
  description: string;
  rawDescription: string;
  amount: number;
  type: 'revenue' | 'expense';
  occurrences: number;
  transactionIds?: string[];
  intervalDays: number;
  lastDate: string;
  nextExpectedDate: string;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  category?: string;
  behavior?: 'STRICT' | 'FLEXIBLE' | 'BURN_RATE';
  behavioralAxis?: BehavioralAxis;
  compressibilityScore?: number;
  priority?: number;
}

export interface MonthEndProjection {
  projectedBalance: number;
  currentBalance: number;
  expectedRevenue: number;
  expectedExpenses: number;
  confidence: number;
  daysRemaining: number;
  trend: 'improving' | 'stable' | 'declining';
  risks: string[];
  details: {
    previousMonthEndBalance: number;
    pastTransactions: Transaction[];
    recurringPredictions: RecurringPrediction[];
    certainProjection: number;
    completedRevenue: number;
    completedExpenses: number;
    recurringRevenue: number;
    recurringExpenses: number;
  };
  personalizedTips?: string[];
}

interface ProjectionSettings {
  inflationFactor?: number;
  userAge?: number;
  // 👇 Ajout pour permettre de passer les réglages du contexte
  recurringSettings?: RecurringSettings;
}

export interface DailyGoal {
  current: number;
  target: number;
  adjustment: number;
  message: string;
  severity: 'safe' | 'warning' | 'danger';
}

// ================================================================
// 🚀 SETTINGS PAR DÉFAUT (FALLBACK)
// ================================================================
// Ces réglages assurent que la projection détecte "large" si aucun setting n'est fourni
const DEFAULT_RECURRING_SETTINGS: RecurringSettings = {
  enabled: true,
  minOccurrences: 3,
  maxCoefficientVariation: 35, // Tolérance élevée pour capturer les variations
  minConfidence: 45,           // Seuil bas pour ne pas rater MSA/Bouygues
  activeMultiplier: 1.8,
  typeTolerance: 2,
  useSemanticSimilarity: true,
  semanticMinScore: 65
};

// ================================================================
// 🚀 CACHES DE PERFORMANCE
// ================================================================
const BEHAVIOR_CACHE = new Map<string, 'STRICT' | 'FLEXIBLE' | 'BURN_RATE'>();
const NORM_CACHE = new Map<string, string>();

/**
 * Version ultra-performante de getBehavior avec mise en cache
 */
export function getBehavior(category?: string): 'STRICT' | 'FLEXIBLE' | 'BURN_RATE' {
  if (!category) return 'BURN_RATE';
  if (BEHAVIOR_CACHE.has(category)) return BEHAVIOR_CACHE.get(category)!;

  const normalized = category.toUpperCase().trim();
  let result: 'STRICT' | 'FLEXIBLE' | 'BURN_RATE' = 'BURN_RATE';

  const strictRegex = /ABRI|ÉNERGIE|ENERGIE|LOYER|CRÉDIT|CREDIT|IMMOBILIER|ÉLECTRICITÉ|ELECTRICITE|GAZ|EAU|CHARGES|TAXE|FONCIERE|ABONNEMENT|SERVICE|DETTE|RÉGULARISATION|REGULARISATION|ASSURANCE|IMPÔT|IMPOT|MUTUELLE|SALAIRE|REVENU|RESSOURCE|PRÉVOYANCE|PREVOYANCE|MOBILE|INTERNET|FIBRE|FORFAIT/;
  const flexibleRegex = /SANTÉ|SANTE|INTÉGRITÉ|INTEGRITE|PHARMACIE|MÉDECIN|MEDECIN|NUTRITION|ALIMENTATION|SUPERMARCHÉ|SUPERMARCHE|MARCHÉ|MARCHE|MOBILITÉ|MOBILITE|TRANSPORT|CARBURANT|PÉAGE|PEAGE|ÉQUIPEMENT|EQUIPEMENT|DOMESTIQUE|ÉLECTROMÉNAGER|ELECTROMENAGER|CONNECTIVITÉ|CONNECTIVITE|FONCTIONNEL/;

  if (strictRegex.test(normalized)) result = 'STRICT';
  else if (flexibleRegex.test(normalized)) result = 'FLEXIBLE';

  BEHAVIOR_CACHE.set(category, result);
  return result;
}

/**
 * Normalisation mémoïsée
 */
export function normalizeDescription(desc: string): string {
  if (NORM_CACHE.has(desc)) return NORM_CACHE.get(desc)!;
  
  const normalized = desc
    .toUpperCase()
    .replace(/[0-9]/g, '')
    .replace(/\b(JANV|FEV|MARS|AVRIL|MAI|JUIN|JUIL|AOUT|SEPT|OCT|NOV|DEC)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  NORM_CACHE.set(desc, normalized);
  return normalized;
}

/**
 * 🚀 PROJECTION DE FIN DE MOIS - VERSION UNIFIÉE
 * Utilise désormais le même moteur que le LeftPanel (detectRecurringPatterns)
 * 
 * NOUVEAU : support de preCalculatedPatterns pour éviter le double calcul
 */
export function calculateMonthEndProjection(
  transactions: Transaction[],
  currentBalance: number = 0,
  settings?: ProjectionSettings,
  preCalculatedPatterns?: RecurringDetectionResult  // ← PARAMÈTRE AJOUTÉ (étape 1)
): MonthEndProjection {
  const safeBalance = Number(currentBalance) || 0;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(0, lastDayOfMonth - now.getDate());
  const endOfMonthDate = new Date(currentYear, currentMonth, lastDayOfMonth, 23, 59, 59);

  // 1. Collecte des transactions DEJA passées ce mois-ci
  const currentMonthTxns: Transaction[] = [];
  let completedRevenue = 0;
  let completedExpenses = 0;

  for (const t of transactions) {
    const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount || 0);
    const date = new Date(t.date);
    
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      currentMonthTxns.push({ ...t, amount });
      if (amount > 0) completedRevenue += amount;
      else completedExpenses += Math.abs(amount);
    }
  }

  const sumCurrentMonth = completedRevenue - completedExpenses;
  const previousMonthEndBalance = safeBalance - sumCurrentMonth;

  // 2. DÉTECTION INTELLIGENTE (via le moteur R.A.S.P partagé)
  // NOUVEAU : réutilisation si patterns déjà calculés (évite le double calcul)
  let detectionResult: RecurringDetectionResult;

  if (preCalculatedPatterns) {
    // On utilise le résultat pré-calculé (venant du LeftPanel ou d'un memo)
    detectionResult = preCalculatedPatterns;
    console.log('[PROJECTION] Récurrences RÉUTILISÉES (pré-calculées) – gain de performance');
  } else {
    // Fallback : calcul normal (seulement si pas de cache)
    const recSettings = settings?.recurringSettings || DEFAULT_RECURRING_SETTINGS;
    detectionResult = detectRecurringPatterns(transactions, recSettings);
    console.log('[PROJECTION] Récurrences CALCULÉES (pas de cache disponible)');
  }

  // 3. FILTRAGE : On ne garde que ce qui tombe entre MAINTENANT et la FIN DU MOIS
  const recurringPredictions: RecurringPrediction[] = [];
  let recurringRevenue = 0;
  let recurringExpenses = 0;

  for (const pattern of detectionResult.patterns) {
    if (!pattern.isActive) continue;

    const nextDate = new Date(pattern.nextExpectedDate);
    
    // Marge de tolérance de 2 jours passés (pour les virements en attente de traitement bancaire)
    const toleranceDate = new Date();
    toleranceDate.setDate(toleranceDate.getDate() - 2);

    // Si la date prévue est dans le futur proche (fin du mois)
    if (nextDate >= toleranceDate && nextDate <= endOfMonthDate) {
      
      const behavior = getBehavior(pattern.category);
      const behavioralProfile = getCategoryBehavioralProfileCached(pattern.category);

      // Mapping vers le format RecurringPrediction
      recurringPredictions.push({
        id: pattern.id,
        description: pattern.description, // Déjà normalisé par le moteur
        rawDescription: pattern.transactions[0].description,
        amount: pattern.averageAmount,
        type: pattern.averageAmount > 0 ? 'revenue' : 'expense',
        occurrences: pattern.transactions.length,
        transactionIds: pattern.transactions.map(t => t.id),
        intervalDays: Math.round(pattern.frequency),
        lastDate: pattern.transactions[pattern.transactions.length - 1].date,
        nextExpectedDate: pattern.nextExpectedDate.toISOString(),
        confidence: pattern.confidence,
        confidenceLevel: pattern.confidence >= 80 ? 'high' : (pattern.confidence >= 50 ? 'medium' : 'low'),
        category: pattern.category,
        behavior,
        behavioralAxis: behavioralProfile.axis,
        compressibilityScore: behavioralProfile.compressibilityScore,
        priority: behavioralProfile.priority
      });

      // Calcul des totaux
      if (pattern.averageAmount > 0) {
        recurringRevenue += pattern.averageAmount;
      } else {
        recurringExpenses += Math.abs(pattern.averageAmount);
      }
    }
  }

  // 4. APPLICATION DE L'INFLATION (Optionnel)
  if (settings?.inflationFactor) {
    recurringExpenses *= settings.inflationFactor;
  }

  const totalRevenue = completedRevenue + recurringRevenue;
  const totalExpenses = completedExpenses + recurringExpenses;
  const projectedBalance = previousMonthEndBalance + totalRevenue - totalExpenses;

  // Tri des prédictions par date
  recurringPredictions.sort((a, b) => new Date(a.nextExpectedDate).getTime() - new Date(b.nextExpectedDate).getTime());

  return {
    projectedBalance,
    currentBalance: safeBalance,
    expectedRevenue: totalRevenue,
    expectedExpenses: totalExpenses,
    daysRemaining,
    confidence: Math.min(100, Math.round((completedExpenses / (totalExpenses || 1)) * 100)),
    trend: projectedBalance > previousMonthEndBalance ? 'improving' : 'declining',
    risks: projectedBalance < 0 ? ['Risque de découvert en fin de mois'] : [],
    details: {
      previousMonthEndBalance,
      pastTransactions: currentMonthTxns,
      recurringPredictions, // Contient maintenant MSA, Bouygues, etc.
      certainProjection: projectedBalance,
      completedRevenue,
      completedExpenses,
      recurringRevenue,
      recurringExpenses,
    }
  };
}

// --- UTILITAIRES CONSERVÉS POUR COMPATIBILITÉ UI ---

function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (Math.abs(str1.length - str2.length) > 3) return 0;

  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const m = s1.length, n = s2.length;
  const d = Array.from({ length: m + 1 }, () => new Uint8Array(n + 1));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      const substitutionCost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + substitutionCost);
    }
  }
  return 1 - d[m][n] / Math.max(m, n);
}

export function isSimilarDescription(d1: string, d2: string): boolean {
  const n1 = normalizeDescription(d1);
  const n2 = normalizeDescription(d2);
  return n1.includes(n2) || n2.includes(n1) || calculateStringSimilarity(n1, n2) > 0.85;
}

export function calculateDailyGoal(transactions: Transaction[], projection: MonthEndProjection): DailyGoal {
  const dayOfMonth = new Date().getDate();
  const current = dayOfMonth > 0 ? projection.details.completedExpenses / dayOfMonth : 0;
  
  const budgetAvailable = projection.currentBalance + projection.details.recurringRevenue - (projection.expectedExpenses - projection.details.completedExpenses);
  const target = Math.max(0, budgetAvailable / Math.max(1, projection.daysRemaining));

  return {
    current,
    target,
    adjustment: target - current,
    severity: projection.projectedBalance < 0 ? 'danger' : projection.projectedBalance < projection.expectedExpenses * 0.1 ? 'warning' : 'safe',
    message: projection.projectedBalance < 0 ? `Limitez à ${Math.round(target)}€/j pour éviter le découvert` : `Vous pouvez dépenser ${Math.round(target)}€/j`
  };
}