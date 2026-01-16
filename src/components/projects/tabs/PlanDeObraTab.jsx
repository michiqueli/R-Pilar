
import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit2,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { projectService } from '@/services/projectService';
import { subpartidaService } from '@/services/subpartidaService';
import { supabase } from '@/lib/customSupabaseClient';
import PartidaDetailModal from '@/components/projects/modals/PartidaDetailModal';
import SubpartidaModal from '@/components/projects/SubpartidaModal';
import EditarSubPartidaModal from '@/components/modals/EditarSubPartidaModal';
import AsignarPresupuestoModal from '@/components/modals/AsignarPresupuestoModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const PlanDeObraTab = ({ projectId }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  
  // State
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedPartidaId, setExpandedPartidaId] = useState(null);
  const [subpartidasMap, setSubpartidasMap] = useState({});
  const [loadingSubs, setLoadingSubs] = useState({});
  
  // Modals
  const [selectedPartida, setSelectedPartida] = useState(null);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [activePartidaIdForSub, setActivePartidaIdForSub] = useState(null);
  const [editSubModalOpen, setEditSubModalOpen] = useState(false);
  const [editingSubPartida, setEditingSubPartida] = useState(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [partidaForBudget, setPartidaForBudget] = useState(null);

  useEffect(() => {
    if (projectId) fetchBreakdown();
  }, [projectId]);

  const fetchBreakdown = async () => {
    setLoading(true);
    try {
      const data = await projectService.getPartidaBreakdown(projectId);
      setPartidas(data || []);
      // Pre-load subpartidas for all to show accurate counts/totals immediately if possible
      // For now, we load on expand or lazy load, but to get totals we might need all.
      // We'll stick to lazy load for performance unless needed.
    } catch (error) {
      console.error("Error cargando partidas:", error);
      toast({ variant: 'destructive', title: t('common.error'), description: 'Error cargando partidas' });
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
      console.error("Error cargando sub-partidas:", error);
      toast({ variant: 'destructive', title: t('common.error'), description: 'Error cargando sub-partidas' });
    } finally {
      setLoadingSubs(prev => ({ ...prev, [partidaId]: false }));
    }
  };

  const toggleExpand = (partidaId) => {
    if (expandedPartidaId === partidaId) {
      setExpandedPartidaId(null);
    } else {
      setExpandedPartidaId(partidaId);
      fetchSubpartidas(partidaId);
    }
  };

  const handleAsignarPresupuesto = async (partidaId, totalPresupuesto) => {
    let currentSubs = subpartidasMap[partidaId];
    if (!currentSubs) {
       const { data, error } = await supabase.from('subpartidas').select('*').eq('partida_id', partidaId);
       if (error) {
         toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron leer las subpartidas.' });
         return;
       }
       currentSubs = data;
    }

    if (!currentSubs || currentSubs.length === 0) {
      toast({ variant: 'destructive', title: 'Atención', description: 'No hay sub-partidas para distribuir el presupuesto.' });
      return;
    }

    const count = currentSubs.length;
    const amountPerItem = totalPresupuesto / count;

    try {
      const updates = currentSubs.map(sub => 
        supabase.from('subpartidas').update({ presupuesto: amountPerItem }).eq('id', sub.id)
      );
      
      await Promise.all(updates);
      await supabase.from('work_items').update({ presupuesto: totalPresupuesto }).eq('id', partidaId);

      await fetchSubpartidas(partidaId);
      await fetchBreakdown();

      toast({ 
        title: 'Presupuesto Asignado', 
        description: `Se distribuyeron ${formatCurrency(totalPresupuesto)} entre ${count} sub-partidas.` 
      });

    } catch (error) {
      console.error("Error updating:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Falló la asignación de presupuesto.' });
    }
  };

  const handleActualizarSubPartida = async (subPartidaUpdated) => {
    try {
      const { error: updateError } = await supabase
        .from('subpartidas')
        .update({ 
           nombre: subPartidaUpdated.nombre,
           presupuesto: subPartidaUpdated.presupuesto,
           avance_pct: subPartidaUpdated.avance_pct
        })
        .eq('id', subPartidaUpdated.id);

      if (updateError) throw updateError;

      const { data: siblings, error: fetchError } = await supabase
        .from('subpartidas')
        .select('presupuesto')
        .eq('partida_id', subPartidaUpdated.partida_id);

      if (fetchError) throw fetchError;

      const newTotal = siblings.reduce((sum, item) => sum + (Number(item.presupuesto) || 0), 0);

      await supabase
        .from('work_items')
        .update({ presupuesto: newTotal })
        .eq('id', subPartidaUpdated.partida_id);

      toast({ title: 'Actualizado', description: 'Sub-partida y presupuesto global actualizados.' });
      
      await fetchSubpartidas(subPartidaUpdated.partida_id);
      await fetchBreakdown(); 

    } catch (error) {
      console.error("Error:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la sub-partida.' });
    }
  };

  const handleOpenBudgetModal = (e, partida) => {
    e.stopPropagation();
    setPartidaForBudget(partida);
    setBudgetModalOpen(true);
  };

  const handleOpenEditSubModal = (e, sub) => {
    e.stopPropagation();
    setEditingSubPartida(sub);
    setEditSubModalOpen(true);
  };

  const handleAddSubpartida = (e, partidaId) => {
    e.stopPropagation();
    setActivePartidaIdForSub(partidaId);
    setSubModalOpen(true);
  };

  const handleDeleteSubpartida = async (e, id, partidaId) => {
    e.stopPropagation();
    if (!window.confirm(t('messages.confirm_delete'))) return;
    
    try {
      await subpartidaService.deleteSubpartida(id);
      await fetchSubpartidas(partidaId); 
      await fetchBreakdown();
      
      toast({ title: t('common.success'), description: t('messages.success_saved') });
    } catch (error) {
       toast({ variant: 'destructive', title: t('common.error'), description: 'Error al eliminar' });
    }
  };

  const handleSubpartidaSuccess = async () => {
    if (activePartidaIdForSub) {
       await fetchSubpartidas(activePartidaIdForSub);
       await fetchBreakdown(); 
    }
  };
  
  const handleAvanceChange = async (sub, newVal) => {
      const updatedSub = { ...sub, avance_pct: newVal };
      setSubpartidasMap(prev => ({
          ...prev,
          [sub.partida_id]: prev[sub.partida_id].map(s => s.id === sub.id ? updatedSub : s)
      }));

      try {
          await subpartidaService.updateSubpartida(sub.id, { avance_pct: newVal });
          // Also update parent progress average
          const subs = subpartidasMap[sub.partida_id];
          const newSubs = subs.map(s => s.id === sub.id ? updatedSub : s);
          const avgProgress = Math.round(newSubs.reduce((acc, s) => acc + (s.avance_pct || 0), 0) / newSubs.length);
          
          await projectService.updatePartidaProgress(sub.partida_id, avgProgress);
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el avance.' });
      }
  };

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
    <div className="space-y-6">
       {/* Actions Bar */}
       <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Estructura de Presupuesto</h3>
            <p className="text-sm text-slate-500">Gestiona las partidas, sub-partidas y asignación de recursos.</p>
          </div>
          <Button onClick={() => document.getElementById('add-partida-trigger')?.click()} className="bg-blue-600 hover:bg-blue-700 text-white">
             <Plus className="w-4 h-4 mr-2" /> Nueva Partida
          </Button>
       </div>

       {/* Main List */}
       <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
          {loading ? (
             <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Cargando estructura...</p>
             </div>
          ) : partidas.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
               <AlertCircle className="w-10 h-10 text-slate-300" />
               <p className="text-slate-500">No hay partidas definidas.</p>
               <Button variant="outline" onClick={() => document.getElementById('add-partida-trigger')?.click()}>
                  Crear primera partida
               </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
               {partidas.map((p) => {
                 const isExpanded = expandedPartidaId === p.id;
                 const subs = subpartidasMap[p.id] || [];
                 const isLoadingSubs = loadingSubs[p.id];

                 return (
                   <div key={p.id} className="group">
                      {/* Parent Row */}
                      <div 
                        className={cn(
                          "p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                          isExpanded && "bg-slate-50 dark:bg-slate-800/30"
                        )}
                        onClick={() => toggleExpand(p.id)}
                      >
                         <div className={cn("w-1.5 h-10 rounded-full flex-shrink-0", getStatusColor(p.status_indicator))} />
                         
                         <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            {/* Title */}
                            <div className="md:col-span-5 flex items-center gap-3">
                               <div className="p-1 rounded-md bg-white border border-slate-200 text-slate-400 shadow-sm">
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                               </div>
                               <div>
                                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                    {p.is_system ? `${p.name} (General)` : p.name}
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                     {p.items_count || (subs.length > 0 ? subs.length : 0)} sub-items
                                  </p>
                               </div>
                            </div>

                            {/* Presupuesto */}
                            <div className="md:col-span-3">
                               <div className="flex items-center gap-2 group/budget">
                                 <div>
                                   <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Presupuesto</p>
                                   <p className="text-sm font-bold text-slate-900 dark:text-white">
                                     {formatCurrency(p.budget || p.presupuesto)}
                                   </p>
                                 </div>
                                 <Button
                                    variant="ghost"
                                    size="iconSm"
                                    onClick={(e) => handleOpenBudgetModal(e, p)}
                                    className="h-6 w-6 opacity-0 group-hover/budget:opacity-100 transition-opacity text-blue-500 hover:bg-blue-50"
                                    title="Distribuir Presupuesto"
                                 >
                                    <DollarSign className="w-3.5 h-3.5" />
                                 </Button>
                               </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="md:col-span-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); setSelectedPartida(p); }}
                                >
                                   <Edit2 className="w-3.5 h-3.5 mr-2" /> Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => handleAddSubpartida(e, p.id)}
                                >
                                   <Plus className="w-3.5 h-3.5 mr-2" /> Sub-item
                                </Button>
                            </div>
                         </div>
                      </div>

                      {/* Children */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100"
                          >
                             <div className="p-4 pl-8 md:pl-16 space-y-2">
                                {isLoadingSubs ? (
                                   <div className="text-xs text-slate-400 py-2 flex items-center gap-2">
                                      <div className="w-3 h-3 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"/>
                                      Cargando detalles...
                                   </div>
                                ) : subs.length === 0 ? (
                                   <div className="text-sm text-slate-500 py-4 italic border-2 border-dashed border-slate-200 rounded-lg text-center">
                                      No hay sub-partidas. Agrega una para comenzar.
                                   </div>
                                ) : (
                                   subs.map(sub => (
                                     <div key={sub.id} className="flex flex-col md:flex-row md:items-center gap-4 p-3 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                                        
                                        <div className="flex-1">
                                           <div className="flex justify-between items-start mb-1">
                                              <p className="font-medium text-slate-800 text-sm">{sub.nombre}</p>
                                              <p className="font-bold text-slate-900 text-sm">{formatCurrency(sub.presupuesto)}</p>
                                           </div>
                                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-blue-500 transition-all duration-500"
                                                style={{ width: `${sub.avance_pct || 0}%` }}
                                              />
                                           </div>
                                        </div>

                                        {/* Slider Control */}
                                        <div className="w-full md:w-48 pt-2 md:pt-0">
                                           <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                              <span>Avance</span>
                                              <span className="font-bold text-blue-600">{sub.avance_pct || 0}%</span>
                                           </div>
                                           <input 
                                              type="range" 
                                              min="0" max="100" 
                                              value={sub.avance_pct || 0}
                                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                              onChange={(e) => handleAvanceChange(sub, parseInt(e.target.value))}
                                           />
                                        </div>

                                        <div className="flex items-center gap-1 border-l pl-3 border-slate-100">
                                            <Button 
                                              variant="ghost" 
                                              size="iconSm" 
                                              className="text-slate-400 hover:text-blue-600" 
                                              onClick={(e) => handleOpenEditSubModal(e, sub)}
                                            >
                                               <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="iconSm" 
                                              className="text-slate-400 hover:text-red-500" 
                                              onClick={(e) => handleDeleteSubpartida(e, sub.id, p.id)}
                                            >
                                               <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                     </div>
                                   ))
                                )}
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                 );
               })}
            </div>
          )}
       </div>

       {/* Modals */}
       <PartidaDetailModal 
          isOpen={!!selectedPartida}
          onClose={() => { setSelectedPartida(null); fetchBreakdown(); }}
          partida={selectedPartida}
          projectId={projectId}
       />
       <SubpartidaModal 
          isOpen={subModalOpen}
          onClose={() => setSubModalOpen(false)}
          partidaId={activePartidaIdForSub}
          onSuccess={handleSubpartidaSuccess}
       />
       <EditarSubPartidaModal 
          isOpen={editSubModalOpen}
          onClose={() => setEditSubModalOpen(false)}
          subPartida={editingSubPartida}
          onActualizar={handleActualizarSubPartida}
       />
       <AsignarPresupuestoModal 
          isOpen={budgetModalOpen}
          onClose={() => setBudgetModalOpen(false)}
          partida={partidaForBudget}
          onAsignar={handleAsignarPresupuesto}
       />
    </div>
  );
};

export default PlanDeObraTab;
