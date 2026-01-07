/**
 * Auth Context - LOCAL VERSION
 * Authentification simple avec localStorage
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

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

  // Login simple - crée ou connecte un utilisateur
  const login = useCallback(async (email: string, password: string, name?: string) => {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    // Vérifier si l'utilisateur existe déjà
    const usersKey = 'flux_users';
    const usersData = localStorage.getItem(usersKey);
    const users: Record<string, { password: string; name: string; id: string }> = usersData 
      ? JSON.parse(usersData) 
      : {};

    if (users[email]) {
      // Utilisateur existant - vérifier le mot de passe
      if (users[email].password !== password) {
        throw new Error('Mot de passe incorrect');
      }
      
      const loggedInUser: User = {
        id: users[email].id,
        email,
        name: users[email].name,
      };
      
      setUser(loggedInUser);
      localStorage.setItem('flux_user', JSON.stringify(loggedInUser));
    } else {
      // Nouvel utilisateur - créer un compte
      if (!name) {
        throw new Error('Le nom est requis pour créer un compte');
      }
      
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        name,
      };
      
      users[email] = {
        password,
        name,
        id: newUser.id,
      };
      
      localStorage.setItem(usersKey, JSON.stringify(users));
      localStorage.setItem('flux_user', JSON.stringify(newUser));
      setUser(newUser);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('flux_user');
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
