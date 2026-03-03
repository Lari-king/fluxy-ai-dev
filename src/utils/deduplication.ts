/**
 * 🔍 DEDUPLICATION ENGINE - VERSION ULTRA-PERFORMANTE
 * Détecte les doublons avec indexation par clé composite.
 * Supporte le nettoyage sémantique des libellés bancaires.
 */

import { Transaction } from '@/contexts/DataContext';

export interface DuplicateResult {
  transaction: Transaction;
  isDuplicate: boolean;
  confidence: 'high' | 'medium' | 'none';
  reason?: string;
}

/**
 * Normalise un libellé pour comparaison profonde
 * Retire : chiffres, caractères spéciaux, et mots de liaison courts
 */
const normalizeLabel = (label: string): string => {
  if (!label) return '';
  return label
    .toLowerCase()
    // 1. Retire les dates et chiffres (souvent des numéros de facture ou dates de transaction)
    .replace(/[0-9]/g, '')
    // 2. Retire les caractères spéciaux
    .replace(/[^a-z\s]/g, '')
    // 3. Retire les mots de liaison bancaire courants (FR, SEPA, VIR, etc.)
    .split(/\s+/)
    .filter(word => word.length > 2 && !['virement', 'sepa', 'prlv', 'cb', 'fact'].includes(word))
    .join('')
    .trim();
};

/**
 * Génère une clé unique pour l'indexation (Date + Montant normalisé)
 */
const generateTxKey = (date: string, amount: number): string => {
  // On force le format de date YYYY-MM-DD et 2 décimales pour le montant
  const safeDate = date?.split('T')[0] || 'no-date';
  const safeAmount = Number(amount).toFixed(2);
  return `${safeDate}_${safeAmount}`;
};

export const detectDuplicates = (
  newTransactions: Transaction[],
  existingTransactions: Transaction[]
): DuplicateResult[] => {
  
  // 1. Création de l'index des transactions existantes O(m)
  // Utilisation d'un Map pour un accès direct O(1) lors de la comparaison
  const existingMap = new Map<string, Transaction[]>();
  
  existingTransactions.forEach(t => {
    const key = generateTxKey(t.date, t.amount);
    if (!existingMap.has(key)) {
      existingMap.set(key, []);
    }
    existingMap.get(key)?.push(t);
  });

  // 2. Analyse des nouvelles transactions O(n)
  return newTransactions.map(newTx => {
    const key = generateTxKey(newTx.date, newTx.amount);
    const potentials = existingMap.get(key) || [];

    // Cas 1 : Aucune transaction avec la même date et le même montant
    if (potentials.length === 0) {
      return { 
        transaction: newTx, 
        isDuplicate: false, 
        confidence: 'none' 
      };
    }

    // Cas 2 : Match EXACT sur la description
    const exactMatch = potentials.find(p => 
      p.description.trim().toLowerCase() === newTx.description.trim().toLowerCase()
    );
    
    if (exactMatch) {
      return {
        transaction: newTx,
        isDuplicate: true,
        confidence: 'high',
        reason: 'Date, montant et libellé identiques'
      };
    }

    // Cas 3 : Match FLOU (Fuzzy) sur la description normalisée
    const newNormalized = normalizeLabel(newTx.description);
    const fuzzyMatch = potentials.find(p => normalizeLabel(p.description) === newNormalized);
    
    if (fuzzyMatch && newNormalized.length > 0) {
      return {
        transaction: newTx,
        isDuplicate: true,
        confidence: 'medium',
        reason: 'Date et montant identiques, libellé similaire'
      };
    }

    // Cas 4 : Même date et montant mais libellés totalement différents
    return { 
      transaction: newTx, 
      isDuplicate: false, 
      confidence: 'none' 
    };
  });
};

/**
 * Statistiques pour le résumé d'importation
 */
export function getDeduplicationStats(results: DuplicateResult[]) {
  const total = results.length;
  const duplicates = results.filter(r => r.isDuplicate);
  
  return {
    total,
    duplicatesCount: duplicates.length,
    uniqueCount: total - duplicates.length,
    highConfidence: duplicates.filter(r => r.confidence === 'high').length,
    mediumConfidence: duplicates.filter(r => r.confidence === 'medium').length,
    duplicateRate: total > 0 ? (duplicates.length / total) * 100 : 0
  };
}