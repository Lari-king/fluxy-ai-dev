import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, LayoutDashboard, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { enrichPeopleWithCache } from '@/utils/people-enrichment';
import { PersonRelation } from '@/types/people';
import { PersonForm } from '@/components/people/PersonForm';
import { RelationsDashboard } from '@/components/relations/RelationsDashboard';
import { RelationDetail } from '@/components/relations/RelationDetail';
import { RelationTopology } from '@/components/relations/RelationTopology';
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
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // LOG DEBUG PAGE PRINCIPAL
  console.log('[PEOPLE PAGE DEBUG]', {
    rawPeopleCount: rawPeople?.length || 0,
    transactionsCount: transactions?.length || 0,
    périodeSélectionnée: period,
    customDates: period === 'custom' ? { start: customStartDate, end: customEndDate } : null,
    loading,
    hasTransactions: !!transactions?.length,
    firstTransactionDate: transactions?.[0]?.date || 'aucune',
    samplePersonId: transactions?.[0]?.personId || 'aucun'
  });

  // --- LOGIQUE DE DONNÉES ---
  const { enrichedPeople, scores } = useMemo(() => {
    if (!rawPeople || !transactions) {
      console.warn('[PEOPLE ENRICH] Données manquantes', { rawPeople, transactions });
      return { enrichedPeople: [] as PersonRelation[], scores: {} };
    }

    const safePeople = Array.isArray(rawPeople) ? [...rawPeople] : [];
    const safeTransactions = Array.isArray(transactions) ? transactions : [];

    // Gestion des fiches orphelines (Ghost)
    const existingIds = new Set(safePeople.map(p => p.id));
    safeTransactions.forEach(t => {
      if (t.personId && !existingIds.has(t.personId)) {
        const nameFromTx = (t as any).personName || t.description?.split(' ')[0] || `Relation #${t.personId.slice(-4)}`;
        safePeople.push({
          id: t.personId,
          name: nameFromTx,
          personType: 'PHYSIQUE' as const,
          isGhost: true,
          circle: 'extended' as const,
          color: 'gray',
          relationship: 'Orpheline',
          notes: 'Créée automatiquement depuis une transaction',
          totalImpact: 0,
          income: 0,
          expenses: 0
        } as PersonRelation);
        existingIds.add(t.personId);
      }
    });

    console.log('[ENRICH CALL INPUT]', {
      peopleInput: safePeople.length,
      txInput: safeTransactions.length,
      txWithPersonId: safeTransactions.filter(t => t.personId).length,
      periodUsed: period,
      // Note : enrichPeopleWithCache N'ACCEPTE PAS period/custom dates actuellement
      // Si tu veux filtrer par période → il faut modifier enrichPeopleWithCache ou filtrer avant
    });

    // IMPORTANT : on ne passe PAS period/customStart/customEnd car la fonction ne les accepte pas
    const result = enrichPeopleWithCache(
      safePeople,
      {
        transactions: safeTransactions,
        monthlyIncome: 2800,
        customRules: undefined
      },
      true // useCache
    );

    console.log('[ENRICH RESULT]', {
      enrichedCount: result.people.length,
      premierExemple: result.people[0] ? {
        name: result.people[0].name,
        totalImpact: result.people[0].totalImpact ?? 'non présent',
        transactionCount: (result.people[0] as any).transactionCount ?? 'non présent',
        trend: (result.people[0] as any).trend ?? 'non présent'
      } : 'aucune personne enrichie',
      scoresKeys: Object.keys(result.scores)
    });

    return {
      enrichedPeople: result.people as PersonRelation[] || [],
      scores: result.scores || {}
    };
  }, [rawPeople, transactions, period /* , customStartDate, customEndDate — non utilisés ici */]);

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

  // Petit helper pour voir les dates problématiques
  const dateStats = useMemo(() => {
    if (!transactions?.length) return { valid: 0, invalid: 0, minDate: null, maxDate: null };
    
    let valid = 0;
    let invalid = 0;
    let minDate = '9999-99-99';
    let maxDate = '0000-00-00';

    transactions.forEach(t => {
      if (typeof t.date === 'string' && t.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        valid++;
        if (t.date < minDate) minDate = t.date;
        if (t.date > maxDate) maxDate = t.date;
      } else {
        invalid++;
      }
    });

    return { valid, invalid, minDate: minDate === '9999-99-99' ? null : minDate, maxDate: maxDate === '0000-00-00' ? null : maxDate };
  }, [transactions]);

  console.log('[DATE STATS TRANSACTIONS]', dateStats);

  const cleanCalculatedFields = (person: any) => {
    const calculatedKeys = [
      'income', 'expenses', 'totalImpact', 'transactionCount',
      'trend', 'dependanceLevel', 'dependanceRatio', 'progressionState', 
      'progressionPercentage', 'arbitrageSignal', 'arbitrageMessage',
      'averageTransaction', 'lastTransactionDate', 'lastTransactionAmount', 'isGhost'
    ];
    const cleaned = { ...person };
    calculatedKeys.forEach(key => delete cleaned[key]);
    return cleaned;
  };

  const handleSavePerson = async (personToSave: PersonRelation) => {
    try {
      const cleanedNewPerson = cleanCalculatedFields(personToSave);
      const currentPeople = Array.isArray(rawPeople) ? [...rawPeople] : [];
      let updatedPeopleList;
      const idToMatch = editingPerson?.id || personToSave.id;

      if (idToMatch && currentPeople.some(p => p.id === idToMatch)) {
        updatedPeopleList = currentPeople.map((p: any) => 
          p.id === idToMatch ? { ...p, ...cleanedNewPerson } : p
        );
      } else {
        updatedPeopleList = [...currentPeople, { ...cleanedNewPerson, id: idToMatch || `p_${Date.now()}` }];
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
      const isReal = (rawPeople || []).some(p => p.id === personId);
      if (isReal) {
        const updatedPeople = rawPeople.filter((p: any) => p.id !== personId);
        await updatePeople(updatedPeople);
      } else {
        const updatedTransactions = transactions.map(t => 
          t.personId === personId 
            ? { ...t, personId: undefined, personName: undefined } 
            : t
        );
        await updateTransactions(updatedTransactions);
      }
      
      emitEvent(AppEvents.PEOPLE_UPDATED);
      toast.success('Relation supprimée');
      setSelectedPerson(null);
      setViewMode('dashboard');
    } catch (error) {
      console.error('Erreur suppression relation', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEditPerson = (person: PersonRelation) => {
    const rawVersion = rawPeople.find(p => p.id === person.id) || person;
    setEditingPerson(rawVersion as PersonRelation);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0B0D]">
        <div className="text-cyan-400 animate-pulse">Chargement des relations...</div>
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
                {[
                  { id: 'all', label: 'Tout' },
                  { id: 'current-month', label: 'Mois' },
                  { id: 'last-3-months', label: '3 mois' },
                  { id: 'last-6-months', label: '6 mois' },
                  { id: 'current-year', label: 'Année' },
                  { id: 'custom', label: 'Perso' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id as Period)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      period === p.id
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {period === 'custom' && (
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 animate-in fade-in slide-in-from-left-2">
                  <input 
                    type="date" 
                    value={customStartDate} 
                    onChange={(e) => setCustomStartDate(e.target.value)} 
                    className="bg-transparent border-none text-xs text-white outline-none" 
                  />
                  <span className="text-slate-500">→</span>
                  <input 
                    type="date" 
                    value={customEndDate} 
                    onChange={(e) => setCustomEndDate(e.target.value)} 
                    className="bg-transparent border-none text-xs text-white outline-none" 
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && (
            <motion.div 
              key="dashboard" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="h-full overflow-y-auto p-4"
            >
              {enrichedPeople.length === 0 && (
                <div className="p-6 text-center text-yellow-400 bg-yellow-900/20 rounded-xl border border-yellow-500/30 mb-6">
                  ⚠️ Aucune relation enrichie détectée.<br />
                  Période : {period} | Transactions : {transactions?.length || 0}<br />
                  Vérifie les logs console (F12) pour plus d'infos.
                </div>
              )}

              {/* Petit indicateur visuel si peu de tx dans la période */}
              {transactions?.length > 0 && period !== 'all' && (
                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 border border-slate-600">
                  <strong>Debug filtre période :</strong> {transactions.length} tx totales → voir console pour le nombre filtré
                </div>
              )}

              <RelationsDashboard
                people={enrichedPeople}
                scores={scores}
                transactions={transactions}
                period={period as any}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onViewDetail={(p) => { setSelectedPerson(p); setViewMode('detail'); }}
                onEdit={handleEditPerson}
                onDelete={handleDeletePerson}
              />
            </motion.div>
          )}

          {viewMode === 'detail' && selectedPerson && (
            <motion.div 
              key="detail" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }} 
              className="h-full overflow-y-auto"
            >
              <RelationDetail
                person={enrichedPeople.find(p => p.id === selectedPerson.id) || selectedPerson}
                transactions={transactions.filter(t => t.personId === selectedPerson.id && !t.isHidden)}
                allPeople={enrichedPeople}
                onEdit={() => handleEditPerson(selectedPerson)}
                onDelete={() => handleDeletePerson(selectedPerson.id)}
                onBack={() => setViewMode('dashboard')}
                onViewDetail={(p) => setSelectedPerson(p)}
              />
            </motion.div>
          )}

          {viewMode === 'topology' && (
            <motion.div 
              key="topology" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
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