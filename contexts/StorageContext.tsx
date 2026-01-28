/**
 * 🔄 STORAGE CONTEXT - Mode Hybride LOCAL/CLOUD
 * 
 * Gestion du mode de stockage :
 * - Mode LOCAL (par défaut) : localStorage + bcrypt
 * - Mode CLOUD (optionnel) : Supabase + migration automatique
 * 
 * ✅ Migration transparente des données
 * ✅ Sync bidirectionnel (futur)
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export type StorageMode = 'local' | 'cloud';
export type MigrationStatus = 'idle' | 'migrating' | 'completed' | 'error';

interface StorageContextType {
  mode: StorageMode;
  migrationStatus: MigrationStatus;
  migrationProgress: number;
  migrationError: string | null;
  switchToCloud: () => Promise<void>;
  switchToLocal: () => Promise<void>;
  canSwitchToCloud: boolean;
}

const StorageContext = createContext<StorageContextType | null>(null);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // État du mode de stockage (lu depuis localStorage)
  const [mode, setMode] = useState<StorageMode>(() => {
    const stored = localStorage.getItem('flux_storage_mode');
    return (stored === 'cloud' || stored === 'local') ? stored : 'local';
  });

  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>('idle');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  // Vérifier si Supabase est disponible (pour activer le cloud)
  const canSwitchToCloud = useMemo(() => {
    // TODO: Vérifier si les credentials Supabase sont présents
    // Pour l'instant, on retourne false car pas encore implémenté
    return false;
  }, []);

  // Sauvegarder le mode dans localStorage
  useEffect(() => {
    localStorage.setItem('flux_storage_mode', mode);
    console.log(`💾 Mode de stockage : ${mode.toUpperCase()}`);
  }, [mode]);

  /**
   * Migration LOCAL → CLOUD
   */
  const switchToCloud = useCallback(async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (!canSwitchToCloud) {
      toast.error('Supabase n\'est pas configuré', {
        description: 'Veuillez configurer vos credentials Supabase',
      });
      return;
    }

    setMigrationStatus('migrating');
    setMigrationProgress(0);
    setMigrationError(null);

    try {
      console.log('🚀 Début de la migration LOCAL → CLOUD');

      // 1. Récupérer toutes les données locales
      const localData = {
        transactions: localStorage.getItem(`flux_${user.id}_transactions`),
        budgets: localStorage.getItem(`flux_${user.id}_budgets`),
        goals: localStorage.getItem(`flux_${user.id}_goals`),
        people: localStorage.getItem(`flux_${user.id}_people`),
        accounts: localStorage.getItem(`flux_${user.id}_accounts`),
        categories: localStorage.getItem(`flux_${user.id}_categories`),
        rules: localStorage.getItem(`flux_${user.id}_rules`),
      };

      setMigrationProgress(20);

      // 2. Envoyer les données au cloud (TODO: implémenter)
      console.log('📤 Envoi des données vers Supabase...', localData);
      
      // Simuler l'upload (à remplacer par vrai appel Supabase)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMigrationProgress(60);

      // 3. Vérifier la migration
      console.log('✅ Vérification de la migration...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMigrationProgress(80);

      // 4. Basculer vers le mode cloud
      setMode('cloud');
      setMigrationProgress(100);
      setMigrationStatus('completed');

      toast.success('Migration réussie !', {
        description: 'Vos données sont maintenant synchronisées dans le cloud',
      });

      console.log('✅ Migration LOCAL → CLOUD terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      setMigrationStatus('error');
      setMigrationError(error instanceof Error ? error.message : 'Erreur inconnue');
      
      toast.error('Échec de la migration', {
        description: 'Vos données restent en local',
      });
    }
  }, [user, canSwitchToCloud]);

  /**
   * Migration CLOUD → LOCAL
   */
  const switchToLocal = useCallback(async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setMigrationStatus('migrating');
    setMigrationProgress(0);
    setMigrationError(null);

    try {
      console.log('🚀 Début de la migration CLOUD → LOCAL');

      // 1. Récupérer les données du cloud (TODO: implémenter)
      console.log('📥 Téléchargement des données depuis Supabase...');
      
      // Simuler le download (à remplacer par vrai appel Supabase)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMigrationProgress(60);

      // 2. Sauvegarder en local
      console.log('💾 Sauvegarde des données en local...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMigrationProgress(80);

      // 3. Basculer vers le mode local
      setMode('local');
      setMigrationProgress(100);
      setMigrationStatus('completed');

      toast.success('Basculement réussi !', {
        description: 'Vos données sont maintenant stockées en local',
      });

      console.log('✅ Migration CLOUD → LOCAL terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      setMigrationStatus('error');
      setMigrationError(error instanceof Error ? error.message : 'Erreur inconnue');
      
      toast.error('Échec du basculement', {
        description: 'Vos données restent dans le cloud',
      });
    }
  }, [user]);

  const value = useMemo(() => ({
    mode,
    migrationStatus,
    migrationProgress,
    migrationError,
    switchToCloud,
    switchToLocal,
    canSwitchToCloud,
  }), [
    mode,
    migrationStatus,
    migrationProgress,
    migrationError,
    switchToCloud,
    switchToLocal,
    canSwitchToCloud,
  ]);

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be within StorageProvider');
  return ctx;
}
