import { PersonRelation, PersonType } from '../types/base';

/**
 * Migre une personne de l'ancien format vers le nouveau
 */
export function migratePerson(legacy: any): PersonRelation {
  return {
    id: legacy.id || crypto.randomUUID(),
    name: legacy.name || 'Sans nom',
    avatar: legacy.avatar || '',
    circle: legacy.circle || 'direct',
    relationship: legacy.relationship || 'Autre',
    color: legacy.color || '#6366f1',
    personType: legacy.personType || PersonType.PHYSIQUE,
    // Initialisation des nouveaux champs optionnels
    contributionType: legacy.contributionType,
    targetObjective: legacy.targetObjective,
    targetMonthlyAmount: legacy.targetMonthlyAmount || 0,
  };
}

/**
 * Nettoie l'objet avant sauvegarde pour ne pas stocker les calculs éphémères
 */
export function sanitizeForSave(person: PersonRelation): any {
  const { 
    totalImpact, income, expenses, transactionCount, 
    arbitrageSignal, arbitrageMessage, progressionPercentage,
    progressionState, dependanceLevel, ...dataToSave 
  } = person;
  return dataToSave;
}