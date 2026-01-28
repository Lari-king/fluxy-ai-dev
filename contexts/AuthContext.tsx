/**
 * 🔐 Auth Context - LOCAL VERSION avec SÉCURITÉ MAXIMALE
 * 
 * Authentification sécurisée avec :
 * - Mots de passe hashés (bcrypt)
 * - Validation stricte des inputs
 * - Rate limiting
 * 
 * ⚠️ PRODUCTION READY
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { authService } from '../src/services/authService';
import { RateLimiter } from '../src/utils/security';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem('flux_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Erreur lors du chargement de l\'utilisateur:', err);
        localStorage.removeItem('flux_user');
      }
    }
    setLoading(false);
  }, []);

  // Login sécurisé avec bcrypt et rate limiting
  const login = useCallback(async (email: string, password: string, name?: string) => {
    // ✅ 1. VALIDATION DES INPUTS
    const emailValidation = authService.validateEmail(email);
    if (!emailValidation.valid) {
      throw new Error(emailValidation.error || 'Email invalide');
    }

    // ✅ 2. RATE LIMITING
    const rateLimitKey = `login_${email}`;
    const isLimited = RateLimiter.isLimited({
      key: rateLimitKey,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (isLimited) {
      const remaining = RateLimiter.getRemainingAttempts({
        key: rateLimitKey,
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
      });
      throw new Error(`Trop de tentatives. Réessayez dans quelques minutes.`);
    }

    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    // ✅ 3. RÉCUPÉRER LES UTILISATEURS
    const usersKey = 'flux_users';
    const usersData = localStorage.getItem(usersKey);
    const users: Record<string, { passwordHash: string; name: string; id: string; created_at: string }> = usersData 
      ? JSON.parse(usersData) 
      : {};

    if (users[email]) {
      // ✅ 4. UTILISATEUR EXISTANT - VÉRIFIER LE MOT DE PASSE
      const storedHash = users[email].passwordHash;
      
      // Si l'ancien format (mot de passe en clair), migrer vers bcrypt
      if (!storedHash.startsWith('$2')) {
        // Migration: hasher l'ancien mot de passe
        if (users[email].passwordHash === password) {
          const newHash = await authService.hashPassword(password);
          users[email].passwordHash = newHash;
          localStorage.setItem(usersKey, JSON.stringify(users));
        } else {
          // Mot de passe incorrect
          RateLimiter.recordAttempt({
            key: rateLimitKey,
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000,
          });
          throw new Error('Mot de passe incorrect');
        }
      } else {
        // Vérifier avec bcrypt
        const isValid = await authService.verifyPassword(password, storedHash);
        if (!isValid) {
          RateLimiter.recordAttempt({
            key: rateLimitKey,
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000,
          });
          throw new Error('Mot de passe incorrect');
        }
      }
      
      const loggedInUser: User = {
        id: users[email].id,
        email,
        name: users[email].name,
      };
      
      // Mettre à jour la dernière connexion
      authService.updateLastLogin(email);
      
      // Reset rate limit après succès
      RateLimiter.reset(rateLimitKey);
      
      setUser(loggedInUser);
      localStorage.setItem('flux_user', JSON.stringify(loggedInUser));
      
      toast.success(`Bienvenue, ${loggedInUser.name} !`);
    } else {
      // ✅ 5. NOUVEL UTILISATEUR - CRÉER UN COMPTE
      if (!name) {
        throw new Error('Le nom est requis pour créer un compte');
      }

      // Valider le nom
      const nameValidation = authService.validateName(name);
      if (!nameValidation.valid) {
        throw new Error(nameValidation.error || 'Nom invalide');
      }

      // Valider le mot de passe
      const passwordValidation = authService.validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      // Hasher le mot de passe
      const passwordHash = await authService.hashPassword(password);
      
      const newUser: User = {
        id: authService.generateUserId(),
        email,
        name: authService.sanitizeInput(name),
      };
      
      users[email] = {
        passwordHash,
        name: newUser.name,
        id: newUser.id,
        created_at: new Date().toISOString(),
      };
      
      localStorage.setItem(usersKey, JSON.stringify(users));
      localStorage.setItem('flux_user', JSON.stringify(newUser));
      setUser(newUser);
      
      toast.success(`Compte créé ! Bienvenue, ${newUser.name} !`);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('flux_user');
    toast.success('Déconnexion réussie');
  }, []);

  // Mock token pour compatibilité avec le code existant
  const accessToken = useMemo(() => user ? user.id : null, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    accessToken,
  }), [user, loading, login, logout, accessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
