
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/components/ui/use-toast';
import { tokens } from '@/lib/designTokens';
import { workItemService } from '@/services/workItemService';

const WorkItemTemplateSelector = ({ isOpen, onClose, onSuccess, projectId }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setSelectedTemplate(null);
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const data = await workItemService.getTemplates();
      setTemplates(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las plantillas.' });
    }
  };

  const handleApply = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      await workItemService.applyTemplate(projectId, selectedTemplate.id);
      toast({ title: t('common.success'), description: 'Plantilla cargada correctamente.' });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
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
            className="bg-white dark:bg-slate-900 w-full max-w-[800px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[85vh]"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-blue-600" />
                Seleccionar Plantilla de Obra
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <div 
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`
                      cursor-pointer rounded-xl p-5 border transition-all relative
                      ${selectedTemplate?.id === tpl.id 
                        ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500 dark:bg-blue-900/20 dark:border-blue-400' 
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm dark:bg-slate-900 dark:border-slate-800'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 dark:text-white">{tpl.label}</h3>
                      {selectedTemplate?.id === tpl.id && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                       {tpl.items && tpl.items.slice(0, 3).map((item, idx) => (
                         <div key={idx} className="text-sm text-slate-500 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                           {item.name}
                         </div>
                       ))}
                       {tpl.items && tpl.items.length > 3 && (
                         <div className="text-xs text-slate-400 pl-3.5 italic">
                           + {tpl.items.length - 3} partidas más...
                         </div>
                       )}
                       {(!tpl.items || tpl.items.length === 0) && (
                         <div className="text-sm text-slate-400 italic">Sin partidas predefinidas</div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 flex items-center justify-between">
               <Button 
                  variant="ghost" 
                  onClick={onClose} // Just close, implies manual creation
                  className="text-slate-500"
               >
                 Prefiero crear partidas manualmente
               </Button>

               <div className="flex gap-3">
                 <Button variant="outline" onClick={onClose} className="rounded-full px-6">
                   Cancelar
                 </Button>
                 <Button 
                   variant="primary" 
                   onClick={handleApply} 
                   loading={loading}
                   disabled={!selectedTemplate}
                   className="rounded-full px-8"
                 >
                   <Copy className="w-4 h-4 mr-2" />
                   Cargar Plantilla
                 </Button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WorkItemTemplateSelector;
