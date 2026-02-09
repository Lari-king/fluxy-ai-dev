import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Users, 
  Mail, 
  Shield, 
  Bell, 
  Receipt, 
  AlertTriangle,
  Plus,
  Check,
  Trash2,
  ArrowLeft,
  Moon,
  Sun,
  Globe,
  Palette,
  CheckCircle2,
  FolderTree,
  Database
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { TransactionSettingsTab } from '@/components/settings/TransactionSettingsTab';
import { RulesSettingsTab } from '@/components/settings/RulesSettingsTab';
import { CategoriesManagementTab } from '@/components/settings/CategoriesManagementTab';
import { DataManagementTab } from '@/components/settings/DataManagementTab';

interface Invitation {
  id: string;
  email: string;
  role: 'viewer' | 'editor';
  scopes: string[];
  status: 'pending' | 'accepted';
  createdAt: string;
}

export function ModernSettings() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('invitations');
  
  // État des invitations
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

  // État des préférences
  const [preferences, setPreferences] = useState({
    darkMode: theme === 'dark',
    animations: true,
    currency: 'eur',
    language: 'fr',
  });

  // État des notifications
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    goalsReached: true,
    monthlySummary: true,
    unusualExpenses: false,
  });

  const availableScopes = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'budgets', label: 'Budgets' },
    { id: 'goals', label: 'Objectifs' },
    { id: 'people', label: 'Personnes' },
    { id: 'patrimoine', label: 'Patrimoine' },
  ];

  const handleSendInvite = () => {
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
    setNewInviteScopes(['dashboard']);
    toast.success('Invitation envoyée !', {
      description: `Un email a été envoyé à ${newInviteEmail}`,
    });
  };

  const handleRevokeInvite = (id: string) => {
    setInvitations(invitations.filter(inv => inv.id !== id));
    toast.success('Invitation révoquée');
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences({ ...preferences, [key]: value });
    if (key === 'darkMode') {
      toggleTheme();
    }
    toast.success('Préférence mise à jour');
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications({ ...notifications, [key]: value });
  };

  const tabs = [
    { id: 'invitations', label: 'Invitations', icon: Users },
    { id: 'preferences', label: 'Préférences', icon: SettingsIcon },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'rules', label: 'Règles', icon: AlertTriangle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'categories', label: 'Catégories', icon: FolderTree },
    { id: 'data', label: 'Données', icon: Database },
  ];

  // Layout fullscreen pour l'onglet Règles (SANS ONGLETS)
  if (activeTab === 'rules') {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ background: '#0a0a0a' }}>
        {/* Mini header pour navigation SANS ONGLETS */}
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl flex-shrink-0">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-medium text-white">Paramètres</h1>
                <p className="text-xs text-white/40">Règles personnalisées</p>
              </div>

              <button
                onClick={() => setActiveTab('invitations')}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Retour aux paramètres</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenu Règles en fullscreen - SANS SCROLL (RulesSettingsTab gère son propre scroll) */}
        <div className="flex-1 overflow-hidden">
          <RulesSettingsTab />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Header Sticky */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl flex-shrink-0">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {/* Row 1: Titre + Bouton Retour */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl text-white">Paramètres</h1>
              <p className="text-xs text-white/40">Gérez vos préférences et invitations</p>
            </div>

            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Retour</span>
            </button>
          </div>

          {/* Row 2: Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-purple-600/20 border border-purple-500/30 text-white'
                      : 'hover:bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-white/40'}`} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu Principal - AVEC SCROLL FORCÉ */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* ONGLET 1: INVITATIONS */}
          {activeTab === 'invitations' && (
            <div className="space-y-6">
              {/* Card: Nouvelle Invitation */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white text-xl">Inviter une personne</h2>
                    <p className="text-sm text-white/60">Partagez l'accès avec des permissions granulaires</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Email</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={newInviteEmail}
                      onChange={(e) => setNewInviteEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  {/* Sélection Rôle */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Rôle</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setNewInviteRole('viewer')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          newInviteRole === 'viewer'
                            ? 'bg-purple-600/20 border-purple-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Shield className={`w-5 h-5 mb-2 ${newInviteRole === 'viewer' ? 'text-purple-400' : 'text-white/40'}`} />
                        <div className="text-sm text-white">Lecteur</div>
                        <div className="text-xs text-white/40">Lecture seule</div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setNewInviteRole('editor')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          newInviteRole === 'editor'
                            ? 'bg-purple-600/20 border-purple-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Shield className={`w-5 h-5 mb-2 ${newInviteRole === 'editor' ? 'text-purple-400' : 'text-white/40'}`} />
                        <div className="text-sm text-white">Éditeur</div>
                        <div className="text-xs text-white/40">Lecture & écriture</div>
                      </motion.button>
                    </div>
                  </div>

                  {/* Sélection Périmètres */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Périmètres autorisés</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableScopes.map(scope => {
                        const isSelected = newInviteScopes.includes(scope.id);
                        return (
                          <button
                            key={scope.id}
                            onClick={() => {
                              if (isSelected) {
                                setNewInviteScopes(newInviteScopes.filter(s => s !== scope.id));
                              } else {
                                setNewInviteScopes([...newInviteScopes, scope.id]);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                                : 'bg-white/5 border-white/10 hover:border-white/20 text-white/60'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {scope.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bouton Envoyer */}
                  <button
                    onClick={handleSendInvite}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-xl text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Envoyer l'invitation
                  </button>
                </div>
              </div>

              {/* Card: Invitations Actives */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-white text-xl mb-4">Invitations actives</h2>
                <div className="space-y-3">
                  {invitations.map(invitation => (
                    <div
                      key={invitation.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <div className="text-white">{invitation.email}</div>
                            <div className="text-xs text-white/40">Invité le {invitation.createdAt}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRevokeInvite(invitation.id)}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Badge Statut */}
                        <Badge
                          className={`${
                            invitation.status === 'accepted'
                              ? 'bg-green-600/20 border border-green-500/30 text-green-300'
                              : 'bg-orange-600/20 border border-orange-500/30 text-orange-300'
                          }`}
                        >
                          {invitation.status === 'accepted' ? 'Acceptée' : 'En attente'}
                        </Badge>

                        {/* Badge Rôle */}
                        <Badge className="bg-white/10 text-white/80">
                          {invitation.role === 'viewer' ? 'Lecteur' : 'Éditeur'}
                        </Badge>

                        {/* Badges Périmètres */}
                        {invitation.scopes.map(scope => (
                          <Badge key={scope} className="bg-purple-600/20 border border-purple-500/30 text-purple-300">
                            {availableScopes.find(s => s.id === scope)?.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 2: PRÉFÉRENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Card: Apparence */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white text-xl">Apparence</h2>
                    <p className="text-sm text-white/60">Personnalisez l'interface</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Mode Sombre */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      {preferences.darkMode ? (
                        <Moon className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Sun className="w-5 h-5 text-orange-400" />
                      )}
                      <div>
                        <div className="text-white">Mode sombre</div>
                        <div className="text-xs text-white/40">Activer le thème sombre</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePreferenceChange('darkMode', !preferences.darkMode)}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        preferences.darkMode ? 'bg-purple-600' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          preferences.darkMode ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Animations */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-white">Animations</div>
                        <div className="text-xs text-white/40">Activer les animations fluides</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePreferenceChange('animations', !preferences.animations)}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        preferences.animations ? 'bg-purple-600' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          preferences.animations ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card: Langue et région */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white text-xl">Langue et région</h2>
                    <p className="text-sm text-white/60">Paramètres régionaux</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Devise */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Devise</Label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="eur" className="bg-gray-900 text-white">Euro (€)</option>
                      <option value="usd" className="bg-gray-900 text-white">Dollar ($)</option>
                      <option value="gbp" className="bg-gray-900 text-white">Livre (£)</option>
                    </select>
                  </div>

                  {/* Langue */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Langue</Label>
                    <select
                      value={preferences.language}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="fr" className="bg-gray-900 text-white">Français</option>
                      <option value="en" className="bg-gray-900 text-white">English</option>
                      <option value="es" className="bg-gray-900 text-white">Español</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 3: TRANSACTIONS - WRAPPER AVEC STYLES FORCÉS */}
          {activeTab === 'transactions' && (
            <div className="transactions-settings-wrapper">
              <style>{`
                .transactions-settings-wrapper {
                  color: white;
                }
                .transactions-settings-wrapper * {
                  color: inherit;
                }
                .transactions-settings-wrapper h1,
                .transactions-settings-wrapper h2,
                .transactions-settings-wrapper h3,
                .transactions-settings-wrapper h4,
                .transactions-settings-wrapper h5,
                .transactions-settings-wrapper h6 {
                  color: white !important;
                }
                .transactions-settings-wrapper p,
                .transactions-settings-wrapper label,
                .transactions-settings-wrapper span,
                .transactions-settings-wrapper div {
                  color: rgba(255, 255, 255, 0.9) !important;
                }
                .transactions-settings-wrapper input {
                  color: white !important;
                  background: rgba(255, 255, 255, 0.05) !important;
                  border-color: rgba(255, 255, 255, 0.1) !important;
                }
                .transactions-settings-wrapper button {
                  color: white !important;
                }
                .transactions-settings-wrapper [class*="text-gray"],
                .transactions-settings-wrapper [class*="text-slate"] {
                  color: rgba(255, 255, 255, 0.6) !important;
                }
              `}</style>
              <TransactionSettingsTab />
            </div>
          )}

          {/* ONGLET 5: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-xl">Notifications</h2>
                  <p className="text-sm text-white/60">Gérez vos préférences de notification</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Alertes de budget */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-white">Alertes de budget</div>
                    <div className="text-xs text-white/40">Recevoir des alertes quand un budget est dépassé</div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('budgetAlerts', !notifications.budgetAlerts)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      notifications.budgetAlerts ? 'bg-purple-600' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifications.budgetAlerts ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Objectifs atteints */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-white">Objectifs atteints</div>
                    <div className="text-xs text-white/40">Notification lorsqu'un objectif est complété</div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('goalsReached', !notifications.goalsReached)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      notifications.goalsReached ? 'bg-purple-600' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifications.goalsReached ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Résumé mensuel */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-white">Résumé mensuel</div>
                    <div className="text-xs text-white/40">Recevoir un résumé de vos finances chaque mois</div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('monthlySummary', !notifications.monthlySummary)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      notifications.monthlySummary ? 'bg-purple-600' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifications.monthlySummary ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Dépenses inhabituelles */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-white">Dépenses inhabituelles</div>
                    <div className="text-xs text-white/40">Alerte sur les transactions anormales détectées</div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('unusualExpenses', !notifications.unusualExpenses)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      notifications.unusualExpenses ? 'bg-purple-600' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifications.unusualExpenses ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 6: CATÉGORIES */}
          {activeTab === 'categories' && (
            <div className="categories-settings-wrapper">
              <style>{`
                .categories-settings-wrapper {
                  color: white;
                }
                .categories-settings-wrapper * {
                  color: inherit;
                }
                .categories-settings-wrapper h1,
                .categories-settings-wrapper h2,
                .categories-settings-wrapper h3,
                .categories-settings-wrapper h4,
                .categories-settings-wrapper h5,
                .categories-settings-wrapper h6 {
                  color: white !important;
                }
                .categories-settings-wrapper p,
                .categories-settings-wrapper label,
                .categories-settings-wrapper span,
                .categories-settings-wrapper div {
                  color: rgba(255, 255, 255, 0.9) !important;
                }
                .categories-settings-wrapper input,
                .categories-settings-wrapper select,
                .categories-settings-wrapper textarea {
                  color: white !important;
                  background: rgba(255, 255, 255, 0.05) !important;
                  border-color: rgba(255, 255, 255, 0.1) !important;
                }
                .categories-settings-wrapper button {
                  color: white !important;
                }
                .categories-settings-wrapper [class*="text-gray"],
                .categories-settings-wrapper [class*="text-slate"] {
                  color: rgba(255, 255, 255, 0.6) !important;
                }
                .categories-settings-wrapper [class*="bg-gray"],
                .categories-settings-wrapper [class*="bg-slate"] {
                  background: rgba(255, 255, 255, 0.05) !important;
                }
                .categories-settings-wrapper [class*="border-gray"],
                .categories-settings-wrapper [class*="border-slate"] {
                  border-color: rgba(255, 255, 255, 0.1) !important;
                }
              `}</style>
              <CategoriesManagementTab />
            </div>
          )}

          {/* ONGLET 7: DONNÉES */}
          {activeTab === 'data' && (
            <div className="data-settings-wrapper">
              <style>{`
                .data-settings-wrapper {
                  color: white;
                }
                .data-settings-wrapper * {
                  color: inherit;
                }
                .data-settings-wrapper h1,
                .data-settings-wrapper h2,
                .data-settings-wrapper h3,
                .data-settings-wrapper h4,
                .data-settings-wrapper h5,
                .data-settings-wrapper h6 {
                  color: white !important;
                }
                .data-settings-wrapper p,
                .data-settings-wrapper label,
                .data-settings-wrapper span,
                .data-settings-wrapper div {
                  color: rgba(255, 255, 255, 0.9) !important;
                }
                .data-settings-wrapper input,
                .data-settings-wrapper select,
                .data-settings-wrapper textarea {
                  color: white !important;
                  background: rgba(255, 255, 255, 0.05) !important;
                  border-color: rgba(255, 255, 255, 0.1) !important;
                }
                .data-settings-wrapper button {
                  color: white !important;
                }
                .data-settings-wrapper [class*="text-gray"],
                .data-settings-wrapper [class*="text-slate"],
                .data-settings-wrapper [class*="text-red"] {
                  color: rgba(255, 255, 255, 0.6) !important;
                }
                .data-settings-wrapper [class*="bg-gray"],
                .data-settings-wrapper [class*="bg-slate"] {
                  background: rgba(255, 255, 255, 0.05) !important;
                }
                .data-settings-wrapper [class*="border-gray"],
                .data-settings-wrapper [class*="border-slate"] {
                  border-color: rgba(255, 255, 255, 0.1) !important;
                }
                /* Texte rouge pour les warnings */
                .data-settings-wrapper [class*="text-red"] {
                  color: rgb(239, 68, 68) !important;
                }
                .data-settings-wrapper [class*="bg-red"] {
                  background: rgba(239, 68, 68, 0.1) !important;
                }
                .data-settings-wrapper [class*="border-red"] {
                  border-color: rgba(239, 68, 68, 0.3) !important;
                }
              `}</style>
              <DataManagementTab />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
