/**
 * ☁️ STORAGE SETTINGS TAB - Version Fusionnée
 * 
 * Gestion du mode de stockage :
 * - Local (localStorage) par défaut
 * - Cloud (Supabase) optionnel
 * - Migration automatique des données
 * - Configuration Supabase
 * - Statistiques de stockage
 * 
 * ✅ Performance optimisée avec useMemo/useCallback
 * ✅ Design harmonisé avec le design system
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Cloud,
  HardDrive,
  ArrowRight,
  Check,
  AlertTriangle,
  Lock,
  Globe,
  RefreshCw,
  Settings,
  Zap,
  Loader2,
  ArrowRightLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { storageService, StorageMode } from '@/services/storage';
import { useAuth } from '@/contexts/AuthContext';

interface StorageConfig {
  mode: StorageMode;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export function StorageSettingsTab() {
  const { user } = useAuth();
  const [currentMode, setCurrentMode] = useState<StorageMode>('local');
  const [selectedMode, setSelectedMode] = useState<StorageMode>('local');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  // ✅ Charger le mode actuel au montage
  useEffect(() => {
    const mode = storageService.getMode();
    setCurrentMode(mode);
    setSelectedMode(mode);
  }, []);

  // ✅ Vérifier si Supabase est configuré (détection locale)
  const isSupabaseConfigured = useMemo(() => {
    try {
      const config = localStorage.getItem('flux_supabase_config');
      if (config) {
        const parsed = JSON.parse(config);
        return !!(parsed.url && parsed.key);
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  // ✅ Charger la config Supabase actuelle
  const currentSupabaseConfig = useMemo(() => {
    try {
      const config = localStorage.getItem('flux_supabase_config');
      if (config) {
        const parsed = JSON.parse(config);
        return {
          url: parsed.url || '',
          key: parsed.key || '',
        };
      }
    } catch {
      return null;
    }
    return null;
  }, [showSupabaseConfig]); // Re-compute quand on ferme/ouvre le modal

  // ✅ États pour afficher la clé
  const [showKey, setShowKey] = useState(false);

  // ✅ Statistiques de stockage
  const storageStats = useMemo(() => {
    let totalSize = 0;
    let itemCount = 0;

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('flux_')) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
          itemCount++;
        }
      }
    });

    return {
      totalSize,
      formattedSize: totalSize < 1024 ? `${totalSize} B` : 
                     totalSize < 1024 * 1024 ? `${(totalSize / 1024).toFixed(2)} KB` :
                     `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
      itemCount,
    };
  }, []);

  // ✅ Options de stockage
  const storageOptions = useMemo(() => [
    {
      id: 'local' as StorageMode,
      icon: HardDrive,
      title: 'Mode Local',
      description: 'Données stockées sur votre appareil uniquement',
      features: [
        { icon: Zap, text: 'Ultra rapide' },
        { icon: Lock, text: 'Privé et sécurisé' },
        { icon: AlertTriangle, text: 'Pas de sauvegarde cloud' },
      ],
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500',
      available: true,
    },
    {
      id: 'cloud' as StorageMode,
      icon: Cloud,
      title: 'Mode Cloud',
      description: 'Données synchronisées avec Supabase',
      features: [
        { icon: Cloud, text: 'Sauvegarde automatique' },
        { icon: ArrowRightLeft, text: 'Sync multi-appareils' },
        { icon: Lock, text: 'Chiffrement bout en bout' },
      ],
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
      available: isSupabaseConfigured,
    },
  ], [isSupabaseConfigured]);

  // ✅ Callback pour sauvegarder la config Supabase
  const handleSaveSupabaseConfig = useCallback(() => {
    if (!supabaseUrl || !supabaseKey) {
      toast.error('URL et clé Supabase requises');
      return;
    }

    try {
      const config: StorageConfig = {
        mode: 'cloud',
        supabaseUrl,
        supabaseKey,
      };

      storageService.setConfig(config);
      setShowSupabaseConfig(false);
      toast.success('Configuration Supabase enregistrée');

      // Recharger pour activer Supabase
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Erreur lors de la config Supabase:', error);
      toast.error('Erreur lors de la configuration');
    }
  }, [supabaseUrl, supabaseKey]);

  // ✅ Callback pour changer le mode de stockage
  const handleModeChange = useCallback(async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (selectedMode === currentMode) {
      toast.info('Mode de stockage inchangé');
      setShowConfirmDialog(false);
      return;
    }

    setShowConfirmDialog(false);
    setIsConfiguring(true);
    setIsMigrating(true);
    setMigrationProgress(0);

    try {
      console.log(`🔄 Migration ${currentMode.toUpperCase()} → ${selectedMode.toUpperCase()}`);

      // Configuration du nouveau mode
      const config: StorageConfig = {
        mode: selectedMode,
        ...(selectedMode === 'cloud' && { supabaseUrl, supabaseKey }),
      };

      // Simuler la progression
      setMigrationProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Migration des données
      toast.loading('Migration des données en cours...', { id: 'migration' });
      setMigrationProgress(40);

      await storageService.migrate(user.id, currentMode, selectedMode);
      
      setMigrationProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Appliquer la config
      storageService.setConfig(config);
      
      setMigrationProgress(100);
      toast.success('Migration terminée !', { id: 'migration' });
      
      setCurrentMode(selectedMode);

      // Recharger l'app
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Erreur lors de la migration:', error);
      toast.error(error.message || 'Erreur lors de la migration', { id: 'migration' });
      setSelectedMode(currentMode);
    } finally {
      setIsConfiguring(false);
      setIsMigrating(false);
      setMigrationProgress(0);
    }
  }, [selectedMode, currentMode, user, supabaseUrl, supabaseKey]);

  // ✅ Handler pour initier le changement
  const handleSelectMode = useCallback((mode: StorageMode) => {
    if (mode === 'cloud' && !isSupabaseConfigured) {
      setShowSupabaseConfig(true);
      return;
    }

    setSelectedMode(mode);
    
    if (mode !== currentMode) {
      setShowConfirmDialog(true);
    }
  }, [currentMode, isSupabaseConfigured]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-semibold text-white/90">Mode de stockage</h2>
            <p className="text-sm text-white/60">
              Choisissez où stocker vos données : local ou cloud
            </p>
          </div>
        </div>

        {/* Mode actuel */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/60">Mode actuel :</span>
          <span className={`px-3 py-1 rounded-lg font-medium ${
            currentMode === 'local'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
          }`}>
            {currentMode === 'local' ? 'Local' : 'Cloud'}
          </span>
        </div>
      </div>

      {/* Options de stockage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {storageOptions.map((option) => (
          <motion.div
            key={option.id}
            whileHover={option.available && !isConfiguring ? { scale: 1.02 } : {}}
            className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
              selectedMode === option.id
                ? `bg-${option.color}-500/10 border-${option.color}-500/50`
                : option.available && !isConfiguring
                ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                : 'border-white/5 bg-white/5 opacity-50'
            }`}
            onClick={() => option.available && !isConfiguring && handleSelectMode(option.id)}
          >
            {/* Selected indicator */}
            {selectedMode === option.id && (
              <div className={`absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br ${option.gradient} flex items-center justify-center`}>
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center mb-4`}>
              <option.icon className="w-7 h-7 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-lg font-semibold text-white/90 mb-2">
              {option.title}
            </h3>
            <p className="text-sm text-white/60 mb-4">
              {option.description}
            </p>

            {/* Features */}
            <ul className="space-y-2">
              {option.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-white/50">
                  <feature.icon className="w-3 h-3" />
                  {feature.text}
                </li>
              ))}
            </ul>

            {/* Not available overlay - NOW CLICKABLE */}
            {!option.available && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm">
                <div className="text-center px-4">
                  <Lock className="w-8 h-8 text-white/60 mx-auto mb-2" />
                  <p className="text-sm text-white/80 font-medium mb-3">Configuration requise</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSupabaseConfig(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                  >
                    Configurer Supabase
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Barre de progression migration */}
      {isMigrating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <div>
              <h3 className="text-sm font-medium text-white/90">Migration en cours...</h3>
              <p className="text-xs text-white/60">Ne fermez pas cette fenêtre</p>
            </div>
          </div>

          <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${migrationProgress}%` }}
              transition={{ duration: 0.3 }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500"
            />
          </div>

          <div className="mt-2 text-xs text-white/60 text-right">
            {migrationProgress}%
          </div>
        </motion.div>
      )}

      {/* Configuration Supabase actuelle */}
      {isSupabaseConfigured && currentSupabaseConfig && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Cloud className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-white/90">Configuration Supabase active</h3>
                <p className="text-sm text-white/60">Vos identifiants cloud sont configurés</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSupabaseUrl(currentSupabaseConfig.url);
                  setSupabaseKey(currentSupabaseConfig.key);
                  setShowSupabaseConfig(true);
                }}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-all"
              >
                Modifier
              </button>
              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer la configuration Supabase ? Vous devrez la reconfigurer pour utiliser le mode Cloud.')) {
                    localStorage.removeItem('flux_supabase_config');
                    toast.success('Configuration Supabase supprimée');
                    setTimeout(() => window.location.reload(), 1000);
                  }
                }}
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/30 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/50">URL Supabase</label>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/70 font-mono">
                {currentSupabaseConfig.url}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/50">Clé Anon</label>
              <div className="relative">
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/70 font-mono">
                  {showKey ? currentSupabaseConfig.key : '•'.repeat(40)}
                </div>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-purple-300 font-medium"
                >
                  {showKey ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>

            {/* Info sur l'isolation des données */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-200">
                  <strong className="font-medium">Isolation des données :</strong> Même si plusieurs personnes utilisent les mêmes identifiants Supabase, vos données sont isolées par votre ID utilisateur unique (<code className="text-blue-300 bg-blue-900/20 px-1 rounded">{user?.id}</code>). Personne d'autre ne peut voir vos données.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Configuration Supabase */}
      {showSupabaseConfig && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-white/90">Configuration Supabase</h3>
              <p className="text-sm text-white/60">
                Configuration simple en 3 étapes - aucune connaissance technique requise
              </p>
            </div>
          </div>

          {/* Guide étape par étape */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <div className="text-sm">
                  <p className="text-white/80 font-medium mb-1">Créer un projet Supabase (gratuit)</p>
                  <p className="text-white/50 text-xs">
                    Rendez-vous sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline hover:text-purple-300">supabase.com</a> → "New Project"
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <div className="text-sm">
                  <p className="text-white/80 font-medium mb-1">Copier vos identifiants</p>
                  <p className="text-white/50 text-xs">
                    Dans Settings → API → URL et anon/public key
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <div className="text-sm">
                  <p className="text-white/80 font-medium mb-1">Coller ci-dessous et enregistrer</p>
                  <p className="text-white/50 text-xs">
                    ✅ Aucune configuration de base de données requise - tout est automatique !
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">URL Supabase</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xxxxx.supabase.co"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Clé Anon (publique)</label>
              <input
                type={showKey ? "text" : "password"}
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-4 text-sm text-white/60 hover:text-white/90"
              >
                {showKey ? "Masquer" : "Afficher"}
              </button>
            </div>

            {/* Note rassurante */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-200">
                  <strong>Pas besoin de créer de tables !</strong> Le système utilise automatiquement une architecture clé-valeur fournie par Figma Make. Zéro configuration manuelle requise.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveSupabaseConfig}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                Enregistrer et activer le cloud
              </button>
              <button
                onClick={() => setShowSupabaseConfig(false)}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg font-medium hover:bg-white/10 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal de confirmation */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              <h3 className="text-lg font-semibold text-white/90">Confirmer le changement</h3>
            </div>

            <p className="text-sm text-white/60 mb-6">
              Vos données seront migrées de <strong className="text-white/90">{currentMode === 'local' ? 'Local' : 'Cloud'}</strong> vers <strong className="text-white/90">{selectedMode === 'local' ? 'Local' : 'Cloud'}</strong>. Cette opération peut prendre quelques instants.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/90 hover:bg-white/10 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleModeChange}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <strong className="font-medium">Note :</strong> Le mode local fonctionne sans configuration. Pour utiliser le cloud, vous devez créer un projet Supabase gratuit sur{' '}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-100">
              supabase.com
            </a>
          </div>
        </div>
      </div>

      {/* Info sur le basculement bidirectionnel */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ArrowRightLeft className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-200">
            <strong className="font-medium">Basculement flexible :</strong> Vous pouvez passer du mode Local au mode Cloud (et vice-versa) à tout moment. Vos données seront automatiquement synchronisées. Parfait pour travailler hors ligne et synchroniser quand vous êtes connecté !
          </div>
        </div>
      </div>
    </div>
  );
}