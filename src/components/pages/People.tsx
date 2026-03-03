// src/components/pages/People.tsx

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, LayoutDashboard, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Import de la Feature People
import { 
  PersonRelation, 
  PersonForm, 
  RelationsDashboard, 
  RelationDetail, 
  RelationTopology,
  usePeopleEngine,       
  sanitizeForSave,       
} from '@/features/people';

import { AppEvents, emitEvent } from '@/utils/events';
import { useData } from '@/contexts/DataContext';

type ViewMode = 'dashboard' | 'detail' | 'topology';
type Period = 'all' | 'current-month' | 'last-3-months' | 'last-6-months' | 'current-year' | 'custom';

export function People() {
  const { 
    people: rawPeople, 
    transactions, 
    loading, 
    updatePeople, 
    updateTransactions 
  } = useData();
  
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPerson, setSelectedPerson] = useState<PersonRelation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonRelation | undefined>();

  const [period, setPeriod] = useState<Period>('all');
  // Les états custom sont gardés au cas où, mais nous les lions si besoin
  const [customStartDate] = useState('');
  const [customEndDate] = useState('');

  // --- UTILISATION DU MOTEUR PEOPLE ---
  // Correction ici : l'erreur indiquait que enrichedPeople n'était pas trouvé directement
  const engine = usePeopleEngine();
  const enrichedPeople = engine.people || []; 

  // Préparation des transactions pour la topologie
  const adaptedTransactions = useMemo(() => {
    return (transactions || [])
      .filter(txn => !txn.isHidden)
      .map(txn => ({
        id: txn.id,
        date: txn.date,
        amount: txn.amount,
        label: txn.description,
        personId: txn.personId,
        mainCategory: txn.category,
        subCategory: (txn as any).subCategory || '',
      }));
  }, [transactions]);

  // --- HANDLERS ---

  const handleSavePerson = async (personToSave: PersonRelation) => {
    try {
      const dataToSave = sanitizeForSave(personToSave);
      const currentPeople = Array.isArray(rawPeople) ? [...rawPeople] : [];
      let updatedPeopleList;
      
      const idToMatch = editingPerson?.id || personToSave.id;

      if (idToMatch && currentPeople.some(p => p.id === idToMatch)) {
        updatedPeopleList = currentPeople.map((p: any) => 
          p.id === idToMatch ? { ...p, ...dataToSave } : p
        );
      } else {
        const newPerson = { ...dataToSave, id: idToMatch || crypto.randomUUID() };
        updatedPeopleList = [...currentPeople, newPerson];
      }

      await updatePeople(updatedPeopleList);
      emitEvent(AppEvents.PEOPLE_UPDATED);
      toast.success('Relation enregistrée');
      setShowForm(false);
      setEditingPerson(undefined);
    } catch (error) {
      console.error('Erreur sauvegarde relation', error);
      toast.error('Erreur de sauvegarde');
    }
  };

  const handleDeletePerson = async (personId: string) => {
    try {
      const updatedPeople = (rawPeople || []).filter((p: any) => p.id !== personId);
      await updatePeople(updatedPeople);

      const updatedTransactions = transactions.map(t => 
        t.personId === personId ? { ...t, personId: undefined } : t
      );
      await updateTransactions(updatedTransactions);
      
      emitEvent(AppEvents.PEOPLE_UPDATED);
      toast.success('Relation supprimée');
      
      if (selectedPerson?.id === personId) {
        setSelectedPerson(null);
        setViewMode('dashboard');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0B0D]">
        <div className="text-cyan-400 animate-pulse">Analyse des connexions...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0A0B0D] text-white overflow-hidden">
      <header className="flex-shrink-0 border-b border-white/5 bg-[#0A0B0D]/95 backdrop-blur-xl z-50">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {viewMode === 'detail' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewMode('dashboard')} 
                  className="rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </Button>
              )}
              <h1 className="text-2xl font-bold tracking-tight">Relations</h1>
            </div>

            <Button 
              onClick={() => { setEditingPerson(undefined); setShowForm(true); }} 
              className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-6 font-semibold shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Nouvelle relation
            </Button>
          </div>

          {viewMode !== 'detail' && (
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <nav className="flex items-center bg-white/5 p-1 rounded-full border border-white/10 w-fit">
                <button 
                  onClick={() => setViewMode('dashboard')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'dashboard' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </button>
                <button 
                  onClick={() => setViewMode('topology')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'topology' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Network className="w-4 h-4" /> Topologie
                </button>
              </nav>

              <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                {['all', 'current-month', 'last-3-months', 'current-year'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p as Period)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      period === p ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p === 'all' ? 'Tout' : p === 'current-month' ? 'Mois' : p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-y-auto p-4">
              <RelationsDashboard
                people={enrichedPeople}
                transactions={transactions}
                period={period as any}
                onViewDetail={(p: PersonRelation) => { setSelectedPerson(p); setViewMode('detail'); }}
                onEdit={(p: PersonRelation) => { setEditingPerson(p); setShowForm(true); }}
                onDelete={handleDeletePerson}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
              />
            </motion.div>
          )}

          {viewMode === 'detail' && selectedPerson && (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full overflow-y-auto">
              <RelationDetail
                person={enrichedPeople.find(p => p.id === selectedPerson.id) || selectedPerson}
                transactions={transactions.filter(t => t.personId === selectedPerson.id)}
                allPeople={enrichedPeople}
                onEdit={() => { setEditingPerson(selectedPerson); setShowForm(true); }}
                onDelete={() => handleDeletePerson(selectedPerson.id)}
                onBack={() => setViewMode('dashboard')}
              />
            </motion.div>
          )}

          {viewMode === 'topology' && (
            <motion.div key="topology" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full">
              <RelationTopology
                people={enrichedPeople}
                transactions={adaptedTransactions}
                onSelectPerson={(p: PersonRelation) => { setSelectedPerson(p); setViewMode('detail'); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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