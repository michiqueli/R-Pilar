
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { taskService } from '@/services/taskService';
import { tokens } from '@/lib/designTokens';

const MOCK_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Usuario Actual (Yo)' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Juan Pérez' },
];

function TaskQuickAdd({ isOpen, onClose, onSuccess, preselectedProjectId }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(MOCK_USERS[0].id);
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await taskService.createTask({
        title,
        assigned_to: assignee,
        due_date: dueDate || null,
        project_id: preselectedProjectId || null,
        status: 'pending',
        priority: 'medium'
      });
      toast({ title: 'Tarea creada', description: 'Se ha agregado la tarea rápida.' });
      setTitle('');
      setDueDate('');
      onSuccess();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[450px] shadow-2xl rounded-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-5">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Creación Rápida
                  </h3>
                  <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                     <Label className="text-xs">¿Qué hay que hacer?</Label>
                     <Input 
                       value={title} 
                       onChange={(e) => setTitle(e.target.value)} 
                       placeholder="Escribe el título de la tarea..." 
                       autoFocus
                       className="border-slate-200"
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <Label className="text-xs">Responsable</Label>
                        <select 
                           className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                           value={assignee}
                           onChange={(e) => setAssignee(e.target.value)}
                        >
                           {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <Label className="text-xs">Vencimiento</Label>
                        <Input 
                           type="date" 
                           value={dueDate} 
                           onChange={(e) => setDueDate(e.target.value)}
                           className="h-10 border-slate-200"
                        />
                     </div>
                  </div>
                  
                  <div className="pt-2 flex justify-end gap-2">
                     <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
                     <Button type="submit" variant="primary" size="sm" loading={loading} className="rounded-full px-6">Crear</Button>
                  </div>
               </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default TaskQuickAdd;
