
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/contexts/LanguageContext';
import { incomeService } from '@/services/incomeService';

function IncomeModal({ isOpen, onClose, onSuccess, income = null }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [catalogs, setCatalogs] = useState({
    projects: [],
    accounts: []
  });

  const [formData, setFormData] = useState({
    income_date: new Date().toISOString().split('T')[0],
    project_id: '',
    account_id: '',
    description: '',
    amount: '',
    vat_amount: '',
    currency: 'ARS',
    receipt_note: '',
    attachment_url: '',
    is_deleted: false
  });

  useEffect(() => {
    const fetchCatalogs = async () => {
      const [projects, accounts] = await Promise.all([
        supabase.from('projects').select('id, name, base_currency').eq('is_deleted', false),
        supabase.from('accounts').select('id, name').eq('is_active', true).eq('is_deleted', false)
      ]);

      setCatalogs({
        projects: projects.data || [],
        accounts: accounts.data || []
      });
    };

    if (isOpen) fetchCatalogs();
  }, [isOpen]);

  useEffect(() => {
    if (income) {
      setFormData({
        income_date: income.income_date,
        project_id: income.project_id || '',
        account_id: income.account_id || '',
        description: income.description,
        amount: income.amount,
        vat_amount: income.vat_amount || '',
        currency: income.currency,
        receipt_note: income.receipt_note || '',
        attachment_url: income.attachment_url || '',
        is_deleted: income.is_deleted || false
      });
    } else {
      setFormData({
        income_date: new Date().toISOString().split('T')[0],
        project_id: '',
        account_id: '',
        description: '',
        amount: '',
        vat_amount: '',
        currency: 'ARS',
        receipt_note: '',
        attachment_url: '',
        is_deleted: false
      });
    }
  }, [income, isOpen]);

  const handleProjectChange = (projectId) => {
    setFormData(prev => {
      const project = catalogs.projects.find(p => p.id === projectId);
      return {
        ...prev,
        project_id: projectId,
        currency: project ? project.base_currency : prev.currency
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.income_date) return toast({ variant: 'destructive', title: t('common.error'), description: 'Date is required' });
    if (!formData.description.trim()) return toast({ variant: 'destructive', title: t('common.error'), description: 'Description is required' });
    if (!formData.project_id) return toast({ variant: 'destructive', title: t('common.error'), description: 'Project is required' });
    if (!formData.account_id) return toast({ variant: 'destructive', title: t('common.error'), description: 'Account is required' });
    if (!formData.amount || parseFloat(formData.amount) <= 0) return toast({ variant: 'destructive', title: t('common.error'), description: 'Amount must be greater than 0' });
    if (!formData.currency) return toast({ variant: 'destructive', title: t('common.error'), description: 'Currency is required' });
    if (formData.vat_amount && parseFloat(formData.vat_amount) < 0) return toast({ variant: 'destructive', title: t('common.error'), description: 'VAT Amount cannot be negative' });

    // Client-side validation for account existence in the loaded catalog
    const selectedAccount = catalogs.accounts.find(a => a.id === formData.account_id);
    if (!selectedAccount) {
      return toast({ 
        variant: 'destructive', 
        title: t('common.error'), 
        description: 'The selected account is invalid or inactive. Please select a valid account.' 
      });
    }

    try {
      setLoading(true);
      const dataToSave = {
        ...formData,
        amount: parseFloat(parseFloat(formData.amount).toFixed(2)),
        vat_amount: formData.vat_amount ? parseFloat(parseFloat(formData.vat_amount).toFixed(2)) : 0,
        updated_at: new Date().toISOString()
      };

      if (income) {
        await incomeService.updateIncome(income.id, dataToSave);
      } else {
        await incomeService.createIncome({ ...dataToSave, is_deleted: false });
      }

      toast({ title: t('common.success'), description: t('common.saved') });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving income:', error);
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {income ? t('incomes.editIncome') : t('incomes.newIncome')}
              </h2>
              <button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('common.date')} *</Label>
                  <input
                    type="date"
                    required
                    value={formData.income_date}
                    onChange={(e) => handleChange('income_date', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('common.description')} *</Label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('projects.title')} *</Label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t('common.search')}</option>
                    {catalogs.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('expenses.account')} *</Label>
                  <select
                    required
                    value={formData.account_id}
                    onChange={(e) => handleChange('account_id', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t('common.search')}</option>
                    {catalogs.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {catalogs.accounts.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">No active accounts found.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('common.amount')} *</Label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('expenses.vatAmount')}</Label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.vat_amount}
                    onChange={(e) => handleChange('vat_amount', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('common.currency')} *</Label>
                  <select
                    required
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className={inputClass}
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>{t('expenses.receipt')}</Label>
                <input
                  type="text"
                  value={formData.receipt_note}
                  onChange={(e) => handleChange('receipt_note', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>{t('expenses.attachment')} URL</Label>
                <input
                  type="text"
                  value={formData.attachment_url}
                  onChange={(e) => handleChange('attachment_url', e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t('common.cancel')}</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default IncomeModal;
