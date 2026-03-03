import { useState, useEffect, useMemo } from 'react';
import { 
  X, Save, Calendar, DollarSign, Tag, User, FileText, 
  MapPin, CreditCard, TrendingUp, TrendingDown, Sparkles 
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Transaction } from '../types';
import { generateId } from '@/utils/transaction-helpers';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onSave?: (transaction: Transaction) => void;
}

export function TransactionFormDialog({
  open,
  onClose,
  transaction,
  onSave
}: TransactionFormDialogProps) {
  const { categories, people, updateTransaction, addTransaction } = useData();
  
  const [formData, setFormData] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: '',
    subCategory: '',
    personId: '',
    type: undefined,
    country: '',
    notes: '',
    status: 'pending'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ============================================================================
  // INITIALISATION DU FORMULAIRE (LOGIQUE ULTRA-ROBUSTE & TOLÉRANTE)
  // ============================================================================
  useEffect(() => {
    if (open && transaction && categories.length > 0) {
      const rawCat = (transaction.category || '').toLowerCase().trim();
      
      const foundParent = categories.find(c => 
        !c.parentId && (c.id.toLowerCase() === rawCat || c.name.toLowerCase().trim() === rawCat)
      );
  
      // On prépare l'état complet d'un coup
      const newState = {
        ...transaction,
        description: transaction.description || '',
        category: foundParent ? foundParent.id : (transaction.category || ''),
        subCategory: transaction.subCategory || '', // On met la valeur direct
      };
  
      setFormData(newState);
    }
  }, [open, transaction?.id, categories.length]); // Surveille la longueur des catégories !

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parentId);
  }, [categories]);

  const selectedCategory = useMemo(() => {
    const currentCatId = formData.category;
    if (!currentCatId) return null;
    return categories.find(c => c.id === currentCatId);
  }, [categories, formData.category]);

  const subCategories = useMemo(() => {
    if (!selectedCategory) return [];
    return categories.filter(c => c.parentId === selectedCategory.id);
  }, [categories, selectedCategory]);

  const isEditing = !!transaction?.id;
  const isIncome = (formData.amount || 0) > 0;

  const previewAmount = useMemo(() => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      signDisplay: 'always'
    }).format(formData.amount || 0);
  }, [formData.amount]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: string, value: any) => {
    const actualValue = (value === 'none' || value === 'unspecified') ? '' : value;
    setFormData(prev => ({ ...prev, [field]: actualValue }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCategoryChange = (value: string) => {
    const actualValue = value === 'none' ? '' : value;
    setFormData(prev => ({ 
      ...prev, 
      category: actualValue,
      subCategory: '' 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const catObj = categories.find(c => c.id === formData.category);
      const categoryLabel = catObj ? catObj.name : (formData.category || '');

      const transactionData: Transaction = {
        ...(transaction || {}),
        id: transaction?.id || generateId('txn'),
        description: formData.description!,
        amount: Number(formData.amount!),
        date: formData.date!,
        category: categoryLabel,
        subCategory: formData.subCategory || undefined,
        personId: formData.personId || undefined,
        type: (formData.type || (isIncome ? 'transfer' : 'physical')) as any,
        country: formData.country || undefined,
        notes: formData.notes || undefined,
        status: formData.status || 'pending',
        lastModified: new Date().toISOString()
      } as Transaction;

      if (isEditing && updateTransaction) {
        await updateTransaction(transaction!.id, transactionData);
        toast.success('Transaction mise à jour');
      } else if (addTransaction) {
        await addTransaction(transactionData);
        toast.success('Transaction créée');
      }

      if (onSave) onSave(transactionData);
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {isEditing ? <FileText className="w-5 h-5 text-cyan-500" /> : <DollarSign className="w-5 h-5 text-cyan-500" />}
            {isEditing ? 'Modifier la transaction' : 'Nouvelle transaction'}
          </DialogTitle>
        </DialogHeader>

        {/* APERÇU DYNAMIQUE */}
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden relative">
          <div className={`absolute inset-y-0 left-0 w-1 ${isIncome ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-medium text-white line-clamp-1">{formData.description || 'Sans titre'}</div>
                <div className="text-xs text-white/40">
                    {formData.date} • {selectedCategory?.name || formData.category || 'Non classé'}
                </div>
              </div>
            </div>
            <div className={`text-lg font-mono font-bold ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>{previewAmount}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-white/40">Description *</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* SÉLECTEUR CATÉGORIE PARENTE */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-white/40 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" /> Catégorie
              </Label>
              <Select 
                value={formData.category || 'none'} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                  <SelectItem value="none">Aucune</SelectItem>
                  {parentCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SÉLECTEUR SOUS-CATÉGORIE */}
            <div className="space-y-2">
  <Label className="text-xs font-black uppercase text-white/40">Sous-catégorie</Label>
  <Select 
    // La clé forcée sur la longueur de la liste résout le problème de timing
    key={`sub-select-${subCategories.length}-${formData.category}`}
    value={formData.subCategory || 'none'} 
    onValueChange={(v) => handleChange('subCategory', v)} 
    disabled={subCategories.length === 0 && !formData.subCategory}
  >
    <SelectTrigger className="bg-white/5 border-white/10 text-white">
      <SelectValue placeholder="Sélectionner..." />
    </SelectTrigger>
    <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
      <SelectItem value="none">Aucune</SelectItem>
      {subCategories.map(cat => (
        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
      ))}
      
      {/* Sécurité ultime : si la valeur est là mais pas encore dans la liste */}
      {formData.subCategory && formData.subCategory !== 'none' && !subCategories.find(s => s.name === formData.subCategory) && (
        <SelectItem value={formData.subCategory}>{formData.subCategory}</SelectItem>
      )}
    </SelectContent>
  </Select>
</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-white/40 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Relation</Label>
              <Select value={formData.personId || 'none'} onValueChange={(v) => handleChange('personId', v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                  <SelectItem value="none">Aucune</SelectItem>
                  {people.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-white/40 flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> Type</Label>
              <Select value={formData.type || 'unspecified'} onValueChange={(v) => handleChange('type', v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                  <SelectItem value="unspecified">Par défaut</SelectItem>
                  <SelectItem value="online">En ligne</SelectItem>
                  <SelectItem value="physical">En magasin</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-[10px] font-black text-cyan-500 uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> {showAdvanced ? "Masquer les détails" : "Plus d'options"}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-white/40">Pays</Label>
                  <Input value={formData.country || ''} onChange={(e) => handleChange('country', e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-white/40">Notes</Label>
                  <Textarea value={formData.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} className="bg-white/5 border-white/10 text-white resize-none" rows={3} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 pt-6 border-t border-white/5">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-white/5 border-white/10 text-white">Annuler</Button>
            <Button type="submit" disabled={isSaving} className="flex-1 bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg shadow-cyan-500/20">
              {isSaving ? 'Envoi...' : isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}