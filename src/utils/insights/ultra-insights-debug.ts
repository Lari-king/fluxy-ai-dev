/**
 * ULTRA INSIGHTS DEBUG HELPER
 * Utilitaire pour déboguer les problèmes d'Ultra Insights
 */

export function debugUltraInsights() {
    const userId = localStorage.getItem('flux_auth_token');
    if (!userId) {
      console.error('❌ Aucun utilisateur connecté');
      return;
    }
  
    const transactions = JSON.parse(
      localStorage.getItem(`flux_${userId}_transactions`) || '[]'
    );
    const categories = JSON.parse(
      localStorage.getItem(`flux_${userId}_categories`) || '[]'
    );
  
    console.group('🔬 Ultra Insights Debug');
    console.log('👤 UserID:', userId);
    console.log('📊 Transactions:', transactions.length);
    console.log('🏷️ Catégories:', categories.length);
    
    if (transactions.length === 0) {
      console.warn('⚠️ Aucune transaction trouvée. Importez des données pour utiliser Ultra Insights.');
      console.groupEnd();
      return;
    }
  
    if (categories.length === 0) {
      console.warn('⚠️ Aucune catégorie trouvée. Créez des catégories pour utiliser Ultra Insights.');
      console.groupEnd();
      return;
    }
  
    // Analyser la répartition par catégorie
    const byCategory: Record<string, number> = {};
    transactions.forEach((t: any) => {
      const catName = categories.find((c: any) => c.id === t.category)?.name || 'Non catégorisé';
      byCategory[catName] = (byCategory[catName] || 0) + 1;
    });
    
    console.log('\n📊 Répartition par catégorie:');
    console.table(byCategory);
    
    // Analyser la plage de dates
    const dates = transactions.map((t: any) => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const monthsDiff = Math.floor((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    console.log('\n📅 Plage de dates:');
    console.log('  Première transaction:', minDate.toLocaleDateString('fr-FR'));
    console.log('  Dernière transaction:', maxDate.toLocaleDateString('fr-FR'));
    console.log('  Durée:', monthsDiff, 'mois');
    
    if (monthsDiff < 4) {
      console.warn('⚠️ Moins de 4 mois de données. Certaines analyses peuvent être limitées.');
    } else {
      console.log('✅ Données suffisantes pour Ultra Insights');
    }
  
    // Analyser la qualité des données
    const withoutCategory = transactions.filter((t: any) => !t.category || t.category === '').length;
    const withoutDate = transactions.filter((t: any) => !t.date).length;
    const withoutAmount = transactions.filter((t: any) => !t.amount).length;
  
    console.log('\n🔍 Qualité des données:');
    console.log('  Sans catégorie:', withoutCategory);
    console.log('  Sans date:', withoutDate);
    console.log('  Sans montant:', withoutAmount);
    
    if (withoutCategory > 0) {
      console.warn(`⚠️ ${withoutCategory} transactions sans catégorie. Catégorisez-les pour améliorer l'analyse.`);
    }
  
    // Test rapide de détection de changements
    console.log('\n🧪 Test de détection de changements...');
    try {
      const monthlyMap = new Map<string, Map<string, number>>();
      
      transactions.forEach((txn: any) => {
        const date = new Date(txn.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, new Map());
        }
        
        const categoryMap = monthlyMap.get(monthKey)!;
        const currentAmount = categoryMap.get(txn.category) || 0;
        categoryMap.set(txn.category, currentAmount + Math.abs(txn.amount));
      });
  
      console.log('  Mois analysés:', monthlyMap.size);
      console.log('  Mois:', Array.from(monthlyMap.keys()).sort());
      
      if (monthlyMap.size >= 4) {
        console.log('✅ Suffisant pour la détection de changements (moyenne mobile 3 mois)');
      } else {
        console.warn('⚠️ Pas assez de mois pour la détection de changements optimale');
      }
    } catch (err) {
      console.error('❌ Erreur lors du test:', err);
    }
  
    console.groupEnd();
    
    return {
      transactions: transactions.length,
      categories: categories.length,
      monthsCovered: monthsDiff,
      quality: {
        withoutCategory,
        withoutDate,
        withoutAmount,
      },
    };
  }
  
  // Exposer dans window pour accès console
  if (typeof window !== 'undefined') {
    (window as any).debugUltraInsights = debugUltraInsights;
    console.log('💡 Tapez "debugUltraInsights()" dans la console pour diagnostiquer Ultra Insights');
  }
  