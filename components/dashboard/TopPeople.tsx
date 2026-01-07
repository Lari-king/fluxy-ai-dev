import React from 'react';
import { motion } from 'framer-motion';
// Les chemins sont corrects pour un composant dans components/dashboard/ accédant à components/ui/
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'; 
import { Users, ArrowRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Button } from '../ui/button';

interface Person {
  id: string;
  name: string;
  avatar?: string;
  relationship: string;
  totalAmount: number;
  income: number;
  expenses: number;
  transactionCount: number;
  color: string;
  averageTransaction: number;
  lastTransactionDate?: string;
  lastTransactionAmount?: number;
}

interface TopPeopleProps {
  people: Person[];
  onNavigate?: (page: string) => void;
}

export function TopPeople({ people, onNavigate = () => {} }: TopPeopleProps) {
  // Trier par impact total (valeur absolue)
  const topPeople = React.useMemo(() => {
    return [...people]
      .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))
      .slice(0, 5);
  }, [people]);

  // ✅ OPTION 2 : Calculer le total de TOUTES les personnes (pas seulement Top 5)
  const totalAllPeople = React.useMemo(() => {
    return people.reduce((sum, p) => sum + Math.abs(p.totalAmount), 0);
  }, [people]);

  // Calculer le total max pour les barres de progression
  const maxAmount = React.useMemo(() => {
    if (topPeople.length === 0) return 0;
    return Math.max(...topPeople.map(p => Math.abs(p.totalAmount)));
  }, [topPeople]);

  if (topPeople.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
            <Users className="w-5 h-5" />
            Top 5 Personnes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Aucune personne avec des transactions
            </p>
            <Button
              onClick={() => onNavigate('people')}
              variant="outline"
              className="gap-2 text-sm h-9"
            >
              Ajouter une personne
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 group hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
            <Users className="w-5 h-5" />
            Top 5 Personnes
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('people')}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Vue en grille - comme Top catégories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          {topPeople.map((person, index) => {
            const isPositive = person.totalAmount >= 0;
            
            // ✅ OPTION 2 : Pourcentage = part de cette personne parmi TOUTES les personnes
            const percentage = totalAllPeople > 0 ? (Math.abs(person.totalAmount) / totalAllPeople) * 100 : 0;
            // Pour la barre de progression, on utilise le max pour une meilleure visualisation
            const barPercentage = maxAmount > 0 ? (Math.abs(person.totalAmount) / maxAmount) * 100 : 0;
            
            // Logique de secours pour l'affichage de la relation
            const relationDisplay = person.relationship 
                ? person.relationship 
                : 'Relation non spécifiée'; 

            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group/card"
              >
                <div
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all cursor-pointer border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800 h-full flex flex-col justify-between"
                  onClick={() => onNavigate('people')}
                >
                  {/* Header avec rang et nom */}
                  <div className="flex items-center gap-2 mb-3">
                    {/* Badge de rang */}
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        #{index + 1}
                      </div>
                    </div>

                    {/* Nom de la personne */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {person.name}
                      </h3>
                    </div>
                  </div>

                  {/* Avatar centré */}
                  <div className="flex justify-center mb-3">
                    {person.avatar ? (
                      <img
                        // Utilisation d'un placeholder basé sur la couleur si l'avatar échoue (ou si vous utilisez cette logique par défaut)
                        src={person.avatar}
                        alt={person.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0"
                        style={{ backgroundColor: person.color }}
                      >
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Relation */}
                  <div className="text-center mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {/* Utilisation de la variable avec le fallback */}
                      {relationDisplay}
                    </p>
                  </div>

                  {/* Montant principal - ENHANCEMENT: Ajout de l'icône de tendance (le "lien") */}
                  <div className="text-center mb-3">
                    <div className={`flex items-center justify-center text-lg font-bold gap-1 ${
                      isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'

                    }`}>
                      {/* Icone de tendance pour visualiser le lien/flux */}
                      {isPositive ? (
                          <TrendingUp className="w-5 h-5" />
                      ) : (
                          <TrendingDown className="w-5 h-5" />
                      )}
                      
                      {isPositive ? '+' : ''}{Math.abs(person.totalAmount).toLocaleString('fr-FR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })} €
                    </div>
                    {/* Description plus précise du lien financier */}
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-semibold">
                      {isPositive ? 'Source de revenu net' : 'Dépense nette associée'}
                    </p>
                  </div>

                  {/* Section du bas avec barre et stats */}
                  <div className='mt-auto w-full'>
                    {/* Barre de progression */}
                    <div className="mb-1.5">
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barPercentage}%` }} // Utilisation de barPercentage ici
                          transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                          className={`h-full rounded-full ${
                            isPositive
                              ? 'bg-gradient-to-r from-green-500 to-green-600'
                              : 'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Pourcentage du total */}
                    <div className="text-center mb-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {percentage.toFixed(1)}% du total
                      </p>
                    </div>

                    {/* Stats secondaires */}
                    <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                      {/* Nombre de transactions */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 dark:text-gray-400">Transactions</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {person.transactionCount}
                        </span>
                      </div>

                      {/* Moyenne par transaction */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 dark:text-gray-400">Moy. / txn</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {Math.abs(person.averageTransaction).toLocaleString('fr-FR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })} €
                        </span>
                      </div>

                      {/* Dernière activité */}
                      {person.lastTransactionDate && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Dernière
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {new Date(person.lastTransactionDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Fin Section du bas */}
                </div>


                {/* Badge #1 avec couronne */}
                {index === 0 && (
                  <div className="absolute -top-2 -right-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 animate-pulse">
                      <span className="text-sm">👑</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bouton "Voir tout" */}
        <button
          onClick={() => onNavigate('people')}
          className="w-full p-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center justify-center gap-2"
        >
          Voir toutes les personnes
          <ArrowRight className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}