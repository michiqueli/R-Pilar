
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Trash2,
  MoreVertical,
  Loader2,
  Calendar
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TaskModal from '@/components/tasks/TaskModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const TareasRapidas = ({ projectId, onTaskChange }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .eq('proyecto_id', projectId)
        .order('fecha_creacion', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas recientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tareas')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Tarea eliminada",
        description: "La tarea se ha eliminado correctamente.",
      });
      
      fetchTasks();
      if (onTaskChange) onTaskChange();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea.",
        variant: "destructive",
      });
    }
  };

  const handleTaskCreated = () => {
    fetchTasks();
    setIsModalOpen(false);
    if (onTaskChange) onTaskChange();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'FINALIZADA':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'EN_CURSO':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'FINALIZADA':
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case 'EN_CURSO':
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default:
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Pendiente';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tareas Recientes</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Últimas actualizaciones</p>
        </div>
        <Button 
          size="sm" 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-sm"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-slate-400">Cargando tareas...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-slate-900 dark:text-white font-medium mb-1">Sin tareas recientes</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-[200px]">
              Crea tu primera tarea para empezar a organizar el trabajo.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-900/20"
            >
              Crear Primera Tarea
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="group p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-1 p-1.5 rounded-full border", getStatusBadgeClass(task.estado))}>
                    {getStatusIcon(task.estado)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-slate-900 dark:text-white truncate pr-2">
                        {task.nombre}
                      </h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {task.descripcion && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {task.descripcion}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", getStatusBadgeClass(task.estado))}>
                        {formatStatus(task.estado)}
                      </span>
                      {task.fecha_vencimiento && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(task.fecha_vencimiento), 'd MMM', { locale: es })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

export default TareasRapidas;
