import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { tokens } from '@/lib/designTokens';

const UsuarioModal = ({ isOpen, onClose, onSuccess, user = null }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'TECNICO',
    estado: 'pendiente'
  });

  // Carga de datos si es edición
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          nombre: user.nombre || '',
          email: user.email || '',
          telefono: user.telefono || '',
          rol: user.rol || 'TECNICO',
          estado: user.estado || 'pendiente'
        });
      } else {
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          rol: 'TECNICO',
          estado: 'pendiente'
        });
      }
    }
  }, [isOpen, user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.email) {
      return toast({ variant: 'destructive', title: 'Error', description: 'Nombre y Email son obligatorios' });
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (user) {
        // MODO EDICIÓN
        const { error } = await supabase
          .from('usuarios')
          .update(payload)
          .eq('user_id', user.user_id);
        if (error) throw error;
      } else {
        // MODO CREACIÓN (Nota: Aquí idealmente se crearía vía Auth primero, 
        // pero este insert es para la tabla public.usuarios)
        const { error } = await supabase
          .from('usuarios')
          .insert([{ ...payload }]);
        if (error) throw error;
      }

      toast({ title: 'Éxito', description: `Usuario ${user ? 'actualizado' : 'creado'} correctamente` });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[24px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input
                  icon={User}
                  placeholder="Ej. Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <Input
                  icon={Mail}
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={!!user} // El email suele ser el identificador, mejor no cambiarlo si ya existe
                />
              </div>

              <div className="space-y-2">
                <Label>Teléfono / WhatsApp</Label>
                <Input
                  icon={Phone}
                  placeholder="+54 9 299 ..."
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol del Sistema</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      value={formData.rol}
                      onChange={(e) => handleChange('rol', e.target.value)}
                    >
                      <option value="TECNICO">TECNICO</option>
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estado de Acceso</Label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      value={formData.estado}
                      onChange={(e) => handleChange('estado', e.target.value)}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aceptado">Aceptado</option>
                      <option value="rechazado">Rechazado</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                loading={loading}
                className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {user ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UsuarioModal;