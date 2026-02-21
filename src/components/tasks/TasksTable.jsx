import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  ListTodo,
  Clock,
  CheckCircle,
  RefreshCw,
  MoreHorizontal,
  Edit
} from 'lucide-react';
import { motion } from 'framer-motion'; // Añadido para consistencia
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';
import { Button } from '@/components/ui/Button';
import KpiCard from '@/components/ui/KpiCard';
import TablePaginationBar from '@/components/common/TablePaginationBar';
import { Chip } from '@/components/ui/Chip'; // Usamos Chip como en proyectos
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TasksTable = ({ 
  tasks: initialTasks = [], 
  proyectoId, 
  onReload,
  showProjectColumn = false,
  onEdit,
  externalFilter = 'TODAS'
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

  const filteredTasks = useMemo(() => {
    if (!externalFilter || externalFilter === 'TODAS') return localTasks;
    return localTasks.filter(task => task.estado === externalFilter);
  }, [localTasks, externalFilter]);

  useEffect(() => { setPage(1); }, [externalFilter]);

  const totalItems = filteredTasks.length;
  const paginatedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

  const counts = useMemo(() => ({
    total: localTasks.length,
    pendientes: localTasks.filter(t => t.estado === 'PENDIENTE').length,
    en_curso: localTasks.filter(t => t.estado === 'EN_CURSO').length,
    finalizadas: localTasks.filter(t => t.estado === 'FINALIZADA').length,
  }), [localTasks]);

  const handleChangeEstado = async (tareaId, nuevoEstado) => {
    setUpdatingId(tareaId);
    const previousTasks = [...localTasks];
    try {
      const now = new Date().toISOString();
      setLocalTasks(prev => prev.map(t => 
        t.id === tareaId ? { ...t, estado: nuevoEstado, fecha_actualizacion: now } : t
      ));
      const { error } = await supabase
        .from('tareas')
        .update({ estado: nuevoEstado, fecha_actualizacion: now })
        .eq('id', tareaId);
      if (error) throw error;
      toast({ title: "Actualizado", description: `Tarea en estado ${nuevoEstado.toLowerCase()}` });
    } catch (error) {
      setLocalTasks(previousTasks);
      toast({ variant: "destructive", title: "Error", description: "No se pudo sincronizar." });
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

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Tareas" value={counts.total} icon={ListTodo} tone="slate" />
        <KpiCard title="Pendientes" value={counts.pendientes} icon={Clock} tone="amber" />
        <KpiCard title="En Curso" value={counts.en_curso} icon={RefreshCw} tone="blue" />
        <KpiCard title="Finalizadas" value={counts.finalizadas} icon={CheckCircle} tone="emerald" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading && localTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex justify-center items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>{externalFilter === 'TODAS' ? 'No hay tareas.' : `No hay tareas ${externalFilter.toLowerCase()}.`}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6 w-12 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">✓</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarea</th>
                  {showProjectColumn && <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto</th>}
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Responsable</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTasks.map((task, index) => {
                  const isCompleted = task.estado === 'FINALIZADA';
                  return (
                    <motion.tr 
                      key={task.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "group transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                        updatingId === task.id && "opacity-50 pointer-events-none"
                      )}
                    >
                      <td className="py-4 px-6 text-center">
                        <button onClick={() => handleToggleFinalizada(task)} className="focus:outline-none hover:scale-110 transition-transform">
                          {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className={cn(
                          "font-semibold text-sm transition-colors",
                          isCompleted ? "line-through text-slate-400" : "text-slate-900 dark:text-white"
                        )}>
                          {task.nombre}
                        </div>
                        {task.descripcion && <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{task.descripcion}</div>}
                      </td>
                      {showProjectColumn && (
                        <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                          {task.projects?.name || '-'}
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                            {task.asignado_a ? task.asignado_a.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="text-slate-600 dark:text-slate-400 text-sm">{task.asignado_a || 'Sin asignar'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                         <select
                          value={task.estado}
                          onChange={(e) => handleChangeEstado(task.id, e.target.value)}
                          className={cn(
                            "appearance-none px-3 py-1 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none uppercase transition-colors",
                            task.estado === 'PENDIENTE' && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                            task.estado === 'EN_CURSO' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                            task.estado === 'FINALIZADA' && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
                          )}
                        >
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="EN_CURSO">EN CURSO</option>
                          <option value="FINALIZADA">FINALIZADA</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                        {task.fecha_vencimiento ? formatDate(task.fecha_vencimiento) : '-'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="iconSm" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:bg-slate-800 rounded-full">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit && onEdit(task)}>
                              <Edit className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
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
        />
      )}
    </div>
  );
};

export default TasksTable;