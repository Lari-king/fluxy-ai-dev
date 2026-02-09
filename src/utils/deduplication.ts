import { Transaction } from '../contexts/DataContext';

export interface DuplicateResult {
  transaction: Transaction;
  isDuplicate: boolean;
  confidence: 'high' | 'medium' | 'none';
  reason?: string;
}

/**
 * Normalise un libellé pour comparaison (retrait dates, espaces, caractères spéciaux)
 */
const normalizeLabel = (label: string) => {
  return label
    .toLowerCase()
    .replace(/[0-9]/g, '') // Enlever les dates/chiffres souvent variables
    .replace(/[^a-z]/g, '') // Garder uniquement les lettres
    .trim();
};

export const detectDuplicates = (
  newTransactions: Transaction[],
  existingTransactions: Transaction[]
): DuplicateResult[] => {
  // 1. Créer un index des transactions existantes pour une recherche rapide
  // Clé : date_montant (ex: 2023-10-25_-4.50)
  const existingMap = new Map<string, Transaction[]>();
  
  existingTransactions.forEach(t => {
    const key = `${t.date}_${t.amount.toFixed(2)}`;
    if (!existingMap.has(key)) existingMap.set(key, []);
    existingMap.get(key)?.push(t);
  });

  return newTransactions.map(newTx => {
    const key = `${newTx.date}_${newTx.amount.toFixed(2)}`;
    const potentials = existingMap.get(key) || [];

    if (potentials.length === 0) {
      return { transaction: newTx, isDuplicate: false, confidence: 'none' };
    }

    const newNormalized = normalizeLabel(newTx.description);

    // Comparaison caractère par caractère après normalisation
    const exactMatch = potentials.find(p => p.description === newTx.description);
    if (exactMatch) {
      return { 
        transaction: newTx, 
        isDuplicate: true, 
        confidence: 'high', 
        reason: 'Identique en tout point' 
      };
    }

    const fuzzyMatch = potentials.find(p => normalizeLabel(p.description) === newNormalized);
    if (fuzzyMatch) {
      return { 
        transaction: newTx, 
        isDuplicate: true, 
        confidence: 'medium', 
        reason: 'Montant et date identiques, libellé très similaire' 
      };
    }

    return { transaction: newTx, isDuplicate: false, confidence: 'none' };
  });
};