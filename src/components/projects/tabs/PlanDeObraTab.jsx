import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  AlertCircle,
  Layers,
  RefreshCw,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { projectService } from '@/services/projectService';
import { subpartidaService } from '@/services/subpartidaService';
import { supabase } from '@/lib/customSupabaseClient';
import PartidaDetailModal from '@/components/projects/modals/PartidaDetailModal';
import WorkPlanModal from '@/components/projects/modals/WorkPlanModal';
import SubpartidaModal from '@/components/projects/SubpartidaModal';
import EditarSubPartidaModal from '@/components/modals/EditarSubPartidaModal';
import AsignarPresupuestoModal from '@/components/modals/AsignarPresupuestoModal';
import SelectPlantillaModal from '@/components/projects/modals/SelectPlantillaModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrencyARS } from '@/lib/formatUtils';

const PlanDeObraTab = ({ projectId }) => {
  const { t } = useTheme();
  const { toast } = useToast();

  // Estados de datos
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPartidaId, setExpandedPartidaId] = useState(null);
  const [subpartidasMap, setSubpartidasMap] = useState({});

  // Estados de modales
  const [isPartidaModalOpen, setIsPartidaModalOpen] = useState(false);
  const [partidaToEdit, setPartidaToEdit] = useState(null);
  const [selectedPartida, setSelectedPartida] = useState(null);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [activePartidaIdForSub, setActivePartidaIdForSub] = useState(null);
  const [editSubModalOpen, setEditSubModalOpen] = useState(false);
  const [editingSubPartida, setEditingSubPartida] = useState(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [partidaForBudget, setPartidaForBudget] = useState(null);
  const [showSelectPlantilla, setShowSelectPlantilla] = useState(false);

  // 1. AVANCE GLOBAL: Calculado reactivamente sobre el estado de las partidas
  const avanceGlobal = useMemo(() => {
    if (!partidas || partidas.length === 0) return 0;
    const total = partidas.reduce((acc, p) => acc + (Number(p.progreso) || 0), 0);
    return Math.round(total / partidas.length);
  }, [partidas]);

  useEffect(() => {
    if (projectId) loadAllData();
  }, [projectId]);
  

  // 2. CARGA PROFUNDA INICIAL: Calcula promedios reales antes de mostrar la página
  const loadAllData = async () => {
    setLoading(true);
    try {
      const partidasData = await projectService.getPartidaBreakdown(projectId);

      const fullData = await Promise.all(partidasData.map(async (partida) => {
        const subs = await subpartidaService.getSubpartidas(partida.id);

        let promedioCalculado = 0;
        if (subs && subs.length > 0) {
          promedioCalculado = Math.round(
            subs.reduce((acc, s) => acc + (Number(s.avance_pct) || 0), 0) / subs.length
          );
        }

        return {
          ...partida,
          progreso: promedioCalculado,
          sub_items_count: subs.length,
          sub_items_preloaded: subs
        };
      }));

      const newMap = {};
      fullData.forEach(p => {
        newMap[p.id] = p.sub_items_preloaded;
      });

      setSubpartidasMap(newMap);
      setPartidas(fullData);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron sincronizar los avances.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (partidaId) => {
    setExpandedPartidaId(expandedPartidaId === partidaId ? null : partidaId);
  };

  // 3. ACTUALIZACIÓN EN TIEMPO REAL: Sincroniza Subpartida -> Padre -> Global
  const handleAvanceChange = async (sub, newVal) => {
    const currentSubs = subpartidasMap[sub.partida_id] || [];
    const updatedSubs = currentSubs.map(s => s.id === sub.id ? { ...s, avance_pct: newVal } : s);

    // Actualizar mapa de hijos
    setSubpartidasMap(prev => ({ ...prev, [sub.partida_id]: updatedSubs }));

    // Calcular nuevo promedio del padre
    const avgProgress = Math.round(updatedSubs.reduce((acc, s) => acc + (Number(s.avance_pct) || 0), 0) / updatedSubs.length);

    // Actualizar estado de partidas (esto dispara el re-render de la barra padre y el avance global)
    setPartidas(prev => prev.map(p => p.id === sub.partida_id ? { ...p, progreso: avgProgress } : p));

    try {
      await subpartidaService.updateSubpartida(sub.id, { avance_pct: newVal });
      await projectService.updatePartidaProgress(sub.partida_id, avgProgress);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Error al guardar progreso.' });
    }
  };

  // 4. COMPONENTE DE BARRA: Con relleno azul a la izquierda y marcadores
  const ProgressBarWithMarkers = ({ value, onChange, isReadOnly = false }) => {
    const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100);

    return (
      <div className="space-y-2 w-full">
        <div className="relative h-5 flex items-center group/bar">
          {/* Marcadores de hito */}
          <div className="absolute inset-0 flex justify-between items-center px-0.5 pointer-events-none">
            {[0, 25, 50, 75, 100].map(m => (
              <div key={m} className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700 z-10" />
            ))}
          </div>

          {/* Fondo de la barra */}
          <div className="absolute inset-x-0 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Relleno azul animado */}
            <motion.div
              className={cn("h-full shadow-sm", safeValue >= 100 ? 'bg-emerald-500' : 'bg-blue-600')}
              initial={false}
              animate={{ width: `${safeValue}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {!isReadOnly && (
            <>
              <input
                type="range" min="0" max="100" step="1"
                value={safeValue}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="absolute inset-x-0 w-full h-5 opacity-0 cursor-pointer z-20"
              />
              {/* Thumb visual personalizado */}
              <div
                className="absolute w-4.5 h-4.5 bg-blue-600 rounded-full shadow-lg border-2 border-white pointer-events-none z-30 transition-all duration-75"
                style={{ left: `calc(${safeValue}% - 9px)` }}
              />
            </>
          )}
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-bold px-0.5 tabular-nums uppercase">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
      </div>
    );
  };
  const handleDeletePartida = async (id) => {
    if (!window.confirm('¿Eliminar partida y todas sus subpartidas?')) return;
    try {
      console.log(id)
      await projectService.deleteWorkItem(id);
      loadAllData();
      toast({ title: 'Partida eliminada.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la partida.' });
    }
  };

  // Handlers de acciones
  const handleAddSubpartida = (e, partidaId) => { e.stopPropagation(); setActivePartidaIdForSub(partidaId); setSubModalOpen(true); }
  const handleOpenEditSubModal = (e, sub) => { e.stopPropagation(); setEditingSubPartida(sub); setEditSubModalOpen(true); };
  const handleDeleteSubpartida = async (e, id, partidaId) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar subpartida?')) return;
    try {
      await subpartidaService.deleteSubpartida(id);
      loadAllData();
      toast({ title: 'Eliminado' });
    } catch (e) { toast({ variant: 'destructive', title: 'Error' }); }
  };

  const handleAsignarPresupuesto = async (partidaId, monto) => {
    try {
      await projectService.updatePartidaBudget(partidaId, monto);
      loadAllData();
      toast({ title: 'Presupuesto actualizado.' });
    } catch (error) { toast({ variant: 'destructive', title: 'Error' }); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* KPI de Avance Global */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shadow-inner">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Avance Global</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{avanceGlobal}%</h2>
            </div>
          </div>
          <div className="flex-1 w-full max-w-2xl">
            <ProgressBarWithMarkers value={avanceGlobal} isReadOnly={true} />
          </div>
        </div>
      </div>

      {/* Header Unificado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Plan de Obra</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Estructura detallada y ejecución técnica.</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowSelectPlantilla(true)} className="flex-1 sm:flex-none gap-2 rounded-full"><RefreshCw className="w-4 h-4" /> Plantilla</Button>
          <Button onClick={() => { setPartidaToEdit(null); setIsPartidaModalOpen(true); }} className="flex-1 sm:flex-none gap-2 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/20"><Plus className="w-4 h-4" /> Nueva Partida</Button>
        </div>
      </div>

      {/* Tabla de Partidas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-slate-500 font-medium animate-pulse">Sincronizando plan de obra...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {partidas.map((p) => {
              const isExpanded = expandedPartidaId === p.id;
              const subs = subpartidasMap[p.id] || [];
              return (
                <div key={p.id} className="group">
                  <div
                    className={cn(
                      "p-5 flex flex-col lg:flex-row lg:items-center gap-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors",
                      isExpanded && "bg-slate-50/50 dark:bg-slate-800/20"
                    )}
                    onClick={() => toggleExpand(p.id)}
                  >
                    {/* Info de Partida */}
                    <div className="flex items-center gap-4 lg:w-1/4 min-w-0">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 shadow-sm">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 dark:text-white truncate text-base">{p.name}</h4>
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                          {p.sub_items_count || 0} Sub-items
                        </span>
                      </div>
                    </div>

                    {/* Inversión */}
                    <div className="lg:w-[15%] flex flex-col">
                      <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Inversión Total</p>
                      <p className="text-base font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {formatCurrencyARS(p.budget || p.presupuesto)}
                      </p>
                    </div>

                    {/* Barra Padre */}
                    <div className="flex-1 min-w-0">
                      <ProgressBarWithMarkers value={p.progreso} isReadOnly={true} />
                    </div>

                    {/* Acciones */}
                    <div className="flex justify-end gap-2 lg:ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setPartidaForBudget(p); setBudgetModalOpen(true); }}>
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setPartidaToEdit(p); setIsPartidaModalOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-blue-600 bg-blue-50 dark:bg-blue-900/20" onClick={(e) => handleAddSubpartida(e, p.id)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        className="text-red-500"
                        onClick={(e) => {
                          e.stopPropagation(); // Evita que se cierre/abra la fila
                          handleDeletePartida(p.id); // <--- AQUÍ LE PASAS EL ID
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Subpartidas Desplegadas */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800"
                      >
                        <div className="p-4 pl-12 md:pl-24 space-y-3">
                          {subs.length === 0 ? (
                            <div className="text-xs text-slate-400 italic py-4">No hay sub-items registrados.</div>
                          ) : (
                            subs.map(sub => (
                              <div key={sub.id} className="flex flex-col lg:flex-row lg:items-center gap-6 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 transition-all group/sub">
                                <div className="lg:w-1/4">
                                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{sub.nombre}</p>
                                  <p className="text-xs font-mono text-blue-600 font-black mt-1 tabular-nums">{formatCurrencyARS(sub.presupuesto)}</p>
                                </div>
                                <div className="flex-1">
                                  <ProgressBarWithMarkers
                                    value={sub.avance_pct}
                                    onChange={(val) => handleAvanceChange(sub, val)}
                                  />
                                </div>
                                <div className="flex items-center gap-2 border-l pl-4 border-slate-100 dark:border-slate-800 min-w-[80px] justify-end">
                                  <span className="text-xs font-black text-blue-600 mr-2 tabular-nums">{sub.avance_pct}%</span>
                                  <Button variant="ghost" size="iconSm" onClick={(e) => handleOpenEditSubModal(e, sub)}><Edit2 className="w-3.5 h-3.5" /></Button>
                                  <Button variant="ghost" size="iconSm" className="text-red-500" onClick={(e) => handleDeleteSubpartida(e, sub.id, p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

      {/* Modales */}
      <WorkPlanModal
        isOpen={isPartidaModalOpen}
        onClose={() => { setIsPartidaModalOpen(false); setPartidaToEdit(null); loadAllData(); }}
        projectId={projectId}
        item={partidaToEdit}
      />
      <SubpartidaModal isOpen={subModalOpen} onClose={() => setSubModalOpen(false)} partidaId={activePartidaIdForSub} onSuccess={() => loadAllData()} />
      <EditarSubPartidaModal isOpen={editSubModalOpen} onClose={() => setEditSubModalOpen(false)} subPartida={editingSubPartida} onActualizar={() => loadAllData()} />
      <AsignarPresupuestoModal isOpen={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} partida={partidaForBudget} onAsignar={handleAsignarPresupuesto} />
      <SelectPlantillaModal isOpen={showSelectPlantilla} onClose={() => setShowSelectPlantilla(false)} onSuccess={() => loadAllData()} proyectoId={projectId} />
    </div>
  );
};

export default PlanDeObraTab;