import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User as UserIcon, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Person {
  id: string;
  name: string;
  avatar?: string;
  circle: string;
  relationship: string;
  color: string;
}

interface PersonSelectorProps {
  value?: string;
  onChange: (personId: string) => void;
  people: Person[];
}

export function PersonSelector({ value, onChange, people }: PersonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPerson = people.find(p => p.id === value);

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.relationship.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (personId: string) => {
    onChange(personId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bouton de sélection */}
      <div className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          {selectedPerson ? (
            <>
              <Avatar className="w-8 h-8 ring-2 ring-offset-1" style={{ '--tw-ring-color': selectedPerson.color }as React.CSSProperties}>
                <AvatarImage src={selectedPerson.avatar} />
                <AvatarFallback style={{ backgroundColor: selectedPerson.color }} className="text-white text-sm">
                  {selectedPerson.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left flex-1 min-w-0">
                <div className="text-sm truncate">{selectedPerson.name}</div>
                <div className="text-xs text-gray-500 truncate">{selectedPerson.relationship}</div>
              </div>
            </>
          ) : (
            <>
              <UserIcon className="w-8 h-8 text-gray-400" />
              <span className="text-gray-500 text-sm">Sélectionner une personne</span>
            </>
          )}
        </button>

        {selectedPerson && (
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Dropdown avec recherche */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Barre de recherche */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une personne..."
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Liste des personnes */}
            <div className="max-h-64 overflow-y-auto">
              {/* Option "Moi" */}
              <button
                type="button"
                onClick={() => handleSelect('me')}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  value === 'me' ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm">Moi</div>
                  <div className="text-xs text-gray-500">Moi-même</div>
                </div>
                {value === 'me' && <Check className="w-5 h-5 text-blue-600" />}
              </button>

              {/* Liste des autres personnes */}
              {filteredPeople.length > 0 ? (
                filteredPeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleSelect(person.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      value === person.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    <Avatar className="w-10 h-10 ring-2 ring-offset-1" style={{ '--tw-ring-color': person.color }as React.CSSProperties}>
                      <AvatarImage src={person.avatar} />
                      <AvatarFallback style={{ backgroundColor: person.color }} className="text-white text-sm">
                        {person.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm truncate">{person.name}</div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                        {person.relationship}
                        <Badge variant="outline" className="text-xs py-0 px-1.5">
                          {person.circle === 'direct' ? 'Directe' : person.circle === 'extended' ? 'Élargie' : 'Grande'}
                        </Badge>
                      </div>
                    </div>
                    {value === person.id && <Check className="w-5 h-5 text-blue-600" />}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  Aucune personne trouvée
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
