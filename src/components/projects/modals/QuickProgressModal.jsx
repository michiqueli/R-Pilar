import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Percent } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { projectService } from '@/services/projectService';
import { useToast } from '@/components/ui/use-toast';
import { tokens } from '@/lib/designTokens';
import * as Slider from '@radix-ui/react-slider';

const QuickProgressModal = ({ isOpen, onClose, onSuccess, partidaId, currentProgress, partidaName }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProgress(currentProgress || 0);
    }
  }, [isOpen, currentProgress]);

  const handleSave = async () => {
    if (progress < 0 || progress > 100) return;
    setLoading(true);
    try {
      await projectService.updatePartidaProgress(partidaId, progress);
      toast({ title: t('common.success'), description: 'Avance actualizado' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('common.error'), description: 'Error al actualizar avance' });
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
            className="bg-white dark:bg-slate-900 w-full max-w-md shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
               <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                 Actualizar Avance - {partidaName}
               </h2>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                 <X className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            <div className="p-8 space-y-8">
               <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {progress}%
                  </div>
                  <p className="text-sm text-slate-500">Progreso completado</p>
               </div>

               <div className="space-y-4">
                  <Slider.Root 
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[progress]}
                    max={100}
                    step={1}
                    onValueChange={(val) => setProgress(val[0])}
                  >
                    <Slider.Track className="bg-slate-200 dark:bg-slate-800 relative grow rounded-full h-[6px]">
                      <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb 
                      className="block w-6 h-6 bg-white border-2 border-blue-500 shadow-lg rounded-full hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-transform"
                    />
                  </Slider.Root>

                  <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
                     <span>0%</span>
                     <span>25%</span>
                     <span>50%</span>
                     <span>75%</span>
                     <span>100%</span>
                  </div>
               </div>
               
               <div className="relative">
                   <Label className="mb-2 block text-center">Entrada Manual</Label>
                   <div className="relative max-w-[120px] mx-auto">
                     <Input 
                       type="number" 
                       min="0" 
                       max="100" 
                       value={progress} 
                       onChange={(e) => {
                         const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                         setProgress(val);
                       }}
                       className="text-center font-bold pl-4 pr-8"
                     />
                     <Percent className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                   </div>
               </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
               <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
               <Button variant="primary" onClick={handleSave} loading={loading}>
                  <Save className="w-4 h-4 mr-2" /> {t('common.save')}
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickProgressModal;