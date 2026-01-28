/**
 * 🗄️ STORAGE SERVICE - Architecture Hybride LOCAL/CLOUD
 * 
 * Version fusionnée combinant :
 * - Interface StorageService pour abstraction
 * - Classe StorageService avec cache et config
 * - Support LOCAL (localStorage) et CLOUD (Supabase)
 * - Migration automatique entre modes
 * - Performance optimisée avec cache
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type StorageMode = 'local' | 'cloud';

interface StorageConfig {
  mode: StorageMode;
  supabaseUrl?: string;
  supabaseKey?: string;
}

/**
 * Interface pour abstraction du stockage
 * Permet de créer différentes implémentations
 */
export interface IStorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Implémentation LocalStorage (pour mode LOCAL)
 */
export class LocalStorageService implements IStorageService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`❌ Erreur LocalStorage GET ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`❌ Erreur LocalStorage SET ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`❌ Erreur LocalStorage DELETE ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('flux_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('❌ Erreur LocalStorage CLEAR:', error);
      throw error;
    }
  }
}

/**
 * Implémentation Supabase (pour mode CLOUD)
 */
export class SupabaseStorageService implements IStorageService {
  private supabase: SupabaseClient;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from('kv_store_0146de71')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        console.error(`❌ Supabase GET ${key}:`, error);
        return null;
      }

      return (data?.value as T) || null;
    } catch (error) {
      console.error(`❌ Erreur Supabase GET ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('kv_store_0146de71')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`❌ Supabase SET ${key}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`❌ Erreur Supabase SET ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('kv_store_0146de71')
        .delete()
        .eq('key', key);

      if (error) {
        console.error(`❌ Supabase DELETE ${key}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`❌ Erreur Supabase DELETE ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('kv_store_0146de71')
        .delete()
        .like('key', 'flux_%');

      if (error) {
        console.error('❌ Supabase CLEAR:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Erreur Supabase CLEAR:', error);
      throw error;
    }
  }
}

/**
 * Service principal avec cache et gestion de config
 */
class StorageService {
  private mode: StorageMode = 'local';
  private supabase: SupabaseClient | null = null;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5000; // 5 secondes

  // Services d'abstraction
  private localService: LocalStorageService;
  private cloudService: SupabaseStorageService | null = null;

  constructor() {
    this.localService = new LocalStorageService();
    this.loadConfig();
  }

  /**
   * Charge la configuration du mode de stockage
   */
  private loadConfig(): void {
    try {
      const config = localStorage.getItem('flux_storage_mode');
      if (config) {
        this.mode = config as StorageMode;
        console.log(`💾 Mode de stockage chargé : ${this.mode.toUpperCase()}`);
      }

      // Charger les credentials Supabase si mode cloud
      if (this.mode === 'cloud') {
        const supabaseConfig = localStorage.getItem('flux_supabase_config');
        if (supabaseConfig) {
          const parsed = JSON.parse(supabaseConfig);
          if (parsed.url && parsed.key) {
            this.initSupabase(parsed.url, parsed.key);
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Erreur lors du chargement de la config storage:', err);
      this.mode = 'local';
    }
  }

  /**
   * Initialise Supabase
   */
  private initSupabase(url: string, key: string): void {
    try {
      this.supabase = createClient(url, key);
      this.cloudService = new SupabaseStorageService(url, key);
      console.log('✅ Supabase initialisé');
    } catch (err) {
      console.error('❌ Erreur lors de l\'initialisation de Supabase:', err);
      this.mode = 'local';
      this.supabase = null;
      this.cloudService = null;
    }
  }

  /**
   * Configure le mode de stockage
   */
  setConfig(config: StorageConfig): void {
    this.mode = config.mode;
    
    if (config.mode === 'cloud' && config.supabaseUrl && config.supabaseKey) {
      this.initSupabase(config.supabaseUrl, config.supabaseKey);
      
      // Sauvegarder les credentials
      localStorage.setItem('flux_supabase_config', JSON.stringify({
        url: config.supabaseUrl,
        key: config.supabaseKey,
      }));
    } else {
      this.supabase = null;
      this.cloudService = null;
    }
    
    // Sauvegarder le mode
    localStorage.setItem('flux_storage_mode', config.mode);
    
    // Clear cache
    this.cache.clear();
    
    console.log(`💾 Mode de stockage configuré : ${config.mode.toUpperCase()}`);
  }

  /**
   * Récupère le mode actuel
   */
  getMode(): StorageMode {
    return this.mode;
  }

  /**
   * Vérifie si Supabase est disponible
   */
  isCloudAvailable(): boolean {
    return this.mode === 'cloud' && this.supabase !== null && this.cloudService !== null;
  }

  /**
   * Génère une clé de stockage pour un utilisateur
   */
  private getKey(userId: string, type: string): string {
    return `flux_${userId}_${type}`;
  }

  /**
   * Vérifie si les données sont en cache et valides
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Met en cache les données
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * GET - Récupère des données
   */
  async get<T>(userId: string, type: string, defaultValue: T): Promise<T> {
    const cacheKey = `${userId}_${type}`;
    
    // Vérifier le cache
    const cached = this.getCachedData(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const key = this.getKey(userId, type);
      let result: T;

      if (this.isCloudAvailable() && this.cloudService) {
        // Mode CLOUD : Supabase
        result = (await this.cloudService.get<T>(key)) || defaultValue;
      } else {
        // Mode LOCAL : localStorage
        result = (await this.localService.get<T>(key)) || defaultValue;
      }

      this.setCachedData(cacheKey, result);
      return result;
    } catch (err) {
      console.error(`❌ Erreur GET ${type}:`, err);
      return defaultValue;
    }
  }

  /**
   * SET - Sauvegarde des données
   */
  async set(userId: string, type: string, data: any): Promise<void> {
    const cacheKey = `${userId}_${type}`;
    
    try {
      const key = this.getKey(userId, type);

      if (this.isCloudAvailable() && this.cloudService) {
        // Mode CLOUD : Supabase
        await this.cloudService.set(key, data);
      } else {
        // Mode LOCAL : localStorage
        await this.localService.set(key, data);
      }

      // Mettre à jour le cache
      this.setCachedData(cacheKey, data);
    } catch (err) {
      console.error(`❌ Erreur SET ${type}:`, err);
      throw err;
    }
  }

  /**
   * DELETE - Supprime des données
   */
  async delete(userId: string, type: string): Promise<void> {
    const cacheKey = `${userId}_${type}`;
    
    try {
      const key = this.getKey(userId, type);

      if (this.isCloudAvailable() && this.cloudService) {
        // Mode CLOUD : Supabase
        await this.cloudService.delete(key);
      } else {
        // Mode LOCAL : localStorage
        await this.localService.delete(key);
      }

      // Supprimer du cache
      this.cache.delete(cacheKey);
    } catch (err) {
      console.error(`❌ Erreur DELETE ${type}:`, err);
      throw err;
    }
  }

  /**
   * MIGRATE - Migre les données entre LOCAL et CLOUD
   */
  async migrate(userId: string, from: StorageMode, to: StorageMode): Promise<void> {
    console.log(`🔄 Migration ${from.toUpperCase()} → ${to.toUpperCase()}...`);
    
    const dataTypes = ['transactions', 'budgets', 'goals', 'people', 'accounts', 'categories', 'rules'];
    
    try {
      for (const type of dataTypes) {
        const key = this.getKey(userId, type);
        
        // Récupérer depuis la source
        let sourceData: any;
        if (from === 'local') {
          sourceData = await this.localService.get(key);
        } else if (this.cloudService) {
          sourceData = await this.cloudService.get(key);
        }
        
        // Sauvegarder vers la destination (si données existent)
        if (sourceData) {
          if (to === 'local') {
            await this.localService.set(key, sourceData);
          } else if (this.cloudService) {
            await this.cloudService.set(key, sourceData);
          }
          
          console.log(`  ✅ ${type} migré (${JSON.stringify(sourceData).length} bytes)`);
        }
      }
      
      console.log('✅ Migration terminée avec succès');
    } catch (err) {
      console.error('❌ Erreur lors de la migration:', err);
      throw err;
    }
  }

  /**
   * CLEAR CACHE - Vide le cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache vidé');
  }
}

// Singleton
export const storageService = new StorageService();
