
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { projectService } from '@/services/projectService';
import { formatDate } from '@/lib/dateUtils';
import { tokens } from '@/lib/designTokens';

const PartidaDetailModal = ({ isOpen, onClose, partida, projectId }) => {
  const { t } = useTheme();
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && partida) {
      fetchMovimientos();
    }
  }, [isOpen, partida]);

  const fetchMovimientos = async () => {
    setLoading(true);
    try {
      const data = await projectService.getPartidaMovimientos(partida.id);
      setMovimientos(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);

  return (
    <AnimatePresence>
      {isOpen && partida && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex flex-col px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
               <div className="flex justify-between items-start mb-2">
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                   {t('movimientos.title')} {partida.name}
                 </h2>
                 <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                   <X className="w-5 h-5 text-slate-400" />
                 </button>
               </div>
               <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                     <span className="text-slate-400">Presupuesto:</span>
                     <span className="text-slate-900 dark:text-white">{formatCurrency(partida.budget)}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                  <div className="flex items-center gap-1">
                     <span className="text-slate-400">Gasto:</span>
                     <span className="text-red-600 dark:text-red-400">{formatCurrency(partida.total_gasto)}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                  <div className="flex items-center gap-1">
                     <span className="text-slate-400">Saldo:</span>
                     <span className={`${partida.diferencia >= 0 ? 'text-green-600' : 'text-red-600'} font-bold`}>
                        {formatCurrency(partida.diferencia)}
                     </span>
                  </div>
               </div>
            </div>

            {/* Content */}
            <div className="p-0 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/30 grow">
               {loading ? (
                 <div className="flex items-center justify-center h-48 animate-pulse text-slate-400">Cargando...</div>
               ) : movimientos.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                    <AlertCircle className="w-8 h-8 opacity-50" />
                    <p>No hay movimientos asociados a esta partida</p>
                 </div>
               ) : (
                 <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                     <tr>
                       <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.date')}</th>
                       <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.description')}</th>
                       <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Estado</th>
                       <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">{t('common.amount')}</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                     {movimientos.map((mov) => (
                       <tr 
                         key={mov.id} 
                         className="hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors group"
                         onClick={() => window.open(`/expenses/${mov.id}`, '_self')}
                       >
                         <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {formatDate(mov.date)}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{mov.description}</div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${mov.status === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {mov.status}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                           {formatCurrency(mov.amount)}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
               <Button variant="outline" onClick={onClose} className="rounded-full px-6">{t('common.close')}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PartidaDetailModal;
