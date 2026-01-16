
import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Calendar, User, Briefcase, Eye, Edit, Trash2 } from 'lucide-react';
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

const TasksList = ({ tasks, loading, onEdit, onDelete, onStatusChange }) => {
  const { t } = useTheme();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-[12px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111827] rounded-[12px] border border-gray-200 dark:border-[#374151] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#374151] bg-gray-50/50 dark:bg-[#1F2937]/50">
              <th className="py-4 px-6 w-12 text-center">
                <span className="sr-only">Check</span>
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">
                {t('tasks.task')}
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                {t('tasks.project')}
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                {t('tasks.responsible')}
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                {t('tasks.dueDate')}
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('common.status')}
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                {t('tasks.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#374151]">
            {tasks.map((task, index) => {
              const status = STATUS_CONFIG[task.status] || STATUS_CONFIG['pending'];
              
              return (
                <motion.tr
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="group hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-all duration-150 ease-out hover:shadow-md dark:hover:shadow-md hover:-translate-y-0.5 relative z-0 hover:z-10 bg-white dark:bg-[#111827]"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={task.status === 'done'} 
                      onCheckedChange={() => onStatusChange(task, task.status === 'done' ? 'pending' : 'done')}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="py-4 px-6 cursor-pointer">
                    <div className={cn(
                      "font-semibold text-[16px] text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors",
                      task.status === 'done' && "line-through text-gray-400 dark:text-gray-500"
                    )}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[240px] mt-1 font-normal">
                        {task.description}
                      </div>
                    )}
                  </td>
                  
                  <td className="py-4 px-6 hidden md:table-cell">
                    {task.projects ? (
                       <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate max-w-[150px] font-medium">{task.projects.name}</span>
                       </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">-</span>
                    )}
                  </td>
                  
                  <td className="py-4 px-6 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
                          U
                       </div>
                       <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Usuario</span>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 hidden sm:table-cell">
                    {task.due_date ? (
                      <div className={cn(
                        "flex items-center gap-2 text-sm",
                        new Date(task.due_date) < new Date() && task.status !== 'done' 
                          ? "text-red-600 dark:text-red-400 font-medium" 
                          : "text-gray-500 dark:text-gray-400"
                      )}>
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        <span>{formatDate(task.due_date)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">-</span>
                    )}
                  </td>
                  
                  <td className="py-4 px-6">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                      status.color
                    )}>
                      {t(status.labelKey)}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 h-8 w-8 transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-[12px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-1">
                        <DropdownMenuItem onClick={() => navigate(`/tasks/${task.id}`)} className="rounded-[8px] cursor-pointer">
                          <Eye className="w-4 h-4 mr-2 text-gray-500" /> {t('common.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(task)} className="rounded-[8px] cursor-pointer">
                          <Edit className="w-4 h-4 mr-2 text-gray-500" /> {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                        <DropdownMenuItem 
                          onClick={() => onDelete(task)} 
                          className="rounded-[8px] cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
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
    </div>
  );
};

export default TasksList;
