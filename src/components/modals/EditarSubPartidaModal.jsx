
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EditarSubPartidaModal({ 
  isOpen, 
  onClose, 
  subPartida, 
  onActualizar 
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    presupuesto: 0
  });

  useEffect(() => {
    if (isOpen && subPartida) {
      setFormData({
        nombre: subPartida.nombre || '',
        presupuesto: subPartida.presupuesto || 0
      });
    } else {
      setFormData({ nombre: '', presupuesto: 0 });
    }
  }, [isOpen, subPartida]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nombre.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre es requerido.' });
      return;
    }
    
    const presupuestoNum = parseFloat(formData.presupuesto);
    if (isNaN(presupuestoNum) || presupuestoNum < 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'El presupuesto debe ser un número positivo.' });
      return;
    }

    setLoading(true);
    console.log("🔄 [EditarSubPartida] Guardando cambios...", { id: subPartida?.id, ...formData });

    try {
      await onActualizar({
        ...subPartida,
        nombre: formData.nombre,
        presupuesto: presupuestoNum
      });
      
      console.log("✅ [EditarSubPartida] Guardado exitoso");
      onClose();
    } catch (error) {
      console.error("❌ [EditarSubPartida] Error al guardar:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la sub-partida.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>Editar Sub-partida</DialogTitle>
          <DialogDescription>
            Modifica los detalles y el presupuesto asignado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input 
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre de la sub-partida"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Presupuesto (ARS)</Label>
            <Input 
              type="number"
              min="0"
              step="0.01"
              value={formData.presupuesto}
              onChange={(e) => setFormData({ ...formData, presupuesto: e.target.value })}
              placeholder="0.00"
            />
            <p className="text-xs text-slate-500">
              Al modificar este valor, el presupuesto de la partida padre se recalculará automáticamente.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
