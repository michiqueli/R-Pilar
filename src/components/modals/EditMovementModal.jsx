
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import DatePickerInput from '@/components/ui/DatePickerInput';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useTheme } from '@/contexts/ThemeProvider';
import { cuentaService } from '@/services/cuentaService';

const EditMovementModal = ({ isOpen, onClose, movement, onSave }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [providers, setProviders] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (isOpen && movement) {
      setFormData({
        ...movement,
        fecha: movement.fecha ? new Date(movement.fecha) : new Date(),
        monto_ars: movement.monto_ars || 0,
      });
      fetchCatalogs();
    }
  }, [isOpen, movement]);

  const fetchCatalogs = async () => {
    try {
      const [provRes, accRes] = await Promise.all([
        supabase.from('providers').select('id, name').eq('is_deleted', false).order('name'),
        cuentaService.getCuentasActivas()
      ]);
      
      if (provRes.data) setProviders(provRes.data);
      if (accRes) setAccounts(accRes);
    } catch (e) {
      console.error("Error loading catalogs", e);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('inversiones')
        .update({
          tipo: formData.tipo,
          descripcion: formData.descripcion,
          monto_ars: formData.monto_ars,
          fecha: formData.fecha,
          estado: formData.estado,
          cuenta_id: formData.cuenta_id,
          proveedor_id: formData.proveedor_id,
          notas: formData.notas
        })
        .eq('id', movement.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Movimiento actualizado correctamente",
        className: 'bg-green-50 border-green-200'
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating movement:", error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "No se pudo actualizar el movimiento"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg shadow-2xl flex flex-col overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Editar Movimiento</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Tipo y Estado */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(val) => setFormData({...formData, tipo: val})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GASTO">Gasto</SelectItem>
                      <SelectItem value="INGRESO">Ingreso</SelectItem>
                      <SelectItem value="INVERSION">Inversión</SelectItem>
                      <SelectItem value="DEVOLUCION">Devolución</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select 
                    value={formData.estado} 
                    onValueChange={(val) => setFormData({...formData, estado: val})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Descripcion */}
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input 
                  value={formData.descripcion || ''} 
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                />
              </div>

              {/* Monto y Fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto (ARS)</Label>
                  <Input value={formData.monto_ars || ''} 
                    onChange={(e) => setFormData({...formData, monto_ars: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <DatePickerInput 
                    date={formData.fecha}
                    onSelect={(date) => setFormData({...formData, fecha: date})}
                  />
                </div>
              </div>

              {/* Cuenta y Proveedor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cuenta</Label>
                  <Select 
                    value={formData.cuenta_id || 'none'} 
                    onValueChange={(val) => setFormData({...formData, cuenta_id: val === 'none' ? null : val})}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cuenta</SelectItem>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.titulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select 
                    value={formData.proveedor_id || 'none'} 
                    onValueChange={(val) => setFormData({...formData, proveedor_id: val === 'none' ? null : val})}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proveedor</SelectItem>
                      {providers.map(prov => (
                        <SelectItem key={prov.id} value={prov.id}>{prov.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label>Notas</Label>
                <textarea 
                  className="w-full min-h-[80px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={formData.notas || ''}
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditMovementModal;
