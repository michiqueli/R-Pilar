
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

const TasksCalendar = ({ tasks }) => {
  // Hooks must be called at the top level
  const navigate = useNavigate();
  const { t } = useTheme();
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const startDay = startOfMonth.getDay(); // 0 is Sunday

  const weekDays = [
    t('common.days.sun') || 'Dom', 
    t('common.days.mon') || 'Lun', 
    t('common.days.tue') || 'Mar', 
    t('common.days.wed') || 'Mié', 
    t('common.days.thu') || 'Jue', 
    t('common.days.fri') || 'Vie', 
    t('common.days.sat') || 'Sáb'
  ];

  // Generate empty slots for previous month
  const emptySlots = Array.from({ length: startDay }).map((_, i) => (
    <div key={`empty-${i}`} className="h-32 bg-gray-50/30 dark:bg-gray-900/10 border border-gray-100 dark:border-[#374151]"></div>
  ));

  // Generate days of current month
  const monthDays = Array.from({ length: daysInMonth }).map((_, index) => {
    const i = index + 1;
    const dateStr = new Date(today.getFullYear(), today.getMonth(), i).toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.due_date === dateStr);
    const isToday = i === today.getDate();

    return (
      <div key={`day-${i}`} className="min-h-[120px] bg-white dark:bg-[#111827] border border-gray-100 dark:border-[#374151] p-2 hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors group relative">
         <span className={cn(
            "text-sm font-semibold mb-2 block w-7 h-7 rounded-full flex items-center justify-center transition-all",
            isToday 
              ? "bg-blue-600 text-white shadow-md" 
              : "text-gray-700 dark:text-gray-300"
         )}>
            {i}
         </span>
         
         <div className="space-y-1.5">
            {dayTasks.map(task => {
               const statusStyle = task.status === 'done' 
                 ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 line-through opacity-70' 
                 : task.status === 'in_progress'
                 ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                 : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
               
               return (
                 <div 
                   key={task.id}
                   onClick={() => navigate(`/tasks/${task.id}`)}
                   className={cn(
                      "text-[10px] px-2 py-1 rounded-[6px] border cursor-pointer truncate font-medium transition-all hover:scale-[1.02]",
                      statusStyle
                   )}
                   title={task.title}
                 >
                    {task.title}
                 </div>
               );
            })}
            {dayTasks.length > 3 && (
               <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-medium py-1">+ {dayTasks.length - 3} más</div>
            )}
         </div>
      </div>
    );
  });

  return (
    <div className="border border-gray-200 dark:border-[#374151] rounded-[12px] overflow-hidden shadow-sm bg-white dark:bg-[#111827]">
       {/* Header */}
       <div className="bg-white dark:bg-[#111827] p-4 flex items-center justify-between border-b border-gray-200 dark:border-[#374151]">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize">
             {today.toLocaleString(t('locale') || 'es-ES', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
             <Button variant="ghost" size="iconSm" disabled className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeft className="w-4 h-4" /></Button>
             <Button variant="ghost" size="iconSm" disabled className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronRight className="w-4 h-4" /></Button>
          </div>
       </div>

       {/* Grid */}
       <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 text-center py-3 border-b border-gray-200 dark:border-[#374151]">
          {weekDays.map(d => (
             <div key={d} className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
       </div>
       <div className="grid grid-cols-7 bg-gray-100 dark:bg-[#374151] gap-px border-b border-gray-200 dark:border-[#374151]">
          {emptySlots}
          {monthDays}
       </div>
    </div>
  );
};

export default TasksCalendar;
