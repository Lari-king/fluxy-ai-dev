import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, TrendingDown, Search, X, 
  Building2, User, ChevronDown, ChevronUp,
  Wallet, DollarSign, ArrowRight, Filter, SlidersHorizontal
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PersonRelation} from '@/features/people/types/base';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  label: string;
  personId?: string;
  category?: string;
  subCategory?: string;
}

interface RelationTopologyProps {
  people: PersonRelation[];
  transactions: Transaction[];
  onSelectPerson: (person: PersonRelation) => void;
}

export function RelationTopology({ people, transactions, onSelectPerson }: RelationTopologyProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<PersonRelation | null>(null);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [filterPersonType, setFilterPersonType] = useState<'all' | 'PHYSIQUE' | 'MORALE'>('all');
  const [filterRelationship, setFilterRelationship] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  // Calculer les flux par personne
  const peopleWithFlows = useMemo(() => {
    return people.map(person => {
      const personTransactions = transactions.filter(
        t => t.personId === person.id && t.amount < 0
      );
      const totalSpent = Math.abs(
        personTransactions.reduce((sum, t) => sum + t.amount, 0)
      );
      
      // Catégories avec sous-catégories
      const categoryMap = new Map<string, { amount: number; subCategories: Map<string, number> }>();
      personTransactions.forEach(t => {
        const cat = t.category || 'Non catégorisé';
        const subCat = (t as any).subCategory || 'Général';
        
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, { amount: 0, subCategories: new Map() });
        }
        
        const catData = categoryMap.get(cat)!;
        catData.amount += Math.abs(t.amount);
        
        const currentSub = catData.subCategories.get(subCat) || 0;
        catData.subCategories.set(subCat, currentSub + Math.abs(t.amount));
      });

      const categories = Array.from(categoryMap.entries())
        .map(([name, data]) => ({
          name,
          amount: data.amount,
          subCategories: Array.from(data.subCategories.entries())
            .map(([subName, subAmount]) => ({ name: subName, amount: subAmount }))
            .sort((a, b) => b.amount - a.amount)
        }))
        .sort((a, b) => b.amount - a.amount);

      return { 
        person, 
        totalSpent, 
        transactionCount: personTransactions.length,
        categories 
      };
    })
    .filter(p => p.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [people, transactions]);

  // Statistiques globales
  const stats = useMemo(() => {
    const totalSpent = peopleWithFlows.reduce((sum, p) => sum + p.totalSpent, 0);
    const totalTransactions = transactions.filter(t => t.amount < 0 && t.personId).length;
    
    return { totalSpent, totalTransactions, totalPeople: peopleWithFlows.length };
  }, [peopleWithFlows, transactions]);

  // Liste unique des types de relations pour le filtre
  const relationshipTypes = useMemo(() => {
    const types = new Set(people.map(p => p.relationship).filter(Boolean));
    return Array.from(types).sort();
  }, [people]);

  // Filtrage avancé
  const filteredPeople = useMemo(() => {
    let result = peopleWithFlows;

    // Filtre recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.person.name.toLowerCase().includes(query) ||
        p.person.relationship?.toLowerCase().includes(query)
      );
    }

    // Filtre type de personne
    if (filterPersonType !== 'all') {
      result = result.filter(p => 
        (p.person.personType || 'PHYSIQUE') === filterPersonType
      );
    }

    // Filtre type de relation
    if (filterRelationship !== 'all') {
      result = result.filter(p => p.person.relationship === filterRelationship);
    }

    // Filtre montant min
    if (minAmount && !isNaN(Number(minAmount))) {
      result = result.filter(p => p.totalSpent >= Number(minAmount));
    }

    // Filtre montant max
    if (maxAmount && !isNaN(Number(maxAmount))) {
      result = result.filter(p => p.totalSpent <= Number(maxAmount));
    }

    return result;
  }, [peopleWithFlows, searchQuery, filterPersonType, filterRelationship, minAmount, maxAmount]);

  const hasActiveFilters = filterPersonType !== 'all' || filterRelationship !== 'all' || minAmount || maxAmount;

  const resetFilters = () => {
    setFilterPersonType('all');
    setFilterRelationship('all');
    setMinAmount('');
    setMaxAmount('');
  };

  const handlePersonClick = (person: PersonRelation) => {
    if (expandedPerson === person.id) {
      setExpandedPerson(null);
    } else {
      setExpandedPerson(person.id);
    }
  };

  return (
    <div className="relative bg-[#0A0B0D] text-white flex">
      {/* Contenu principal avec scroll */}
      <div className="flex-1 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-8 py-6 space-y-6 pb-20">
          
          {/* Header avec recherche */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Topologie des Flux</h2>
              <p className="text-sm text-slate-500">
                Visualisation des flux financiers par relation
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une relation..."
                  className="pl-9 h-10 bg-white/5 border-white/10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>

              {/* Bouton Filtres */}
              <Button
                onClick={() => setFiltersPanelOpen(!filtersPanelOpen)}
                className={`h-10 px-4 ${
                  filtersPanelOpen || hasActiveFilters
                    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-slate-400'
                } border hover:bg-white/10`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtres
                {hasActiveFilters && (
                  <Badge className="ml-2 bg-cyan-500 text-white border-0 h-5 px-1.5 text-xs">
                    {[filterPersonType !== 'all', filterRelationship !== 'all', minAmount, maxAmount].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

        {/* Nœud central "Moi" */}
        <section className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl p-6 w-[500px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center border-2 border-cyan-400">
                  <Wallet className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Moi</h3>
                  <p className="text-xs text-slate-400">Point de départ</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-500">Total</span>
                </div>
                <p className="text-xl font-bold text-red-400 tabular-nums">
                  {stats.totalSpent.toFixed(0)}€
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-500">Relations</span>
                </div>
                <p className="text-xl font-bold text-cyan-400 tabular-nums">
                  {stats.totalPeople}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-slate-500">Transactions</span>
                </div>
                <p className="text-xl font-bold text-orange-400 tabular-nums">
                  {stats.totalTransactions}
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Flèche de liaison */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ArrowRight className="w-8 h-8 text-slate-600 rotate-90" />
          </motion.div>
        </div>

        {/* Grid des relations */}
        <section className="pb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-400">
              Relations ({filteredPeople.length})
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Réinitialiser les filtres
              </button>
            )}
          </div>

          {filteredPeople.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-base text-slate-400">
                {searchQuery ? 'Aucune relation trouvée' : 'Aucune relation avec transactions'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeople.map((item, idx) => {
                const { person, totalSpent, transactionCount, categories } = item;
                const isExpanded = expandedPerson === person.id;
                const isCompany = person.personType === 'MORALE';

                return (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    {/* Carte principale */}
                    <div
                      onClick={() => handlePersonClick(person)}
                      className={`bg-[#12131A] border rounded-2xl p-4 cursor-pointer transition-all hover:border-cyan-400/50 ${
                        isExpanded ? 'border-cyan-400' : 'border-white/10'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-12 w-12 border-2 border-white/10">
                          <AvatarImage src={person.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold">
                            {person.name[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{person.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            {isCompany ? (
                              <><Building2 className="w-3 h-3" /> {person.relationship}</>
                            ) : (
                              <><User className="w-3 h-3" /> {person.relationship}</>
                            )}
                          </div>
                        </div>

                        <button className="p-1 hover:bg-white/10 rounded transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </div>

                      {/* Métriques */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-[10px] text-slate-500 mb-0.5">Total dépensé</p>
                          <p className="text-sm font-bold text-red-400 tabular-nums">
                            {totalSpent.toFixed(0)}€
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-[10px] text-slate-500 mb-0.5">Transactions</p>
                          <p className="text-sm font-bold text-cyan-400 tabular-nums">
                            {transactionCount}
                          </p>
                        </div>
                      </div>

                      {/* Catégories (si expanded) */}
                      <AnimatePresence>
                        {isExpanded && categories.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-white/10 space-y-2"
                          >
                            <p className="text-xs font-semibold text-slate-400 mb-2">
                              Catégories principales
                            </p>
                            {categories.slice(0, 3).map((cat, catIdx) => (
                              <div key={catIdx} className="space-y-1">
                                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                  <span className="text-xs font-medium">{cat.name}</span>
                                  <span className="text-xs font-bold text-orange-400 tabular-nums">
                                    {cat.amount.toFixed(0)}€
                                  </span>
                                </div>
                                
                                {/* Sous-catégories */}
                                {cat.subCategories.slice(0, 2).map((sub, subIdx) => (
                                  <div
                                    key={subIdx}
                                    className="flex items-center justify-between pl-4 pr-2 py-1 text-xs text-slate-500"
                                  >
                                    <span className="truncate">└ {sub.name}</span>
                                    <span className="font-semibold tabular-nums ml-2">
                                      {sub.amount.toFixed(0)}€
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ))}

                            {categories.length > 3 && (
                              <p className="text-[10px] text-slate-600 text-center pt-1">
                                +{categories.length - 3} autre{categories.length - 3 > 1 ? 's' : ''} catégorie{categories.length - 3 > 1 ? 's' : ''}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
        </div>
      </div>

      {/* Panneau de filtres latéral */}
      <AnimatePresence>
        {filtersPanelOpen && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-[#12131A] border-l border-white/10 flex flex-col overflow-hidden z-50"
          >
            {/* Header du panneau */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold">Filtres</h3>
                <button
                  onClick={() => setFiltersPanelOpen(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Affinez votre recherche
              </p>
            </div>

            {/* Contenu avec scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Filtre Type de personne */}
              <div>
                <label className="text-sm font-semibold text-slate-400 mb-3 block">
                  Type de personne
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'Tous', icon: Users },
                    { value: 'PHYSIQUE', label: 'Personnes physiques', icon: User },
                    { value: 'MORALE', label: 'Personnes morales', icon: Building2 }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setFilterPersonType(value as any)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        filterPersonType === value
                          ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                      {filterPersonType === value && (
                        <div className="ml-auto w-2 h-2 bg-cyan-400 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre Type de relation */}
              <div>
                <label className="text-sm font-semibold text-slate-400 mb-3 block">
                  Type de relation
                </label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => setFilterRelationship('all')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      filterRelationship === 'all'
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm">Toutes</span>
                    {filterRelationship === 'all' && (
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    )}
                  </button>
                  {relationshipTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterRelationship(type)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                        filterRelationship === type
                          ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-sm truncate">{type}</span>
                      {filterRelationship === type && (
                        <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 ml-2"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre Montant */}
              <div>
                <label className="text-sm font-semibold text-slate-400 mb-3 block">
                  Montant total dépensé
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Minimum (€)</label>
                    <Input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      placeholder="0"
                      className="h-9 bg-white/5 border-white/10 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Maximum (€)</label>
                    <Input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="Illimité"
                      className="h-9 bg-white/5 border-white/10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer avec bouton reset */}
            {hasActiveFilters && (
              <div className="p-4 border-t border-white/10">
                <Button
                  onClick={resetFilters}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser tous les filtres
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
