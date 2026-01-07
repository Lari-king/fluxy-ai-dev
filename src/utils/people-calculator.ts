import { Transaction } from './csv-parser'; // Chemin d'importation corrigé et type Transaction importé

// On n'a plus besoin d'importer Entity de '../../types' si Transaction est correctement importé
// import { Entity } from '../../types'; 

export interface Person {
  id: string;
  name: string;
  avatar?: string;
  circle: 'direct' | 'extended' | 'large' | string;
  relationship: string;
  color: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
}

// Type étendu (PersonWithStats + ajout des champs pour le tableau de bord)
export interface PersonWithStats extends Person {
  totalImpact: number; // L'impact total net (revenus - dépenses)
  income: number;
  expenses: number; // Valeur positive (somme des dépenses en valeur absolue)
  transactionCount: number;
  // Ajout des stats avancées pour le tableau de bord (TopPeople)
  averageTransaction: number;
  lastTransactionDate?: string;
  lastTransactionAmount?: number;
}

/**
 * Calculate financial stats for a person based on their transactions
 */
export function calculatePersonStats(
  personId: string,
  transactions: Transaction[]
): {
  income: number;
  expenses: number;
  totalImpact: number;
  transactionCount: number;
  averageTransaction: number; // Ajout
  lastTransactionDate?: string; // Ajout
  lastTransactionAmount?: number; // Ajout
} {
  const personTransactions = transactions
    .filter(txn => txn.personId === personId)
    // S'assurer que les transactions sont triées pour trouver la dernière
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const income = personTransactions
    .filter(txn => (txn.amount || 0) > 0)
    .reduce((sum, txn) => sum + (txn.amount || 0), 0);

  const rawExpenses = personTransactions
    .filter(txn => (txn.amount || 0) < 0)
    .reduce((sum, txn) => sum + (txn.amount || 0), 0); // Les dépenses sont négatives ici

  const totalImpact = income + rawExpenses; // Net impact
  const transactionCount = personTransactions.length;
  const averageTransaction = transactionCount > 0 ? totalImpact / transactionCount : 0;
  
  const latestTxn = personTransactions[0]; // La transaction la plus récente après le tri

  return {
    income,
    expenses: Math.abs(rawExpenses), // On expose expenses en valeur absolue positive pour l'UI
    totalImpact,
    transactionCount,
    averageTransaction,
    lastTransactionDate: latestTxn?.date,
    lastTransactionAmount: latestTxn?.amount,
  };
}

/**
 * Enrich people data with calculated stats from transactions
 */
export function enrichPeopleWithStats(
  people: Person[],
  transactions: Transaction[]
): PersonWithStats[] {
  return people.map(person => {
    const stats = calculatePersonStats(person.id, transactions);
    
    return {
      ...person,
      // CONSERVATION CRUCIALE : 'relationship', 'name', 'circle', etc. sont conservés ici.
      // Les propriétés de 'stats' sont ajoutées/écrasent si elles existent.
      ...stats,
      // On s'assure que le champ expenses est bien en positif pour PersonWithStats, mais
      // ceci est déjà géré par ...stats, car calculatePersonStats retourne expenses: Math.abs(rawExpenses).
    };
  });
}

/**
 * Get all transactions for a specific person
 */
export function getTransactionsForPerson(
  personId: string,
  transactions: Transaction[]
): Transaction[] {
  return transactions.filter(txn => txn.personId === personId);
}