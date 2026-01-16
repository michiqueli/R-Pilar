
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/components/ui/use-toast';
import { templateService } from '@/services/templateService';
import { supabase } from '@/lib/customSupabaseClient';
import AddPartidaModal from './AddPartidaModal';
import { tokens } from '@/lib/designTokens';

const CreateTemplateModal = ({ isOpen, onClose, onSuccess, templateToEdit = null }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isAddPartidaOpen, setIsAddPartidaOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom',
    items: [] // { name, description }
  });

  useEffect(() => {
    if (isOpen) {
      if (templateToEdit) {
        setFormData({
          name: templateToEdit.name,
          type: templateToEdit.type,
          items: templateToEdit.items || []
        });
      } else {
        setFormData({
          name: '',
          type: 'custom',
          items: []
        });
      }
    }
  }, [isOpen, templateToEdit]);

  const handleAddPartida = (item) => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));
  };

  const handleRemovePartida = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return toast({ variant: 'destructive', title: t('common.error'), description: 'Nombre requerido' });
    if (formData.items.length === 0) return toast({ variant: 'destructive', title: t('common.error'), description: 'Mínimo 1 partida' });
    if (formData.items.length > 20) return toast({ variant: 'destructive', title: t('common.error'), description: 'Máximo 20 partidas' });

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      if (templateToEdit) {
        await templateService.updateTemplate(templateToEdit.id, formData);
        toast({ title: t('common.success'), description: 'Plantilla actualizada' });
      } else {
        await templateService.createTemplate({ ...formData, user_id: user.id });
        toast({ title: t('common.success'), description: 'Plantilla creada' });
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('common.error'), description: 'Error al guardar plantilla' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta plantilla?')) return;
    setLoading(true);
    try {
      await templateService.deleteTemplate(templateToEdit.id);
      toast({ title: t('common.success'), description: 'Plantilla eliminada' });
      onSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Error al eliminar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[85vh]"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
               <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {templateToEdit ? 'Editar Plantilla de Obra' : 'Crear Plantilla de Obra'}
                  </h2>
                  <p className="text-sm text-slate-500">Define una estructura reutilizable de partidas</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                 <X className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar grow bg-slate-50/50 dark:bg-slate-900/50">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                     <Label>Nombre de Plantilla <span className="text-red-500">*</span></Label>
                     <Input 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ej. Casa Tipo 100m2"
                        className="rounded-lg"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label>Tipo de Obra</Label>
                     <select
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                     >
                        <option value="custom">Personalizada</option>
                        <option value="construction">Construcción</option>
                        <option value="electrical">Eléctrica</option>
                        <option value="solar">Fotovoltaica</option>
                        <option value="renovation">Reforma</option>
                     </select>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="font-bold text-slate-800 dark:text-white">Partidas ({formData.items.length})</h3>
                     <Button size="sm" onClick={() => setIsAddPartidaOpen(true)} className="rounded-full">
                        <Plus className="w-4 h-4 mr-2" /> Agregar Partida
                     </Button>
                  </div>

                  {formData.items.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                       <p className="text-slate-400 text-sm">No hay partidas definidas. Agrega al menos una.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                       {formData.items.map((item, index) => (
                         <div key={index} className="flex items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                            <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                            <div className="flex-1">
                               <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.name}</div>
                               {item.description && <div className="text-xs text-slate-500 line-clamp-1">{item.description}</div>}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="iconSm" 
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleRemovePartida(index)}
                            >
                               <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
               <div>
                  {templateToEdit && (
                    <Button variant="destructive" onClick={handleDelete} className="rounded-full px-6" disabled={loading}>
                       <Trash2 className="w-4 h-4 mr-2" /> Eliminar Plantilla
                    </Button>
                  )}
               </div>
               <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="rounded-full px-6">{t('common.cancel')}</Button>
                  <Button variant="primary" onClick={handleSubmit} loading={loading} className="rounded-full px-8 shadow-lg shadow-blue-500/20">
                     <Save className="w-4 h-4 mr-2" /> Guardar Plantilla
                  </Button>
               </div>
            </div>
            
            <AddPartidaModal 
               isOpen={isAddPartidaOpen}
               onClose={() => setIsAddPartidaOpen(false)}
               onSave={handleAddPartida}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateTemplateModal;
