
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/contexts/LanguageContext';

function CatalogModal({ isOpen, onClose, onSuccess, item = null, tableName, title }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    is_active: true
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        is_active: item.is_active ?? true
      });
    } else {
      setFormData({
        name: '',
        is_active: true
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Name is required' });
      return;
    }

    try {
      setLoading(true);

      // Check for duplicates
      let duplicateQuery = supabase
        .from(tableName)
        .select('id')
        .ilike('name', formData.name.trim())
        .eq('is_deleted', false);

      if (item) {
        duplicateQuery = duplicateQuery.neq('id', item.id);
      }

      const { data: duplicates, error: dupError } = await duplicateQuery;
      
      if (dupError) throw dupError;

      if (duplicates && duplicates.length > 0) {
        throw new Error('An item with this name already exists.');
      }

      const dataToSave = {
        name: formData.name.trim(),
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      if (item) {
        const { error } = await supabase.from(tableName).update(dataToSave).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tableName).insert([{ ...dataToSave, is_deleted: false, created_at: new Date().toISOString() }]);
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
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {item ? `${t('catalogs.editItem')}` : `${t('catalogs.newItem')}`} - {title}
              </h2>
              <button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className={labelClass}>{t('common.name')} *</Label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="active-mode"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active-mode" className={`cursor-pointer ${labelClass}`}>{t('common.active')}</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">{t('common.cancel')}</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CatalogModal;
