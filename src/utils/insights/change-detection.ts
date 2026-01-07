/**
 * CHANGE DETECTION ALGORITHM
 * Détection simple et efficace des changements brutaux dans les séries temporelles
 */

export interface MonthlyAmount {
    month: string; // Format: "2024-01"
    amount: number;
    category: string;
  }
  
  export interface ChangeAlert {
    month: string;
    type: 'spike' | 'drop';
    percent: number;
    category: string;
    previousAverage: number;
    currentAmount: number;
  }
  
  /**
   * Calcule la moyenne d'un tableau de nombres
   */
  function average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Détecte les changements brutaux (>30% vs moyenne mobile sur 3 mois)
   */
  export function detectChanges(
    categoryData: MonthlyAmount[],
    threshold: number = 0.3 // 30% par défaut
  ): ChangeAlert[] {
    const alerts: ChangeAlert[] = [];
  
    // On a besoin d'au moins 4 mois de données (3 pour la moyenne + 1 pour comparer)
    if (categoryData.length < 4) return alerts;
  
    for (let i = 3; i < categoryData.length; i++) {
      const previous3Months = categoryData.slice(i - 3, i).map(d => d.amount);
      const avg3Months = average(previous3Months);
      const current = categoryData[i];
  
      // Éviter la division par zéro
      if (avg3Months === 0) continue;
  
      const change = (current.amount - avg3Months) / avg3Months;
  
      if (Math.abs(change) > threshold) {
        alerts.push({
          month: current.month,
          type: change > 0 ? 'spike' : 'drop',
          percent: Math.round(change * 100),
          category: current.category,
          previousAverage: Math.round(avg3Months),
          currentAmount: Math.round(current.amount),
        });
      }
    }
  
    return alerts;
  }
  
  /**
   * Détecte les changements pour toutes les catégories
   */
  export function detectAllCategoryChanges(
    data: MonthlyAmount[],
    threshold: number = 0.3
  ): Map<string, ChangeAlert[]> {
    const changesByCategory = new Map<string, ChangeAlert[]>();
  
    // Regrouper par catégorie
    const categoriesMap = new Map<string, MonthlyAmount[]>();
    
    data.forEach(item => {
      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, []);
      }
      categoriesMap.get(item.category)!.push(item);
    });
  
    // Détecter les changements pour chaque catégorie
    categoriesMap.forEach((categoryData, category) => {
      // Trier par mois chronologique
      const sortedData = categoryData.sort((a, b) => 
        a.month.localeCompare(b.month)
      );
  
      const alerts = detectChanges(sortedData, threshold);
      if (alerts.length > 0) {
        changesByCategory.set(category, alerts);
      }
    });
  
    return changesByCategory;
  }
  
  /**
   * Obtient les N changements les plus significatifs
   */
  export function getTopChanges(
    changes: Map<string, ChangeAlert[]>,
    limit: number = 10
  ): ChangeAlert[] {
    const allAlerts: ChangeAlert[] = [];
  
    changes.forEach(alerts => {
      allAlerts.push(...alerts);
    });
  
    // Trier par magnitude du changement (valeur absolue)
    return allAlerts
      .sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent))
      .slice(0, limit);
  }
  