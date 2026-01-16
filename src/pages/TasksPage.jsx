
import React, { useState } from 'react';
import { Plus, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/contexts/LanguageContext';
import TasksTable from '@/components/tasks/TasksTable';
import TaskModal from '@/components/tasks/TaskModal';
import usePageTitle from '@/hooks/usePageTitle';

function TasksPage() {
  const { t } = useTranslation();
  usePageTitle(t('tasks.title'));
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-50/50 dark:bg-[#111827] transition-colors duration-200 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-white flex items-center gap-3">{t('tasks.title')}
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full font-bold align-middle translate-y-[-2px]">
                5
              </span>
            </h1>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => { setTaskToEdit(null); setIsModalOpen(true); }}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> {t('tasks.new')}
            </Button>
          </div>
        </div>

        <TasksTable
          key={refreshKey}
          onEdit={handleEdit}
          onReload={handleSuccess}
          showProjectColumn={true}
        />
      </div>

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
