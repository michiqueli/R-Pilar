import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/customSupabaseClient'; // Importamos Supabase
import TasksTable from '@/components/tasks/TasksTable';
import TaskModal from '@/components/tasks/TaskModal';
import usePageTitle from '@/hooks/usePageTitle';
import SearchBar from '@/components/common/SearchBar'; // Reutilizamos SearchBar

function TasksPage() {
  const { t } = useTranslation();
  usePageTitle(t('tasks.title'));
  const { toast } = useToast();

  // -- Data State --
  const [totalTasks, setTotalTasks] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // -- Fetch Total Count (Para el contador dinámico) --
  const fetchTotalTasks = async () => {
    try {
      const { count, error } = await supabase
        .from('tareas')
        .select('*', { count: 'exact', head: true })

      if (error) throw error;
      setTotalTasks(count || 0);
    } catch (error) {
      console.error("Error fetching tasks count:", error);
    }
  };

  useEffect(() => {
    fetchTotalTasks();
  }, [refreshKey]);

  const handleEdit = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchTotalTasks();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] transition-colors duration-200 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* 1. Header Section - Contador dinámico */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-white leading-tight">
              {t('tasks.title')}
            </h1>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full font-bold shadow-sm">
              {totalTasks}
            </span>
          </div>

          <Button
            variant="primary"
            onClick={() => { setTaskToEdit(null); setIsModalOpen(true); }}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 h-11"
          >
            <Plus className="w-4 h-4 mr-2" /> {t('tasks.new')}
          </Button>
        </div>

        {/* 2. Barra de Control Unificada (Igual a Clientes/Proveedores) */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-2">
          <div className="w-full md:flex-1 relative">
            <SearchBar 
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t('tasks.search') || 'Buscar tareas...'}
              className="w-full border-none shadow-none bg-transparent"
            />
          </div>
        </div>

        {/* 3. Tabla de Tareas */}
        <TasksTable
          key={refreshKey}
          searchTerm={searchTerm} // Pasamos el search term para filtrar dentro de la tabla
          onEdit={handleEdit}
          onReload={handleSuccess}
          showProjectColumn={true}
        />
      </motion.div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}

export default TasksPage;