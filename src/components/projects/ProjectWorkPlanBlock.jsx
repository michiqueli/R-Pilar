
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ListTodo, 
  Edit2, 
  Trash2, 
  Layout, 
  RefreshCcw, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { projectService } from '@/services/projectService';
import { subpartidaService } from '@/services/subpartidaService';
import WorkPlanModal from './modals/WorkPlanModal';
// import SelectTemplateModal from './modals/SelectTemplateModal'; // Deprecated
import SelectPlantillaModal from './modals/SelectPlantillaModal'; // New Modal
import SubpartidaModal from './SubpartidaModal';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectWorkPlanBlock = ({ projectId }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  
  // Main Data State
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Expansion & Subpartidas State
  const [expandedPartidaId, setExpandedPartidaId] = useState(null);
  const [subpartidasMap, setSubpartidasMap] = useState({});
  const [loadingSubs, setLoadingSubs] = useState({});

  // Modals State
  const [isPartidaModalOpen, setIsPartidaModalOpen] = useState(false);
  const [showSelectPlantilla, setShowSelectPlantilla] = useState(false); // New State Name
  const [editingPartida, setEditingPartida] = useState(null);
  
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [activePartidaForSub, setActivePartidaForSub] = useState(null);
  const [editingSub, setEditingSub] = useState(null);

  useEffect(() => {
    if (projectId) fetchWorkPlan();
  }, [projectId]);

  const fetchWorkPlan = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const data = await projectService.getPartidaBreakdown(projectId);
      setPartidas(data || []);
    } catch (error) {
      console.error(error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubpartidas = async (partidaId) => {
    setLoadingSubs(prev => ({ ...prev, [partidaId]: true }));
    try {
      const subs = await subpartidaService.getSubpartidas(partidaId);
      setSubpartidasMap(prev => ({ ...prev, [partidaId]: subs }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSubs(prev => ({ ...prev, [partidaId]: false }));
    }
  };

  const toggleExpand = (partidaId) => {
    if (expandedPartidaId === partidaId) {
      setExpandedPartidaId(null);
    } else {
      setExpandedPartidaId(partidaId);
      if (!subpartidasMap[partidaId]) {
        fetchSubpartidas(partidaId);
      }
    }
  };

  // --- Handlers for Partidas (Parent) ---
  const handleEditPartida = (e, item) => {
    e.stopPropagation();
    setEditingPartida(item);
    setIsPartidaModalOpen(true);
  };

  const handleDeletePartida = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t('common.confirmDelete') || '¿Estás seguro de eliminar?')) return;
    try {
      await projectService.deleteWorkItem(id);
      fetchWorkPlan();
      toast({ title: 'Éxito', description: 'Partida eliminada' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Error al eliminar' });
    }
  };

  // --- Handlers for Subpartidas (Children) ---
  const handleAddSubpartida = (e, partidaId) => {
    e.stopPropagation();
    setEditingSub(null);
    setActivePartidaForSub(partidaId);
    setIsSubModalOpen(true);
  };

  const handleEditSubpartida = (e, sub, partidaId) => {
    e.stopPropagation();
    setEditingSub(sub);
    setActivePartidaForSub(partidaId);
    setIsSubModalOpen(true);
  };

  const handleDeleteSubpartida = async (e, id, partidaId) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar sub-partida?')) return;
    try {
      await subpartidaService.deleteSubpartida(id);
      await fetchSubpartidas(partidaId);
      await fetchWorkPlan(); // Refresh parent progress
      toast({ title: 'Éxito', description: 'Sub-partida eliminada' });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Error al eliminar' });
    }
  };

  const handleAvanceChange = async (sub, newVal) => {
      // Optimistic update for slider
      const updatedSub = { ...sub, avance_pct: newVal };
      setSubpartidasMap(prev => ({
          ...prev,
          [sub.partida_id]: prev[sub.partida_id].map(s => s.id === sub.id ? updatedSub : s)
      }));

      try {
          await subpartidaService.updateSubpartida(sub.id, { avance_pct: newVal });
          await fetchWorkPlan(); 
      } catch (error) {
          console.error(error);
      }
  };

  // --- Utils ---
  const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

  const getStatusColor = (indicator) => {
    switch (indicator) {
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col w-full">
      {/* Fixed Header */}
      <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 bg-white dark:bg-slate-900 z-10">
        <div className="flex items-center gap-2">
           <Layout className="w-5 h-5 text-blue-600" />
           <h3 className="font-bold text-lg text-slate-800 dark:text-white">Plan de Obra / Partidas</h3>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
           {/* New Button for Templates */}
           <Button 
             variant="outline" 
             size="sm" 
             onClick={() => setShowSelectPlantilla(true)} 
             className="text-xs"
           >
             <RefreshCcw className="w-3.5 h-3.5 mr-2" /> 
             {partidas.length > 0 ? 'Cambiar Plantilla' : 'Cargar Plantilla'}
           </Button>
           
           <Button variant="primary" size="sm" onClick={() => { setEditingPartida(null); setIsPartidaModalOpen(true); }} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-2" /> Agregar Partida
           </Button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="grow overflow-y-auto custom-scrollbar max-h-[520px] bg-slate-50/50 dark:bg-slate-950/20">
        {loading ? (
           <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Cargando...</p>
           </div>
        ) : hasError ? (
            <div className="p-12 text-center flex flex-col items-center gap-4 min-h-[300px] justify-center text-red-500">
               <AlertCircle className="w-12 h-12 mb-2" />
               <p>No se pudo cargar el plan de obra.</p>
               <Button variant="outline" size="sm" onClick={fetchWorkPlan}>Reintentar</Button>
            </div>
        ) : partidas.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-4 min-h-[300px] justify-center">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                <ListTodo className="w-8 h-8" />
             </div>
             <div className="max-w-xs text-center">
                <h4 className="font-bold text-slate-700 dark:text-white mb-2">No hay partidas configuradas</h4>
                <p className="text-sm text-slate-500 mb-6">Comienza creando partidas manualmente.</p>
             </div>
             <Button variant="outline" onClick={() => setShowSelectPlantilla(true)}>
               <Layout className="w-4 h-4 mr-2" /> Cargar Plantilla
             </Button>
          </div>
        ) : (
          <div className="p-4 md:p-6 space-y-3">
             {partidas.map((p) => {
               const isExpanded = expandedPartidaId === p.id;
               const subs = subpartidasMap[p.id] || [];
               const isLoadingSubs = loadingSubs[p.id];

               return (
                 <motion.div 
                   key={p.id}
                   layout
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all"
                 >
                    {/* Main Row */}
                    <div 
                      className="p-4 cursor-pointer flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => toggleExpand(p.id)}
                    >
                       <div className={cn("w-1 h-12 rounded-full mr-1 flex-shrink-0", getStatusColor(p.status_indicator))} />
                       
                       <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                          {/* Title & Chevron */}
                          <div className="col-span-12 sm:col-span-5 flex items-center gap-2">
                             <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate pr-2">
                                  {p.name}
                                </h4>
                                <div className="flex gap-2 text-xs text-slate-500">
                                   <span>{p.budget > 0 ? formatCurrency(p.budget) : 'Sin presupuesto'}</span>
                                   <span>•</span>
                                   <span>{p.progress || 0}% Avance</span>
                                </div>
                             </div>
                          </div>

                          {/* Stats (Desktop) */}
                          <div className="hidden sm:block sm:col-span-3">
                             <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Presupuesto</p>
                             <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                               {p.budget > 0 ? formatCurrency(p.budget) : '-'}
                             </p>
                          </div>
                          
                          <div className="hidden sm:block sm:col-span-3">
                             <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Costo Asignado</p>
                             <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {formatCurrency(p.total_gasto)}
                             </p>
                          </div>

                           {/* Actions */}
                           <div className="col-span-12 sm:col-span-1 flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                onClick={(e) => handleEditPartida(e, p)}
                              >
                                 <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                onClick={(e) => handleDeletePartida(e, p.id)}
                              >
                                 <Trash2 className="w-4 h-4" />
                              </Button>
                           </div>
                       </div>
                    </div>

                    {/* Expanded Section (Subpartidas) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800"
                        >
                           <div className="p-4 pl-8 sm:pl-12 space-y-3">
                              {isLoadingSubs ? (
                                 <div className="text-xs text-slate-400 py-2">Cargando sub-partidas...</div>
                              ) : subs.length === 0 ? (
                                 <div className="text-sm text-slate-500 py-2 italic flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    No hay sub-partidas
                                 </div>
                              ) : (
                                 subs.map(sub => (
                                   <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                                      <div className="flex-1">
                                         <div className="flex justify-between items-start">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{sub.nombre}</p>
                                         </div>
                                         <div className="flex gap-4 mt-1">
                                            <span className="text-xs text-slate-500">Pres: <span className="font-mono font-medium">{formatCurrency(sub.presupuesto)}</span></span>
                                            <span className="text-xs text-slate-500">Real: <span className="font-mono font-medium">{formatCurrency(sub.costo_acumulado)}</span></span>
                                         </div>
                                      </div>

                                      <div className="w-full sm:w-48 flex flex-col gap-1">
                                         <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Avance</span>
                                            <span className="font-bold text-blue-600">{sub.avance_pct}%</span>
                                         </div>
                                         <input 
                                            type="range" 
                                            min="0" max="100" 
                                            value={sub.avance_pct || 0}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-blue-600"
                                            onChange={(e) => handleAvanceChange(sub, parseInt(e.target.value))}
                                         />
                                      </div>

                                      <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-800 pl-3">
                                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-blue-600" onClick={(e) => handleEditSubpartida(e, sub, p.id)}>
                                             <Edit2 className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-500" onClick={(e) => handleDeleteSubpartida(e, sub.id, p.id)}>
                                             <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                      </div>
                                   </div>
                                 ))
                              )}

                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full border border-dashed border-blue-200 dark:border-blue-800 mt-2"
                                onClick={(e) => handleAddSubpartida(e, p.id)}
                              >
                                 <Plus className="w-4 h-4 mr-2" />
                                 Agregar Sub-partida
                              </Button>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </motion.div>
               );
             })}
          </div>
        )}
      </div>

      {/* Modals */}
      <WorkPlanModal 
        isOpen={isPartidaModalOpen} 
        onClose={() => setIsPartidaModalOpen(false)} 
        onSuccess={() => { setIsPartidaModalOpen(false); fetchWorkPlan(); }} 
        projectId={projectId} 
        item={editingPartida} 
      />

      <SelectPlantillaModal 
        isOpen={showSelectPlantilla} 
        onClose={() => setShowSelectPlantilla(false)} 
        proyectoId={projectId} 
        onSuccess={async () => { 
           await fetchWorkPlan(); 
           // Optional: setShowSelectPlantilla(false); is already done by onClose in modal logic usually or passed down.
           // In SelectPlantillaModal: onSuccess calls this, then local onClose.
        }} 
      />
      
      <SubpartidaModal 
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        partidaId={activePartidaForSub}
        subpartida={editingSub}
        onSuccess={async () => {
           if (activePartidaForSub) await fetchSubpartidas(activePartidaForSub);
           await fetchWorkPlan();
        }}
      />
    </div>
  );
};

export default ProjectWorkPlanBlock;
