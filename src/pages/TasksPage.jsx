
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
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <Briefcase className="w-6 h-6 text-blue-600" />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-slate-900">{t('tasks.title')}</h1>
               <p className="text-slate-500 text-sm">{t('tasks.subtitle')}</p>
             </div>
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
