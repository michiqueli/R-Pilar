import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import TasksTable from '@/components/tasks/TasksTable';
import TaskModal from '@/components/tasks/TaskModal';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';

const ProjectTasksTab = ({ projectId }) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // NUEVO: Estado del filtro elevado al padre
  const [activeFilter, setActiveFilter] = useState('TODAS');

  const fetchTasks = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .eq('proyecto_id', projectId)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (e) {
      console.error("Error loading tasks:", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las tareas.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId, refreshKey]);

  // Cálculo de contadores para los botones del header
  const counts = useMemo(() => ({
    TODAS: tasks.length,
    PENDIENTE: tasks.filter(t => t.estado === 'PENDIENTE').length,
    EN_CURSO: tasks.filter(t => t.estado === 'EN_CURSO').length,
    FINALIZADA: tasks.filter(t => t.estado === 'FINALIZADA').length,
  }), [tasks]);

  const handleEdit = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleTaskSuccess = () => {
    setIsModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header unificado con filtros y botón de acción */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
               <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-none mb-1">Tareas del Proyecto</h3>
              <p className="text-sm text-slate-500">Gestión de avance y prioridades.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* GRUPO DE FILTROS (Estilo Selector de Segmentos) */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
              {['TODAS', 'PENDIENTE', 'EN_CURSO', 'FINALIZADA'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all whitespace-nowrap flex items-center gap-2",
                    activeFilter === f 
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {f.replace('_', ' ')}
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-md text-[9px]",
                    activeFilter === f ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500"
                  )}>
                    {counts[f]}
                  </span>
                </button>
              ))}
            </div>

            {/* BOTÓN DE ACCIÓN PRINCIPAL */}
            <Button 
                variant="default" 
                size="sm" 
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-500/20 h-9" 
                onClick={() => { setTaskToEdit(null); setIsModalOpen(true); }}
            >
               <Plus className="w-4 h-4" /> Nueva Tarea
            </Button>
          </div>
      </div>

      {/* Tabla con filtro controlado desde afuera */}
      <TasksTable 
        tasks={tasks} 
        proyectoId={projectId}
        onReload={fetchTasks}
        onEdit={handleEdit}
        showProjectColumn={false}
        externalFilter={activeFilter} // Pasamos el filtro seleccionado
      />

      {/* Modal */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTaskSuccess}
        taskToEdit={taskToEdit}
        preselectedProjectId={projectId}
        fetchTasks={fetchTasks}
      />
    </div>
  );
};

export default ProjectTasksTab;