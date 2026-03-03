/**
 * 🧠 MOTEUR DE SIMILARITÉ SÉMANTIQUE - FLUX SMART (version optimisée 2026)
 * * Objectifs :
 * - < 1 ms par comparaison effective
 * - Clustering O(n) grâce au groupage par marque
 * - Protection contre les données corrompues (undefined/null)
 * - Fusion géographique (Paris/Amsterdam/etc.) pour les abonnements mondiaux
 */

import type { Transaction } from '@/features/transactions/types';

// ========================================
// TYPES
// ========================================

export interface SimilarityResult {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  normalizedDesc1: string;
  normalizedDesc2: string;
  extractedBrand1?: string;
  extractedBrand2?: string;
}

export interface ClusterResult {
  clusters: Map<string, Transaction[]>;
  orphans: Transaction[];
  statistics: {
    totalClusters: number;
    averageClusterSize: number;
    largestCluster: number;
  };
}

// ========================================
// DICTIONNAIRE DE MARQUES CONNUES
// ========================================

export const KNOWN_BRANDS: string[] = [
  'disney plus', 'disney+', 'amazon prime', 'prime video', 'youtube premium', 'google workspace', 'creative cloud', 'linkedin premium',
  'google one', 'apple music', 'mycanal', 'canal+', 'deezer', 'netflix', 'spotify', 'youtube',
  'bnp paribas cardif', 'credit agricole', 'societe generale', 'credit mutuel', 'mutualite sociale agricole',
  'la poste mobile', 'la poste telecom', 'bouygues telecom', 'free mobile', 'b&you', 'sosh',
  'totalenergies', 'eau de paris', 'western union', 'uber eats', 'uber', 'bolt', 'sncf', 'ratp', 'navigo', 'transdev',
  'leroy merlin', 'decathlon', 'sumup', 'apple', 'google', 'microsoft', 'orange', 'free', 'sfr', 'bouygues',
  'edf', 'engie', 'veolia', 'saur', 'bnp', 'axa', 'dgfip', 'impots', 'tresor public', 'carrefour', 'leclerc',
  'mcdonalds', 'subway', 'sodexo', 'heetch', 'starbucks', 'allo poulet'
].sort((a, b) => b.length - a.length);

const BRAND_REGEX = new RegExp(
  KNOWN_BRANDS.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

// Patterns de bruit incluant les villes pour éviter la fragmentation
const NOISE_PATTERNS = [
  /paiement\s+(cb|carte)/gi,
  /prlv\s+sepa/gi,
  /virement\s+(de|vers|instantane emis vers|instantane recu de)/gi,
  /retrait\s+distributeur/gi,
  /carte\s*\*?\d*/gi,
  /ref\s*:?\s*\w+/gi,
  /n[o°]\s*\d+/gi,
  /du\s+\d{1,2}\/\d{1,2}\/\d{2,4}/gi,
  /\/\//g, 
  /\b(paris|amsterdam|irlande|pays-bas|france|st denis|montrouge|aubervilliers|guyancourt|vienna|viennay|lyon|london|eu|uk)\b/gi,
];

const BRAND_ALIASES: Record<string, string> = {
  'sosh': 'orange',
  'sosh by orange': 'orange',
  'b&you': 'bouygues',
  'bouygues telecom': 'bouygues',
  'free mobile': 'free',
  'edf part': 'edf',
  'uber eats': 'ubereats',
  'western union vienna': 'western union',
  'western union viennay': 'western union',
};

// ========================================
// NORMALISATION OPTIMISÉE
// ========================================

export function normalizeDescriptionAdvanced(description: string | null | undefined): {
  normalized: string;
  brand?: string;
  tokens: string[];
} {
  if (!description || typeof description !== 'string') {
    return { normalized: 'inconnu', brand: undefined, tokens: [] };
  }

  let text = description.toLowerCase().trim();

  NOISE_PATTERNS.forEach(p => { text = text.replace(p, ' '); });

  text = text.replace(/[^a-z0-9\s]/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  let brand = extractBrand(text);
  if (brand) {
    brand = BRAND_ALIASES[brand.toLowerCase()] || brand.toLowerCase();
  }

  const tokens = text.split(' ').filter(w => w.length >= 3 && !/^\d+$/.test(w));

  return { normalized: text, brand, tokens };
}

export function extractBrand(description: string): string | undefined {
  if (!description) return undefined;
  const match = description.toLowerCase().match(BRAND_REGEX);
  if (match) return match[0];
  const words = description.toLowerCase().split(' ').filter(w => w.length > 3);
  return words[0] || undefined;
}

/**
 * FIX Erreur TS 2339 : Utilisation de description uniquement
 */
export function normalizeAll(transactions: Transaction[]) {
  const map = new Map<string, ReturnType<typeof normalizeDescriptionAdvanced>>();
  transactions.forEach(t => {
    map.set(t.id, normalizeDescriptionAdvanced(t.description));
  });
  return map;
}

// ========================================
// SIMILARITÉ ET CLUSTERING
// ========================================

export function calculateLevenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  let prevRow = Array.from({ length: len2 + 1 }, (_, i) => i);
  let currRow = new Array(len2 + 1);

  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(prevRow[j] + 1, currRow[j - 1] + 1, prevRow[j - 1] + cost);
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[len2];
}

export function clusterTransactionsBySimilarity(
  transactions: Transaction[],
  options: { minClusterSize?: number; considerAmount?: boolean; amountTolerance?: number; } = {}
): ClusterResult {
  const { minClusterSize = 2, considerAmount = false, amountTolerance = 20 } = options;

  if (!transactions || transactions.length === 0) {
    return { clusters: new Map(), orphans: [], statistics: { totalClusters: 0, averageClusterSize: 0, largestCluster: 0 } };
  }

  const normalizedMap = normalizeAll(transactions);
  const brandGroups = new Map<string, Transaction[]>();
  const noBrand: Transaction[] = [];

  transactions.forEach(txn => {
    const info = normalizedMap.get(txn.id)!;
    if (info.brand) {
      const group = brandGroups.get(info.brand) || [];
      group.push(txn);
      brandGroups.set(info.brand, group);
    } else {
      noBrand.push(txn);
    }
  });

  const clusters = new Map<string, Transaction[]>();
  const processed = new Set<string>();

  brandGroups.forEach((txns, brandName) => {
    txns.forEach(txn => {
      if (processed.has(txn.id)) return;
      const clusterId = `cluster_${brandName}_${txn.id}`;
      const cluster = txns.filter(candidate => {
        if (processed.has(candidate.id)) return false;
        return checkAmountMatch(txn.amount, candidate.amount, true, amountTolerance, considerAmount);
      });

      if (cluster.length >= minClusterSize) {
        clusters.set(clusterId, cluster);
        cluster.forEach(c => processed.add(c.id));
      }
    });
  });

  const validClusters = new Map<string, Transaction[]>();
  const orphans: Transaction[] = [];
  clusters.forEach((txs, key) => validClusters.set(key, txs));
  transactions.forEach(t => { if (!processed.has(t.id)) orphans.push(t); });

  const sizes = Array.from(validClusters.values()).map(c => c.length);

  return {
    clusters: validClusters,
    orphans,
    statistics: {
      totalClusters: validClusters.size,
      averageClusterSize: sizes.length ? (sizes.reduce((a, b) => a + b, 0) / sizes.length) : 0,
      largestCluster: sizes.length ? Math.max(...sizes) : 0,
    },
  };
}

function checkAmountMatch(a1: number, a2: number, hasBrand: boolean, tol: number, consider: boolean): boolean {
  if (!consider) return true;
  const diff = Math.abs(a1 - a2);
  const avg = Math.abs((a1 + a2) / 2) || 1;
  const variation = (diff / avg) * 100;
  return hasBrand ? variation <= 45 : variation <= tol;
}

export function calculateSemanticSimilarity(desc1: string, desc2: string): SimilarityResult {
  const i1 = normalizeDescriptionAdvanced(desc1);
  const i2 = normalizeDescriptionAdvanced(desc2);
  
  let score = 0;
  const reasons: string[] = [];

  if (i1.brand && i2.brand && i1.brand === i2.brand) {
    score += 70;
    reasons.push(`Même marque (${i1.brand})`);
  }

  const lev = calculateLevenshteinDistance(i1.normalized, i2.normalized);
  const maxL = Math.max(i1.normalized.length, i2.normalized.length);
  score += maxL ? (1 - lev / maxL) * 30 : 30;

  return {
    score: Math.min(100, Math.round(score)),
    confidence: score > 80 ? 'high' : score > 50 ? 'medium' : 'low',
    reasons,
    normalizedDesc1: i1.normalized,
    normalizedDesc2: i2.normalized,
    extractedBrand1: i1.brand,
    extractedBrand2: i2.brand,
  };
}