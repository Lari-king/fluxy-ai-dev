/**
 * Formate un nombre avec des options pour la devise, les décimales et la locale.
 * C'est la fonction de formatage principale pour l'argent dans l'application.
 *
 * ⚠️ NOUVEAU COMPORTEMENT : Affiche toujours 2 décimales par défaut pour plus de précision.
 * Pour les grands nombres du dashboard, passer explicitement maximumFractionDigits = 0.
 *
 * @param amount Le montant à formater.
 * @param locale La locale à utiliser (par défaut 'fr-FR').
 * @param maximumFractionDigits Le nombre maximum de décimales (par défaut 2 pour la précision).
 * @param withCurrency Symbole de devise affiché ou non (par défaut true).
 * @returns Le montant formaté en chaîne de caractères.
 */
export function formatCurrency(
  amount: number, 
  locale: string = 'fr-FR', 
  maximumFractionDigits: number = 2, // 🆕 Par défaut 2 pour afficher les centimes
  withCurrency: boolean = true
): string {
  // Arrondir pour éviter les problèmes de précision (utilisé uniquement pour le formatage)
  const rounded = Math.round(amount * 100) / 100;
  
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: maximumFractionDigits, // 🆕 Toujours afficher le nombre de décimales demandé
    maximumFractionDigits: maximumFractionDigits,
  };

  if (withCurrency) {
    options.style = 'currency';
    options.currency = 'EUR'; // Utilisation de l'Euro comme devise par défaut
  }

  // Si on ne veut pas le symbole, on retire le style/currency pour utiliser le formatage de nombre simple
  if (!withCurrency) {
      return rounded.toLocaleString(locale, options);
  }

  return rounded.toLocaleString(locale, options);
}

/**
 * Formate un nombre en pourcentage avec 1 décimale par défaut.
 * 🆕 Possibilité de spécifier le nombre de décimales
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  // Assurer une décimale pour la précision des KPI
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + ' %';
}

/**
 * Formate un nombre simple (ex: nombre de transactions) avec maximum 0 décimale.
 */
export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  return rounded.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Formate une date
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    
    case 'long':
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    
    case 'full':
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    
    default:
      return d.toLocaleDateString('fr-FR');
  }
}

/**
 * Alias pour compatibilité
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return formatPercentage(value, decimals);
}

/**
 * 🆕 Formate une date de manière compacte (DD/MM/AAAA)
 */
export function formatDateCompact(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
}

/**
 * 🆕 Formate une date de manière complète
 */
export function formatDateFull(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);
}

/**
 * 🆕 Formate une date et heure
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * 🆕 Formate un type de transaction
 */
export function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    'online': 'En ligne',
    'physical': 'En magasin',
    'transfer': 'Virement',
    'direct_debit': 'Prélèvement',
    'check': 'Chèque',
    'cash': 'Espèces'
  };

  return typeMap[type] || type;
}

/**
 * 🆕 Formate un identifiant court
 */
export function formatShortId(id: string, length = 8): string {
  return id.substring(0, length);
}
