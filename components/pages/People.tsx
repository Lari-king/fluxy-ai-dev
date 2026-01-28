import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from 'contexts/AuthContext';
import { useData } from 'contexts/DataContext';
import { ArrowLeft, Plus, LayoutDashboard, Network, Calendar } from 'lucide-react';
import { Button } from 'components/ui/button';
import { toast } from 'sonner';
import { enrichPeopleWithCache } from 'src/utils/people-enrichment';
import { PersonRelation } from 'types/people';
import { PersonForm } from 'components/people/PersonForm';
import { RelationsDashboard } from 'components/relations/RelationsDashboard';
import { RelationDetail } from 'components/relations/RelationDetail';
import { RelationTopology } from 'components/relations/RelationTopology';
import { AppEvents, emitEvent } from 'src/utils/events';

type ViewMode = 'dashboard' | 'detail' | 'topology';
type Period = 'current-month' | 'custom';

export function People() {
  const { accessToken } = useAuth();
  const { people: rawPeople, transactions, loading, updatePeople } = useData();
  
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPerson, setSelectedPerson] = useState<PersonRelation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonRelation | undefined>();
  const [pendingPersonId, setPendingPersonId] = useState<string | null>(null);

  // États pour la période (partagés entre Dashboard et Topologie)
  const [period, setPeriod] = useState<Period>('current-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // --- LOGIQUE DE DONNÉES ---

  const { enrichedPeople, scores } = useMemo(() => {
    const result = enrichPeopleWithCache(rawPeople as PersonRelation[], {
      transactions,
      monthlyIncome: 2800,
    });
    return { 
      enrichedPeople: result.people, 
      scores: result.scores 
    };
  }, [rawPeople, transactions]);

  // 🔄 Synchronisation automatique des données enrichies
  useEffect(() => {
    // Mettre à jour selectedPerson avec sa version enrichie
    if (selectedPerson) {
      const updatedPerson = enrichedPeople.find(p => p.id === selectedPerson.id);
      if (updatedPerson) {
        setSelectedPerson(updatedPerson);
      }
    }
    
    // Si une personne vient d'être créée, l'afficher automatiquement
    if (pendingPersonId) {
      const newPerson = enrichedPeople.find(p => p.id === pendingPersonId);
      if (newPerson) {
        setSelectedPerson(newPerson);
        setViewMode('detail');
        setPendingPersonId(null);
      }
    }
  }, [enrichedPeople, pendingPersonId]);

  const adaptedTransactions = useMemo(() => {
    return transactions.map(txn => ({
      id: txn.id,
      date: txn.date,
      amount: txn.amount,
      label: txn.description,
      personId: txn.personId,
      mainCategory: txn.category,
      subCategory: (txn as any).subCategory || '',
    }));
  }, [transactions]);

  // Calcul de la période active (pour affichage du label)
  const periodLabel = useMemo(() => {
    let startDate, endDate;
    
    if (period === 'current-month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    } else {
      startDate = customStartDate || new Date().toISOString().split('T')[0];
      endDate = customEndDate || new Date().toISOString().split('T')[0];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }, [period, customStartDate, customEndDate]);

  const cleanCalculatedFields = (person: any) => {
    const calculatedKeys = [
      'income', 'expenses', 'totalImpact', 'transactionCount',
      'trend', 'dependanceLevel', 'dependanceRatio', 'progressionState', 
      'progressionPercentage', 'arbitrageSignal', 'arbitrageMessage',
      'averageTransaction', 'lastTransactionDate', 'lastTransactionAmount'
    ];
    const cleaned = { ...person };
    calculatedKeys.forEach(key => delete cleaned[key]);
    return cleaned;
  };

  const handleSavePerson = async (personToSave: PersonRelation) => {
    try {
      const cleanedNewPerson = cleanCalculatedFields(personToSave);
      
      let updatedPeople;
      if (editingPerson) {
        updatedPeople = rawPeople.map((p: any) => 
          p.id === cleanedNewPerson.id ? { ...p, ...cleanedNewPerson } : p
        );
      } else {
        updatedPeople = [...rawPeople, cleanedNewPerson];
      }

      if (accessToken) {
        const rawToSave = updatedPeople.map(p => cleanCalculatedFields(p));
        await updatePeople(rawToSave);
        emitEvent(AppEvents.PEOPLE_UPDATED);
      }

      toast.success(editingPerson ? 'Profil mis à jour' : 'Nouvelle relation créée');
      
      // Si c'est une nouvelle personne, la sélectionner automatiquement
      if (!editingPerson) {
        setPendingPersonId(cleanedNewPerson.id);
      }
      
      setShowForm(false);
      setEditingPerson(undefined);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur technique lors de la sauvegarde');
    }
  };

  const handleDeletePerson = async (personId: string) => {
    try {
      const updatedPeople = rawPeople
        .filter((p: any) => p.id !== personId)
        .map(p => cleanCalculatedFields(p));

      if (accessToken) {
        await updatePeople(updatedPeople);
        emitEvent(AppEvents.PEOPLE_UPDATED);
      }

      toast.success('Relation supprimée');
      setSelectedPerson(null);
      setViewMode('dashboard');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEditPerson = (person: PersonRelation) => {
    const rawVersion = rawPeople.find(p => p.id === person.id) || person;
    setEditingPerson(rawVersion as PersonRelation);
    setShowForm(true);
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0A0B0D]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Initialisation...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0A0B0D] text-white overflow-hidden">
      
      {/* HEADER REFONDÉ */}
      <header className="flex-shrink-0 border-b border-white/5 bg-[#0A0B0D]/95 backdrop-blur-xl z-50">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          
          {/* Ligne 1 : Titre + Bouton */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Bouton retour si en mode détail */}
              {viewMode === 'detail' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewMode('dashboard')}
                  className="rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> 
                  Retour
                </Button>
              )}
              
              <h1 className="text-2xl font-bold tracking-tight">Relations</h1>
            </div>

            <Button 
              onClick={() => { setEditingPerson(undefined); setShowForm(true); }}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 shadow-lg shadow-cyan-500/20 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" /> 
              Nouvelle relation
            </Button>
          </div>

          {/* Ligne 2 : Filtres (caché en mode detail) */}
          {viewMode !== 'detail' && (
            <div className="flex items-center gap-4">
              {/* Toggle Dashboard / Topologie */}
              <nav className="flex items-center bg-white/5 p-1 rounded-full border border-white/10">
                <button 
                  onClick={() => setViewMode('dashboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'dashboard' 
                      ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button 
                  onClick={() => setViewMode('topology')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'topology' 
                      ? 'bg-purple-500/20 text-purple-400 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Network className="w-4 h-4" />
                  Topologie
                </button>
              </nav>

              {/* Sélecteur de Période */}
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                  className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-white pr-8"
                >
                  <option value="current-month" className="bg-[#12131A]">Mois en cours</option>
                  <option value="custom" className="bg-[#12131A]">Période personnalisée</option>
                </select>
              </div>
              
              {period === 'custom' && (
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent border-none text-sm focus:outline-none text-white"
                  />
                  <span className="text-slate-500">→</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent border-none text-sm focus:outline-none text-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          
          {/* Vue Dashboard */}
          {viewMode === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto"
            >
              <RelationsDashboard
                people={enrichedPeople}
                scores={scores}
                transactions={transactions}
                period={period}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onViewDetail={(p) => { setSelectedPerson(p); setViewMode('detail'); }}
                onEdit={handleEditPerson}
                onDelete={handleDeletePerson}
              />
            </motion.div>
          )}

          {/* Vue Détail Relation */}
          {viewMode === 'detail' && selectedPerson && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="h-full overflow-y-auto bg-[#0A0B0D]"
            >
              <RelationDetail
                person={selectedPerson}
                transactions={transactions.filter(t => t.personId === selectedPerson.id && !t.isHidden)}
                allPeople={enrichedPeople}
                onEdit={() => handleEditPerson(selectedPerson)}
                onDelete={() => handleDeletePerson(selectedPerson.id)}
                onBack={() => setViewMode('dashboard')}
                onViewDetail={(p) => setSelectedPerson(p)}
              />
            </motion.div>
          )}

          {/* Vue Topologie */}
          {viewMode === 'topology' && (
            <motion.div
              key="topology"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full w-full"
            >
              <RelationTopology
                people={enrichedPeople}
                transactions={adaptedTransactions}
                onSelectPerson={(p) => { setSelectedPerson(p); setViewMode('detail'); }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Formulaire Création/Édition */}
      <AnimatePresence>
        {showForm && (
          <PersonForm
            person={editingPerson}
            onClose={() => { setShowForm(false); setEditingPerson(undefined); }}
            onSave={handleSavePerson}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
