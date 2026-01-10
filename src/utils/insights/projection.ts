import { Transaction } from 'src/utils/csv-parser';

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
  confidence: number; // Modifié en number pour le score de probabilité
  confidenceLevel: 'high' | 'medium' | 'low';
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

/**
 * Normalisation des libellés pour le groupement
 */
export function normalizeDescription(desc: string): string {
  return desc
    .toUpperCase()
    .replace(/[0-9]/g, '') // Enlever les chiffres (souvent des dates ou IDs de transaction)
    .replace(/\b(JANV|FEV|MARS|AVRIL|MAI|JUIN|JUIL|AOUT|SEPT|OCT|NOV|DEC)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcul de la projection de fin de mois (Moteur V2)
 */
export function calculateMonthEndProjection(
  transactions: Transaction[],
  currentBalance: number = 0,
  settings?: ProjectionSettings
): MonthEndProjection {
  const safeBalance = isNaN(currentBalance) || currentBalance === null ? 0 : currentBalance;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(0, lastDayOfMonth - now.getDate());

  // 1. Transactions déjà passées ce mois-ci
  const currentMonthTxns = transactions.filter(txn => {
    const d = new Date(txn.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).map(txn => ({
    ...txn,
    amount: typeof txn.amount === 'string' ? parseFloat(txn.amount) : (txn.amount || 0)
  }));

  const sumCurrentMonth = currentMonthTxns.reduce((sum, txn) => sum + txn.amount, 0);
  const previousMonthEndBalance = safeBalance - sumCurrentMonth;

  // 2. DÉTECTION DES RÉCURRENCES (Signature Temporelle)
  const groups: { [key: string]: Transaction[] } = {};

  transactions.forEach(t => {
    if (t.amount === 0 || t.description.toLowerCase().includes('virement interne')) return;
    
    const normName = normalizeDescription(t.description); 
    const key = `${t.amount > 0 ? 'IN' : 'OUT'}-${normName}`;
    
    if (!groups[key]) groups[key] = [];
    groups[key].push({
      ...t,
      amount: typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount || 0)
    });
  });

  const allPredictions: RecurringPrediction[] = [];

  Object.values(groups).forEach(groupTxns => {
    if (groupTxns.length < 2) return;

    groupTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const intervals: number[] = [];
    for (let i = 0; i < groupTxns.length - 1; i++) {
      const diffTime = Math.abs(new Date(groupTxns[i].date).getTime() - new Date(groupTxns[i+1].date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      intervals.push(diffDays);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, val) => acc + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const regularityScore = Math.max(0, 100 - (stdDev / avgInterval * 100));

    const daysSinceLast = (now.getTime() - new Date(groupTxns[0].date).getTime()) / (1000 * 3600 * 24);
    const recencyPenalty = daysSinceLast > (avgInterval * 1.5) ? 25 : 0;
    const finalConfidence = Math.round(regularityScore - recencyPenalty);

    // Règle des 80% (Seulement le Top-Tier)
    const isReliable = (groupTxns.length >= 3 && finalConfidence >= 75) || (groupTxns.length === 2 && finalConfidence >= 90);

    if (isReliable) {
      const names = groupTxns.map(t => t.description);
      const rawDescription = names.sort((a, b) =>
        names.filter(v => v === a).length - names.filter(v => v === b).length
      ).pop() || groupTxns[0].description;

      const avgAmount = groupTxns.reduce((sum, t) => sum + t.amount, 0) / groupTxns.length;
      const nextDate = new Date(groupTxns[0].date);
      nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));
      
      allPredictions.push({
        id: `pred-${normalizeDescription(rawDescription)}-${avgAmount.toFixed(0)}`,
        description: normalizeDescription(rawDescription),
        rawDescription: rawDescription,
        amount: avgAmount,
        type: avgAmount > 0 ? 'revenue' : 'expense',
        occurrences: groupTxns.length,
        transactionIds: groupTxns.map(t => t.id),
        intervalDays: Math.round(avgInterval),
        lastDate: groupTxns[0].date,
        nextExpectedDate: nextDate.toISOString(),
        confidence: finalConfidence,
        confidenceLevel: finalConfidence >= 90 ? 'high' : (finalConfidence >= 70 ? 'medium' : 'low')
      });
    }
  });

  // 3. CALCULS FINANCIERS
  const endOfMonth = new Date(currentYear, currentMonth, lastDayOfMonth, 23, 59, 59);
  const recurringThisMonth = allPredictions.filter(p => new Date(p.nextExpectedDate) <= endOfMonth);

  const recurringRevenue = recurringThisMonth.filter(p => p.type === 'revenue').reduce((sum, p) => sum + p.amount, 0);
  let recurringExpenses = recurringThisMonth.filter(p => p.type === 'expense').reduce((sum, p) => sum + Math.abs(p.amount), 0);

  if (settings?.inflationFactor && settings.inflationFactor > 1) {
    recurringExpenses *= settings.inflationFactor;
  }

  const completedRevenue = currentMonthTxns.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const completedExpenses = currentMonthTxns.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

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
    trend: projectedBalance > safeBalance ? 'improving' : 'declining',
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

// Nettoyage des fonctions inutilisées demandées par le compilateur
export function isSimilarDescription(d1: string, d2: string): boolean {
  const n1 = normalizeDescription(d1);
  const n2 = normalizeDescription(d2);
  
  // Si l'un contient l'autre, c'est un match (rapide)
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Sinon, score de similarité floue (Levenshtein)
  return calculateStringSimilarity(n1, n2) > 0.85; 
}

/**

 * Détection avancée des récurrences prédites (basé sur weeks over 6 months, proba >=80%)
/**
 * Détection avancée des récurrences prédites (basée sur occurrences hebdomadaires sur 6 mois, proba >=80%)
 */
function detectRecurringPredictions(
  transactions: Transaction[],
  now: Date,
  endOfMonth: Date,
  settings: ProjectionSettings
): RecurringPrediction[] {
  const predictions: RecurringPrediction[] = [];

  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 mois back
  const recentTxns = transactions.filter(t => new Date(t.date) >= sixMonthsAgo);

  // Group by normalized desc + similar amount
  const groups = recentTxns.reduce((acc, txn) => {
    const normDesc = normalizeDescription(txn.description);
    const key = `${normDesc}_${Math.round(txn.amount / 10) * 10}`; // Group by desc + montant rounded to 10
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key)!.push(txn);
    return acc;
  }, new Map<string, Transaction[]>());

  groups.forEach((groupTxns, key) => {
    if (groupTxns.length < 3) return; // Min occurrences

    // Weekly analysis
    const weeks = new Set<string>();
    groupTxns.forEach(t => {
      const date = new Date(t.date);
      const weekKey = `${date.getFullYear()}-${Math.floor(date.getDate() / 7)}`;
      weeks.add(weekKey);
    });

    const totalPossibleWeeks = 24; // 6 months ~24 weeks
    const occurrenceRate = (weeks.size / totalPossibleWeeks) * 100;

    if (occurrenceRate < 80) return; // Proba >=80%

    // Calculate avg interval, amount, etc.
    const sorted = groupTxns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push((new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / (86400000));
    }
    const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    const avgAmount = groupTxns.reduce((sum, t) => sum + t.amount, 0) / groupTxns.length;

    const lastDate = new Date(sorted[sorted.length - 1].date);
    let nextExpected = new Date(lastDate);
    nextExpected.setDate(nextExpected.getDate() + avgInterval);

    if (nextExpected > now && nextExpected <= endOfMonth) {
      predictions.push({
        id: key,
        description: key.split('_')[0],
        rawDescription: groupTxns[0].description,
        amount: avgAmount,
        type: avgAmount > 0 ? 'revenue' : 'expense',
        occurrences: groupTxns.length,
        transactionIds: groupTxns.map(t => t.id),
        intervalDays: Math.round(avgInterval),
        lastDate: sorted[sorted.length - 1].date,
        nextExpectedDate: nextExpected.toISOString(),
        confidence: Math.round(occurrenceRate),
        confidenceLevel: occurrenceRate >= 95 ? 'high' : occurrenceRate >= 85 ? 'medium' : 'low',
      });
    }
  });

  return predictions;
}

// ... Garder les autres fonctions auxiliaires (calculateConfidence, determineTrend, etc.) identiques à ta version précédente

function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  return 1 - distance / Math.max(s1.length, s2.length);
}

function calculateDailyExpenseTrend(currentMonthTxns: Transaction[], now: Date): number {
  const dayOfMonth = now.getDate();
  if (dayOfMonth === 0) return 0;

  const totalExpenses = currentMonthTxns
    .filter(txn => txn.amount < 0 && new Date(txn.date) <= now)
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

  return totalExpenses / dayOfMonth;
}

export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function calculateConfidence(
  allTransactions: Transaction[],
  currentMonthTxns: Transaction[],
  recurringAmount: number,
  daysRemaining: number
): number {
  if (allTransactions.length === 0 && currentMonthTxns.length === 0) return 0;

  let confidence = 50;
  if (allTransactions.length > 100) confidence += 20;
  else if (allTransactions.length > 50) confidence += 10;

  if (currentMonthTxns.length > 20) confidence += 15;
  else if (currentMonthTxns.length > 10) confidence += 10;

  if (recurringAmount > 0) confidence += 15;

  if (daysRemaining > 15) confidence -= 10;
  else if (daysRemaining < 5) confidence += 10;

  return Math.min(100, Math.max(0, confidence));
}

function determineTrend(
  projectedBalance: number,
  currentBalance: number,
  expectedExpenses: number
): 'improving' | 'stable' | 'declining' {
  const difference = projectedBalance - currentBalance;
  const percentChange = currentBalance !== 0 ? (difference / Math.abs(currentBalance)) * 100 : 0;

  if (percentChange > 5) return 'improving';
  if (percentChange < -5) return 'declining';
  return 'stable';
}

export function identifyRisks(
  projectedBalance: number,
  expectedExpenses: number,
  completedExpenses: number,
  daysRemaining: number
): string[] {
  const risks: string[] = [];

  if (projectedBalance < 0) risks.push('Découvert prévu fin de mois');

  const dailyExpenseRate = daysRemaining > 0 ? completedExpenses / (30 - daysRemaining) : 0;
  const projectedDailyExpenses = dailyExpenseRate * daysRemaining;

  if (projectedDailyExpenses > expectedExpenses * 0.5) risks.push('Rythme de dépenses élevé');

  if (projectedBalance > 0 && projectedBalance < expectedExpenses * 0.1) risks.push('Marge de sécurité faible');

  return risks;
}

export function formatProjection(projection: MonthEndProjection): string {
  const { projectedBalance, trend, confidence } = projection;
  const trendEmoji = { improving: '📈', stable: '➡️', declining: '📉' }[trend];
  const sign = projectedBalance >= 0 ? '+' : '';
  return `${trendEmoji} ${sign}${projectedBalance.toFixed(2)}€ (${confidence}% confiance)`;
}

export function calculateDailyGoal(
  transactions: Transaction[],
  projection: MonthEndProjection
): DailyGoal {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const dayOfMonth = now.getDate();

  const currentMonthExpensesPast = transactions
    .filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth &&
             date.getFullYear() === currentYear &&
             date.getTime() <= now.getTime() &&
             t.amount < 0;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const current = dayOfMonth > 0 ? currentMonthExpensesPast / dayOfMonth : 0;

  const currentMonthExpensesAll = transactions
    .filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth &&
             date.getFullYear() === currentYear &&
             t.amount < 0;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const recurringExpensesRemaining = projection.expectedExpenses - currentMonthExpensesAll;
  const budgetAvailable = projection.currentBalance +
                         projection.expectedRevenue -
                         currentMonthExpensesPast -
                         recurringExpensesRemaining;

  let target: number;
  let message: string;
  let severity: 'safe' | 'warning' | 'danger';

  const fmt = (amount: number) => new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  if (projection.projectedBalance < 0) {
    target = Math.max(0, budgetAvailable / Math.max(1, projection.daysRemaining));
    message = `⚠️ Pour éviter le découvert : limitez vos dépenses à ${fmt(target)}/jour`;
    severity = 'danger';
  } else if (projection.projectedBalance < projection.expectedExpenses * 0.1) {
    const safetyMargin = Math.abs(budgetAvailable) * 0.1;
    target = Math.max(0, (budgetAvailable - safetyMargin) / Math.max(1, projection.daysRemaining));
    message = `⚠️ Pour maintenir une marge de sécurité : limitez à ${fmt(target)}/jour`;
    severity = 'warning';
  } else {
    const comfortMargin = Math.abs(budgetAvailable) * 0.15;
    target = Math.max(0, (budgetAvailable - comfortMargin) / Math.max(1, projection.daysRemaining));
    message = `✅ Bonne gestion ! Vous pouvez dépenser jusqu'à ${fmt(target)}/jour`;
    severity = 'safe';
  }

  return {
    current,
    target,
    adjustment: target - current,
    message,
    severity,
  };
}