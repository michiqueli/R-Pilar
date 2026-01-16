
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { tokens } from '@/lib/designTokens';

const MOCK_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Usuario Actual (Yo)' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Juan Pérez' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Maria Gonzalez' },
];

function TaskModal({ isOpen, onClose, onSuccess, taskToEdit = null, preselectedProjectId = null }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  
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
      console.log("[TaskModal] Opened. Preselected Project ID:", preselectedProjectId);
      fetchProjects();
      
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
          assigned_to: MOCK_USERS[0].id,
          due_date: '',
          status: 'PENDIENTE',
          priority: 'MEDIA'
        });
      }
    }
  }, [isOpen, taskToEdit, preselectedProjectId]);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name').eq('is_deleted', false).order('name');
    setProjects(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      return toast({ variant: 'destructive', title: 'Error', description: 'El título es obligatorio.' });
    }
    
    // If we are in project context, ensure project_id is set
    if (preselectedProjectId && formData.project_id !== preselectedProjectId) {
       console.warn("[TaskModal] Project ID mismatch corrected manually.");
       formData.project_id = preselectedProjectId;
    }

    setLoading(true);
    
    try {
      const payload = {
        nombre: formData.title,
        descripcion: formData.description,
        proyecto_id: formData.project_id || null,
        asignado_a: formData.assigned_to,
        estado: formData.status,
        prioridad: formData.priority,
        fecha_vencimiento: formData.due_date === '' ? null : formData.due_date,
        fecha_actualizacion: new Date().toISOString()
      };

      if (taskToEdit) {
        console.log("[TaskModal] Updating task:", taskToEdit.id, payload);
        const { error } = await supabase
          .from('tareas')
          .update(payload)
          .eq('id', taskToEdit.id);
          
        if (error) throw error;
        toast({ title: 'Éxito', description: 'Tarea actualizada correctamente.' });
      } else {
        // Create new
        payload.fecha_creacion = new Date().toISOString();
        console.log("[TaskModal] Creating new task with payload:", payload);
        
        const { error } = await supabase
          .from('tareas')
          .insert([payload]);
          
        if (error) throw error;
        toast({ title: 'Éxito', description: 'Tarea creada correctamente.' });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("[TaskModal] Error saving task:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo guardar la tarea.' });
    } finally {
      setLoading(false);
    }
  };

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
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6 bg-slate-50/50">
              <div className="space-y-2">
                 <Label>Título <span className="text-red-500">*</span></Label>
                 <Input 
                   value={formData.title} 
                   onChange={(e) => setFormData({...formData, title: e.target.value})} 
                   placeholder="Ej: Revisar presupuesto de obra"
                   autoFocus
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label>Responsable</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <select 
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                      >
                         <option value="">Seleccionar responsable...</option>
                         {MOCK_USERS.map(u => (
                           <option key={u.id} value={u.id}>{u.name}</option>
                         ))}
                      </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label>Proyecto</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <select 
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        value={formData.project_id}
                        onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                        disabled={!!preselectedProjectId} // Disable if locked to a project
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
                    <Label>Estado</Label>
                    <select 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                       <option value="PENDIENTE">Pendiente</option>
                       <option value="EN_CURSO">En curso</option>
                       <option value="FINALIZADA">Finalizada</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <Label>Prioridad</Label>
                    <select 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                       <option value="BAJA">Baja</option>
                       <option value="MEDIA">Media</option>
                       <option value="ALTA">Alta</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <Label>Fecha Límite</Label>
                    <Input 
                      type="date" 
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <Label>Descripción</Label>
                 <textarea 
                    className="w-full min-h-[100px] rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                    placeholder="Detalles adicionales..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                 />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
               <Button variant="outline" onClick={onClose} className="rounded-full px-6">Cancelar</Button>
               <Button variant="primary" onClick={handleSubmit} loading={loading} className="rounded-full px-8">
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
