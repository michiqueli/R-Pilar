
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrencyARS } from '@/lib/formatUtils';

const DeleteMovementModal = ({ isOpen, movimiento, onConfirm, onCancel }) => {
  if (!movimiento) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Eliminar Movimiento
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-6 text-left">
               <p className="text-sm font-medium text-gray-900 dark:text-white">{movimiento.descripcion}</p>
               <p className="text-lg font-bold font-mono text-gray-700 dark:text-gray-300 mt-1">
                  {formatCurrencyARS(movimiento.monto_ars || movimiento.amount)}
               </p>
               <p className="text-xs text-gray-500 mt-1">
                  Esta acción no se puede deshacer.
               </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onCancel} className="w-full">
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => onConfirm(movimiento)} 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteMovementModal;
