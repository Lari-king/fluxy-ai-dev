import { motion } from 'framer-motion';
import { Edit, Trash2, Mail, Phone, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface Person {
  id: string;
  name: string;
  avatar?: string;
  circle: 'direct' | 'extended' | 'large';
  relationship: string;
  totalImpact: number;
  income: number;
  expenses: number;
  color: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
}

interface PersonCardProps {
  person: Person;
  circleLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function PersonCard({ person, circleLabel, onEdit, onDelete }: PersonCardProps) {
  const age = person.birthDate
    ? new Date().getFullYear() - new Date(person.birthDate).getFullYear()
    : null;

  return (
    <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden border-2">
      {/* Bande colorée en haut */}
      <div className="h-2" style={{ backgroundColor: person.color }} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20 ring-4 ring-offset-2 transition-transform group-hover:scale-110" style={{ '--tw-ring-color': person.color }as React.CSSProperties}>
            <AvatarImage src={person.avatar} />
            <AvatarFallback style={{ backgroundColor: person.color }} className="text-white text-2xl">
              {person.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl truncate">{person.name}</CardTitle>
                <CardDescription className="mt-0.5">{person.relationship}</CardDescription>
                {age && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {age} ans
                  </div>
                )}
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onEdit}
                  className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onDelete}
                  className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Badge variant="outline" className="mt-2">
              {circleLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Coordonnées */}
        {(person.email || person.phone) && (
          <div className="space-y-2 pb-3 border-b">
            {person.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{person.email}</span>
              </div>
            )}
            {person.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{person.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Impact financier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Revenus</span>
            </div>
            <span className="text-green-600">
              +{(person.income ?? 0).toLocaleString('fr-FR')} €
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Dépenses</span>
            </div>
            <span className="text-red-600">
              {(person.expenses ?? 0).toLocaleString('fr-FR')} €
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border-2 border-blue-300 dark:border-blue-700">
            <span className="text-sm">Impact total</span>
            <span className={`${person.totalImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {person.totalImpact >= 0 ? '+' : ''}{(person.totalImpact ?? 0).toLocaleString('fr-FR')} €
            </span>
          </div>
        </div>

        {/* Notes */}
        {person.notes && (
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {person.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
