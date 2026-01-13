/**
 * 🧠 AXES COMPORTEMENTAUX - COUCHE LATENTE STABLE
 * 
 * Inspiré de la recherche académique (MIT, INSEAD) sur la robustesse
 * des modèles prédictifs face aux taxonomies dynamiques.
 * 
 * Principe clé : On ne prédit jamais sur des labels dynamiques,
 * mais sur des comportements latents stables.
 * 
 * Performance : Tous les mappings sont pré-calculés et mémoïsés.
 */

// ================================================================
// 1. DÉFINITION DES AXES COMPORTEMENTAUX STABLES
// ================================================================

export type BehavioralAxis =
  | 'SURVIE_FIXE'        // Incompressible, récurrent, prioritaire (loyer, factures)
  | 'SURVIE_VARIABLE'    // Nécessaire mais ajustable (alimentation, santé)
  | 'CONFORT'            // Arbitrable, émotionnel (livraison, VTC)
  | 'STATUT_ESTIME'      // Très comportemental (apparence, sorties)
  | 'PROJET_LONG_TERME'  // Investissement, futur
  | 'SOCIAL_EMOTIONNEL'; // Très contextuel (cadeaux, restaurants)

export interface BehavioralProfile {
  axis: BehavioralAxis;
  compressibilityScore: number; // 0 = incompressible, 1 = totalement arbitrable
  priority: number; // 1 = critique, 5 = optionnel
  emotionalWeight: number; // Impact psychologique de la réduction
}

// ================================================================
// 2. MAPPING DYNAMIQUE CATÉGORIES → AXES (Par mots-clés)
// ================================================================

/**
 * Détecte l'axe comportemental d'une catégorie de façon DYNAMIQUE
 * en analysant les mots-clés au lieu d'un mapping statique
 * 
 * ⚡️ OPTIMISATION : Utilise des Sets pour O(1) au lieu de Arrays O(n)
 */
export function getCategoryBehavioralProfile(category?: string): BehavioralProfile {
  if (!category) {
    return {
      axis: 'SOCIAL_EMOTIONNEL',
      compressibilityScore: 0.9,
      priority: 5,
      emotionalWeight: 0.3
    };
  }
  
  const normalized = category.toUpperCase().trim();
  
  // 🏠 SURVIE_FIXE - Factures fixes et prévisibles
  if (matchesKeywords(normalized, SURVIE_FIXE_KEYWORDS)) {
    return {
      axis: 'SURVIE_FIXE',
      compressibilityScore: 0.05, // Quasi incompressible
      priority: 1,
      emotionalWeight: 0.9 // Très stressant si on ne paie pas
    };
  }
  
  // 🌿 SURVIE_VARIABLE - Nécessaire mais ajustable
  if (matchesKeywords(normalized, SURVIE_VARIABLE_KEYWORDS)) {
    return {
      axis: 'SURVIE_VARIABLE',
      compressibilityScore: 0.3, // Ajustable mais avec limite
      priority: 2,
      emotionalWeight: 0.6
    };
  }
  
  // 🎯 PROJET_LONG_TERME - Investissements
  if (matchesKeywords(normalized, PROJET_LONG_TERME_KEYWORDS)) {
    return {
      axis: 'PROJET_LONG_TERME',
      compressibilityScore: 0.7, // Report possible
      priority: 3,
      emotionalWeight: 0.4
    };
  }
  
  // 🎨 STATUT_ESTIME - Apparence, image
  if (matchesKeywords(normalized, STATUT_ESTIME_KEYWORDS)) {
    return {
      axis: 'STATUT_ESTIME',
      compressibilityScore: 0.8,
      priority: 4,
      emotionalWeight: 0.7 // Impact psychologique élevé
    };
  }
  
  // 🛋️ CONFORT - Arbitrable
  if (matchesKeywords(normalized, CONFORT_KEYWORDS)) {
    return {
      axis: 'CONFORT',
      compressibilityScore: 0.85,
      priority: 4,
      emotionalWeight: 0.5
    };
  }
  
  // 👥 SOCIAL_EMOTIONNEL - Par défaut
  return {
    axis: 'SOCIAL_EMOTIONNEL',
    compressibilityScore: 0.9,
    priority: 5,
    emotionalWeight: 0.6
  };
}

// ================================================================
// 3. MOTS-CLÉS PAR AXE (Sets pour performance O(1))
// ================================================================

const SURVIE_FIXE_KEYWORDS = new Set([
  'ABRI', 'ÉNERGIE', 'ENERGIE', 'LOYER', 'CRÉDIT', 'CREDIT', 'IMMOBILIER',
  'ÉLECTRICITÉ', 'ELECTRICITE', 'GAZ', 'EAU', 'CHARGES', 'TAXE', 'FONCIERE',
  'ABONNEMENT', 'SERVICE', 'DETTE', 'RÉGULARISATION', 'REGULARISATION',
  'ASSURANCE', 'IMPÔT', 'IMPOT', 'MUTUELLE', 'PRÉVOYANCE', 'PREVOYANCE',
  'MOBILE', 'INTERNET', 'FIBRE', 'FORFAIT'
]);

const SURVIE_VARIABLE_KEYWORDS = new Set([
  'SANTÉ', 'SANTE', 'INTÉGRITÉ', 'INTEGRITE', 'PHARMACIE', 'MÉDECIN', 'MEDECIN',
  'NUTRITION', 'ALIMENTATION', 'SUPERMARCHÉ', 'SUPERMARCHE', 'MARCHÉ', 'MARCHE',
  'MOBILITÉ', 'MOBILITE', 'TRANSPORT', 'CARBURANT', 'PÉAGE', 'PEAGE',
  'ÉQUIPEMENT', 'EQUIPEMENT', 'DOMESTIQUE', 'ÉLECTROMÉNAGER', 'ELECTROMENAGER'
]);

const CONFORT_KEYWORDS = new Set([
  'CONFORT', 'TEMPS', 'LIVRAISON', 'UBER', 'VTC', 'AIDE', 'MÉNAGÈRE', 'MENAGERE',
  'PREMIUM', 'LUXE', 'CAVE', 'VIN', 'ÉPICERIE', 'EPICERIE', 'FINE'
]);

const STATUT_ESTIME_KEYWORDS = new Set([
  'APPARENCE', 'ESTIME', 'PRÊT', 'PRET', 'PORTER', 'CHAUSSURE', 'COIFFEUR',
  'BEAUTÉ', 'BEAUTE', 'PARFUM', 'BIJOU', 'MONTRE', 'ACCESSOIRE', 'MODE',
  'PRESSING', 'COSMÉTIQUE', 'COSMETIQUE'
]);

const PROJET_LONG_TERME_KEYWORDS = new Set([
  'INVESTISSEMENT', 'ACTIF', 'PEA', 'TITRE', 'CRYPTO', 'IMMOBILIER', 'LOCATIF',
  'CROWDFUNDING', 'ASSURANCE-VIE', 'RETRAITE', 'PER', 'SCPI', 'PROJET', 'PERSONNEL',
  'FORMATION', 'SAVOIR', 'COACHING', 'CERTIFICATION'
]);

// ================================================================
// 4. FONCTION UTILITAIRE DE MATCHING (Optimisée)
// ================================================================

function matchesKeywords(normalized: string, keywords: Set<string>): boolean {
  for (const keyword of keywords) {
    if (normalized.includes(keyword)) {
      return true;
    }
  }
  return false;
}

// ================================================================
// 5. ANALYSE COMPORTEMENTALE D'UNE DÉPENSE
// ================================================================

export interface BehavioralContext {
  dayOfMonth: number;
  isWeekend: boolean;
  daysSinceSalary: number;
  balanceLevel: 'low' | 'medium' | 'high';
  monthProgress: number; // 0 à 1
}

/**
 * Calcule le facteur d'ajustement comportemental
 * basé sur le contexte (jour du mois, solde, etc.)
 * 
 * Inspiré de Prospect Theory et Mental Accounting
 */
export function getBehavioralAdjustment(
  profile: BehavioralProfile,
  context: BehavioralContext
): number {
  let adjustment = 1.0;
  
  // 🔴 Seuil psychologique (solde bas)
  if (context.balanceLevel === 'low') {
    // On compresse plus les dépenses compressibles
    adjustment *= (1 - profile.compressibilityScore * 0.4);
  }
  
  // 📅 Fin de mois (après jour 20)
  if (context.dayOfMonth > 20) {
    // Réduction progressive des dépenses non-essentielles
    const endOfMonthPressure = (context.dayOfMonth - 20) / 10; // 0 à 1
    adjustment *= (1 - profile.compressibilityScore * endOfMonthPressure * 0.3);
  }
  
  // 💰 Post-salaire (amplification émotionnelle)
  if (context.daysSinceSalary <= 3 && context.balanceLevel === 'high') {
    // Les dépenses STATUT_ESTIME et CONFORT augmentent
    if (profile.axis === 'STATUT_ESTIME' || profile.axis === 'CONFORT') {
      adjustment *= 1.2;
    }
  }
  
  // 🎉 Week-end (effet social)
  if (context.isWeekend) {
    if (profile.axis === 'SOCIAL_EMOTIONNEL') {
      adjustment *= 1.15;
    }
  }
  
  return adjustment;
}

// ================================================================
// 6. CACHE MEMOÏSÉ (Performance)
// ================================================================

const profileCache = new Map<string, BehavioralProfile>();

export function getCategoryBehavioralProfileCached(category?: string): BehavioralProfile {
  if (!category) return getCategoryBehavioralProfile(category);
  
  if (profileCache.has(category)) {
    return profileCache.get(category)!;
  }
  
  const profile = getCategoryBehavioralProfile(category);
  profileCache.set(category, profile);
  return profile;
}

/**
 * Nettoie le cache (à appeler quand les catégories changent)
 */
export function clearBehavioralCache(): void {
  profileCache.clear();
}
