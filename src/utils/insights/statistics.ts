/**
 * 📊 FONCTIONS STATISTIQUES DE BASE
 * 
 * Utilitaires mathématiques pour les calculs d'insights
 * Sans dépendance externe - 100% natif TypeScript
 */

/**
 * Calcule la moyenne d'un tableau de nombres
 */
export function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Calcule la médiane d'un tableau de nombres
   */
  export function median(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  /**
   * Calcule la variance d'un tableau de nombres
   */
  export function variance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const avg = mean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  }
  
  /**
   * Calcule l'écart-type (standard deviation) d'un tableau de nombres
   */
  export function standardDeviation(values: number[]): number {
    return Math.sqrt(variance(values));
  }
  
  /**
   * Calcule le Z-score d'une valeur
   * Z = (X - μ) / σ
   */
  export function zScore(value: number, values: number[]): number {
    const avg = mean(values);
    const stdDev = standardDeviation(values);
    
    if (stdDev === 0) return 0;
    return (value - avg) / stdDev;
  }
  
  /**
   * Calcule les quartiles (Q1, Q2/médiane, Q3)
   */
  export function quartiles(values: number[]): { q1: number; q2: number; q3: number } {
    if (values.length === 0) return { q1: 0, q2: 0, q3: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    const q1Index = Math.floor(n * 0.25);
    const q2Index = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);
    
    return {
      q1: sorted[q1Index],
      q2: sorted[q2Index],
      q3: sorted[q3Index],
    };
  }
  
  /**
   * Calcule l'Interquartile Range (IQR)
   * IQR = Q3 - Q1
   */
  export function iqr(values: number[]): number {
    const { q1, q3 } = quartiles(values);
    return q3 - q1;
  }
  
  /**
   * Détecte les outliers avec la méthode IQR
   * Outlier si : X < Q1 - 1.5×IQR  OU  X > Q3 + 1.5×IQR
   */
  export function isOutlierIQR(value: number, values: number[]): boolean {
    const { q1, q3 } = quartiles(values);
    const iqrValue = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqrValue;
    const upperBound = q3 + 1.5 * iqrValue;
    
    return value < lowerBound || value > upperBound;
  }
  
  /**
   * Calcule le coefficient de variation (CV)
   * CV = (σ / μ) × 100
   * Mesure la dispersion relative des données
   */
  export function coefficientOfVariation(values: number[]): number {
    const avg = mean(values);
    if (avg === 0) return 0;
    
    const stdDev = standardDeviation(values);
    return (stdDev / avg) * 100;
  }
  
  /**
   * Régression linéaire simple
   * Retourne la pente (slope) et l'ordonnée à l'origine (intercept)
   * y = slope × x + intercept
   */
  export function linearRegression(
    xValues: number[],
    yValues: number[]
  ): { slope: number; intercept: number; rSquared: number } {
    if (xValues.length !== yValues.length || xValues.length < 2) {
      return { slope: 0, intercept: 0, rSquared: 0 };
    }
    
    const n = xValues.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);
    
    // Calcul de la pente
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Calcul de l'ordonnée à l'origine
    const intercept = (sumY - slope * sumX) / n;
    
    // Calcul du R² (coefficient de détermination)
    const meanY = sumY / n;
    const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
    const ssResidual = yValues.reduce(
      (sum, y, i) => sum + Math.pow(y - (slope * xValues[i] + intercept), 2),
      0
    );
    const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;
    
    return { slope, intercept, rSquared };
  }
  
  /**
   * Calcule la distance de Levenshtein entre deux chaînes
   * Utilisé pour mesurer la similarité de texte
   */
  export function levenshteinDistance(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    const matrix: number[][] = [];
    
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[s2.length][s1.length];
  }
  
  /**
   * Calcule la similarité entre deux chaînes (0-1)
   * Basé sur la distance de Levenshtein normalisée
   */
  export function stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;
    
    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    return 1 - distance / maxLength;
  }
  
  /**
   * Calcule le nombre de jours entre deux dates
   */
  export function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // millisecondes dans un jour
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  }
  
  /**
   * Calcule le nombre de mois entre deux dates
   */
  export function monthsBetween(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    return years * 12 + months;
  }
  
  /**
   * Groupe des valeurs numériques dans des bins (histogramme)
   */
  export function histogram(
    values: number[],
    binCount: number = 10
  ): Array<{ min: number; max: number; count: number }> {
    if (values.length === 0) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / binCount;
    
    const bins: Array<{ min: number; max: number; count: number }> = [];
    
    for (let i = 0; i < binCount; i++) {
      const binMin = min + i * binSize;
      const binMax = binMin + binSize;
      const count = values.filter(v => v >= binMin && v < binMax).length;
      
      bins.push({ min: binMin, max: binMax, count });
    }
    
    return bins;
  }
  
  /**
   * Calcule la moyenne mobile (moving average)
   */
  export function movingAverage(values: number[], windowSize: number): number[] {
    if (values.length < windowSize) return values;
    
    const result: number[] = [];
    
    for (let i = 0; i <= values.length - windowSize; i++) {
      const window = values.slice(i, i + windowSize);
      result.push(mean(window));
    }
    
    return result;
  }
  
  /**
   * Détecte les tendances dans une série temporelle
   * Retourne 'increasing', 'decreasing', ou 'stable'
   */
  export function detectTrend(
    values: number[],
    threshold: number = 0.1
  ): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';
    
    const xValues = values.map((_, i) => i);
    const { slope } = linearRegression(xValues, values);
    
    const avgValue = mean(values);
    const normalizedSlope = slope / avgValue;
    
    if (normalizedSlope > threshold) return 'increasing';
    if (normalizedSlope < -threshold) return 'decreasing';
    return 'stable';
  }
  