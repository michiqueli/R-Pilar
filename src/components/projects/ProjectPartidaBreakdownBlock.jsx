import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit2,
  FileSpreadsheet,
  LayoutTemplate,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { projectService } from '@/services/projectService';
import { subpartidaService } from '@/services/subpartidaService';
import { supabase } from '@/lib/customSupabaseClient'; // Needed for manual queries/updates
import PartidaDetailModal from './modals/PartidaDetailModal';
import SubpartidaModal from './SubpartidaModal';
import EditarSubPartidaModal from '@/components/modals/EditarSubPartidaModal';
import AsignarPresupuestoModal from '@/components/modals/AsignarPresupuestoModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const ProjectPartidaBreakdownBlock = ({ projectId }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  
  // State
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedPartidaId, setExpandedPartidaId] = useState(null);
  const [subpartidasMap, setSubpartidasMap] = useState({});
  const [loadingSubs, setLoadingSubs] = useState({});
  
  // Modals
  const [selectedPartida, setSelectedPartida] = useState(null); // For editing main partida details
  
  // Subpartida Creation Modal
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [activePartidaIdForSub, setActivePartidaIdForSub] = useState(null);
  
  // Edit Subpartida Modal
  const [editSubModalOpen, setEditSubModalOpen] = useState(false);
  const [editingSubPartida, setEditingSubPartida] = useState(null);

  // Budget Assignment Modal
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [partidaForBudget, setPartidaForBudget] = useState(null);

  useEffect(() => {
    if (projectId) fetchBreakdown();
  }, [projectId]);

  // --------------------------------------------------------------------------------------------
  // FETCHING DATA
  // --------------------------------------------------------------------------------------------

  const fetchBreakdown = async () => {
    setLoading(true);
    console.log("🔄 [fetchBreakdown] Loading structure...");
    try {
      const data = await projectService.getPartidaBreakdown(projectId);
      setPartidas(data || []);
      console.log(`✅ [fetchBreakdown] Loaded ${data?.length} partidas.`);
    } catch (error) {
      console.error("❌ [fetchBreakdown] Error:", error);
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
      console.log(`✅ [fetchSubpartidas] Loaded ${subs.length} sub-items for Partida ${partidaId}`);
    } catch (error) {
      console.error("❌ [fetchSubpartidas] Error:", error);
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
      // Always re-fetch to ensure sync
      fetchSubpartidas(partidaId);
    }
  };

  // --------------------------------------------------------------------------------------------
  // BUDGET LOGIC
  // --------------------------------------------------------------------------------------------

  // Task 3: Distribute total budget equally among sub-partidas
  const handleAsignarPresupuesto = async (partidaId, totalPresupuesto) => {
    console.log(`💰 [handleAsignarPresupuesto] Partida: ${partidaId}, Total: ${totalPresupuesto}`);
    
    // 1. Get current subpartidas (ensure we have latest)
    let currentSubs = subpartidasMap[partidaId];
    if (!currentSubs) {
       // If not loaded yet, fetch them manually
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
    console.log(`🔄 [handleAsignarPresupuesto] Distributing ${amountPerItem.toFixed(2)} to ${count} items.`);

    try {
      // 2. Update Subpartidas in Batch (or loop if simple)
      // Supabase update doesn't support complex joins easily for updates without stored procedures, 
      // so we loop. For < 50 items this is fine.
      const updates = currentSubs.map(sub => 
        supabase.from('subpartidas').update({ presupuesto: amountPerItem }).eq('id', sub.id)
      );
      
      await Promise.all(updates);

      // 3. Update Parent Partida
      await supabase.from('work_items').update({ presupuesto: totalPresupuesto }).eq('id', partidaId);

      // 4. Reload
      await fetchSubpartidas(partidaId); // Refresh subs
      await fetchBreakdown(); // Refresh parent total display

      toast({ 
        title: 'Presupuesto Asignado', 
        description: `Se distribuyeron ${formatCurrency(totalPresupuesto)} entre ${count} sub-partidas.` 
      });

    } catch (error) {
      console.error("❌ [handleAsignarPresupuesto] Error updating:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Falló la asignación de presupuesto.' });
    }
  };

  // Task 4: Update single sub-partida budget and recalculate parent
  const handleActualizarSubPartida = async (subPartidaUpdated) => {
    console.log("💰 [handleActualizarSubPartida] Updated Sub:", subPartidaUpdated);

    try {
      // 1. Update the specific sub-partida
      const { error: updateError } = await supabase
        .from('subpartidas')
        .update({ 
           nombre: subPartidaUpdated.nombre,
           presupuesto: subPartidaUpdated.presupuesto,
           avance_pct: subPartidaUpdated.avance_pct // Preserve if passed
        })
        .eq('id', subPartidaUpdated.id);

      if (updateError) throw updateError;

      // 2. Recalculate Parent Total
      // Fetch all siblings
      const { data: siblings, error: fetchError } = await supabase
        .from('subpartidas')
        .select('presupuesto')
        .eq('partida_id', subPartidaUpdated.partida_id);

      if (fetchError) throw fetchError;

      const newTotal = siblings.reduce((sum, item) => sum + (Number(item.presupuesto) || 0), 0);
      console.log(`🔄 [handleActualizarSubPartida] Recalculated Parent Total: ${newTotal}`);

      // 3. Sync Parent
      await supabase
        .from('work_items')
        .update({ presupuesto: newTotal })
        .eq('id', subPartidaUpdated.partida_id);

      // 4. Reload UI
      toast({ title: 'Actualizado', description: 'Sub-partida y presupuesto global actualizados.' });
      
      // Smart refresh
      await fetchSubpartidas(subPartidaUpdated.partida_id);
      await fetchBreakdown(); 

    } catch (error) {
      console.error("❌ [handleActualizarSubPartida] Error:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la sub-partida.' });
    }
  };

  // --------------------------------------------------------------------------------------------
  // UI HANDLERS
  // --------------------------------------------------------------------------------------------

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
      
      // Recalculate budget after delete
      // We could do it properly here, or just lazy refresh
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
      // Optimistic update
      const updatedSub = { ...sub, avance_pct: newVal };
      setSubpartidasMap(prev => ({
          ...prev,
          [sub.partida_id]: prev[sub.partida_id].map(s => s.id === sub.id ? updatedSub : s)
      }));

      try {
          await subpartidaService.updateSubpartida(sub.id, { avance_pct: newVal });
          // Debounce fetchBreakdown if needed, but for now we skip to keep UI responsive
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el avance.' });
      }
  };

  // Utils
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
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('projects.planDeObra')}</h3>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="outline" size="sm" className="text-xs w-full sm:w-auto">
                <LayoutTemplate className="w-3.5 h-3.5 mr-2" />
                {t('projects.cambiarPlantilla')}
             </Button>
             <Button variant="primary" size="sm" className="text-xs w-full sm:w-auto" onClick={() => document.getElementById('add-partida-trigger')?.click()}>
                <Plus className="w-3.5 h-3.5 mr-2" />
                {t('projects.agregarPartida')}
             </Button>
          </div>
       </div>

       {/* Scrollable Body */}
       <div className="grow overflow-y-auto custom-scrollbar max-h-[520px] bg-slate-50/50 dark:bg-slate-950/20">
          {loading ? (
             <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">{t('common.loading')}</p>
             </div>
          ) : partidas.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
               <AlertCircle className="w-10 h-10 text-slate-300" />
               <p className="text-slate-500">{t('projects.noPartidas')}</p>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-3">
               {partidas.map((p) => {
                 const isExpanded = expandedPartidaId === p.id;
                 const subs = subpartidasMap[p.id] || [];
                 const isLoadingSubs = loadingSubs[p.id];
                 
                 // Calculate local totals just for verify
                 const subTotal = subs.reduce((acc, s) => acc + (Number(s.presupuesto) || 0), 0);

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
                                    {p.is_system ? `${p.name} (General)` : p.name}
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                     {subs.length > 0 ? subs.length : (p.items_count || 0)} {t('projects.subItems')}
                                  </p>
                               </div>
                            </div>

                            {/* Presupuesto (Editable) */}
                            <div className="col-span-6 sm:col-span-3 group/budget">
                               <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">{t('projects.presupuesto')}</p>
                               <div className="flex items-center gap-2">
                                 <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                   {formatCurrency(p.budget || p.presupuesto)}
                                 </p>
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
                            
                            {/* Costo Acumulado */}
                            <div className="col-span-6 sm:col-span-3">
                               <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">{t('projects.costoAcumulado')}</p>
                               <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {formatCurrency(p.total_gasto)}
                               </p>
                            </div>

                             {/* Actions (Edit Parent) */}
                             <div className="col-span-12 sm:col-span-1 flex justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                  onClick={(e) => { e.stopPropagation(); setSelectedPartida(p); }}
                                >
                                   <Edit2 className="w-4 h-4" />
                                </Button>
                             </div>
                         </div>
                      </div>

                      {/* Expanded Section */}
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
                                   <div className="text-sm text-slate-500 py-2 italic">{t('projects.noSubpartidas')}</div>
                                ) : (
                                   subs.map(sub => (
                                     <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-200 transition-colors">
                                        
                                        {/* Sub Item Info */}
                                        <div className="flex-1 min-w-0">
                                           <div className="flex justify-between items-start">
                                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{sub.nombre}</p>
                                           </div>
                                           <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                                Pres: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(sub.presupuesto)}</span>
                                              </span>
                                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                                Real: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(sub.costo_acumulado)}</span>
                                              </span>
                                           </div>
                                        </div>

                                        {/* Progress Slider */}
                                        <div className="w-full sm:w-48 flex flex-col gap-1">
                                           <div className="flex justify-between text-xs">
                                              <span className="text-slate-500">{t('projects.avance')}</span>
                                              <span className="font-bold text-indigo-600">{sub.avance_pct}%</span>
                                           </div>
                                           <input 
                                              type="range" 
                                              min="0" max="100" 
                                              value={sub.avance_pct || 0}
                                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600"
                                              onChange={(e) => handleAvanceChange(sub, parseInt(e.target.value))}
                                           />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-800 pl-3">
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-7 w-7 text-slate-400 hover:text-blue-600" 
                                              onClick={(e) => handleOpenEditSubModal(e, sub)}
                                              title="Editar Sub-partida"
                                            >
                                               <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-7 w-7 text-slate-400 hover:text-red-500" 
                                              onClick={(e) => handleDeleteSubpartida(e, sub.id, p.id)}
                                              title="Eliminar"
                                            >
                                               <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                     </div>
                                   ))
                                )}

                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 w-full border border-dashed border-indigo-200 dark:border-indigo-800"
                                  onClick={(e) => handleAddSubpartida(e, p.id)}
                                >
                                   <Plus className="w-4 h-4 mr-2" />
                                   {t('projects.agregarSubpartida')}
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

       {/* --- Modals --- */}
       
       <PartidaDetailModal 
          isOpen={!!selectedPartida}
          onClose={() => { setSelectedPartida(null); fetchBreakdown(); }}
          partida={selectedPartida}
          projectId={projectId}
       />

       {/* Creation Modal (Simplified existing one) */}
       <SubpartidaModal 
          isOpen={subModalOpen}
          onClose={() => setSubModalOpen(false)}
          partidaId={activePartidaIdForSub}
          onSuccess={handleSubpartidaSuccess}
       />

       {/* Task 2 & 7: New Edit SubPartida Modal */}
       <EditarSubPartidaModal 
          isOpen={editSubModalOpen}
          onClose={() => setEditSubModalOpen(false)}
          subPartida={editingSubPartida}
          onActualizar={handleActualizarSubPartida}
       />

       {/* Task 3 UI: Budget Distribution Modal */}
       <AsignarPresupuestoModal 
          isOpen={budgetModalOpen}
          onClose={() => setBudgetModalOpen(false)}
          partida={partidaForBudget}
          onAsignar={handleAsignarPresupuesto}
       />
    </div>
  );
};

export default ProjectPartidaBreakdownBlock;