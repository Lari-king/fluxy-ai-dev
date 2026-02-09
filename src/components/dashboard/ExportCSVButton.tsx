import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Importation UI standard

interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  category: string;
  status: 'completed' | 'upcoming';
  personId?: string;
}

interface ExportCSVButtonProps {
  transactions: Transaction[];
  filename: string;
}

/**
 * Composant Bouton pour exporter une liste de transactions au format CSV.
 */
export const ExportCSVButton: React.FC<ExportCSVButtonProps> = ({ transactions, filename }) => {

  const convertToCSV = (data: Transaction[]) => {
    // Définir les en-têtes CSV
    const headers = [
      'ID', 
      'Date', 
      'Montant', 
      'Description', 
      'Catégorie', 
      'Statut', 
      'ID_Personne_Associee'
    ];
    
    const csvRows = [headers.join(',')];

    // Mapper les données
    for (const txn of data) {
      // Nettoyer les descriptions pour éviter les problèmes avec les virgules dans le CSV
      const safeDescription = `"${txn.description.replace(/"/g, '""')}"`;

      const row = [
        txn.id,
        txn.date,
        txn.amount.toFixed(2), // Assurer deux décimales
        safeDescription,
        txn.category || 'Non spécifié',
        txn.status,
        txn.personId || '',
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      console.warn('Aucune transaction à exporter.');
      return;
    }
    
    const csvContent = convertToCSV(transactions);
    
    // Créer un Blob (Binary Large Object)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Créer un lien de téléchargement invisible
    const link = document.createElement('a');
    if (link.download !== undefined) { 
      // Compatible avec la plupart des navigateurs
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Libérer l'URL
      setTimeout(() => URL.revokeObjectURL(url), 100); 
    } else {
      // Fallback pour les anciens navigateurs
      console.error('Votre navigateur ne supporte pas le téléchargement direct de fichiers.');
    }
  };

  return (
    <Button 
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <Download className="w-4 h-4" />
      Exporter CSV
    </Button>
  );
};