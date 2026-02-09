/**
 * 🔬 BENCHMARK RAPIDE FLUX SMART
 * 
 * Permet de comparer rapidement l'ancienne méthode vs Flux Smart
 * 
 * Utilisation dans la console (F12) :
 * 
 * import { quickBenchmark } from '@/utils/insights/src/utils/insights/quick-benchmark';
 * import { useData } from '@/utils/insights/contexts/DataContext';
 * const { transactions } = useData();
 * quickBenchmark(transactions);
 */

import { Transaction } from '@/contexts/DataContext';
import { detectRecurringPatterns, RecurringSettings } from '@/utils/insights/recurring-detection';

export interface BenchmarkResult {
  classic: {
    patterns: number;
    transactions: number;
    executionTime: number;
    patternsList: any[];
  };
  smart: {
    patterns: number;
    transactions: number;
    executionTime: number;
    patternsList: any[];
  };
  improvement: {
    patternsCount: number;
    patternsPercent: number;
    transactionsCount: number;
    newPatterns: any[];
    lostPatterns: any[];
  };
}

const baseSettings: RecurringSettings = {
  enabled: true,
  minOccurrences: 3,
  maxCoefficientVariation: 30,
  minConfidence: 50,
  activeMultiplier: 2,
  typeTolerance: 3,
};

/**
 * Lance un benchmark rapide comparant les 2 méthodes
 */
export function quickBenchmark(transactions: Transaction[]): BenchmarkResult {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔬 BENCHMARK FLUX SMART vs CLASSIQUE');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  // =====================================================
  // TEST 1 : Méthode Classique
  // =====================================================
  
  console.log('📌 Test 1 : Méthode Classique (Ancienne)');
  console.log('─────────────────────────────────────────');
  
  const startClassic = performance.now();
  const classicResult = detectRecurringPatterns(transactions, {
    ...baseSettings,
    useSemanticSimilarity: false,
  });
  const endClassic = performance.now();
  const classicTime = endClassic - startClassic;
  
  console.log(`⏱️  Temps d'exécution: ${classicTime.toFixed(2)} ms`);
  console.log(`📊 Récurrences détectées: ${classicResult.patterns.length}`);
  console.log(`🔢 Transactions récurrentes: ${classicResult.totalRecurringTransactions}`);
  console.log(`💰 Impact mensuel: ${classicResult.monthlyRecurringAmount.toFixed(2)} €`);
  console.log('');
  
  // =====================================================
  // TEST 2 : Méthode Flux Smart
  // =====================================================
  
  console.log('📌 Test 2 : Méthode Flux Smart (Nouvelle)');
  console.log('─────────────────────────────────────────');
  
  const startSmart = performance.now();
  const smartResult = detectRecurringPatterns(transactions, {
    ...baseSettings,
    useSemanticSimilarity: true,
    semanticMinScore: 70,
  });
  const endSmart = performance.now();
  const smartTime = endSmart - startSmart;
  
  console.log(`⏱️  Temps d'exécution: ${smartTime.toFixed(2)} ms`);
  console.log(`📊 Récurrences détectées: ${smartResult.patterns.length}`);
  console.log(`🔢 Transactions récurrentes: ${smartResult.totalRecurringTransactions}`);
  console.log(`💰 Impact mensuel: ${smartResult.monthlyRecurringAmount.toFixed(2)} €`);
  console.log('');
  
  // =====================================================
  // COMPARAISON
  // =====================================================
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 COMPARAISON DES RÉSULTATS');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  const patternsImprovement = smartResult.patterns.length - classicResult.patterns.length;
  const patternsImprovementPercent = classicResult.patterns.length > 0
    ? (patternsImprovement / classicResult.patterns.length) * 100
    : 0;
  
  const txnImprovement = smartResult.totalRecurringTransactions - classicResult.totalRecurringTransactions;
  
  // Performance
  const performanceDiff = smartTime - classicTime;
  const performancePercent = classicTime > 0 
    ? (performanceDiff / classicTime) * 100
    : 0;
  
  console.log('🎯 Précision :');
  console.log(`   Différence de récurrences: ${patternsImprovement > 0 ? '+' : ''}${patternsImprovement}`);
  console.log(`   Amélioration: ${patternsImprovementPercent > 0 ? '+' : ''}${patternsImprovementPercent.toFixed(1)}%`);
  console.log(`   Différence de transactions: ${txnImprovement > 0 ? '+' : ''}${txnImprovement}`);
  console.log('');
  
  console.log('⚡ Performance :');
  console.log(`   Différence: ${performanceDiff > 0 ? '+' : ''}${performanceDiff.toFixed(2)} ms`);
  console.log(`   Impact: ${performancePercent > 0 ? '+' : ''}${performancePercent.toFixed(1)}%`);
  console.log('');
  
  // Nouvelles récurrences détectées par Flux Smart
  const newPatterns = smartResult.patterns.filter(sp =>
    !classicResult.patterns.some(cp => cp.description === sp.description)
  );
  
  // Récurrences perdues (détectées par Classique mais pas par Smart)
  const lostPatterns = classicResult.patterns.filter(cp =>
    !smartResult.patterns.some(sp => sp.description === cp.description)
  );
  
  if (newPatterns.length > 0) {
    console.log('🆕 Nouvelles récurrences détectées par Flux Smart :');
    newPatterns.forEach(p => {
      const amount = p.averageAmount > 0 
        ? `+${p.averageAmount.toFixed(2)}` 
        : p.averageAmount.toFixed(2);
      console.log(`   • ${p.description}`);
      console.log(`     ${p.transactions.length} occurrences • ${amount} € • ${p.category}`);
    });
    console.log('');
  }
  
  if (lostPatterns.length > 0) {
    console.log('⚠️  Récurrences non détectées par Flux Smart (possibles faux positifs) :');
    lostPatterns.forEach(p => {
      const amount = p.averageAmount > 0 
        ? `+${p.averageAmount.toFixed(2)}` 
        : p.averageAmount.toFixed(2);
      console.log(`   • ${p.description}`);
      console.log(`     ${p.transactions.length} occurrences • ${amount} €`);
    });
    console.log('');
  }
  
  // Verdict
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎯 VERDICT :');
  console.log('═══════════════════════════════════════════════════════');
  
  if (patternsImprovementPercent > 10) {
    console.log('✅ Flux Smart détecte significativement PLUS de récurrences');
    console.log(`   Recommandation: ACTIVER Flux Smart (${patternsImprovementPercent.toFixed(0)}% de gain)`);
  } else if (patternsImprovementPercent > 0) {
    console.log('✅ Flux Smart détecte légèrement PLUS de récurrences');
    console.log(`   Recommandation: ACTIVER Flux Smart (${patternsImprovementPercent.toFixed(0)}% de gain)`);
  } else if (patternsImprovementPercent < -10) {
    console.log('⚠️  Flux Smart détecte MOINS de récurrences (possible sur-filtrage)');
    console.log(`   Recommandation: Ajuster le seuil semanticMinScore (actuellement 70)`);
  } else {
    console.log('➡️  Résultats similaires entre les 2 méthodes');
    console.log(`   Recommandation: ACTIVER Flux Smart pour bénéficier du meilleur regroupement`);
  }
  
  if (performanceDiff > 50) {
    console.log(`⚠️  Impact performance: +${performanceDiff.toFixed(0)} ms (peut être optimisé avec cache)`);
  } else {
    console.log(`✅ Impact performance négligeable: ${performanceDiff.toFixed(0)} ms`);
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  return {
    classic: {
      patterns: classicResult.patterns.length,
      transactions: classicResult.totalRecurringTransactions,
      executionTime: classicTime,
      patternsList: classicResult.patterns,
    },
    smart: {
      patterns: smartResult.patterns.length,
      transactions: smartResult.totalRecurringTransactions,
      executionTime: smartTime,
      patternsList: smartResult.patterns,
    },
    improvement: {
      patternsCount: patternsImprovement,
      patternsPercent: patternsImprovementPercent,
      transactionsCount: txnImprovement,
      newPatterns,
      lostPatterns,
    },
  };
}

/**
 * Affiche un rapport détaillé de comparaison pattern par pattern
 */
export function detailedComparison(classicPatterns: any[], smartPatterns: any[]) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 RAPPORT DE COMPARAISON DÉTAILLÉ');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  // Patterns communs
  const common = smartPatterns.filter(sp =>
    classicPatterns.some(cp => cp.description === sp.description)
  );
  
  // Patterns uniquement dans Flux Smart
  const onlyInSmart = smartPatterns.filter(sp =>
    !classicPatterns.some(cp => cp.description === sp.description)
  );
  
  // Patterns uniquement dans Classique
  const onlyInClassic = classicPatterns.filter(cp =>
    !smartPatterns.some(sp => sp.description === cp.description)
  );
  
  console.log(`✅ Récurrences communes: ${common.length}`);
  console.log(`🆕 Détectées uniquement par Flux Smart: ${onlyInSmart.length}`);
  console.log(`📊 Détectées uniquement par Classique: ${onlyInClassic.length}`);
  console.log('');
  
  if (common.length > 0) {
    console.log('✅ Récurrences communes aux 2 méthodes :');
    console.log('─────────────────────────────────────────');
    common.forEach(p => {
      console.log(`  • ${p.description}`);
      console.log(`    ${p.transactions.length} occurrences, ${p.averageAmount.toFixed(2)} €/mois, confiance: ${p.confidence.toFixed(0)}%`);
    });
    console.log('');
  }
  
  if (onlyInSmart.length > 0) {
    console.log('🆕 Nouvelles détections (Flux Smart uniquement) :');
    console.log('─────────────────────────────────────────');
    onlyInSmart.forEach(p => {
      console.log(`  • ${p.description}`);
      console.log(`    ${p.transactions.length} occurrences, ${p.averageAmount.toFixed(2)} €/mois`);
      console.log(`    Catégorie: ${p.category}, Confiance: ${p.confidence.toFixed(0)}%`);
    });
    console.log('');
  }
  
  if (onlyInClassic.length > 0) {
    console.log('⚠️  Faux positifs potentiels (Classique uniquement) :');
    console.log('─────────────────────────────────────────');
    onlyInClassic.forEach(p => {
      console.log(`  • ${p.description}`);
      console.log(`    ${p.transactions.length} occurrences, ${p.averageAmount.toFixed(2)} €/mois`);
      console.log(`    Confiance: ${p.confidence.toFixed(0)}%`);
    });
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

/**
 * Test avec différents seuils de similarité
 */
export function testThresholds(transactions: Transaction[]) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔧 TEST DES SEUILS DE SIMILARITÉ');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  const thresholds = [60, 65, 70, 75, 80];
  
  console.log('Seuil | Récurrences | Transactions | Temps');
  console.log('─────────────────────────────────────────────────');
  
  thresholds.forEach(threshold => {
    const start = performance.now();
    const result = detectRecurringPatterns(transactions, {
      ...baseSettings,
      useSemanticSimilarity: true,
      semanticMinScore: threshold,
    });
    const end = performance.now();
    
    console.log(`  ${threshold}  |     ${result.patterns.length.toString().padStart(2, ' ')}      |      ${result.totalRecurringTransactions.toString().padStart(3, ' ')}       | ${(end - start).toFixed(1)} ms`);
  });
  
  console.log('─────────────────────────────────────────────────');
  console.log('');
  console.log('💡 Recommandation :');
  console.log('   • Seuil 60-65 : Plus de récurrences (risque de faux positifs)');
  console.log('   • Seuil 70 : Équilibre (RECOMMANDÉ)');
  console.log('   • Seuil 75-80 : Moins de récurrences (plus strict)');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

// Exporter pour utilisation dans la console
(window as any).fluxSmartBenchmark = {
  quick: quickBenchmark,
  detailed: detailedComparison,
  testThresholds,
};

console.log('🔬 Flux Smart Benchmark chargé !');
console.log('Utilisation dans la console :');
console.log('  fluxSmartBenchmark.quick(transactions)');
console.log('  fluxSmartBenchmark.testThresholds(transactions)');