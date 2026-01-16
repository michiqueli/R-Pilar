
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { movimientoService } from '@/services/movimientoService';
import { formatDate } from '@/lib/dateUtils';
import { useNavigate } from 'react-router-dom';

const PendingDetailDrawer = ({ isOpen, onClose, projectId, type = 'income' }) => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, projectId, type]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let data = [];
      if (type === 'income') {
        data = await movimientoService.getPendingIncome(projectId);
      } else {
        data = await movimientoService.getPendingExpense(projectId);
      }
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount_ars) || 0), 0);

  const handleViewAll = () => {
    navigate('/movimientos'); // Could pass state/filters via location state if needed
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-slate-950 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
               <div className="flex items-center gap-3">
                 <div className={`w-3 h-8 rounded-full ${type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                   {type === 'income' ? t('movimientos.pendiente_cobrar') : t('movimientos.pendiente_pagar')}
                 </h2>
               </div>
               <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                 <X className="w-6 h-6" />
               </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
               {loading ? (
                 <div className="text-center py-10 animate-pulse text-slate-400">Cargando...</div>
               ) : (
                 <div className="space-y-3">
                   {items.map(item => (
                     <div 
                       key={item.id} 
                       className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                       onClick={() => window.open(type === 'expense' ? `/expenses/${item.id}` : `/incomes/${item.id}`, '_self')}
                     >
                       <div className="flex-1 min-w-0">
                         <div className="font-semibold text-slate-900 dark:text-white truncate">{item.description}</div>
                         <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                           <div className="flex items-center gap-1">
                             <Calendar className="w-3 h-3" />
                             <span>{formatDate(item.date)}</span>
                           </div>
                           {item.project && (
                             <div className="flex items-center gap-1">
                               <Briefcase className="w-3 h-3" />
                               <span className="truncate max-w-[150px]">{item.project.name}</span>
                             </div>
                           )}
                         </div>
                       </div>
                       <div className="text-right shrink-0">
                         <div className={`text-lg font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                           {movimientoService.formatCurrencyARS(item.amount_ars)}
                         </div>
                         <div className="text-xs font-medium text-slate-400 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           Ver detalle <ExternalLink className="w-3 h-3" />
                         </div>
                       </div>
                     </div>
                   ))}
                   {items.length === 0 && (
                     <div className="bg-white dark:bg-slate-900 rounded-xl p-10 text-center border border-dashed border-slate-300 dark:border-slate-700">
                       <p className="text-slate-500">No hay movimientos pendientes</p>
                     </div>
                   )}
                 </div>
               )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-lg z-10">
               <div>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 p-0 hover:bg-transparent" onClick={handleViewAll}>
                    {t('movimientos.ver_todos')} &rarr;
                  </Button>
               </div>
               <div className="text-right">
                  <span className="text-sm font-bold text-slate-400 uppercase mr-3">Total Pendiente</span>
                  <span className={`text-2xl font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {movimientoService.formatCurrencyARS(totalAmount)}
                  </span>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PendingDetailDrawer;
