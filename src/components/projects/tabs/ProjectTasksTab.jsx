
import React, { useState, useEffect } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import TasksTable from '@/components/tasks/TasksTable';
import TaskModal from '@/components/tasks/TaskModal';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const ProjectTasksTab = ({ projectId }) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to fetch tasks for this project
  const fetchTasks = async () => {
    if (!projectId) return;
    setLoading(true);
    console.log(`📥 [ProjectTasksTab] Fetching tasks for project ${projectId}...`);
    
    try {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .eq('proyecto_id', projectId)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ [ProjectTasksTab] Loaded ${data?.length} tasks.`);
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

  const handleEdit = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleTaskSuccess = () => {
    setRefreshKey(prev => prev + 1); // Trigger reload
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
         <div>
            <h3 className="text-lg font-bold text-slate-800">Tareas del Proyecto</h3>
            <p className="text-sm text-slate-500">Gestiona el avance de las tareas asociadas.</p>
         </div>

         <div className="flex gap-2">
            <Button 
               variant="default" 
               size="sm" 
               className="rounded-full bg-blue-600 hover:bg-blue-700 text-white" 
               onClick={() => { setTaskToEdit(null); setIsModalOpen(true); }}
            >
               <Plus className="w-4 h-4 mr-2" /> Nueva Tarea
            </Button>
         </div>
      </div>

      {/* The Smart Table */}
      <TasksTable 
        tasks={tasks} 
        proyectoId={projectId}
        onReload={fetchTasks}
        onEdit={handleEdit}
        showProjectColumn={false}
      />

      {/* Modal */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTaskSuccess}
        taskToEdit={taskToEdit}
        preselectedProjectId={projectId}
      />
    </div>
  );
};

export default ProjectTasksTab;
