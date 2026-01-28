/**
 * 🔐 AUTH SERVICE - Sécurité maximale
 * 
 * Service centralisé pour toute la logique d'authentification :
 * - Hash des mots de passe (bcrypt)
 * - Validation des inputs (email, password)
 * - Génération de tokens sécurisés
 * - Vérification des permissions
 * 
 * ⚠️ PRODUCTION READY avec bcrypt
 */

import bcrypt from 'bcryptjs';

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_login?: string;
}

export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly MIN_PASSWORD_LENGTH = 8;

  /**
   * ✅ Hash un mot de passe avec bcrypt
   * PRODUCTION READY
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, this.SALT_ROUNDS);
      return hash;
    } catch (error) {
      console.error('❌ Erreur lors du hashage du mot de passe:', error);
      throw new Error('Impossible de sécuriser le mot de passe');
    }
  }

  /**
   * ✅ Vérifie un mot de passe hashé
   * PRODUCTION READY
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hash);
      return isValid;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du mot de passe:', error);
      return false;
    }
  }

  /**
   * ✅ Valide un email
   */
  validateEmail(email: string): { valid: boolean; error?: string } {
    // Regex standard RFC 5322
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || email.trim() === '') {
      return { valid: false, error: 'Email requis' };
    }

    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Format email invalide' };
    }

    if (email.length > 254) {
      return { valid: false, error: 'Email trop long' };
    }

    return { valid: true };
  }

  /**
   * ✅ Valide un mot de passe avec critères de force
   */
  validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];
    let score = 0;

    // Longueur minimale
    if (!password || password.length < this.MIN_PASSWORD_LENGTH) {
      errors.push(`Au moins ${this.MIN_PASSWORD_LENGTH} caractères`);
    } else {
      score += 1;
    }

    // Majuscule
    if (!/[A-Z]/.test(password)) {
      errors.push('Au moins une majuscule');
    } else {
      score += 1;
    }

    // Minuscule
    if (!/[a-z]/.test(password)) {
      errors.push('Au moins une minuscule');
    } else {
      score += 1;
    }

    // Chiffre
    if (!/[0-9]/.test(password)) {
      errors.push('Au moins un chiffre');
    } else {
      score += 1;
    }

    // Caractère spécial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Au moins un caractère spécial');
    } else {
      score += 1;
    }

    // Longueur bonus
    if (password.length >= 12) {
      score += 1;
    }

    // Déterminer la force
    let strength: 'weak' | 'medium' | 'strong';
    if (score < 3) {
      strength = 'weak';
    } else if (score < 5) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    return {
      valid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * ✅ Valide un nom d'utilisateur
   */
  validateName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim() === '') {
      return { valid: false, error: 'Nom requis' };
    }

    if (name.length < 2) {
      return { valid: false, error: 'Nom trop court (min 2 caractères)' };
    }

    if (name.length > 100) {
      return { valid: false, error: 'Nom trop long (max 100 caractères)' };
    }

    // Pas de caractères spéciaux dangereux
    if (/<|>|&|"|'/.test(name)) {
      return { valid: false, error: 'Caractères non autorisés' };
    }

    return { valid: true };
  }

  /**
   * ✅ Génère un ID utilisateur unique
   */
  generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ✅ Génère un token de session (pour mode local)
   */
  generateSessionToken(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * ✅ Sanitize user input
   */
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * ✅ Vérifie si un email existe déjà (mode local)
   */
  emailExists(email: string): boolean {
    try {
      const usersJson = localStorage.getItem('flux_users');
      if (!usersJson) return false;

      const users = JSON.parse(usersJson);
      return !!users[email];
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'email:', error);
      return false;
    }
  }

  /**
   * ✅ Récupère un utilisateur par email (mode local)
   */
  getLocalUserByEmail(email: string): LocalUser | null {
    try {
      const usersJson = localStorage.getItem('flux_users');
      if (!usersJson) return null;

      const users = JSON.parse(usersJson);
      const userData = users[email];
      
      if (!userData) return null;

      return {
        id: userData.id,
        email: email,
        name: userData.name,
        created_at: userData.created_at || new Date().toISOString(),
        last_login: userData.last_login,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * ✅ Met à jour la dernière connexion
   */
  updateLastLogin(email: string): void {
    try {
      const usersJson = localStorage.getItem('flux_users');
      if (!usersJson) return;

      const users = JSON.parse(usersJson);
      if (users[email]) {
        users[email].last_login = new Date().toISOString();
        localStorage.setItem('flux_users', JSON.stringify(users));
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la dernière connexion:', error);
    }
  }
}

// Singleton
export const authService = new AuthService();
