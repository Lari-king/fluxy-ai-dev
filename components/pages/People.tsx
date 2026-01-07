import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Plus, Users, TrendingUp, TrendingDown, UserCircle, Heart, DollarSign, Building2, LucideIcon, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { PersonForm, PersonCircle } from '../people/PersonForm';
import { PersonCard } from '../people/PersonCard';
import { AppEvents, emitEvent } from '../../src/utils/events';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

// Interface correspondant aux données enrichies par DataContext + people-calculator
interface Person {
  id: string;
  name: string;
  avatar?: string;
  circle: PersonCircle;
  relationship: string;
  color: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
  // Champs calculés automatiquement
  totalImpact: number;
  income: number;
  expenses: number;
  transactionCount?: number;
}
  
interface CircleData {
  name: string;
  icon: LucideIcon;
  color: string;
}

export function People() {
  const { accessToken } = useAuth();
  
  // ✅ Récupération des données centralisées (déjà enrichies avec les stats)
  const { people, loading, updatePeople } = useData(); 
  
  const [selectedCircle, setSelectedCircle] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  
  const [editingPerson, setEditingPerson] = useState<Person | undefined>();
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

  const handleSavePerson = async (person: Person) => {
    try {
      // ⚠️ IMPORTANT: On retire les champs calculés (stats) avant de sauvegarder en base
      // On ne veut persister que les données brutes de la personne
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { income, expenses, totalImpact, transactionCount, ...personToSave } = person;
      
      const updatedPeople = editingPerson
        ? people.map((p) => {
            // On nettoie également les objets existants du tableau pour la sauvegarde
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { income, expenses, totalImpact, transactionCount, ...pData } = p as any;
            return p.id === personToSave.id ? { ...pData, ...personToSave } : pData;
          })
        : [
            ...people.map(p => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { income, expenses, totalImpact, transactionCount, ...pData } = p as any;
                return pData;
            }), 
            personToSave
        ];

      if (accessToken) {
        await updatePeople(updatedPeople as any[]);
        emitEvent(AppEvents.PEOPLE_UPDATED);
      }

      toast.success(editingPerson ? 'Personne modifiée' : 'Personne ajoutée');
      setShowForm(false);
      setEditingPerson(undefined);
    } catch (error) {
      console.error('Error saving person:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeletePerson = async () => {
    if (!deletingPerson) return;

    try {
      const updatedPeople = people
        .filter((p) => p.id !== deletingPerson.id)
        .map(p => {
          // Nettoyage des stats pour la sauvegarde
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { income, expenses, totalImpact, transactionCount, ...pData } = p as any;
          return pData;
        });

      if (accessToken) {
        await updatePeople(updatedPeople as any[]);
        emitEvent(AppEvents.PEOPLE_UPDATED);
      }

      toast.success('Personne supprimée');
      setDeletingPerson(null);
    } catch (error) {
      console.error('Error deleting person:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
    setShowForm(true);
  };

  const handleAddPerson = () => {
    setEditingPerson(undefined);
    setShowForm(true);
  };

  // Configuration des cercles
  const defaultCircles: Record<string, CircleData> = {
    direct: { name: 'Famille directe', icon: Heart, color: 'from-pink-500 to-rose-500' },
    extended: { name: 'Famille élargie', icon: Users, color: 'from-blue-500 to-cyan-500' },
    large: { name: 'Grande famille', icon: UserCircle, color: 'from-purple-500 to-indigo-500' },
    friends: { name: 'Amis proches', icon: Heart, color: 'from-yellow-500 to-orange-500' },
    business: { name: 'Affaires / Business', icon: Building2, color: 'from-green-500 to-teal-500' },
    community: { name: 'Communauté', icon: Users, color: 'from-indigo-500 to-blue-500' },
  };

  // ✅ Memoize circle extraction
  const allCircles = useMemo(() => {
    return Array.from(new Set(people.map(p => p.circle as string))).reduce((acc, circleKey) => {
      if (!defaultCircles[circleKey]) {
        // Custom circle - create entry dynamically
        acc[circleKey] = {
          name: circleKey.charAt(0).toUpperCase() + circleKey.slice(1),
          icon: UserCircle,
          color: 'from-gray-500 to-gray-600'
        };
      } else {
        acc[circleKey] = defaultCircles[circleKey];
      }
      return acc;
    }, {} as Record<string, CircleData>);
  }, [people]);

  const circles: Record<string, CircleData> = { ...defaultCircles, ...allCircles };

  // ✅ Memoize filtering
  const filteredPeople = useMemo(() => {
    return selectedCircle === 'all' 
      ? (people as Person[])
      : (people as Person[]).filter(p => p.circle === selectedCircle);
  }, [selectedCircle, people]);

  // ✅ Memoize calculations
  const totalImpact = useMemo(() => filteredPeople.reduce((sum, p) => sum + (p.totalImpact || 0), 0), [filteredPeople]);
  const totalIncome = useMemo(() => filteredPeople.reduce((sum, p) => sum + (p.income || 0), 0), [filteredPeople]);
  const totalExpenses = useMemo(() => filteredPeople.reduce((sum, p) => sum + Math.abs(p.expenses || 0), 0), [filteredPeople]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-blue-50/30 dark:from-gray-950 dark:via-pink-950/20 dark:to-blue-950/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600">
            Personnes & Impact
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analysez l'impact financier de votre cercle familial
          </p>
        </motion.div>

        {/* Stats globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Revenus totaux
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-green-600">
                  +{totalIncome.toLocaleString('fr-FR')} €
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Dépenses totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-red-600">
                  -{totalExpenses.toLocaleString('fr-FR')} €
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Impact net
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl ${totalImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalImpact >= 0 ? '+' : ''}{totalImpact.toLocaleString('fr-FR')} €
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filtres par cercle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-3">
            <Button
            onClick={() => setSelectedCircle('all')}
            variant={selectedCircle === 'all' ? 'default' : 'outline'}
            className={selectedCircle === 'all' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : ''}
           >
              <Users className="w-4 h-4 mr-2" />
              Tous ({people.length})
            </Button>
            {Object.entries(circles).map(([key, circleData]) => {
              const { name, icon: Icon, color } = circleData as CircleData;
              const count = people.filter(p => p.circle === key).length;
              
              // N'afficher les boutons de cercle que s'il y a des personnes dedans, ou si c'est celui sélectionné
              if (count === 0 && key !== selectedCircle) return null; 

              return (
                <Button
                  key={key}
                  onClick={() => setSelectedCircle(key)}
                  variant={selectedCircle === key ? 'default' : 'outline'}
                  className={selectedCircle === key ? `bg-gradient-to-r ${color}` : ''}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {name} ({count})
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Liste des personnes */}
        {filteredPeople.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 col-span-full"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl mb-2">
              {selectedCircle === 'all' ? 'Aucune personne ajoutée' : 'Aucune personne dans ce cercle'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {selectedCircle === 'all' 
                ? 'Ajoutez des personnes pour suivre leur impact financier et analyser vos flux'
                : 'Ce cercle est vide. Ajoutez des personnes ou sélectionnez un autre cercle.'
              }
            </p>
            <Button
              onClick={handleAddPerson}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg shadow-pink-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une personne
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                <PersonCard
                  person={person}
                  circleLabel={circles[person.circle]?.name || person.circle}
                  onEdit={() => handleEditPerson(person)}
                  onDelete={() => setDeletingPerson(person)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Bouton ajouter personne flottant en bas si la liste n'est pas vide */}
        {filteredPeople.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <Button
              onClick={handleAddPerson}
              size="lg"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter une personne
            </Button>
          </motion.div>
        )}
      </div>

      {/* Formulaire d'ajout/édition */}
      {showForm && (
        <PersonForm
          person={editingPerson}
          onClose={() => {
            setShowForm(false);
            setEditingPerson(undefined);
          }}
          onSave={handleSavePerson}
        />
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingPerson} onOpenChange={() => setDeletingPerson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette personne ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deletingPerson?.name}</strong> ?
              Cette action est irréversible et supprimera également toutes les transactions associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}