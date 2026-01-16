
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/components/ui/use-toast';
import { tokens } from '@/lib/designTokens';
import { workItemService } from '@/services/workItemService';

const WorkItemForm = ({ isOpen, onClose, onSuccess, projectId, workItem = null }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weight: 1,
    estimated_budget: 0,
    progress: 0
  });

  useEffect(() => {
    if (isOpen) {
      if (workItem) {
        setFormData({
          name: workItem.name,
          description: workItem.description || '',
          weight: workItem.weight || 1,
          estimated_budget: workItem.estimated_budget || 0,
          progress: workItem.progress || 0
        });
      } else {
        setFormData({
          name: '',
          description: '',
          weight: 1,
          estimated_budget: 0,
          progress: 0
        });
      }
    }
  }, [isOpen, workItem]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return toast({ variant: 'destructive', title: t('common.error'), description: 'El nombre es obligatorio.' });
    }
    if (formData.weight <= 0) {
      return toast({ variant: 'destructive', title: t('common.error'), description: 'El peso debe ser mayor a 0.' });
    }
    if (formData.progress < 0 || formData.progress > 100) {
      return toast({ variant: 'destructive', title: t('common.error'), description: 'El avance debe estar entre 0 y 100.' });
    }

    setLoading(true);
    try {
      if (workItem) {
        await workItemService.updateWorkItem(workItem.id, formData);
      } else {
        await workItemService.createWorkItem(projectId, formData);
      }
      toast({ title: t('common.success'), description: 'Partida guardada correctamente.' });
      onSuccess();
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[600px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {workItem ? 'Editar Partida' : 'Nueva Partida'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="space-y-2">
                <Label>Nombre <span className="text-red-500">*</span></Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Ej: Cimientos"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <textarea 
                  className="flex w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 min-h-[80px]"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso (Ponderación)</Label>
                  <Input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={formData.weight} 
                    onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value)})} 
                  />
                  <p className="text-[10px] text-slate-500">Importancia relativa en el proyecto.</p>
                </div>
                <div className="space-y-2">
                  <Label>Avance (%)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={formData.progress} 
                    onChange={(e) => setFormData({...formData, progress: parseFloat(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Presupuesto Estimado</Label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={formData.estimated_budget} 
                  onChange={(e) => setFormData({...formData, estimated_budget: parseFloat(e.target.value)})} 
                  className="font-medium"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 flex items-center justify-end gap-3">
               <Button variant="outline" onClick={onClose} className="rounded-full px-6" disabled={loading}>
                 Cancelar
               </Button>
               <Button 
                 variant="primary" 
                 onClick={handleSubmit} 
                 loading={loading}
                 className="rounded-full px-8"
               >
                 <Save className="w-4 h-4 mr-2" />
                 Guardar Partida
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WorkItemForm;
