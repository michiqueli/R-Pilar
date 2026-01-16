
import React, { useState } from 'react';
import { X, User, Phone, Mail, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { tokens } from '@/lib/designTokens';
import { useTheme } from '@/contexts/ThemeProvider';

const ClientQuickCreateModal = ({ isOpen, onClose, onSuccess, initialName = '' }) => {
  const { toast } = useToast();
  const { t } = useTheme();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialName,
    tax_id: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async () => {
    if (!formData.name) {
      return toast({ variant: 'destructive', title: t('common.error'), description: t('messages.field_required') });
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      };

      const { data, error } = await supabase
        .from('clients')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast({ title: t('common.success'), description: t('messages.success_saved') });
      onSuccess(data); // Pass the created client back
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[500px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.card }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('button.new_client')}
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
                  placeholder="Ej. Empresa SA"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('clients.tax_id')} ({t('common.optional')})</Label>
                <Input
                  icon={FileText}
                  placeholder="CUIT / NIF"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.email')} ({t('common.optional')})</Label>
                  <Input
                    icon={Mail}
                    placeholder="email@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                {t('common.create')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ClientQuickCreateModal;
