
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { subpartidaService } from '@/services/subpartidaService';

const SubpartidaModal = ({ isOpen, onClose, partidaId, subpartida = null, onSuccess }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    presupuesto: 0,
    costo_acumulado: 0,
    avance_pct: 0
  });

  useEffect(() => {
    if (isOpen) {
      if (subpartida) {
        setFormData({
          nombre: subpartida.nombre || '',
          presupuesto: subpartida.presupuesto || 0,
          costo_acumulado: subpartida.costo_acumulado || 0,
          avance_pct: subpartida.avance_pct || 0
        });
      } else {
        setFormData({
          nombre: '',
          presupuesto: 0,
          costo_acumulado: 0,
          avance_pct: 0
        });
      }
    }
  }, [isOpen, subpartida]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      return toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('messages.field_required')
      });
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        partida_id: partidaId
      };

      if (subpartida) {
        await subpartidaService.updateSubpartida(subpartida.id, payload);
        toast({ title: t('common.success'), description: t('messages.success_saved') });
      } else {
        await subpartidaService.createSubpartida(payload);
        toast({ title: t('common.success'), description: t('messages.success_saved') });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message || t('messages.error_save')
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md shadow-2xl rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {subpartida ? t('projects.editSubpartida') || 'Editar Sub-Partida' : t('projects.agregarSubpartida')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>{t('common.name')} <span className="text-red-500">*</span></Label>
            <Input 
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Ej. Materiales de base"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('projects.presupuesto')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-7"
                  value={formData.presupuesto}
                  onChange={(e) => setFormData({...formData, presupuesto: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('projects.costoAcumulado')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-7"
                  value={formData.costo_acumulado}
                  onChange={(e) => setFormData({...formData, costo_acumulado: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between">
                <Label>{t('projects.avance')} (%)</Label>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formData.avance_pct}%</span>
             </div>
             <input 
               type="range"
               min="0"
               max="100"
               step="1"
               className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-blue-600"
               value={formData.avance_pct}
               onChange={(e) => setFormData({...formData, avance_pct: parseInt(e.target.value)})}
             />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SubpartidaModal;
