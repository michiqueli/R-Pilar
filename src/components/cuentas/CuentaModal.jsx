
import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlignLeft, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { ThemedSelect } from '@/components/ui/themed-components';
import { tokens } from '@/lib/designTokens';
import { cuentaService } from '@/services/cuentaService';
import { useTheme } from '@/contexts/ThemeProvider';

const CuentaModal = ({ isOpen, onClose, onSuccess, cuenta = null }) => {
  const { toast } = useToast();
  const { t } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Banco',
    nota: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (cuenta) {
        setFormData({
          titulo: cuenta.titulo || '',
          tipo: cuenta.tipo || 'Banco',
          nota: cuenta.nota || ''
        });
      } else {
        setFormData({
          titulo: '',
          tipo: 'Banco',
          nota: ''
        });
      }
    }
  }, [isOpen, cuenta]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.titulo || !formData.tipo) {
      return toast({ 
        variant: 'destructive', 
        title: t('common.error'), 
        description: t('cuentas.requiredFields') 
      });
    }

    setLoading(true);
    try {
      if (cuenta) {
        await cuentaService.updateCuenta(cuenta.id, formData);
      } else {
        await cuentaService.createCuenta(formData);
      }

      toast({ 
        title: t('common.success'), 
        description: t('cuentas.created') 
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ 
        variant: 'destructive', 
        title: t('common.error'), 
        description: t('cuentas.error') 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-500" />
                {cuenta ? t('cuentas.editar') : t('cuentas.newCuenta')}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 bg-slate-50/30 dark:bg-slate-900/30">
              {/* Título */}
              <div className="space-y-2">
                <Label>{t('cuentas.titulo')} <span className="text-red-500">*</span></Label>
                <Input
                  icon={CreditCard}
                  placeholder="Ej. Banco Galicia"
                  value={formData.titulo}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  autoFocus
                />
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label>{t('cuentas.tipo')} <span className="text-red-500">*</span></Label>
                <ThemedSelect
                  value={formData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value)}
                >
                  <option value="Banco">Banco</option>
                  <option value="Efectivo">Efectivo</option>
                </ThemedSelect>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label>{t('cuentas.nota')} <span className="text-slate-400 text-xs font-normal ml-1">({t('common.optional')})</span></Label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
                     <AlignLeft className="h-4 w-4" />
                  </div>
                  <textarea
                    className="flex w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 pl-10 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-none"
                    placeholder={t('placeholder.additional_notes')}
                    value={formData.nota}
                    onChange={(e) => handleChange('nota', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                loading={loading}
              >
                {t('common.save')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CuentaModal;
