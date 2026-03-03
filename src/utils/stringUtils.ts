/**
 * 🔧 STRING UTILITIES - Normalisation et comparaison insensible aux accents/casse
 */

/**
 * Normalise une chaîne de caractères pour comparaison insensible aux accents et à la casse
 * 
 * Exemples :
 * - "Loisirs et Sorties" → "loisirs et sorties"
 * - "Transports et Véhicules" → "transports et vehicules"
 * - "Santé" → "sante"
 * - "Retrait d'espèces" → "retrait d'especes"
 */
export function normalizeString(str: string | undefined | null): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués (é → e + ´)
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .trim();
}

/**
 * Compare deux chaînes de manière insensible aux accents et à la casse
 */
export function stringEquals(str1: string | undefined | null, str2: string | undefined | null): boolean {
  return normalizeString(str1) === normalizeString(str2);
}

/**
 * Vérifie si une chaîne contient une autre (insensible aux accents/casse)
 */
export function stringIncludes(haystack: string | undefined | null, needle: string | undefined | null): boolean {
  if (!needle) return true;
  if (!haystack) return false;
  
  return normalizeString(haystack).includes(normalizeString(needle));
}
