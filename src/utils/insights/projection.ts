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
  // 🆕 NOUVEAUX CHAMPS COMPORTEMENTAUX
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
// 🎯 DÉTECTEUR MASLOW DYNAMIQUE - BASÉ SUR MOTS-CLÉS
// ================================================================

/**
 * Détecte le comportement Maslow d'une catégorie de façon DYNAMIQUE
 * en analysant les mots-clés au lieu d'un mapping statique
 */
export function getBehavior(category?: string): 'STRICT' | 'FLEXIBLE' | 'BURN_RATE' {
  if (!category) return 'BURN_RATE';
  
  const normalized = category.toUpperCase().trim();
  
  // 🏠 STRICT - Factures fixes et prévisibles (besoins vitaux contraignants)
  const strictKeywords = [
    'ABRI', 'ÉNERGIE', 'ENERGIE', 'LOYER', 'CRÉDIT', 'CREDIT', 'IMMOBILIER',
    'ÉLECTRICITÉ', 'ELECTRICITE', 'GAZ', 'EAU', 'CHARGES', 'TAXE', 'FONCIERE',
    'ABONNEMENT', 'SERVICE', 'DETTE', 'RÉGULARISATION', 'REGULARISATION',
    'ASSURANCE', 'IMPÔT', 'IMPOT', 'MUTUELLE',
    'SALAIRE', 'REVENU', 'RESSOURCE', 'PRÉVOYANCE', 'PREVOYANCE',
    'MOBILE', 'INTERNET', 'FIBRE', 'FORFAIT'
  ];
  
  // 🌿 FLEXIBLE - Variables mais nécessaires (besoins vitaux flexibles)
  const flexibleKeywords = [
    'SANTÉ', 'SANTE', 'INTÉGRITÉ', 'INTEGRITE', 'PHARMACIE', 'MÉDECIN', 'MEDECIN',
    'NUTRITION', 'ALIMENTATION', 'SUPERMARCHÉ', 'SUPERMARCHE', 'MARCHÉ', 'MARCHE',
    'MOBILITÉ', 'MOBILITE', 'TRANSPORT', 'CARBURANT', 'PÉAGE', 'PEAGE',
    'ÉQUIPEMENT', 'EQUIPEMENT', 'DOMESTIQUE', 'ÉLECTROMÉNAGER', 'ELECTROMENAGER',
    'CONNECTIVITÉ', 'CONNECTIVITE', 'FONCTIONNEL'
  ];
  
  // 🎨 BURN_RATE - Dépenses discrétionnaires (tout le reste)
  const burnRateKeywords = [
    'LOISIR', 'DIVERTISSEMENT', 'SHOPPING', 'ESTHÉTIQUE', 'ESTHETIQUE',
    'SOCIAL', 'RELATION', 'RESTAURANT', 'CAFÉ', 'CAFE', 'BAR',
    'CULTURE', 'MÉDIA', 'MEDIA', 'STREAMING', 'CINÉMA', 'CINEMA',
    'SPORT', 'COLLECTIF', 'APPARENCE', 'ESTIME', 'CONFORT', 'TEMPS',
    'HOBBY', 'PASSION', 'VOYAGE', 'EXCEPTIONNEL', 'FORMATION', 'SAVOIR',
    'INVESTISSEMENT', 'ACTIF', 'PROJET', 'PERSONNEL', 'PHILANTHROPIE',
    'TRANSMISSION', 'HÉRITAGE', 'HERITAGE'
  ];
  
  // Vérifier STRICT en premier (prioritaire)
  for (const keyword of strictKeywords) {
    if (normalized.includes(keyword)) {
      return 'STRICT';
    }
  }
  
  // Puis FLEXIBLE
  for (const keyword of flexibleKeywords) {
    if (normalized.includes(keyword)) {
      return 'FLEXIBLE';
    }
  }
  
  // Puis BURN_RATE explicite
  for (const keyword of burnRateKeywords) {
    if (normalized.includes(keyword)) {
      return 'BURN_RATE';
    }
  }
  
  // Par défaut : BURN_RATE (si aucun mot-clé ne match)
  return 'BURN_RATE';
}

/**
 * Normalisation des libellés pour le groupement
 */
export function normalizeDescription(desc: string): string {
  return desc
    .toUpperCase()
    .replace(/[0-9]/g, '')
    .replace(/\b(JANV|FEV|MARS|AVRIL|MAI|JUIN|JUIL|AOUT|SEPT|OCT|NOV|DEC)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcul de la projection de fin de mois (Moteur V3 - MASLOW ENHANCED)
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

  // 🔍 ÉTAPE 1 : ANALYSE DES TRANSACTIONS
  console.group('🔍 ÉTAPE 1 : ANALYSE DES TRANSACTIONS');
  console.log('Total transactions:', transactions.length);
  console.log('Mois analysé:', currentMonth + 1, '/', currentYear);
  console.log('Jours restants:', daysRemaining);
  
  const positiveTransactions = transactions.filter(t => t.amount > 0);
  console.log('→ Revenus potentiels:', positiveTransactions.length);
  
  if (positiveTransactions.length > 0 && positiveTransactions.length <= 5) {
    console.log('→ Exemples de REVENUS:');
    positiveTransactions.forEach(t => {
      const behavior = getBehavior(t.category);
      console.log(`   • ${t.description.substring(0, 50)}`);
      console.log(`     ${t.amount}€ | ${new Date(t.date).toLocaleDateString()}`);
      console.log(`     Catégorie: ${t.category || 'Non catégorisé'} → Behavior: ${behavior}`);
    });
  }
  console.groupEnd();

  // 1. Transactions du mois en cours
  const currentMonthTxns = transactions.filter(txn => {
    const d = new Date(txn.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).map(txn => ({
    ...txn,
    amount: typeof txn.amount === 'string' ? parseFloat(txn.amount) : (txn.amount || 0)
  }));

  const sumCurrentMonth = currentMonthTxns.reduce((sum, txn) => sum + txn.amount, 0);
  const previousMonthEndBalance = safeBalance - sumCurrentMonth;

  // 2. DÉTECTION DES RÉCURRENCES
  const groups: { [key: string]: Transaction[] } = {};

  transactions.forEach(t => {
    if (t.amount === 0 || t.description.toLowerCase().includes('virement interne')) return;
    
    const normName = normalizeDescription(t.description);
    const behavior = getBehavior(t.category);
    
    // Clé adaptée au comportement
    let groupKey: string;
    if (behavior === 'STRICT') {
      // Pour STRICT : groupe par nom (montant peut varier légèrement)
      groupKey = `${t.amount > 0 ? 'IN' : 'OUT'}-${normName}-STRICT`;
    } else if (behavior === 'FLEXIBLE') {
      // Pour FLEXIBLE : arrondit à 10€ près
      groupKey = `${t.amount > 0 ? 'IN' : 'OUT'}-${normName}-${Math.round(Math.abs(t.amount) / 10) * 10}`;
    } else {
      // BURN_RATE : pas de prédiction
      groupKey = `${t.amount > 0 ? 'IN' : 'OUT'}-${normName}-BURN`;
    }
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push({
      ...t,
      amount: typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount || 0)
    });
  });

  // 🔍 ÉTAPE 2 : GROUPEMENT
  console.group('🔍 ÉTAPE 2 : GROUPEMENT AVEC MASLOW');
  const revenueGroups = Object.entries(groups).filter(([k]) => k.startsWith('IN-'));
  console.log('→ Groupes de REVENUS:', revenueGroups.length);
  
  if (revenueGroups.length > 0) {
    console.log('\n📊 TOP 10 GROUPES DE REVENUS:');
    revenueGroups
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 10)
      .forEach(([, txns], idx) => {
        const behavior = getBehavior(txns[0].category);
        const avgAmount = txns.reduce((s, t) => s + t.amount, 0) / txns.length;
        console.log(`\n   ${idx + 1}. "${txns[0].description.substring(0, 40)}..."`);
        console.log(`      → Comportement: ${behavior} (${txns[0].category || 'Non catégorisé'})`);
        console.log(`      → Occurrences: ${txns.length}`);
        console.log(`      → Montant moyen: ${avgAmount.toFixed(2)}€`);
      });
  }
  console.groupEnd();

  // 🔍 ÉTAPE 3 : ANALYSE ET FILTRAGE AVEC MASLOW
  console.group('🔍 ÉTAPE 3 : FILTRAGE INTELLIGENT (MASLOW)');
  
  const allPredictions: RecurringPrediction[] = [];
  const rejectionDetails: any[] = [];
  let groupIndex = 0;

  Object.entries(groups).forEach(([, groupTxns]) => {
    groupIndex++;
    const isRevenue = groupTxns[0].amount > 0;
    const behavior = getBehavior(groupTxns[0].category);
    
    // Skip BURN_RATE (sauf si revenus)
    if (behavior === 'BURN_RATE' && !isRevenue) return;
    
    // Log détaillé pour les revenus et STRICT
    const shouldLog = isRevenue || behavior === 'STRICT';
    
    if (shouldLog) {
      console.log(`\n${isRevenue ? '💰' : '🏠'} Groupe #${groupIndex}: "${groupTxns[0].description.substring(0, 35)}..."`);
      console.log(`   → Behavior: ${behavior} (${groupTxns[0].category || 'Non catégorisé'})`);
    }
    
    // 🎯 SEUIL ADAPTATIF SELON MASLOW
    let minOccurrences = 2;
    let minConfidence = 75;
    
    if (behavior === 'STRICT' || isRevenue) {
      // STRICT ou Revenus : plus permissif
      minOccurrences = 2;
      minConfidence = 60; // Abaissé de 75% à 60%
    } else if (behavior === 'FLEXIBLE') {
      minOccurrences = 3;
      minConfidence = 70;
    }
    
    if (groupTxns.length < minOccurrences) {
      if (shouldLog) {
        console.log(`   ❌ REJETÉ: ${groupTxns.length} occurrence(s) < ${minOccurrences}`);
      }
      rejectionDetails.push({
        description: groupTxns[0].description.substring(0, 40),
        type: isRevenue ? 'REVENU' : 'DÉPENSE',
        behavior,
        occurrences: groupTxns.length,
        raison: `Moins de ${minOccurrences} occurrences`,
      });
      return;
    }

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
    let regularityScore = Math.max(0, 100 - (stdDev / avgInterval * 100));

    // 🎯 BOOST DE CONFIANCE SELON MASLOW
    if (behavior === 'STRICT') {
      regularityScore += 20; // +20% pour factures fixes
    } else if (behavior === 'FLEXIBLE') {
      regularityScore += 10; // +10% pour variables
    }
    
    // Boost supplémentaire pour les revenus
    if (isRevenue) {
      regularityScore += 15; // +15% pour les revenus
    }

    const daysSinceLast = (now.getTime() - new Date(groupTxns[0].date).getTime()) / (1000 * 3600 * 24);
    const recencyPenalty = daysSinceLast > (avgInterval * 1.5) ? 25 : 0;
    const finalConfidence = Math.round(Math.min(100, regularityScore - recencyPenalty));

    if (shouldLog) {
      console.log(`   → Occurrences: ${groupTxns.length}`);
      console.log(`   → Intervalle moyen: ${avgInterval.toFixed(1)}j`);
      console.log(`   → Régularité de base: ${(regularityScore - (behavior === 'STRICT' ? 20 : behavior === 'FLEXIBLE' ? 10 : 0) - (isRevenue ? 15 : 0)).toFixed(1)}%`);
      if (behavior === 'STRICT') console.log(`   → Bonus STRICT: +20%`);
      if (behavior === 'FLEXIBLE') console.log(`   → Bonus FLEXIBLE: +10%`);
      if (isRevenue) console.log(`   → Bonus REVENU: +15%`);
      console.log(`   → Confiance finale: ${finalConfidence}%`);
      console.log(`   → Seuil requis: ≥${minConfidence}%`);
    }

    const isReliable = finalConfidence >= minConfidence;

    if (shouldLog) {
      console.log(`   → Résultat: ${isReliable ? '✅ ACCEPTÉ' : '❌ REJETÉ'}`);
    }

    if (!isReliable) {
      rejectionDetails.push({
        description: groupTxns[0].description.substring(0, 40),
        type: isRevenue ? 'REVENU' : 'DÉPENSE',
        behavior,
        occurrences: groupTxns.length,
        confiance: finalConfidence,
        raison: `Confiance ${finalConfidence}% < ${minConfidence}%`,
      });
      return;
    }

    const names = groupTxns.map(t => t.description);
    const rawDescription = names.sort((a, b) =>
      names.filter(v => v === a).length - names.filter(v => v === b).length
    ).pop() || groupTxns[0].description;

    const avgAmount = groupTxns.reduce((sum, t) => sum + t.amount, 0) / groupTxns.length;
    const nextDate = new Date(groupTxns[0].date);
    nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));
    
    if (shouldLog) {
      console.log(`   ✅ Prochaine date prévue: ${nextDate.toLocaleDateString('fr-FR')}`);
    }
    
    // 🆕 ENRICHISSEMENT COMPORTEMENTAL
    const behavioralProfile = getCategoryBehavioralProfileCached(groupTxns[0].category);
    
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
      confidenceLevel: finalConfidence >= 90 ? 'high' : (finalConfidence >= 70 ? 'medium' : 'low'),
      category: groupTxns[0].category,
      behavior: behavior,
      // 🆕 NOUVEAUX CHAMPS COMPORTEMENTAUX
      behavioralAxis: behavioralProfile.axis,
      compressibilityScore: behavioralProfile.compressibilityScore,
      priority: behavioralProfile.priority
    });
  });

  // Résumé
  const revenueRejections = rejectionDetails.filter(r => r.type === 'REVENU');
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`→ Prédictions acceptées: ${allPredictions.length}`);
  console.log(`   • Revenus: ${allPredictions.filter(p => p.type === 'revenue').length}`);
  console.log(`   • Dépenses: ${allPredictions.filter(p => p.type === 'expense').length}`);
  console.log(`→ Groupes rejetés: ${rejectionDetails.length}`);
  console.log(`   • Revenus rejetés: ${revenueRejections.length}`);
  
  console.groupEnd();

  // 3. CALCULS FINANCIERS
  console.group('🔍 ÉTAPE 4 : PROJECTION FINALE');
  
  const endOfMonth = new Date(currentYear, currentMonth, lastDayOfMonth, 23, 59, 59);
  const recurringThisMonth = allPredictions.filter(p => {
    const nextDate = new Date(p.nextExpectedDate);
    return nextDate > now && nextDate <= endOfMonth;
  });

  console.log(`Prédictions ce mois: ${recurringThisMonth.length}`);
  
  const recurringRevenue = recurringThisMonth.filter(p => p.type === 'revenue').reduce((sum, p) => sum + p.amount, 0);
  let recurringExpenses = recurringThisMonth.filter(p => p.type === 'expense').reduce((sum, p) => sum + Math.abs(p.amount), 0);

  // 🆕 DÉTAIL DES RÉCURRENCES PRÉVUES CE MOIS
  console.log('\n💰 RÉCURRENCES PRÉVUES CE MOIS - DÉTAIL COMPLET:');
  console.log('─'.repeat(80));
  
  const revenuesThisMonth = recurringThisMonth.filter(p => p.type === 'revenue');
  const expensesThisMonth = recurringThisMonth.filter(p => p.type === 'expense');
  
  console.log(`\n✅ REVENUS RÉCURRENTS CE MOIS (${revenuesThisMonth.length}) :`);
  if (revenuesThisMonth.length > 0) {
    revenuesThisMonth.forEach((p, idx) => {
      console.log(`\n   ${idx + 1}. ${p.rawDescription.substring(0, 60)}`);
      console.log(`      💶 Montant: +${p.amount.toFixed(2)}€`);
      console.log(`      📅 Date prévue: ${new Date(p.nextExpectedDate).toLocaleDateString('fr-FR')}`);
      console.log(`      📊 Confiance: ${p.confidence}%`);
      console.log(`      🔄 Basé sur ${p.occurrences} occurrences (tous les ${p.intervalDays}j)`);
      console.log(`      🏷️ Catégorie: ${p.category || 'Non catégorisé'}`);
    });
    console.log(`\n   ═══════════════════════════════════════════════════`);
    console.log(`   💰 TOTAL REVENUS RÉCURRENTS: +${recurringRevenue.toFixed(2)}€`);
    console.log(`   ═══════════════════════════════════════════════════`);
  } else {
    console.log('   (Aucun revenu récurrent prévu ce mois)');
  }
  
  console.log(`\n\n❌ DÉPENSES RÉCURRENTES CE MOIS (${expensesThisMonth.length}) :`);
  if (expensesThisMonth.length > 0) {
    expensesThisMonth.forEach((p, idx) => {
      console.log(`\n   ${idx + 1}. ${p.rawDescription.substring(0, 60)}`);
      console.log(`      💶 Montant: ${p.amount.toFixed(2)}€`);
      console.log(`      📅 Date prévue: ${new Date(p.nextExpectedDate).toLocaleDateString('fr-FR')}`);
      console.log(`      📊 Confiance: ${p.confidence}%`);
      console.log(`      🔄 Basé sur ${p.occurrences} occurrences (tous les ${p.intervalDays}j)`);
      console.log(`      🏷️ Catégorie: ${p.category || 'Non catégorisé'}`);
    });
    console.log(`\n   ═══════════════════════════════════════════════════`);
    console.log(`   💸 TOTAL DÉPENSES RÉCURRENTES: -${recurringExpenses.toFixed(2)}€`);
    console.log(`   ═══════════════════════════════════════════════════`);
  } else {
    console.log('   (Aucune dépense récurrente prévue ce mois)');
  }
  
  console.log('\n' + '─'.repeat(80));

  if (settings?.inflationFactor && settings.inflationFactor > 1) {
    recurringExpenses *= settings.inflationFactor;
  }

  const completedRevenue = currentMonthTxns.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const completedExpenses = currentMonthTxns.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalRevenue = completedRevenue + recurringRevenue;
  const totalExpenses = completedExpenses + recurringExpenses;
  const projectedBalance = previousMonthEndBalance + totalRevenue - totalExpenses;

  console.log('\n📈 FORMULE:');
  console.log(`Solde fin mois dernier: ${previousMonthEndBalance.toFixed(2)}€`);
  console.log(`+ Revenus complétés: ${completedRevenue.toFixed(2)}€`);
  console.log(`+ Revenus récurrents: ${recurringRevenue.toFixed(2)}€`);
  console.log(`- Dépenses complétées: ${completedExpenses.toFixed(2)}€`);
  console.log(`- Dépenses récurrentes: ${recurringExpenses.toFixed(2)}€`);
  console.log(`\n🎯 PROJECTION: ${projectedBalance.toFixed(2)}€`);
  
  console.groupEnd();

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

// Fonctions utilitaires
export function isSimilarDescription(d1: string, d2: string): boolean {
  const n1 = normalizeDescription(d1);
  const n2 = normalizeDescription(d2);
  
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  return calculateStringSimilarity(n1, n2) > 0.85; 
}

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

export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
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