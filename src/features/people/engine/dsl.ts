// src/features/people/engine/dsl.ts
import { PersonRelation, ProgressionState, ArbitrageSignal } from '../types/base';

export function applyDSLRules(people: PersonRelation[]): PersonRelation[] {
  return people.map(person => {
    // Initialisation avec les Enums corrects
    let signal: ArbitrageSignal = ArbitrageSignal.NEUTRE;
    let message = 'Relation équilibrée';

    // Extraction sécurisée des valeurs (gestion du undefined)
    const expenses = person.expenses ?? 0;
    const income = person.income ?? 0;
    const target = person.targetMonthlyAmount ?? 0;

    // Logique du DSL avec les types Enums
    if (expenses > 1000 && income === 0) {
      signal = ArbitrageSignal.SURVEILLER;
      message = 'Charge financière importante sans contrepartie';
    }

    if (target > 0 && expenses > target) {
      signal = ArbitrageSignal.REDUIRE;
      message = "Dépassement de l'objectif mensuel";
    }

    // Calcul de l'état de progression
    let state = ProgressionState.NEUTRE;
    const progress = person.progressionPercentage || 0;
    
    if (progress > 100) {
      state = ProgressionState.EN_AVANCE;
    } else if (progress < 50 && progress > 0) {
      state = ProgressionState.EN_RETARD;
    } else if (progress <= 0 && target > 0) {
      state = ProgressionState.CRITIQUE;
    }

    return {
      ...person,
      arbitrageSignal: signal,
      arbitrageMessage: message,
      progressionState: state
    };
  });
}