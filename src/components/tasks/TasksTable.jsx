import React, { useState, useEffect, useCallback } from 'react';
import { 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Calendar, 
  User,
  Briefcase,
  ListTodo,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';
import { Button } from '@/components/ui/Button';
import KpiCard from '@/components/ui/KpiCard'; // Importamos tu nuevo componente

const TasksTable = ({ 
  tasks: initialTasks = [], 
  proyectoId, 
  onReload,
  showProjectColumn = false,
  onEdit 
}) => {
  const { toast } = useToast();
  
  // State Management
  const [localTasks, setLocalTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('TODAS');

  // Función para cargar tareas desde DB optimizada con useCallback
  const loadTareas = useCallback(async () => {
    // Si ya estamos cargando, no repetir
    if (loading) return;

    console.log(`[TasksTable] Cargando tareas... Project Filter: ${proyectoId || 'None'}`);
    setLoading(true);
    
    try {
      let query = supabase
        .from('tareas')
        .select(`
          *,
          projects:proyecto_id ( name )
        `)
        .order('fecha_creacion', { ascending: false });

      if (proyectoId) {
        query = query.eq('proyecto_id', proyectoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setLocalTasks(data || []);
    } catch (error) {
      console.error("[TasksTable] Error:", error);
      toast({
        variant: "destructive",
        title: "Error al cargar tareas",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [proyectoId, toast]); // Solo se redefine si cambia proyectoId

  // Sincronización corregida: Solo sincroniza si initialTasks tiene contenido, 
  // de lo contrario carga de la DB una sola vez.
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setLocalTasks(initialTasks);
    } else {
      loadTareas();
    }
    // Eliminamos initialTasks de las dependencias para evitar el bucle infinito 
    // provocado por referencias de arrays nuevas en cada render del padre.
  }, [proyectoId, loadTareas]); 

  // Handle status change
  const handleChangeEstado = async (tareaId, nuevoEstado) => {
    setUpdatingId(tareaId);
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('tareas')
        .update({ 
          estado: nuevoEstado,
          fecha_actualizacion: now
        })
        .eq('id', tareaId)
        .select()
        .single();

      if (error) throw error;

      setLocalTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === tareaId ? { ...task, estado: nuevoEstado, fecha_actualizacion: now } : task
        )
      );

      toast({
        title: "Estado actualizado",
        description: `Tarea marcada como ${nuevoEstado.replace('_', ' ').toLowerCase()}`,
      });
      
      if (onReload) onReload();
    } catch (error) {
      console.error("[handleChangeEstado] Exception:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "No se pudo cambiar el estado."
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleFinalizada = async (tarea) => {
    if (updatingId) return;
    const nuevoEstado = tarea.estado === 'FINALIZADA' ? 'EN_CURSO' : 'FINALIZADA';
    await handleChangeEstado(tarea.id, nuevoEstado);
  };

  const handleDelete = async (tareaId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;
    setUpdatingId(tareaId);
    try {
      const { error } = await supabase.from('tareas').delete().eq('id', tareaId);
      if (error) throw error;
      setLocalTasks(prev => prev.filter(t => t.id !== tareaId));
      toast({ title: "Tarea eliminada correctamente" });
      if (onReload) onReload();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar." });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTasks = localTasks.filter(task => {
    if (filter === 'TODAS') return true;
    return task.estado === filter;
  });

  const counts = {
    total: localTasks.length,
    pendientes: localTasks.filter(t => t.estado === 'PENDIENTE').length,
    en_curso: localTasks.filter(t => t.estado === 'EN_CURSO').length,
    finalizadas: localTasks.filter(t => t.estado === 'FINALIZADA').length,
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'EN_CURSO': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FINALIZADA': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Summary - USANDO KPICARD ESTANDARIZADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Tareas" 
          value={counts.total} 
          icon={ListTodo} 
          tone="slate" 
        />
        <KpiCard 
          title="Pendientes" 
          value={counts.pendientes} 
          icon={Clock} 
          tone="amber" 
        />
        <KpiCard 
          title="En Curso" 
          value={counts.en_curso} 
          icon={RefreshCw} 
          tone="blue" 
        />
        <KpiCard 
          title="Finalizadas" 
          value={counts.finalizadas} 
          icon={CheckCircle} 
          tone="emerald" 
        />
      </div>

      {/* Filters Buttons */}
      <div className="flex flex-wrap gap-2 pb-2">
        {['TODAS', 'PENDIENTE', 'EN_CURSO', 'FINALIZADA'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border",
              filter === f 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {f.charAt(0) + f.slice(1).toLowerCase().replace('_', ' ')}
            <span className="ml-2 opacity-70 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
               {f === 'TODAS' ? counts.total : 
                f === 'PENDIENTE' ? counts.pendientes :
                f === 'EN_CURSO' ? counts.en_curso : counts.finalizadas}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading && localTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex justify-center items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando tareas...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {filter === 'TODAS' ? 'No hay tareas registradas.' : 'No hay tareas con este estado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">✓</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Tarea</th>
                  {showProjectColumn && <th className="py-3 px-4 font-semibold text-slate-700">Proyecto</th>}
                  <th className="py-3 px-4 font-semibold text-slate-700">Asignado</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Estado</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Vence</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const isCompleted = task.estado === 'FINALIZADA';
                  const isUpdating = updatingId === task.id;

                  return (
                    <tr 
                      key={task.id} 
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors group",
                        isUpdating ? "opacity-50 pointer-events-none" : ""
                      )}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleFinalizada(task)}
                          disabled={isUpdating}
                          className="focus:outline-none hover:scale-110 transition-transform"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-blue-500" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className={cn("font-medium text-slate-900", isCompleted && "line-through text-slate-400")}>
                          {task.nombre}
                        </div>
                        {task.descripcion && (
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">
                            {task.descripcion}
                          </div>
                        )}
                      </td>
                      {showProjectColumn && (
                        <td className="py-3 px-4 text-slate-600">
                           {task.projects?.name || '-'}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                             {task.asignado_a ? task.asignado_a.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                           </div>
                           <span className="text-slate-600 truncate max-w-[100px]">{task.asignado_a || 'Sin asignar'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <select
                            value={task.estado}
                            onChange={(e) => handleChangeEstado(task.id, e.target.value)}
                            disabled={isUpdating}
                            className={cn(
                              "appearance-none pl-2 pr-8 py-1 rounded-md text-xs font-semibold border cursor-pointer focus:outline-none",
                              getStatusColor(task.estado)
                            )}
                          >
                            <option value="PENDIENTE">⏳ Pendiente</option>
                            <option value="EN_CURSO">🔄 En Curso</option>
                            <option value="FINALIZADA">✅ Finalizada</option>
                          </select>
                          {isUpdating && <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-1.5 text-slate-400" />}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs font-mono">
                        {task.fecha_vencimiento ? formatDate(task.fecha_vencimiento) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="iconSm" 
                            onClick={() => onEdit && onEdit(task)}
                            className="h-8 w-8 text-slate-400 hover:text-blue-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="iconSm"
                            onClick={() => handleDelete(task.id)}
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksTable;