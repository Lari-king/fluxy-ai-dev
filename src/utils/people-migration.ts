/**
 * 🔄 MIGRATION - ANCIEN SYSTÈME → NOUVEAU SYSTÈME RELATIONNEL
 * 
 * Utilitaires pour migrer les données People existantes vers le nouveau modèle
 * avec les dimensions déclaratives et calculées
 * 
 * ⚠️ Migration NON-DESTRUCTIVE : les anciennes données sont préservées
 */

import { PersonRelation, PersonType } from '../types/people';
import { DEFAULT_PERSON_VALUES } from '@/constants/people-config';

/**
 * Interface de l'ancien système Person (pour typage lors de la migration)
 */
interface LegacyPerson {
  id: string;
  name: string;
  avatar?: string;
  relationship: string;
  color: string;
  circle: string;
  totalImpact?: number;
  income?: number;
  expenses?: number;
  transactionCount?: number;
  [key: string]: any;
}

/**
 * Migre une personne de l'ancien format vers le nouveau format PersonRelation
 * 
 * Les champs calculés (totalImpact, income, expenses) seront recalculés
 * par le people-calculator, donc on les initialise à 0
 * 
 * @param legacyPerson - Personne au format ancien
 * @returns PersonRelation compatible avec le nouveau système
 */
export function migrateLegacyPerson(legacyPerson: LegacyPerson): PersonRelation {
  // Détection automatique du type de personne basée sur le nom/relation
  const personType = detectPersonType(legacyPerson);
  
  return {
    // === Champs de base (conservés) ===
    id: legacyPerson.id,
    name: legacyPerson.name,
    avatar: legacyPerson.avatar,
    relationship: legacyPerson.relationship,
    color: legacyPerson.color || DEFAULT_PERSON_VALUES.color,
    circle: legacyPerson.circle || DEFAULT_PERSON_VALUES.circle,
    email: legacyPerson.email,
    phone: legacyPerson.phone,
    birthDate: legacyPerson.birthDate,
    notes: legacyPerson.notes,
    
    // === Type de personne (détecté) ===
    personType,
    
    // === Dimensions déclaratives (valeurs par défaut) ===
    // L'utilisateur pourra les définir manuellement plus tard
    contributionType: undefined,
    timeBenefit: undefined,
    targetObjective: DEFAULT_PERSON_VALUES.targetObjective,
    targetMonthlyAmount: undefined,
    targetDate: undefined,
    
    // === Statistiques calculées (seront recalculées) ===
    totalImpact: 0,
    income: 0,
    expenses: 0,
    transactionCount: 0,
    averageTransaction: 0,
    lastTransactionDate: undefined,
    lastTransactionAmount: undefined,
    
    // === Indicateurs dérivés (seront calculés) ===
    dependanceLevel: undefined,
    dependanceRatio: undefined,
    trend: undefined,
    progressionState: undefined,
    progressionPercentage: undefined,
    arbitrageSignal: undefined,
    arbitrageMessage: undefined,
  };
}

/**
 * Détecte automatiquement le type de personne (PHYSIQUE vs MORALE)
 * basé sur des heuristiques simples
 * 
 * Heuristiques :
 * - Mots-clés entreprise/service → MORALE
 * - Relations familiales → PHYSIQUE
 * - Par défaut → PHYSIQUE
 */
function detectPersonType(person: LegacyPerson): PersonType {
  const name = person.name.toLowerCase();
  const relationship = person.relationship?.toLowerCase() || '';
  
  // Mots-clés indiquant une personne morale
  const moraleKeywords = [
    'abonnement', 'subscription', 'saas',
    'assurance', 'insurance',
    'banque', 'bank',
    'fournisseur', 'provider',
    'service', 'entreprise', 'company',
    'plateforme', 'platform',
    'boutique', 'shop', 'store',
    'agence', 'agency',
    'opérateur', 'operator',
    'spotify', 'netflix', 'amazon', 'google', 'apple',
  ];
  
  // Mots-clés indiquant une personne physique
  const physiqueKeywords = [
    'conjoint', 'époux', 'épouse', 'mari', 'femme', 'compagnon', 'compagne',
    'enfant', 'fils', 'fille',
    'père', 'mère', 'parent',
    'frère', 'sœur', 'soeur',
    'grand-père', 'grand-mère', 'grand-parent',
    'oncle', 'tante', 'cousin', 'cousine',
    'neveu', 'nièce',
    'ami', 'amie', 'copain', 'copine',
    'collègue', 'voisin',
  ];
  
  // Vérification personne morale
  for (const keyword of moraleKeywords) {
    if (name.includes(keyword) || relationship.includes(keyword)) {
      return PersonType.MORALE;
    }
  }
  
  // Vérification personne physique
  for (const keyword of physiqueKeywords) {
    if (name.includes(keyword) || relationship.includes(keyword)) {
      return PersonType.PHYSIQUE;
    }
  }
  
  // Par défaut : personne physique
  return PersonType.PHYSIQUE;
}

/**
 * Migre un tableau complet de personnes
 * 
 * @param legacyPeople - Tableau de personnes au format ancien
 * @returns Tableau de PersonRelation au nouveau format
 */
export function migrateLegacyPeople(legacyPeople: LegacyPerson[]): PersonRelation[] {
  return legacyPeople.map(migrateLegacyPerson);
}

/**
 * Vérifie si une personne a besoin d'être migrée
 * 
 * Une personne a besoin de migration si elle n'a pas le champ `personType`
 */
export function needsMigration(person: any): boolean {
  return !person.personType;
}

/**
 * Migre uniquement les personnes qui en ont besoin
 * 
 * Les personnes déjà au nouveau format sont conservées telles quelles
 */
export function migrateIfNeeded(people: any[]): PersonRelation[] {
  return people.map(person => {
    if (needsMigration(person)) {
      console.log(`🔄 Migration de la personne: ${person.name}`);
      return migrateLegacyPerson(person);
    }
    return person as PersonRelation;
  });
}

/**
 * Nettoie une PersonRelation avant sauvegarde
 * 
 * Retire tous les champs calculés pour ne sauvegarder que les données brutes
 * 
 * @param person - PersonRelation complète (avec champs calculés)
 * @returns Objet à sauvegarder (sans champs calculés)
 */
export function sanitizePersonForSave(person: PersonRelation): Partial<PersonRelation> {
  const {
    // Champs calculés à exclure
    totalImpact,
    income,
    expenses,
    transactionCount,
    averageTransaction,
    lastTransactionDate,
    lastTransactionAmount,
    dependanceLevel,
    dependanceRatio,
    trend,
    progressionState,
    progressionPercentage,
    arbitrageSignal,
    arbitrageMessage,
    // Le reste = données brutes à sauvegarder
    ...rawData
  } = person;
  
  return rawData;
}

/**
 * Nettoie un tableau de personnes pour sauvegarde
 */
export function sanitizePeopleForSave(people: PersonRelation[]): Partial<PersonRelation>[] {
  return people.map(sanitizePersonForSave);
}
