
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hammer, Zap, Sun, RefreshCcw, Layout, Plus, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { templateService } from '@/services/templateService';
import { projectService } from '@/services/projectService';
import { useToast } from '@/components/ui/use-toast';
import CreateTemplateModal from './CreateTemplateModal';
import { tokens } from '@/lib/designTokens';

const SelectTemplateModal = ({ isOpen, onClose, projectId, onSuccess }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  
  // Create/Edit modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState(null);

  useEffect(() => {
    if (isOpen) fetchTemplates();
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las plantillas' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateId) => {
    setApplyingId(templateId);
    try {
      // 1. Apply Template
      await projectService.applyTemplate(projectId, templateId);
      
      // 2. Validate Persistence (Double Check)
      const workPlan = await projectService.getWorkPlan(projectId);
      if (!workPlan || workPlan.length === 0) {
        throw new Error('Verification failed: Items not persisted');
      }

      toast({ title: t('common.success'), description: 'Plantilla cargada con éxito' });
      onSuccess(); // Triggers parent refresh
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('common.error'), description: 'Error al aplicar plantilla' });
    } finally {
      setApplyingId(null);
    }
  };

  const handleEditTemplate = (e, tmpl) => {
    e.stopPropagation();
    setTemplateToEdit(tmpl);
    setCreateModalOpen(true);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'construction': return <Hammer className="w-5 h-5" />;
      case 'electrical': return <Zap className="w-5 h-5" />;
      case 'solar': return <Sun className="w-5 h-5" />;
      case 'renovation': return <RefreshCcw className="w-5 h-5" />;
      default: return <Layout className="w-5 h-5" />;
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'construction': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'electrical': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'solar': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'renovation': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-6xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] relative border border-slate-200 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
               <div>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Seleccionar Plantilla de Obra</h2>
                 <p className="text-slate-500 mt-1">Elige una plantilla predefinida o personalizada para comenzar tu plan de trabajo.</p>
               </div>
               <div className="flex items-center gap-4">
                  <Button variant="outline" className="rounded-full" onClick={() => { setTemplateToEdit(null); setCreateModalOpen(true); }}>
                     <Plus className="w-4 h-4 mr-2" /> Crear nueva plantilla
                  </Button>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
               </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 grow">
               {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>)}
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tmpl => (
                      <div 
                        key={tmpl.id} 
                        className={`group bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col h-full relative`}
                      >
                         <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${getColor(tmpl.type)}`}>
                               {getIcon(tmpl.type)}
                            </div>
                            {!tmpl.is_predefined && (
                              <Button variant="ghost" size="iconSm" onClick={(e) => handleEditTemplate(e, tmpl)} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                 <Edit className="w-4 h-4 text-slate-400" />
                              </Button>
                            )}
                         </div>

                         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{tmpl.name}</h3>
                         <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{tmpl.type}</div>

                         <div className="space-y-2 mb-6 flex-1">
                            {tmpl.items?.slice(0, 4).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                 <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                                 <span className="truncate">{item.name}</span>
                              </div>
                            ))}
                            {(tmpl.items?.length || 0) > 4 && (
                              <div className="text-xs text-blue-500 font-medium pl-3.5">+ {(tmpl.items.length - 4)} partidas más</div>
                            )}
                         </div>

                         <Button 
                           variant="primary" 
                           className="w-full rounded-full shadow-md hover:shadow-lg transition-all"
                           onClick={() => handleApplyTemplate(tmpl.id)}
                           disabled={applyingId !== null}
                         >
                           {applyingId === tmpl.id ? (
                             <>
                               <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cargando...
                             </>
                           ) : (
                             'Cargar Plantilla'
                           )}
                         </Button>
                      </div>
                    ))}
                 </div>
               )}
            </div>

            <CreateTemplateModal 
               isOpen={createModalOpen}
               onClose={() => setCreateModalOpen(false)}
               onSuccess={() => {
                 setCreateModalOpen(false);
                 fetchTemplates();
               }}
               templateToEdit={templateToEdit}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SelectTemplateModal;
