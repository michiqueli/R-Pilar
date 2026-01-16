
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, DollarSign, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { tokens } from '@/lib/designTokens';
import { movimientoService } from '@/services/movimientoService';
import DatePickerInput from '@/components/ui/DatePickerInput';
import { Switch } from '@/components/ui/switch';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';

const DuplicateMovementModal = ({ isOpen, onClose, originalMovement, onSave }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
     description: '',
     amount_ars: '',
     fecha: new Date(),
     type: 'GASTO',
     status: 'PENDIENTE',
     notes: ''
  });

  useEffect(() => {
    if (isOpen && originalMovement) {
       setFormData({
          description: `${originalMovement.descripcion} (Copia)`,
          amount_ars: originalMovement.monto_ars || originalMovement.amount || '',
          fecha: new Date(), // Reset to today
          type: originalMovement.tipo || 'GASTO',
          status: 'PENDIENTE', // Reset to pending
          notes: originalMovement.notas || '',
          account_id: originalMovement.cuenta_id || '',
          project_id: originalMovement.project_id || '',
          provider_id: originalMovement.provider_id || '',
          inversionista_id: originalMovement.inversionista_id || '',
          // Economic defaults
          valor_usd: originalMovement.fx_rate || 1200,
          iva_incluido: originalMovement.vat_included || false,
          iva_porcentaje: originalMovement.vat_percent || 21
       });
    }
  }, [isOpen, originalMovement]);

  const handleSubmit = async () => {
     setLoading(true);
     try {
        await movimientoService.createMovimiento({
           ...formData,
           tipo_movimiento: formData.type,
           date: formData.fecha,
           amount: formData.amount_ars, // Legacy mapping
           projectId: formData.project_id,
           responsible: formData.provider_id, // Legacy mapping
        });

        toast({ title: "Movimiento duplicado con éxito" });
        onSave();
        onClose();
     } catch (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
     } finally {
        setLoading(false);
     }
  };

  return (
    <AnimatePresence>
      {isOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
               <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                     <Copy className="w-5 h-5 text-blue-500" />
                     Duplicar Movimiento
                  </h3>
                  <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
               </div>

               <div className="p-6 space-y-4">
                  <div className="space-y-2">
                     <Label>Descripción</Label>
                     <Input 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Monto (ARS)</Label>
                        <Input 
                           type="number"
                           value={formData.amount_ars} 
                           onChange={e => setFormData({...formData, amount_ars: e.target.value})} 
                        />
                     </div>
                     <div className="space-y-2">
                        <Label>Fecha</Label>
                        <DatePickerInput 
                           date={formData.fecha}
                           onSelect={d => setFormData({...formData, fecha: d})}
                        />
                     </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                     Este movimiento se creará como <strong>PENDIENTE</strong> con fecha de hoy.
                  </div>
               </div>

               <div className="p-4 border-t bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white">
                     {loading ? 'Guardando...' : 'Duplicar Movimiento'}
                  </Button>
               </div>
            </motion.div>
         </div>
      )}
    </AnimatePresence>
  );
};

export default DuplicateMovementModal;
