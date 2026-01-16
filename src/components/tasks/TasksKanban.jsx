
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, MoreVertical, Plus } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/dateUtils';
import { tokens } from '@/lib/designTokens';

const Column = ({ title, status, tasks, color, onEdit, onDelete, onStatusChange }) => {
  const navigate = useNavigate();
  
  // Basic drag handlers - in a real app use dnd-kit or react-beautiful-dnd for better XP
  // Here we simulate with buttons for simplicity & robustness in "no-external-lib" constraints
  
  return (
    <div className="flex-1 min-w-[300px] bg-slate-50/50 rounded-2xl flex flex-col h-full border border-slate-100">
      <div className={`p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 rounded-t-2xl`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-bold text-slate-700">{title}</h3>
          <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">{tasks.length}</span>
        </div>
        <Button variant="ghost" size="iconSm" className="rounded-full text-slate-400">
           <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layoutId={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all group relative"
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
             <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                  task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                  task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}>
                   {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
                {/* Quick Status Move Actions (Simulating DnD) */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                   {status !== 'pending' && (
                     <button 
                       onClick={() => onStatusChange(task, 'pending')}
                       className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[8px]" title="Mover a Pendiente">←</button>
                   )}
                   {status !== 'in_progress' && (
                     <button 
                       onClick={() => onStatusChange(task, 'in_progress')}
                       className="w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center text-[8px]" title="Mover a En Curso">
                         {status === 'pending' ? '→' : '←'}
                       </button>
                   )}
                   {status !== 'done' && (
                     <button 
                       onClick={() => onStatusChange(task, 'done')}
                       className="w-5 h-5 rounded-full bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center text-[8px]" title="Mover a Hecho">→</button>
                   )}
                </div>
             </div>
             
             <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2">{task.title}</h4>
             
             {task.projects && (
                <div className="text-xs text-slate-500 mb-3 bg-slate-50 inline-block px-2 py-1 rounded">
                   {task.projects.name}
                </div>
             )}

             <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                   <Calendar className="w-3.5 h-3.5" />
                   {task.due_date ? formatDate(task.due_date) : '-'}
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                   U
                </div>
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const TasksKanban = ({ tasks, onEdit, onDelete, onStatusChange }) => {
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const progressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-280px)] min-h-[500px]">
      <Column 
        title="Pendiente" 
        status="pending" 
        tasks={pendingTasks} 
        color="bg-slate-400" 
        onEdit={onEdit} 
        onDelete={onDelete} 
        onStatusChange={onStatusChange}
      />
      <Column 
        title="En Curso" 
        status="in_progress" 
        tasks={progressTasks} 
        color="bg-blue-500" 
        onEdit={onEdit} 
        onDelete={onDelete} 
        onStatusChange={onStatusChange}
      />
      <Column 
        title="Hecho" 
        status="done" 
        tasks={doneTasks} 
        color="bg-green-500" 
        onEdit={onEdit} 
        onDelete={onDelete} 
        onStatusChange={onStatusChange}
      />
    </div>
  );
};

export default TasksKanban;
