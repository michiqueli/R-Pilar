
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { projectService } from '@/services/projectService';
import { useToast } from '@/components/ui/use-toast';
import { tokens } from '@/lib/designTokens';

const WorkPlanModal = ({ isOpen, onClose, projectId, item }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    progress: '',
    status: 'Activo',
    budget: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          name: item.name,
          description: item.description || '',
          progress: item.progress || 0,
          status: item.status || 'Activo',
          budget: item.budget || 0
        });
      } else {
        setFormData({ name: '', description: '', progress: 0, status: 'Activo', budget: '' });
      }
    }
  }, [isOpen, item]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return toast({ variant: 'destructive', title: t('common.error'), description: 'El nombre es requerido' });
    
    // Validate budget
    const budgetVal = parseFloat(formData.budget);
    if (isNaN(budgetVal) || budgetVal < 0) {
        return toast({ variant: 'destructive', title: t('common.error'), description: 'Presupuesto inválido' });
    }

    setLoading(true);
    try {
      const payload = {
          ...formData,
          budget: budgetVal,
          project_id: projectId
      };

      if (item) {
        await projectService.updateWorkPlan(item.id, payload);
      } else {
        await projectService.createWorkPlan(payload);
      }
      toast({ title: t('common.success'), description: 'Partida guardada correctamente' });
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('common.error'), description: 'Error al guardar la partida' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
      if(!val) return '';
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                 {item ? 'Editar Partida' : 'Nueva Partida'}
               </h2>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                 <X className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            <div className="p-6 space-y-4">
               <div className="space-y-2">
                  <Label>Nombre de Partida <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej. Cimientos, Mampostería..."
                  />
               </div>
               
               <div className="space-y-2">
                  <Label>{t('common.description')}</Label>
                  <textarea 
                    className="w-full min-h-[80px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
               </div>

               <div className="space-y-2">
                  <Label>Presupuesto (ARS) <span className="text-red-500">*</span></Label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  />
                  {formData.budget && !isNaN(formData.budget) && (
                      <p className="text-xs text-slate-500 text-right font-medium">
                         {formatCurrency(formData.budget)}
                      </p>
                  )}
                  {parseFloat(formData.budget) === 0 && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-amber-600 dark:text-amber-500">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Un presupuesto de 0 puede afectar los indicadores de estado.</span>
                      </div>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>% Avance</Label>
                     <Input 
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => setFormData({...formData, progress: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <Label>Estado</Label>
                     <select
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                     >
                        <option value="Activo">Activo</option>
                        <option value="Completado">Completado</option>
                        <option value="Pausado">Pausado</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
               <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
               <Button variant="primary" onClick={handleSubmit} loading={loading}>
                  <Save className="w-4 h-4 mr-2" /> {t('common.save')}
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WorkPlanModal;
