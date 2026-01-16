
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, FileText, User, CreditCard, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { formatDate } from '@/lib/dateUtils';
import { useTheme } from '@/contexts/ThemeProvider';

const ViewMovementModal = ({ isOpen, onClose, movement }) => {
  const { t } = useTheme();

  if (!movement) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md shadow-2xl flex flex-col overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Detalles del Movimiento</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                  ${movement.tipo === 'GASTO' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                    movement.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                  {movement.tipo}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                  ${movement.estado === 'CONFIRMADO' 
                    ? 'border-green-200 text-green-700 bg-green-50 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900' 
                    : 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900'
                  }`}>
                  {movement.estado}
                </span>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Descripción</p>
                    <p className="text-slate-900 dark:text-white font-medium">{movement.descripcion}</p>
                    {movement.notas && <p className="text-sm text-slate-500 mt-1 italic">{movement.notas}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Monto</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{formatCurrencyARS(movement.monto_ars)}</p>
                    {movement.monto_usd > 0 && (
                      <p className="text-sm text-slate-500 font-mono">{formatCurrencyUSD(movement.monto_usd)} USD</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Fecha</p>
                    <p className="text-slate-900 dark:text-white">{formatDate(movement.fecha)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Proveedor / Inversor</p>
                    <p className="text-slate-900 dark:text-white">
                      {movement.provider_name || movement.inversionista_nombre || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Cuenta</p>
                    <p className="text-slate-900 dark:text-white">{movement.cuenta_titulo || 'Sin cuenta'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <Button variant="outline" onClick={onClose}>Cerrar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ViewMovementModal;
