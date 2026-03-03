// src/features/people/engine/enrichment.ts
import { Transaction } from '@/contexts/DataContext';
import { PersonRelation, PeopleScores } from '../types/base'; // Importé depuis base.ts
import { aggregateTransactions } from './aggregators';
import { applyDSLRules } from './dsl';

// Note: Si tu as supprimé ou commenté le fichier scores.ts, 
// on commente l'import et on crée une fonction bouchon pour les scores.
// import { calculateScores } from './scores'; 

export function enrichPeopleData(
  people: PersonRelation[],
  transactions: Transaction[]
): { enrichedPeople: PersonRelation[]; scores: PeopleScores } {
  
  // 1. Stats financières (Agrégation des transactions par personne)
  const withStats = people.map(p => ({
    ...p,
    ...aggregateTransactions(p.id, transactions)
  }));

  // 2. Calcul des progressions (si objectifs présents)
  const withProgression = withStats.map(p => {
    // On utilise 0 par défaut si expenses est undefined pour éviter les erreurs NaN
    const expenses = p.expenses ?? 0;
    const progression = p.targetMonthlyAmount && p.targetMonthlyAmount > 0 
      ? (expenses / p.targetMonthlyAmount) * 100 
      : 0;
      
    return { ...p, progressionPercentage: progression };
  });

  // 3. DSL (Application des règles d'arbitrage et signaux)
  const enrichedPeople = applyDSLRules(withProgression);

  // 4. Scores globaux 
  // Comme tu es en Option B, on renvoie un objet de score vide ou neutre
  // pour ne pas casser le reste de l'application qui attend cet objet.
  const scores: PeopleScores = {
    liberte: {
      total: 0,
      pillars: []
    },
    resilience: {
      total: 0,
      pillars: []
    }
  };

  return { enrichedPeople, scores };
}