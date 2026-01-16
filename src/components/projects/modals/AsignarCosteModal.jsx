
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { partidasService } from '@/services/partidasService';
import { formatCurrencyARS } from '@/lib/formatUtils';

const AsignarCosteModal = ({ isOpen, onClose, onSuccess, item, type }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [monto, setMonto] = useState('');
  
  const currentCost = item ? (type === 'partida' ? item.coste_asignado : item.coste_asignado) : 0; // mapped to same key in service

  const handleSubmit = async () => {
    if (!monto || Number(monto) <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'El monto debe ser mayor a 0.' });
      return;
    }

    setLoading(true);
    try {
      if (type === 'partida') {
        await partidasService.asignarCostePartida(item.id, monto);
      } else {
        await partidasService.asignarCosteSubPartida(item.id, monto);
      }
      toast({ title: 'Éxito', description: 'Coste asignado correctamente.' });
      onSuccess();
      onClose();
      setMonto('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Error al asignar el coste.' });
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
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Asignar Coste
              </h3>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Item:</p>
                <p className="font-medium text-slate-900 dark:text-white mb-2">{item?.nombre}</p>
                
                <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-700 pt-2">
                  <div>
                    <p className="text-xs text-slate-500">Coste Actual</p>
                    <p className="font-mono font-medium">{formatCurrencyARS(currentCost)}</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 mb-1" />
                  <div>
                     <p className="text-xs text-slate-500">A Asignar</p>
                     <p className="font-mono font-medium text-blue-600">
                        {monto ? formatCurrencyARS(monto) : '$ 0.00'}
                     </p>
                  </div>
                </div>
                
                {monto > 0 && (
                   <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Nuevo Total:</span>
                      <span className="text-lg font-bold font-mono text-green-600">
                        {formatCurrencyARS(Number(currentCost) + Number(monto))}
                      </span>
                   </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Monto a agregar</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button onClick={handleSubmit} loading={loading} className="bg-green-600 hover:bg-green-700">
                Asignar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AsignarCosteModal;
