
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';

function IncomeModal({ isOpen, onClose, onSuccess, projectId, defaultCurrency, incomeToEdit = null }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: defaultCurrency || 'ARS',
    account_id: '',
    vat_amount: '',
    receipt_note: '',
    attachment_url: '',
    income_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase.from('accounts').select('id, name').eq('is_active', true);
      setAccounts(data || []);
    };
    if (isOpen) fetchAccounts();
  }, [isOpen]);

  useEffect(() => {
    if (incomeToEdit) {
      setFormData({
        description: incomeToEdit.description,
        amount: incomeToEdit.amount,
        currency: incomeToEdit.currency,
        account_id: incomeToEdit.account_id || '',
        vat_amount: incomeToEdit.vat_amount || '',
        receipt_note: incomeToEdit.receipt_note || '',
        attachment_url: incomeToEdit.attachment_url || '',
        income_date: incomeToEdit.income_date,
        notes: incomeToEdit.notes || ''
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        currency: defaultCurrency || 'ARS',
        account_id: '',
        vat_amount: '',
        receipt_note: '',
        attachment_url: '',
        income_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [incomeToEdit, isOpen, defaultCurrency]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description.trim() || !formData.amount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Required fields missing' });
      return;
    }

    try {
      setLoading(true);
      const dataToSave = {
        project_id: projectId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        account_id: formData.account_id || null,
        vat_amount: formData.vat_amount ? parseFloat(formData.vat_amount) : 0,
        receipt_note: formData.receipt_note || null,
        attachment_url: formData.attachment_url || null,
        income_date: formData.income_date,
        notes: formData.notes.trim() || null
      };

      if (incomeToEdit) {
        const { error } = await supabase
          .from('project_income')
          .update(dataToSave)
          .eq('id', incomeToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_income')
          .insert([dataToSave]);
        if (error) throw error;
      }

      toast({ title: 'Success', description: `Income ${incomeToEdit ? 'updated' : 'added'}` });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {incomeToEdit ? 'Edit Income' : 'Add Income'}
              </h2>
              <button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Description *</Label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {['ARS', 'USD', 'EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label>Date *</Label>
                  <input
                    type="date"
                    required
                    value={formData.income_date}
                    onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account</Label>
                  <select
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">{loading ? 'Saving...' : 'Save'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default IncomeModal;
