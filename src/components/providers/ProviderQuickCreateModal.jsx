
import React, { useState } from 'react';
import { X, User, Phone, Mail, FileText, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { tokens } from '@/lib/designTokens';
import { useTheme } from '@/contexts/ThemeProvider';

const ProviderQuickCreateModal = ({ isOpen, onClose, onSuccess, initialName = '' }) => {
  const { toast } = useToast();
  const { t } = useTheme();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialName,
    tax_id: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleSubmit = async () => {
    if (!formData.name) {
      return toast({ variant: 'destructive', title: t('common.error'), description: t('messages.field_required') });
    }

    setLoading(true);
    try {
      // Fetch default provider type ID if exists
      const { data: typeData } = await supabase.from('catalog_provider_type').select('id').limit(1).single();
      const defaultTypeId = typeData?.id;

      const payload = {
        ...formData,
        provider_type_id: defaultTypeId, // Fallback if schema requires it
        is_active: true,
        type: 'PROVEEDOR', // Legacy text field support
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      };

      const { data, error } = await supabase
        .from('providers')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast({ title: t('common.success'), description: t('messages.success_saved') });
      onSuccess(data);
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[600px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('button.create_provider')}
              </h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>{t('common.name')} <span className="text-red-500">*</span></Label>
                <Input
                  icon={User}
                  placeholder="Ej. Distribuidora S.A."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('providers.tax_id')} ({t('common.optional')})</Label>
                  <Input
                    icon={FileText}
                    placeholder="20-12345678-9"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.phone')} ({t('common.optional')})</Label>
                  <Input
                    icon={Phone}
                    placeholder="+54..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.email')} ({t('common.optional')})</Label>
                  <Input
                    icon={Mail}
                    placeholder="contacto@proveedor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                   <Label>{t('common.address')} ({t('common.optional')})</Label>
                   <Input 
                      icon={MapPin}
                      placeholder="Calle Falsa 123"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                   />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={onClose} 
                className="rounded-full px-5"
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                loading={loading}
                className="rounded-full px-6 shadow-md"
              >
                {t('button.create_provider')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProviderQuickCreateModal;
