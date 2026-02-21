import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { tokens } from '@/lib/designTokens';
import { cn } from '@/lib/utils';

function TaskModal({ isOpen, onClose, onSuccess, taskToEdit = null, preselectedProjectId = null }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    due_date: '',
    status: 'PENDIENTE',
    priority: 'MEDIA'
  });

  useEffect(() => {
    if (isOpen) {
      const fetchCatalogs = async () => {
        setCatalogsLoading(true);
        try {
          const [projectsRes, usersRes] = await Promise.all([
            supabase.from('projects').select('id, name').eq('is_deleted', false).order('name'),
            supabase.from('usuarios').select('id, nombre').order('nombre')
          ]);

          if (projectsRes.error) throw projectsRes.error;
          if (usersRes.error) throw usersRes.error;

          setProjects(projectsRes.data || []);
          setUsers(usersRes.data || []);

          if (taskToEdit) {
            setFormData({
              title: taskToEdit.nombre || '',
              description: taskToEdit.descripcion || '',
              project_id: taskToEdit.proyecto_id || '',
              assigned_to: taskToEdit.asignado_a || '',
              due_date: taskToEdit.fecha_vencimiento || '',
              status: taskToEdit.estado || 'PENDIENTE',
              priority: taskToEdit.prioridad || 'MEDIA'
            });
          } else {
            setFormData({
              title: '',
              description: '',
              project_id: preselectedProjectId || '',
              assigned_to: '',
              due_date: '',
              status: 'PENDIENTE',
              priority: 'MEDIA'
            });
          }
        } catch (error) {
          console.error("Error cargando catálogos:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos.' });
        } finally {
          setCatalogsLoading(false);
        }
      };
      fetchCatalogs();
    }
  }, [isOpen, taskToEdit, preselectedProjectId, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return toast({ variant: 'destructive', title: 'Error', description: 'El título es obligatorio.' });
    }

    setLoading(true);
    try {
      const payload = {
        nombre: formData.title,
        descripcion: formData.description,
        proyecto_id: preselectedProjectId || formData.project_id || null,
        asignado_a: formData.assigned_to || null,
        estado: formData.status,
        prioridad: formData.priority,
        fecha_vencimiento: formData.due_date === '' ? null : formData.due_date,
        fecha_actualizacion: new Date().toISOString()
      };

      let error;
      if (taskToEdit) {
        const { error: updateError } = await supabase.from('tareas').update(payload).eq('id', taskToEdit.id);
        error = updateError;
      } else {
        payload.fecha_creacion = new Date().toISOString();
        const { error: insertError } = await supabase.from('tareas').insert([payload]);
        error = insertError;
      }
      
      if (error) throw error;
      toast({ title: 'Éxito', description: taskToEdit ? 'Tarea actualizada.' : 'Tarea creada correctamente.' });
      onClose(); 
      if (onSuccess) onSuccess(); 
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Clase común para los select y textarea para no repetir código
  const inputClasses = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[700px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {taskToEdit ? 'Editar Tarea' : 'Nueva Tarea'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
              {catalogsLoading ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Cargando personal...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="dark:text-slate-300">Título <span className="text-red-500">*</span></Label>
                    <Input 
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                      value={formData.title} 
                      onChange={(e) => setFormData({...formData, title: e.target.value})} 
                      placeholder="Ej: Revisar presupuesto de obra"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">Responsable</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <select 
                          className={cn(inputClasses, "pl-9 pr-4 py-2 appearance-none")}
                          value={formData.assigned_to}
                          onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                        >
                          <option value="">Seleccionar responsable...</option>
                          {users.map(u => (
                            <option key={u.id} value={u.nombre}>{u.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">Proyecto</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <select 
                          className={cn(inputClasses, "pl-9 pr-4 py-2 appearance-none disabled:opacity-50")}
                          value={formData.project_id}
                          onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                          disabled={!!preselectedProjectId}
                        >
                          <option value="">Sin proyecto (Global)</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label className="dark:text-slate-300">Estado</Label>
                        <select 
                          className={cn(inputClasses, "px-3 py-2")}
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                           <option value="PENDIENTE">Pendiente</option>
                           <option value="EN_CURSO">En curso</option>
                           <option value="FINALIZADA">Finalizada</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <Label className="dark:text-slate-300">Prioridad</Label>
                        <select 
                          className={cn(inputClasses, "px-3 py-2")}
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        >
                           <option value="BAJA">Baja</option>
                           <option value="MEDIA">Media</option>
                           <option value="ALTA">Alta</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <Label className="dark:text-slate-300">Fecha Límite</Label>
                        <Input 
                          type="date" 
                          className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                          value={formData.due_date}
                          onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="dark:text-slate-300">Descripción</Label>
                     <textarea 
                        className={cn(inputClasses, "p-3 min-h-[100px] resize-y")}
                        placeholder="Detalles adicionales..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                     />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
               <Button 
                variant="outline" 
                onClick={onClose} 
                className="rounded-full px-6 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
               >
                Cancelar
               </Button>
               <Button 
                variant="primary" 
                onClick={handleSubmit} 
                loading={loading} 
                className="rounded-full px-8 bg-blue-600 hover:bg-blue-700"
               >
                 {taskToEdit ? 'Guardar Cambios' : 'Crear Tarea'}
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default TaskModal;