
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/contexts/LanguageContext';

function ExpenseSplitModal({ isOpen, onClose, onSuccess, expenseId, remainingAmount }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    project_id: '',
    split_amount: '',
    notes: ''
  });

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('id, name').eq('is_deleted', false);
      setProjects(data || []);
    };
    if (isOpen) {
      fetchProjects();
      setFormData(prev => ({ ...prev, split_amount: remainingAmount > 0 ? remainingAmount : '' }));
    }
  }, [isOpen, remainingAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project_id || !formData.split_amount || formData.split_amount <= 0) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Invalid input' });
      return;
    }

    if (parseFloat(formData.split_amount) > remainingAmount + 0.01) { // small tolerance
       toast({ variant: 'destructive', title: t('common.error'), description: 'Split amount exceeds remaining expense amount' });
       return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from('expense_splits').insert([{
        expense_id: expenseId,
        project_id: formData.project_id,
        split_amount: parseFloat(formData.split_amount),
        notes: formData.notes || null
      }]);

      if (error) throw error;
      toast({ title: t('common.success'), description: t('common.saved') });
      onSuccess();
      onClose();
      setFormData({ project_id: '', split_amount: '', notes: '' });
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";
  const labelClass = "text-slate-700 dark:text-slate-200";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('expenses.addSplit')}</h2>
              <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className={labelClass}>{t('projects.title')}</Label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">{t('common.search')}</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>{t('common.amount')} (Max: {remainingAmount.toFixed(2)})</Label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={remainingAmount}
                  value={formData.split_amount}
                  onChange={(e) => setFormData({ ...formData, split_amount: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>{t('common.notes')}</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`${inputClass} h-20`}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">{t('common.cancel')}</Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">{t('common.save')}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ExpenseSplitModal;
