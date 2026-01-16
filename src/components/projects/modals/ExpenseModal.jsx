
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';

const EXPENSE_TYPES = ['MATERIAL', 'MANO_DE_OBRA', 'SERVICIO', 'OTRO'];
const PAYMENT_STATUSES = ['PAGADO', 'A_PAGAR'];

function ExpenseModal({ isOpen, onClose, onSuccess, projectId, defaultCurrency, expenseToEdit = null }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [providers, setProviders] = useState([]);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: defaultCurrency || 'ARS',
    expense_type: 'MATERIAL',
    payment_status: 'PAGADO',
    account_id: '',
    provider_id: '',
    vat_amount: '',
    receipt_note: '',
    attachment_url: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: accountsData } = await supabase.from('accounts').select('id, name').eq('is_active', true);
      const { data: providersData } = await supabase.from('providers').select('id, name').eq('is_active', true);
      setAccounts(accountsData || []);
      setProviders(providersData || []);
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        description: expenseToEdit.description,
        amount: expenseToEdit.amount,
        currency: expenseToEdit.currency,
        expense_type: expenseToEdit.expense_type || 'MATERIAL',
        payment_status: expenseToEdit.payment_status || 'PAGADO',
        account_id: expenseToEdit.account_id || '',
        provider_id: expenseToEdit.provider_id || '',
        vat_amount: expenseToEdit.vat_amount || '',
        receipt_note: expenseToEdit.receipt_note || '',
        attachment_url: expenseToEdit.attachment_url || '',
        expense_date: expenseToEdit.expense_date,
        notes: expenseToEdit.notes || ''
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        currency: defaultCurrency || 'ARS',
        expense_type: 'MATERIAL',
        payment_status: 'PAGADO',
        account_id: '',
        provider_id: '',
        vat_amount: '',
        receipt_note: '',
        attachment_url: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [expenseToEdit, isOpen, defaultCurrency]);

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
        expense_type: formData.expense_type,
        payment_status: formData.payment_status,
        account_id: formData.account_id || null,
        provider_id: formData.provider_id || null,
        vat_amount: formData.vat_amount ? parseFloat(formData.vat_amount) : 0,
        receipt_note: formData.receipt_note || null,
        attachment_url: formData.attachment_url || null,
        expense_date: formData.expense_date,
        notes: formData.notes.trim() || null
      };

      if (expenseToEdit) {
        const { error } = await supabase
          .from('project_expenses')
          .update(dataToSave)
          .eq('id', expenseToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_expenses')
          .insert([dataToSave]);
        if (error) throw error;
      }

      toast({ title: 'Success', description: `Expense ${expenseToEdit ? 'updated' : 'added'}` });
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
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  <Label>VAT Amount</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vat_amount}
                    onChange={(e) => setFormData({ ...formData, vat_amount: e.target.value })}
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
                  <Label>Type</Label>
                  <select
                    value={formData.expense_type}
                    onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <select
                    value={formData.provider_id}
                    onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Provider</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Receipt Note / Invoice #</Label>
                <input
                  type="text"
                  value={formData.receipt_note}
                  onChange={(e) => setFormData({ ...formData, receipt_note: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
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

export default ExpenseModal;
