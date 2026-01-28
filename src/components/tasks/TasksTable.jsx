import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  User,
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
import KpiCard from '@/components/ui/KpiCard';
import TablePaginationBar from '@/components/common/TablePaginationBar';

const TasksTable = ({ 
  tasks: initialTasks = [], 
  proyectoId, 
  onReload,
  showProjectColumn = false,
  onEdit,
  externalFilter = 'TODAS' // Recibimos el filtro del padre
}) => {
  const { toast } = useToast();
  
  const [localTasks, setLocalTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadTareas = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      let query = supabase
        .from('tareas')
        .select(`*, projects:proyecto_id ( name )`)
        .order('fecha_creacion', { ascending: false });

      if (proyectoId) query = query.eq('proyecto_id', proyectoId);

      const { data, error } = await query;
      if (error) throw error;
      setLocalTasks(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [proyectoId, toast]);

  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setLocalTasks(initialTasks);
    } else {
      loadTareas();
    }
  }, [proyectoId, initialTasks, loadTareas]);

  // CORRECCIÓN: Filtrado reactivo basado en externalFilter
  const filteredTasks = useMemo(() => {
    if (!externalFilter || externalFilter === 'TODAS') return localTasks;
    return localTasks.filter(task => task.estado === externalFilter);
  }, [localTasks, externalFilter]);

  // CORRECCIÓN: Resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setPage(1);
  }, [externalFilter]);

  const totalItems = filteredTasks.length;
  const paginatedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

  const counts = useMemo(() => ({
    total: localTasks.length,
    pendientes: localTasks.filter(t => t.estado === 'PENDIENTE').length,
    en_curso: localTasks.filter(t => t.estado === 'EN_CURSO').length,
    finalizadas: localTasks.filter(t => t.estado === 'FINALIZADA').length,
  }), [localTasks]);

  // Handlers (handleChangeEstado, handleDelete, etc. se mantienen igual...)
  const handleChangeEstado = async (tareaId, nuevoEstado) => {
    setUpdatingId(tareaId);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('tareas')
        .update({ estado: nuevoEstado, fecha_actualizacion: now })
        .eq('id', tareaId);

      if (error) throw error;

      setLocalTasks(prev => prev.map(t => t.id === tareaId ? { ...t, estado: nuevoEstado, fecha_actualizacion: now } : t));
      toast({ title: "Actualizado", description: `Tarea en estado ${nuevoEstado.toLowerCase()}` });
      if (onReload) onReload();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar." });
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
    if (!window.confirm("¿Eliminar tarea?")) return;
    setUpdatingId(tareaId);
    try {
      const { error } = await supabase.from('tareas').delete().eq('id', tareaId);
      if (error) throw error;
      setLocalTasks(prev => prev.filter(t => t.id !== tareaId));
      if (onReload) onReload();
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setUpdatingId(null);
    }
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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Tareas" value={counts.total} icon={ListTodo} tone="slate" />
        <KpiCard title="Pendientes" value={counts.pendientes} icon={Clock} tone="amber" />
        <KpiCard title="En Curso" value={counts.en_curso} icon={RefreshCw} tone="blue" />
        <KpiCard title="Finalizadas" value={counts.finalizadas} icon={CheckCircle} tone="emerald" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading && localTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex justify-center items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>{externalFilter === 'TODAS' ? 'No hay tareas.' : `No hay tareas ${externalFilter.toLowerCase()}.`}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">✓</th>
                  <th className="py-3 px-4">Tarea</th>
                  {showProjectColumn && <th className="py-3 px-4">Proyecto</th>}
                  <th className="py-3 px-4">Asignado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Vence</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.map((task) => {
                  const isCompleted = task.estado === 'FINALIZADA';
                  return (
                    <tr key={task.id} className={cn("hover:bg-slate-50/80 transition-colors group", updatingId === task.id && "opacity-50 pointer-events-none")}>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleToggleFinalizada(task)} className="focus:outline-none hover:scale-110 transition-transform">
                          {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className={cn("font-medium text-slate-900", isCompleted && "line-through text-slate-400")}>{task.nombre}</div>
                        {task.descripcion && <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{task.descripcion}</div>}
                      </td>
                      {showProjectColumn && <td className="py-3 px-4 text-slate-600">{task.projects?.name || '-'}</td>}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 border border-blue-100">
                             {task.asignado_a ? task.asignado_a.charAt(0).toUpperCase() : '?'}
                           </div>
                           <span className="text-slate-600 text-xs">{task.asignado_a || 'Sin asignar'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={task.estado}
                          onChange={(e) => handleChangeEstado(task.id, e.target.value)}
                          className={cn("appearance-none px-2 py-1 rounded-md text-[10px] font-bold border cursor-pointer focus:outline-none uppercase", getStatusColor(task.estado))}
                        >
                          <option value="PENDIENTE">⏳ Pendiente</option>
                          <option value="EN_CURSO">🔄 En Curso</option>
                          <option value="FINALIZADA">✅ Finalizada</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                        {task.fecha_vencimiento ? formatDate(task.fecha_vencimiento) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="iconSm" onClick={() => onEdit && onEdit(task)} className="h-7 w-7 text-slate-400 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="iconSm" onClick={() => handleDelete(task.id)} className="h-7 w-7 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></Button>
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

      {!loading && totalItems > 0 && (
        <TablePaginationBar
          page={page} pageSize={pageSize} totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(1); }}
          labels={{ showing: 'Mostrando', of: 'de', rowsPerPage: 'Filas:', previous: 'Ant.', next: 'Sig.' }}
        />
      )}
    </div>
  );
};

export default TasksTable;