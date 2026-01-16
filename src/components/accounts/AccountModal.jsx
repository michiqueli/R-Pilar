
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/contexts/LanguageContext';

const ACCOUNT_TYPES = ['EMPRESA', 'TARJETA_PERSONAL', 'CAJA_CHICA', 'OTRA'];
const CURRENCIES = ['ARS', 'USD'];

function AccountModal({ isOpen, onClose, onSuccess, account = null }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EMPRESA',
    currency: 'ARS',
    notes: '',
    is_active: true
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        currency: account.currency,
        notes: account.notes || '',
        is_active: account.is_active
      });
    } else {
      setFormData({
        name: '',
        type: 'EMPRESA',
        currency: 'ARS',
        notes: '',
        is_active: true
      });
    }
  }, [account, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
       toast({ variant: 'destructive', title: t('common.error'), description: 'Name is required' });
       return;
    }
    if (!formData.type) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Type is required' });
      return;
    }
    if (!formData.currency) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Currency is required' });
      return;
    }

    try {
      setLoading(true);

      // Check for unique name
      let uniqueQuery = supabase
        .from('accounts')
        .select('id')
        .ilike('name', formData.name.trim())
        .eq('is_deleted', false);
      
      if (account) uniqueQuery = uniqueQuery.neq('id', account.id);
      
      const { data: duplicates } = await uniqueQuery;
      if (duplicates && duplicates.length > 0) {
        throw new Error('An account with this name already exists.');
      }

      const dataToSave = {
        ...formData,
        name: formData.name.trim(),
        updated_at: new Date().toISOString()
      };

      if (account) {
        const { error } = await supabase.from('accounts').update(dataToSave).eq('id', account.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('accounts').insert([{ ...dataToSave, is_deleted: false }]);
        if (error) throw error;
      }

      toast({ title: t('common.success'), description: t('common.saved') });
      onSuccess();
      onClose();
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
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {account ? t('accounts.editAccount') : t('accounts.newAccount')}
              </h2>
              <button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className={labelClass}>{t('common.name')} *</Label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('common.type')} *</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={inputClass}
                  >
                    {ACCOUNT_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className={labelClass}>{t('common.currency')} *</Label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className={inputClass}
                  >
                    {CURRENCIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>{t('common.notes')}</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`${inputClass} min-h-[100px]`}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className={labelClass}>{t('common.active')}</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t('common.cancel')}</Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">{loading ? t('common.saving') : t('common.save')}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default AccountModal;
