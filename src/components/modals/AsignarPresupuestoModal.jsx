
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calculator } from 'lucide-react';

export default function AsignarPresupuestoModal({ 
  isOpen, 
  onClose, 
  partida, 
  onAsignar 
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [montoTotal, setMontoTotal] = useState('');

  useEffect(() => {
    if (isOpen && partida) {
      setMontoTotal(partida.presupuesto || '');
    } else {
      setMontoTotal('');
    }
  }, [isOpen, partida]);

  const handleSubmit = async () => {
    const monto = parseFloat(montoTotal);
    if (isNaN(monto) || monto < 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ingrese un monto válido.' });
      return;
    }

    setLoading(true);
    console.log("💰 [AsignarPresupuesto] Iniciando distribución:", { partidaId: partida?.id, monto });

    try {
      await onAsignar(partida.id, monto);
      onClose();
    } catch (error) {
      console.error("❌ [AsignarPresupuesto] Error:", error);
      // Toast handled by parent usually, but safe to add here if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-sm bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>Asignar Presupuesto Global</DialogTitle>
          <DialogDescription>
            Este monto se dividirá equitativamente entre todas las sub-partidas existentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Presupuesto Total (ARS)</Label>
            <Input 
              type="number"
              min="0"
              step="0.01"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
            Distribuir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
