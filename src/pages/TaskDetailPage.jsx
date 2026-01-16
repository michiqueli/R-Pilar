
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ChevronRight, Calendar, User, Briefcase, CheckCircle, Clock, RotateCcw, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/use-toast';
import { taskService } from '@/services/taskService';
import { formatDate } from '@/lib/dateUtils';
import TaskModal from '@/components/tasks/TaskModal';

function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const data = await taskService.getTaskById(id);
      setTask(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se encontró la tarea.' });
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    try {
       await taskService.updateStatus(task.id, newStatus);
       fetchTask();
       toast({ title: 'Estado actualizado' });
    } catch (e) {
       console.error(e);
    }
  };

  const handleDelete = async () => {
    if(!window.confirm('¿Eliminar tarea permanentemente?')) return;
    try {
      await taskService.deleteTask(task.id);
      toast({ title: 'Tarea eliminada' });
      navigate('/tasks');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando...</div>;
  if (!task) return null;

  return (
    <>
      <Helmet><title>Tarea: {task.title}</title></Helmet>
      
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
         <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center text-sm text-slate-500 mb-4">
               <span className="cursor-pointer hover:text-slate-900" onClick={() => navigate('/tasks')}>Tareas</span>
               <ChevronRight className="w-4 h-4 mx-2" />
               <span className="font-medium text-slate-900">Detalle</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
               {/* Toolbar */}
               <div className="border-b border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-2">
                        <Chip label={task.status === 'pending' ? 'Pendiente' : task.status === 'in_progress' ? 'En curso' : 'Hecho'} variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'primary' : 'default'} />
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                           {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'} Prioridad
                        </span>
                     </div>
                     <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
                  </div>

                  <div className="flex gap-2">
                     {task.status !== 'done' ? (
                        <Button variant="success" className="rounded-full" onClick={() => handleStatusUpdate('done')}>
                           <CheckCircle className="w-4 h-4 mr-2" /> Marcar como Hecho
                        </Button>
                     ) : (
                        <Button variant="outline" className="rounded-full" onClick={() => handleStatusUpdate('pending')}>
                           <RotateCcw className="w-4 h-4 mr-2" /> Reabrir Tarea
                        </Button>
                     )}
                     <Button variant="secondary" size="icon" className="rounded-full" onClick={() => setIsEditOpen(true)}>
                        <Edit className="w-4 h-4" />
                     </Button>
                     <Button variant="ghost" size="icon" className="rounded-full text-red-500 hover:bg-red-50" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
               </div>

               {/* Body */}
               <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                     <div className="prose prose-slate prose-sm max-w-none">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción</h3>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                           {task.description || 'Sin descripción detallada.'}
                        </p>
                     </div>

                     {/* Future comments section placeholder */}
                     <div className="pt-6 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Actividad</h3>
                        <div className="bg-slate-50 p-4 rounded-xl text-center text-sm text-slate-500 italic">
                           Historial de comentarios próximamente...
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
                        <div>
                           <div className="text-xs text-slate-400 font-bold uppercase mb-1">Responsable</div>
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">U</div>
                              <span className="font-medium text-slate-900">Usuario Asignado</span>
                           </div>
                        </div>

                        <div>
                           <div className="text-xs text-slate-400 font-bold uppercase mb-1">Proyecto</div>
                           {task.projects ? (
                              <div className="flex items-center gap-2 text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/projects/${task.projects.id}`)}>
                                 <Briefcase className="w-4 h-4" />
                                 <span className="font-medium">{task.projects.name}</span>
                              </div>
                           ) : (
                              <span className="text-slate-500 italic">Global (Sin proyecto)</span>
                           )}
                        </div>

                        <div>
                           <div className="text-xs text-slate-400 font-bold uppercase mb-1">Vencimiento</div>
                           <div className="flex items-center gap-2 text-slate-700">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">{task.due_date ? formatDate(task.due_date) : 'Sin fecha'}</span>
                           </div>
                        </div>

                        {task.completed_at && (
                           <div>
                              <div className="text-xs text-slate-400 font-bold uppercase mb-1">Completado el</div>
                              <div className="flex items-center gap-2 text-green-700">
                                 <Clock className="w-4 h-4" />
                                 <span className="font-medium">{formatDate(task.completed_at)}</span>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <TaskModal 
         isOpen={isEditOpen}
         onClose={() => setIsEditOpen(false)}
         onSuccess={fetchTask}
         taskToEdit={task}
      />
    </>
  );
}

export default TaskDetailPage;
