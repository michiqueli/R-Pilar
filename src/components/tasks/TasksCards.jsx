
import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Calendar, Briefcase, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

const STATUS_CONFIG = {
  'pending': { color: 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400', labelKey: 'tasks.pending' },
  'in_progress': { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400', labelKey: 'tasks.inProgress' },
  'done': { color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400', labelKey: 'tasks.done' }
};

const TasksCards = ({ tasks, loading, onEdit, onDelete, onStatusChange }) => {
  const { t } = useTheme();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-[12px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tasks.map((task, index) => {
        const status = STATUS_CONFIG[task.status] || STATUS_CONFIG['pending'];

        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="group"
          >
            <div 
              className="relative bg-white dark:bg-[#111827] rounded-[12px] border border-gray-200 dark:border-[#374151] shadow-sm p-4 transition-all duration-150 ease-out hover:shadow-md dark:hover:shadow-md hover:-translate-y-0.5 cursor-pointer h-full flex flex-col"
              onClick={() => navigate(`/tasks/${task.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <Checkbox 
                  checked={task.status === 'done'} 
                  onCheckedChange={() => onStatusChange(task, task.status === 'done' ? 'pending' : 'done')}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-gray-300 dark:border-gray-600"
                />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="iconSm" 
                      className="rounded-full -mr-2 -mt-2 hover:bg-gray-100 dark:hover:bg-gray-800 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-[12px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-1">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${task.id}`); }} className="rounded-[8px]">
                      <Eye className="w-4 h-4 mr-2" /> {t('common.view')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="rounded-[8px]">
                      <Edit className="w-4 h-4 mr-2" /> {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(task); }} className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-[8px]">
                      <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 mb-4 pl-1">
                <h3 className={cn(
                  "font-semibold text-[16px] text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2",
                  task.status === 'done' && "line-through text-gray-400 dark:text-gray-500"
                )}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 font-normal">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-[#374151]">
                 <div className="flex items-center justify-between">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                      status.color
                    )}>
                      {t(status.labelKey)}
                    </span>
                    
                    {task.due_date && (
                      <div className={cn(
                        "flex items-center gap-1.5 text-xs",
                        new Date(task.due_date) < new Date() && task.status !== 'done' 
                          ? "text-red-600 dark:text-red-400 font-medium" 
                          : "text-gray-400 dark:text-gray-500"
                      )}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(task.due_date)}</span>
                      </div>
                    )}
                 </div>
                 
                 {task.projects && (
                   <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{task.projects.name}</span>
                   </div>
                 )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TasksCards;
