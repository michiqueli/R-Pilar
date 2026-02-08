import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Trash2, Mail, Phone, Edit2 } from 'lucide-react'; // Agregué Edit2
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const UsuariosTable = ({ users, columns, onReload, onEdit }) => {
  const { toast } = useToast();

  const handleUpdate = async (userId, field, value) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ [field]: value, fecha_actualizacion: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      toast({ title: "Cambio guardado", description: `Se actualizó el ${field} correctamente.` });
      onReload();
    } catch (err) {
      toast({ variant: 'destructive', title: "Error", description: err.message });
    }
  };

  // --- NUEVA FUNCIÓN DE ELIMINAR ---
  const handleDelete = async (user) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${user.nombre}? Esta acción no se puede deshacer.`)) return;

    try {
      // Nota: Esto elimina el perfil de la tabla pública. 
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({ title: "Usuario eliminado", description: "El perfil ha sido removido correctamente." });
      onReload();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast({ variant: 'destructive', title: "Error", description: "No se pudo eliminar el usuario." });
    }
  };

  return (
    <div className="rounded-[16px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
            <tr className="border-b dark:border-gray-800">
              {columns.name && <th className="py-4 px-6 text-left">Usuario</th>}
              {columns.phone && <th className="py-4 px-6 text-left">Contacto</th>}
              {columns.rol && <th className="py-4 px-6 text-left">Rol</th>}
              {columns.status && <th className="py-4 px-6 text-left">Estado</th>}
              {columns.actions && <th className="py-4 px-6 text-right">Gestión</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((u) => (
              <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                {columns.name && (
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center font-black shadow-sm">
                        {u.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{u.nombre}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{u.email}</p>
                      </div>
                    </div>
                  </td>
                )}

                {columns.phone && (
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 opacity-50" />
                      {u.telefono || '-'}
                    </div>
                  </td>
                )}

                {columns.rol && (
                  <td className="py-4 px-6">
                    <select
                      value={u.rol}
                      onChange={(e) => handleUpdate(u.user_id, 'rol', e.target.value)}
                      className="bg-transparent font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer text-xs"
                    >
                      <option value="TECNICO">TECNICO</option>
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    </select>
                  </td>
                )}

                {columns.status && (
                  <td className="py-4 px-6">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-black uppercase border transition-colors",
                      {
                        "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400": u.estado === 'aceptado',
                        "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400": u.estado === 'pendiente',
                        "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400": u.estado === 'rechazado'
                      }
                    )}>
                      {u.estado}
                    </span>
                  </td>
                )}

                {columns.actions && (
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Botón de Edición (abre el modal) */}
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => onEdit && onEdit(u)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      {u.estado === 'pendiente' && (
                        <>
                          <Button
                            size="iconSm"
                            className="bg-green-500 text-white hover:bg-green-600 rounded-full h-8 w-8 shadow-sm"
                            onClick={() => handleUpdate(u.user_id, 'estado', 'aceptado')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="iconSm"
                            variant="destructive"
                            className="rounded-full h-8 w-8 shadow-sm"
                            onClick={() => handleUpdate(u.user_id, 'estado', 'rechazado')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {/* Botón de Eliminar Real */}
                      <Button
                        variant="ghost"
                        size="iconSm"
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        onClick={() => handleDelete(u)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsuariosTable;