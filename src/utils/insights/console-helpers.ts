/**
 * 🛠️ HELPERS CONSOLE - FLUX SMART
 * 
 * Fonctions utilitaires pour tester Flux Smart depuis la console
 */

import { Transaction } from 'contexts/DataContext';

/**
 * Récupère les transactions depuis localStorage
 */
export function getTransactions(): Transaction[] {
  try {
    // 🔍 Chercher la clé transactions avec le pattern flux_*_transactions
    let transactionsKey: string | null = null;
    
    // Parcourir toutes les clés localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.match(/^flux_.*_transactions$/)) {
        transactionsKey = key;
        break;
      }
    }
    
    // Si pas trouvé, essayer l'ancienne clé
    if (!transactionsKey) {
      transactionsKey = 'flux_transactions';
    }
    
    const stored = localStorage.getItem(transactionsKey);
    if (!stored) {
      console.warn('⚠️ Aucune transaction trouvée dans localStorage');
      console.warn(`   Clé recherchée: ${transactionsKey}`);
      console.warn(`   Clés disponibles:`, Object.keys(localStorage));
      return [];
    }
    
    const transactions = JSON.parse(stored);
    console.log(`✅ ${transactions.length} transactions chargées depuis ${transactionsKey}`);
    return transactions;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des transactions:', error);
    return [];
  }
}

/**
 * Affiche un résumé des transactions
 */
export function summarizeTransactions(transactions: Transaction[]) {
  const total = transactions.length;
  const revenue = transactions.filter(t => t.amount > 0).length;
  const expenses = transactions.filter(t => t.amount < 0).length;
  
  const totalRevenue = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  console.log(`
╔════════════════════════════════════════╗
║   📊 RÉSUMÉ DES TRANSACTIONS           ║
╠════════════════════════════════════════╣
║ Total : ${total.toString().padEnd(30)} ║
║ Revenus : ${revenue.toString().padEnd(28)} ║
║ Dépenses : ${expenses.toString().padEnd(27)} ║
║                                        ║
║ 💰 Revenus totaux : ${totalRevenue.toFixed(2).padEnd(17)} € ║
║ 💸 Dépenses totales : ${totalExpenses.toFixed(2).padEnd(15)} € ║
║ 📈 Solde net : ${(totalRevenue - totalExpenses).toFixed(2).padEnd(21)} € ║
╚════════════════════════════════════════╝
  `);
}

/**
 * Teste Flux Smart avec différents seuils de similarité
 */
export async function testAllThresholds(transactions?: Transaction[]) {
  const txns = transactions || getTransactions();
  
  if (txns.length === 0) {
    console.error('❌ Aucune transaction disponible pour le test');
    return;
  }
  
  const { testThresholds } = await import('./quick-benchmark');
  return testThresholds(txns);
}

/**
 * Lance un benchmark rapide
 */
export async function runQuickBenchmark(transactions?: Transaction[]) {
  const txns = transactions || getTransactions();
  
  if (txns.length === 0) {
    console.error('❌ Aucune transaction disponible pour le test');
    return;
  }
  
  const { quickBenchmark } = await import('./quick-benchmark');
  return quickBenchmark(txns);
}

// Exposer dans window pour accès console
if (typeof window !== 'undefined') {
  (window as any).fluxHelpers = {
    getTransactions,
    summarize: summarizeTransactions,
    testThresholds: testAllThresholds,
    benchmark: runQuickBenchmark,
  };
  
  console.log('🛠️ Flux Helpers disponibles !');
  console.log('');
  console.log('📝 Commandes disponibles :');
  console.log('  • fluxHelpers.getTransactions()     → Charge les transactions');
  console.log('  • fluxHelpers.summarize(txns)       → Affiche un résumé');
  console.log('  • fluxHelpers.benchmark()           → Lance le benchmark');
  console.log('  • fluxHelpers.testThresholds()      → Teste différents seuils');
  console.log('');
  console.log('🚀 Exemple rapide :');
  console.log('  const txns = fluxHelpers.getTransactions();');
  console.log('  fluxHelpers.benchmark(txns);');
  console.log('');
}

export {};