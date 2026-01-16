
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { partidasService } from '@/services/partidasService';

const CreateSubPartidaModal = ({ isOpen, onClose, onSuccess, partidaId, subPartidaToEdit = null }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    presupuesto: '',
    progreso: 0,
    estado: 'PENDIENTE'
  });

  useEffect(() => {
    if (isOpen) {
      if (subPartidaToEdit) {
        setFormData({
          nombre: subPartidaToEdit.nombre || '',
          descripcion: subPartidaToEdit.descripcion || '',
          presupuesto: subPartidaToEdit.presupuesto || '',
          progreso: subPartidaToEdit.progreso || 0,
          estado: subPartidaToEdit.estado || 'PENDIENTE'
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          presupuesto: '',
          progreso: 0,
          estado: 'PENDIENTE'
        });
      }
    }
  }, [isOpen, subPartidaToEdit]);

  const handleSubmit = async () => {
    if (!formData.nombre) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre es obligatorio.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        presupuesto: Number(formData.presupuesto),
        progreso: Number(formData.progreso)
      };

      if (subPartidaToEdit) {
        await partidasService.updateSubPartida(subPartidaToEdit.id, payload);
        toast({ title: 'Éxito', description: 'Sub-partida actualizada correctamente.' });
      } else {
        await partidasService.createSubPartida(partidaId, payload);
        toast({ title: 'Éxito', description: 'Sub-partida creada correctamente.' });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al guardar la sub-partida.' });
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
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-lg dark:text-white">
                {subPartidaToEdit ? 'Editar Sub-partida' : 'Nueva Sub-partida'}
              </h3>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nombre <span className="text-red-500">*</span></Label>
                <Input 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej. Materiales"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <textarea 
                  className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 min-h-[80px]"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Detalles..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Presupuesto</Label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.presupuesto}
                    onChange={(e) => setFormData({...formData, presupuesto: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Progreso (%)</Label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progreso}
                    onChange={(e) => setFormData({...formData, progreso: Math.min(100, Math.max(0, e.target.value))})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-slate-300 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN PROGRESO">EN PROGRESO</option>
                  <option value="COMPLETADO">COMPLETADO</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button onClick={handleSubmit} loading={loading}>
                <Save className="w-4 h-4 mr-2" /> Guardar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateSubPartidaModal;
