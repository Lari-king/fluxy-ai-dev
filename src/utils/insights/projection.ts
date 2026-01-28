import { Transaction } from 'src/utils/csv-parser';
import { 
  getCategoryBehavioralProfileCached, 
  type BehavioralAxis
} from './behavioralAxes';

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
}

export interface DailyGoal {
  current: number;
  target: number;
  adjustment: number;
  message: string;
  severity: 'safe' | 'warning' | 'danger';
}

// ================================================================
// 🚀 CACHES DE PERFORMANCE (X10 SPEED)
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
 * Normalisation mémoïsée (évite les regex à chaque itération)
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
 * Projection de fin de mois optimisée
 */
export function calculateMonthEndProjection(
  transactions: Transaction[],
  currentBalance: number = 0,
  settings?: ProjectionSettings
): MonthEndProjection {
  const safeBalance = Number(currentBalance) || 0;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(0, lastDayOfMonth - now.getDate());

  // Une seule boucle pour séparer les données (Gain perf significatif)
  const currentMonthTxns: Transaction[] = [];
  let completedRevenue = 0;
  let completedExpenses = 0;
  const groups: Record<string, Transaction[]> = {};

  for (const t of transactions) {
    const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount || 0);
    const date = new Date(t.date);
    
    // 1. Collecte mois en cours
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      currentMonthTxns.push({ ...t, amount });
      if (amount > 0) completedRevenue += amount;
      else completedExpenses += Math.abs(amount);
    }

    // 2. Groupement pour récurrence
    if (amount === 0 || t.description.toLowerCase().includes('virement interne')) continue;
    
    const behavior = getBehavior(t.category);
    const normName = normalizeDescription(t.description);
    
    let groupKey: string;
    if (behavior === 'STRICT') {
      groupKey = `${amount > 0 ? 'IN' : 'OUT'}-${normName}-STRICT`;
    } else if (behavior === 'FLEXIBLE') {
      groupKey = `${amount > 0 ? 'IN' : 'OUT'}-${normName}-${Math.round(Math.abs(amount) / 10) * 10}`;
    } else if (amount > 0) {
      groupKey = `IN-${normName}-BURN`;
    } else continue;

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push({ ...t, amount });
  }

  const sumCurrentMonth = completedRevenue - completedExpenses;
  const previousMonthEndBalance = safeBalance - sumCurrentMonth;

  // 3. ANALYSE ET FILTRAGE DES GROUPES
  const allPredictions: RecurringPrediction[] = [];
  const endOfMonth = new Date(currentYear, currentMonth, lastDayOfMonth, 23, 59, 59);
  
  for (const groupTxns of Object.values(groups)) {
    const firstTx = groupTxns[0];
    const isRevenue = firstTx.amount > 0;
    const behavior = getBehavior(firstTx.category);
    
    const minOccurrences = (behavior === 'STRICT' || isRevenue) ? 2 : 3;
    const minConfidence = (behavior === 'STRICT' || isRevenue) ? 60 : 70;

    if (groupTxns.length < minOccurrences) continue;

    // Calcul intervalle
    groupTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let totalDays = 0;
    const intervals: number[] = [];
    for (let i = 0; i < groupTxns.length - 1; i++) {
      const diff = Math.ceil(Math.abs(new Date(groupTxns[i].date).getTime() - new Date(groupTxns[i+1].date).getTime()) / 86400000);
      intervals.push(diff);
      totalDays += diff;
    }

    const avgInterval = totalDays / intervals.length;
    const variance = intervals.reduce((acc, v) => acc + Math.pow(v - avgInterval, 2), 0) / intervals.length;
    const regularityScore = Math.max(0, 100 - (Math.sqrt(variance) / avgInterval * 100)) + (behavior === 'STRICT' ? 20 : isRevenue ? 15 : 10);
    
    const daysSinceLast = (now.getTime() - new Date(groupTxns[0].date).getTime()) / 86400000;
    const finalConfidence = Math.round(Math.min(100, regularityScore - (daysSinceLast > (avgInterval * 1.5) ? 25 : 0)));

    if (finalConfidence < minConfidence) continue;

    const avgAmount = groupTxns.reduce((sum, t) => sum + t.amount, 0) / groupTxns.length;
    const nextDate = new Date(groupTxns[0].date);
    nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));
    
    const behavioralProfile = getCategoryBehavioralProfileCached(firstTx.category);

    allPredictions.push({
      id: `pred-${normalizeDescription(firstTx.description)}-${avgAmount.toFixed(0)}`,
      description: normalizeDescription(firstTx.description),
      rawDescription: firstTx.description,
      amount: avgAmount, // ICI : Garde le signe original
      type: avgAmount > 0 ? 'revenue' : 'expense',
      occurrences: groupTxns.length,
      transactionIds: groupTxns.map(t => t.id),
      intervalDays: Math.round(avgInterval),
      lastDate: groupTxns[0].date,
      nextExpectedDate: nextDate.toISOString(),
      confidence: finalConfidence,
      confidenceLevel: finalConfidence >= 90 ? 'high' : (finalConfidence >= 70 ? 'medium' : 'low'),
      category: firstTx.category,
      behavior,
      behavioralAxis: behavioralProfile.axis,
      compressibilityScore: behavioralProfile.compressibilityScore,
      priority: behavioralProfile.priority
    });
  }

  // 4. CALCULS FINANCIERS FINAUX
  let recurringRevenue = 0;
  let recurringExpenses = 0;
  const filteredPredictions: RecurringPrediction[] = [];

  for (const p of allPredictions) {
    const nextDate = new Date(p.nextExpectedDate);
    if (nextDate > now && nextDate <= endOfMonth) {
      filteredPredictions.push(p);
      if (p.amount > 0) recurringRevenue += p.amount;
      else recurringExpenses += Math.abs(p.amount);
    }
  }

  if (settings?.inflationFactor) recurringExpenses *= settings.inflationFactor;

  const totalRevenue = completedRevenue + recurringRevenue;
  const totalExpenses = completedExpenses + recurringExpenses;
  const projectedBalance = previousMonthEndBalance + totalRevenue - totalExpenses;

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
      recurringPredictions: allPredictions.sort((a, b) => new Date(a.nextExpectedDate).getTime() - new Date(b.nextExpectedDate).getTime()),
      certainProjection: projectedBalance,
      completedRevenue,
      completedExpenses,
      recurringRevenue,
      recurringExpenses,
    }
  };
}

// Optimisation de la recherche de similarité (Levenshtein rapide)
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (Math.abs(str1.length - str2.length) > 3) return 0; // Court-circuit si trop différent

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