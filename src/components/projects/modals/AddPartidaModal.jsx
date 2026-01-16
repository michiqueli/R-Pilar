
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/components/ui/use-toast';
import { tokens } from '@/lib/designTokens';

const AddPartidaModal = ({ isOpen, onClose, onSave }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = () => {
    if (!formData.name.trim()) return toast({ variant: 'destructive', title: t('common.error'), description: 'Nombre es requerido' });
    if (formData.name.length > 100) return toast({ variant: 'destructive', title: t('common.error'), description: 'Nombre muy largo (max 100)' });
    if (formData.description.length > 500) return toast({ variant: 'destructive', title: t('common.error'), description: 'Descripción muy larga (max 500)' });

    onSave(formData);
    setFormData({ name: '', description: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
               <h3 className="font-bold text-lg text-slate-900 dark:text-white">Agregar Partida</h3>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                 <X className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            <div className="p-6 space-y-4">
               <div className="space-y-2">
                  <Label>Nombre de Partida <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej. Cimientos, Pintura..."
                    className="rounded-lg"
                  />
               </div>
               <div className="space-y-2">
                  <Label>Descripción {t('common.optional')}</Label>
                  <textarea 
                    className="w-full min-h-[100px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descripción breve..."
                  />
               </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
               <Button variant="outline" onClick={onClose} className="rounded-full px-6">{t('common.cancel')}</Button>
               <Button variant="primary" onClick={handleSubmit} className="rounded-full px-6 shadow-lg shadow-blue-500/20">
                  <Save className="w-4 h-4 mr-2" /> Guardar Partida
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddPartidaModal;
