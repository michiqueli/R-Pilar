
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button'; // Assuming we want consistency
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

function ProviderModal({ isOpen, onClose, onSuccess, provider = null }) {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [providerTypes, setProviderTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    provider_type_id: '',
    phone: '',
    email: '',
    notes: '',
    is_active: true
  });

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase.from('catalog_provider_type').select('*').eq('is_deleted', false).eq('is_active', true);
      if (!error) setProviderTypes(data || []);
    };
    if (isOpen) fetchTypes();
  }, [isOpen]);

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        provider_type_id: provider.provider_type_id || '',
        phone: provider.phone || '',
        email: provider.email || '',
        notes: provider.notes || '',
        is_active: provider.is_active
      });
    } else {
      setFormData({
        name: '',
        provider_type_id: '',
        phone: '',
        email: '',
        notes: '',
        is_active: true
      });
    }
  }, [provider, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
       toast({ variant: 'destructive', title: t('common.error'), description: t('messages.field_required') });
       return;
    }
    if (!formData.provider_type_id) {
       toast({ variant: 'destructive', title: t('common.error'), description: t('messages.field_required') });
       return;
    }

    try {
      setLoading(true);

      // Check for unique name
      let uniqueQuery = supabase
        .from('providers')
        .select('id')
        .ilike('name', formData.name.trim())
        .eq('is_deleted', false);
      
      if (provider) uniqueQuery = uniqueQuery.neq('id', provider.id);
      
      const { data: duplicates } = await uniqueQuery;
      if (duplicates && duplicates.length > 0) {
        throw new Error('A provider with this name already exists.');
      }

      const dataToSave = {
        ...formData,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      };

      if (provider) {
        const { error } = await supabase.from('providers').update(dataToSave).eq('id', provider.id);
        if (error) throw error;
      } else {
        const typeName = providerTypes.find(t => t.id === formData.provider_type_id)?.name || 'PROVEEDOR';
        const { error } = await supabase.from('providers').insert([{ ...dataToSave, type: typeName, is_deleted: false }]);
        if (error) throw error;
      }

      toast({ title: t('common.success'), description: t('messages.success_saved') });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors";
  const labelClass = "text-gray-700 dark:text-gray-300 font-medium text-sm";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#1F2937] rounded-[12px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
          >
            <div className="sticky top-0 bg-white dark:bg-[#1F2937] border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {provider ? t('providers.editProvider') : t('providers.newProvider')}
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                 <X className="w-5 h-5 text-gray-400" />
              </button>
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
                  placeholder={t('providers.name')}
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>{t('common.type')} *</Label>
                <select
                  required
                  value={formData.provider_type_id}
                  onChange={(e) => setFormData({ ...formData, provider_type_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">{t('common.search')}</option>
                  {providerTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('providers.email')}</Label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass}
                    placeholder="example@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('providers.phone')}</Label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>{t('common.notes')}</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`${inputClass} min-h-[100px] resize-none`}
                  placeholder={t('providers.notes')}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label className={labelClass}>{t('common.active')}</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#D1D5DB] dark:data-[state=unchecked]:bg-gray-600"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button 
                   type="button" 
                   variant="outline" 
                   onClick={onClose} 
                   className="flex-1 rounded-full border-gray-200 dark:border-gray-600"
                >
                   {t('common.cancel')}
                </Button>
                <Button 
                   type="submit" 
                   disabled={loading} 
                   className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                   {loading ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ProviderModal;
