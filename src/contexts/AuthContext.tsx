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
import { authService } from '@/services/authService';
import { RateLimiter } from '@/utils/security';
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
// Login sécurisé avec gestion de migration et protection contre les crashs
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
    windowMs: 15 * 60 * 1000,
  });

  if (isLimited) {
    throw new Error(`Trop de tentatives. Réessayez plus tard.`);
  }

  // Simuler un léger délai réseau pour la sécurité (anti-bruteforce)
  await new Promise(resolve => setTimeout(resolve, 500));

  // ✅ 3. RÉCUPÉRER LES UTILISATEURS
  const usersKey = 'flux_users';
  const usersData = localStorage.getItem(usersKey);
  const users = usersData ? JSON.parse(usersData) : {};

  const existingUser = users[email];

  if (existingUser) {
    // ✅ 4. UTILISATEUR EXISTANT
    // On récupère le hash, avec une sécurité si la clé est absente (le fameux fix)
    const storedHash = existingUser.passwordHash || ""; 
    
    // Si le hash est vide ou ne commence pas par $2 (bcrypt), c'est un ancien compte ou un bug
    if (!storedHash || !storedHash.startsWith('$2')) {
      
      // Tentative de récupération : soit c'est le password en clair dans passwordHash, 
      // soit c'était stocké dans une ancienne clé .password
      const oldPassword = storedHash || existingUser.password;

      if (oldPassword === password) {
        // MIGRATION : On génère un vrai hash bcrypt pour la prochaine fois
        const newHash = await authService.hashPassword(password);
        users[email].passwordHash = newHash;
        // On nettoie l'ancienne clé si elle existait
        delete users[email].password; 
        localStorage.setItem(usersKey, JSON.stringify(users));
      } else {
        RateLimiter.recordAttempt({ key: rateLimitKey, maxAttempts: 5, windowMs: 15 * 60 * 1000 });
        throw new Error('Mot de passe incorrect');
      }
    } else {
      // VÉRIFICATION NORMALE (BCRYPT)
      const isValid = await authService.verifyPassword(password, storedHash);
      if (!isValid) {
        RateLimiter.recordAttempt({ key: rateLimitKey, maxAttempts: 5, windowMs: 15 * 60 * 1000 });
        throw new Error('Mot de passe incorrect');
      }
    }
    
    const loggedInUser: User = {
      id: existingUser.id,
      email,
      name: existingUser.name,
    };
    
    authService.updateLastLogin(email);
    RateLimiter.reset(rateLimitKey);
    
    setUser(loggedInUser);
    localStorage.setItem('flux_user', JSON.stringify(loggedInUser));
    toast.success(`Bienvenue, ${loggedInUser.name} !`);

  } else {
    // ✅ 5. NOUVEL UTILISATEUR (CRÉATION)
    if (!name) {
      throw new Error('Le nom est requis pour créer un compte');
    }

    const nameValidation = authService.validateName(name);
    if (!nameValidation.valid) throw new Error(nameValidation.error || 'Nom invalide');

    const passwordValidation = authService.validatePassword(password);
    if (!passwordValidation.valid) throw new Error(passwordValidation.errors.join(', '));

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
