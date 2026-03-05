// src/components/pages/People.tsx

import { useState, useMemo, useEffect } from 'react';
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
  const [customStartDate] = useState('');
  const [customEndDate] = useState('');

  // --- LOGIQUE DE SYNCHRONISATION ---
  // On force le moteur à recalculer dès que rawPeople ou transactions changent dans le DataContext
  const engine = usePeopleEngine();
  
  // Utilisation de useMemo pour garantir que enrichedPeople est toujours à jour avec les transactions liées
  const enrichedPeople = useMemo(() => {
    return engine.people || [];
  }, [engine.people, transactions, rawPeople]); 

  // Préparation des transactions pour la topologie (vérification du mapping personId)
  const adaptedTransactions = useMemo(() => {
    return (transactions || [])
      .filter(txn => !txn.isHidden)
      .map(txn => ({
        id: txn.id,
        date: txn.date,
        amount: txn.amount,
        label: txn.description,
        personId: txn.personId, // Élément crucial pour la liaison
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
      
      // On déclenche un événement global pour forcer le rafraîchissement des composants d'IA
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
      // 1. Supprimer la personne
      const updatedPeople = (rawPeople || []).filter((p: any) => p.id !== personId);
      await updatePeople(updatedPeople);

      // 2. Délier les transactions (remettre personId à null)
      const transactionsToUpdate = transactions.filter(t => t.personId === personId);
      if (transactionsToUpdate.length > 0) {
        // Si ton updateTransactions accepte un tableau complet :
        const newTransactions = transactions.map(t => 
          t.personId === personId ? { ...t, personId: undefined } : t
        );
        await updateTransactions(newTransactions);
      }
      
      emitEvent(AppEvents.PEOPLE_UPDATED);
      toast.success('Relation supprimée et transactions déliées');
      
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <div className="text-cyan-400 font-mono text-xs tracking-widest uppercase animate-pulse">
            Analyse des connexions...
          </div>
        </div>
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
                  className="rounded-full hover:bg-white/10 text-slate-400"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </Button>
              )}
              <h1 className="text-2xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">
                Relations
              </h1>
            </div>

            <Button 
              onClick={() => { setEditingPerson(undefined); setShowForm(true); }} 
              className="rounded-full bg-white text-black hover:bg-cyan-400 hover:text-black transition-all px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-white/5"
            >
              <Plus className="w-4 h-4 mr-2 stroke-[3px]" /> Nouvelle relation
            </Button>
          </div>

          {viewMode !== 'detail' && (
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <nav className="flex items-center bg-white/5 p-1 rounded-full border border-white/10 w-fit">
                <button 
                  onClick={() => setViewMode('dashboard')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === 'dashboard' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </button>
                <button 
                  onClick={() => setViewMode('topology')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === 'topology' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" /> Topologie
                </button>
              </nav>

              <div className="flex flex-wrap items-center gap-1 bg-white/[0.02] p-1 rounded-full border border-white/5">
                {[
                  { id: 'all', label: 'Tout' },
                  { id: 'current-month', label: 'Mois' },
                  { id: 'last-3-months', label: '3 Mois' },
                  { id: 'current-year', label: 'Année' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id as Period)}
                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${
                      period === p.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {p.label}
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
            <motion.div 
              key="dashboard" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-4 custom-scrollbar"
            >
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
            <motion.div 
              key="detail" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto"
            >
              <RelationDetail
                // On s'assure de trouver la personne enrichie (avec ses scores calculés)
                person={enrichedPeople.find(p => p.id === selectedPerson.id) || selectedPerson}
                transactions={transactions.filter(t => t.personId === selectedPerson.id && !t.isHidden)}
                allPeople={enrichedPeople}
                onEdit={() => { setEditingPerson(selectedPerson); setShowForm(true); }}
                onDelete={() => handleDeletePerson(selectedPerson.id)}
                onBack={() => setViewMode('dashboard')}
              />
            </motion.div>
          )}

          {viewMode === 'topology' && (
            <motion.div 
              key="topology" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-full w-full"
            >
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