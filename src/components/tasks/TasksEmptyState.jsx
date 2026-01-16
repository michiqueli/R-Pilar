
import React from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { motion } from 'framer-motion';

const TasksEmptyState = ({ onCreate }) => {
  const { t } = useTheme();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-[12px] border border-gray-200 dark:border-[#374151] bg-white dark:bg-[#111827] shadow-sm p-10 md:p-14 text-center max-w-2xl mx-auto mt-8"
    >
      <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-6 shadow-inner">
        <ClipboardList className="w-10 h-10 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        {t('tasks.noTasks')}
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
        {t('tasks.createFirst')}
      </p>
      
      <Button 
        onClick={onCreate}
        variant="primary"
        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5 h-auto text-sm font-medium"
      >
        <Plus className="w-4 h-4 mr-2" />
        {t('tasks.new')}
      </Button>
    </motion.div>
  );
};

export default TasksEmptyState;
