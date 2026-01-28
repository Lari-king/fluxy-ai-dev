/**
 * 🔒 SECURITY UTILITIES
 * 
 * Fonctions de validation et sanitization pour la sécurité :
 * - Validation des inputs
 * - Sanitization XSS
 * - Rate limiting helpers
 * 
 * ⚠️ PRODUCTION READY
 */

/**
 * ✅ Sanitize pour affichage texte simple
 */
export function sanitizeText(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  /**
   * ✅ Rate limiting helper (localStorage based)
   */
  interface RateLimitConfig {
    key: string;
    maxAttempts: number;
    windowMs: number;
  }
  
  export class RateLimiter {
    private static getKey(key: string): string {
      return `rate_limit_${key}`;
    }
  
    /**
     * Vérifie si une action est rate-limitée
     */
    static isLimited(config: RateLimitConfig): boolean {
      const storageKey = this.getKey(config.key);
      const stored = localStorage.getItem(storageKey);
  
      if (!stored) return false;
  
      try {
        const data = JSON.parse(stored);
        const now = Date.now();
  
        // Fenêtre expirée
        if (now - data.timestamp > config.windowMs) {
          localStorage.removeItem(storageKey);
          return false;
        }
  
        // Trop de tentatives
        return data.attempts >= config.maxAttempts;
      } catch (error) {
        return false;
      }
    }
  
    /**
     * Enregistre une tentative
     */
    static recordAttempt(config: RateLimitConfig): void {
      const storageKey = this.getKey(config.key);
      const stored = localStorage.getItem(storageKey);
      const now = Date.now();
  
      if (!stored) {
        localStorage.setItem(storageKey, JSON.stringify({
          attempts: 1,
          timestamp: now,
        }));
        return;
      }
  
      try {
        const data = JSON.parse(stored);
  
        // Fenêtre expirée, reset
        if (now - data.timestamp > config.windowMs) {
          localStorage.setItem(storageKey, JSON.stringify({
            attempts: 1,
            timestamp: now,
          }));
        } else {
          // Incrémenter
          data.attempts += 1;
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement de la tentative:', error);
      }
    }
  
    /**
     * Reset le rate limit
     */
    static reset(key: string): void {
      const storageKey = this.getKey(key);
      localStorage.removeItem(storageKey);
    }
  
    /**
     * Récupère le nombre de tentatives restantes
     */
    static getRemainingAttempts(config: RateLimitConfig): number {
      const storageKey = this.getKey(config.key);
      const stored = localStorage.getItem(storageKey);
  
      if (!stored) return config.maxAttempts;
  
      try {
        const data = JSON.parse(stored);
        const now = Date.now();
  
        // Fenêtre expirée
        if (now - data.timestamp > config.windowMs) {
          return config.maxAttempts;
        }
  
        return Math.max(0, config.maxAttempts - data.attempts);
      } catch (error) {
        return config.maxAttempts;
      }
    }
  }
  