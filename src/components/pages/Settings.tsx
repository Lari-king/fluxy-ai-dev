/**
 * ⚙️ SETTINGS SCREEN - VERSION 2026
 * 
 * Design harmonisé avec le design system :
 * - Navigation par onglets modernisée
 * - Hiérarchie visuelle optimisée
 * - Performance avec useMemo/useCallback
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Users, 
  Mail, 
  Shield, 
  Bell, 
  Palette, 
  Moon, 
  Sun, 
  Receipt, 
  AlertTriangle, 
  FolderTree, 
  Database,
  Cloud,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { TransactionSettingsTab } from '@/components/settings/TransactionSettingsTab';
import { RulesSettingsTab } from '@/components/settings/RulesSettingsTab';
import { CategoriesManagementTab } from '@/components/settings/CategoriesManagementTab';
import { DataManagementTab } from '@/components/settings/DataManagementTab';
import { StorageSettingsTab } from '@/components/settings/StorageSettingsTab';

interface Invitation {
  id: string;
  email: string;
  role: 'viewer' | 'editor';
  scopes: string[];
  status: 'pending' | 'accepted';
  createdAt: string;
}

const TABS = [
  { id: 'invitations', label: 'Invitations', icon: Users },
  { id: 'preferences', label: 'Préférences', icon: SettingsIcon },
  { id: 'storage', label: 'Stockage', icon: Cloud },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'categories', label: 'Catégories', icon: FolderTree },
  { id: 'rules', label: 'Règles', icon: AlertTriangle },
  { id: 'data', label: 'Données', icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const;

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('invitations');
  const [invitations, setInvitations] = useState<Invitation[]>([
    {
      id: '1',
      email: 'marie@example.com',
      role: 'viewer',
      scopes: ['transactions', 'budgets'],
      status: 'accepted',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      email: 'jean@example.com',
      role: 'viewer',
      scopes: ['dashboard'],
      status: 'pending',
      createdAt: '2024-01-20',
    },
  ]);

  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [newInviteScopes, setNewInviteScopes] = useState<string[]>(['dashboard']);

  const availableScopes = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'budgets', label: 'Budgets' },
    { id: 'goals', label: 'Objectifs' },
    { id: 'people', label: 'Personnes' },
    { id: 'patrimoine', label: 'Patrimoine' },
  ], []);

  const handleSendInvite = useCallback(() => {
    if (!newInviteEmail) {
      toast.error('Email requis');
      return;
    }

    const newInvitation: Invitation = {
      id: Date.now().toString(),
      email: newInviteEmail,
      role: newInviteRole,
      scopes: newInviteScopes,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setInvitations([...invitations, newInvitation]);
    setNewInviteEmail('');
    toast.success('Invitation envoyée !', {
      description: `Un email a été envoyé à ${newInviteEmail}`,
    });
  }, [newInviteEmail, newInviteRole, newInviteScopes, invitations]);

  const handleRevokeInvite = useCallback((id: string) => {
    setInvitations(prev => prev.filter(inv => inv.id !== id));
    toast.success('Invitation révoquée');
  }, []);

  const toggleScope = useCallback((scopeId: string) => {
    setNewInviteScopes(prev => 
      prev.includes(scopeId) 
        ? prev.filter(s => s !== scopeId) 
        : [...prev, scopeId]
    );
  }, []);

  // Layout fullscreen pour l'onglet Règles
  if (activeTab === 'rules') {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-black">
        {/* Header minimaliste */}
        <div className="bg-black/90 backdrop-blur-xl border-b border-white/10 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <SettingsIcon className="w-4 h-4 text-cyan-400" />
              </div>
              <h1 className="text-lg font-medium text-white/90">Paramètres</h1>
            </div>

            {/* Navigation tabs compacte */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content full-screen */}
        <div className="flex-1 overflow-hidden">
          <RulesSettingsTab />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-white/90">Paramètres</h1>
                <p className="text-xs text-white/40">Configurez votre application</p>
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-thin pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/5 border border-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* INVITATIONS TAB */}
            {activeTab === 'invitations' && (
              <div className="space-y-6">
                {/* Inviter une personne */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Mail className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h2 className="text-lg font-medium text-white/90">Inviter une personne</h2>
                      <p className="text-xs text-white/40">Partagez l'accès avec des permissions granulaires</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Email & Role */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Email</label>
                        <input
                          type="email"
                          value={newInviteEmail}
                          onChange={(e) => setNewInviteEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Rôle</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setNewInviteRole('viewer')}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              newInviteRole === 'viewer'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <Shield className="w-4 h-4 mx-auto mb-1" />
                            Lecteur
                          </button>
                          <button
                            onClick={() => setNewInviteRole('editor')}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              newInviteRole === 'editor'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <Shield className="w-4 h-4 mx-auto mb-1" />
                            Éditeur
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scopes */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Périmètres autorisés</label>
                      <div className="flex flex-wrap gap-2">
                        {availableScopes.map(scope => (
                          <button
                            key={scope.id}
                            onClick={() => toggleScope(scope.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                              newInviteScopes.includes(scope.id)
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {scope.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSendInvite}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all shadow-lg shadow-cyan-500/25"
                    >
                      <Mail className="w-4 h-4" />
                      Envoyer l'invitation
                    </button>
                  </div>
                </div>

                {/* Invitations actives */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-medium text-white/90">Invitations actives</h2>
                      <p className="text-xs text-white/40">{invitations.length} invitation{invitations.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {invitations.map(invitation => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-white/90">{invitation.email}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              invitation.status === 'accepted' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {invitation.status === 'accepted' ? 'Acceptée' : 'En attente'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400">
                              {invitation.role === 'viewer' ? 'Lecteur' : 'Éditeur'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {invitation.scopes.map(scope => (
                              <span
                                key={scope}
                                className="text-xs px-2 py-0.5 bg-white/5 text-white/60 rounded"
                              >
                                {availableScopes.find(s => s.id === scope)?.label}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeInvite(invitation.id)}
                          className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm font-medium border border-red-500/20"
                        >
                          Révoquer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Palette className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h2 className="text-lg font-medium text-white/90">Apparence</h2>
                      <p className="text-xs text-white/40">Personnalisez l'interface</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <Moon className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Sun className="w-5 h-5 text-orange-400" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-white/90">Mode sombre</div>
                        <div className="text-xs text-white/40">Interface noir minimaliste</div>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        theme === 'dark' ? 'bg-cyan-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${
                          theme === 'dark' ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STORAGE TAB */}
            {activeTab === 'storage' && <StorageSettingsTab />}

            {/* TRANSACTIONS TAB */}
            {activeTab === 'transactions' && <TransactionSettingsTab />}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && <CategoriesManagementTab />}

            {/* DATA TAB */}
            {activeTab === 'data' && <DataManagementTab />}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h2 className="text-lg font-medium text-white/90">Notifications</h2>
                      <p className="text-xs text-white/40">Gérez vos préférences de notifications</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-white/90">Alertes de budget</div>
                        <div className="text-xs text-white/40">Recevoir des alertes quand un budget est dépassé</div>
                      </div>
                      <button className="relative w-12 h-6 rounded-full bg-cyan-500">
                        <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-lg" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}