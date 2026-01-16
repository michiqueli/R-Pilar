
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { movimientoService } from '@/services/movimientoService';
import { formatDate, formatCurrencyARS } from '@/lib/formatUtils';
import { tokens } from '@/lib/designTokens';

const BalanceDetailModal = ({ isOpen, onClose, projectId, type = 'monthly', initialMonth = new Date().getMonth(), initialYear = new Date().getFullYear() }) => {
  const { t } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date(initialYear, initialMonth, 1));
  const [data, setData] = useState({ ingresos: [], gastos: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, currentDate, projectId, type]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let movements = [];
      if (type === 'monthly') {
        movements = await movimientoService.getMonthlyMovements(
          projectId, 
          currentDate.getMonth(), 
          currentDate.getFullYear()
        );
      } else {
        movements = await movimientoService.getMovimientos({ projectId });
      }

      setData({
        ingresos: movements.filter(m => m.type === 'ingreso'),
        gastos: movements.filter(m => m.type === 'gasto')
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const totalIngresos = data.ingresos.reduce((sum, m) => sum + (parseFloat(m.amount_ars) || 0), 0);
  const totalGastos = data.gastos.reduce((sum, m) => sum + (parseFloat(m.amount_ars) || 0), 0);
  const balance = totalIngresos - totalGastos;

  const TableColumn = ({ title, items, colorClass, totalColorClass, totalAmount, emptyMessage }) => (
    <div className={`flex flex-col h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 ${colorClass}`}>
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 font-bold text-lg flex justify-between items-center">
        <span>{title}</span>
        <span className="text-sm font-normal opacity-70 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar max-h-[400px]">
        {items.map(item => (
          <div 
            key={item.id} 
            className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => window.open(item.type === 'gasto' ? `/expenses/${item.id}` : `/incomes/${item.id}`, '_self')}
          >
             <div className="flex justify-between items-start mb-1">
               <span className="font-medium text-slate-800 dark:text-slate-200 text-sm line-clamp-1">{item.description}</span>
               <span className="font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">{formatCurrencyARS(item.amount_ars)}</span>
             </div>
             <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{formatDate(item.date)}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {item.status || 'Completado'}
                </span>
             </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-10 text-slate-400 italic text-sm">{emptyMessage}</div>
        )}
      </div>
      <div className={`p-4 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center ${totalColorClass} bg-opacity-10 font-bold`}>
         <span>Total</span>
         <span>{formatCurrencyARS(totalAmount)}</span>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-950 w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] relative"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
               <div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                   {type === 'monthly' ? t('movimientos.balance_mensual') : t('movimientos.balance_total')}
                 </h2>
               </div>
               <div className="flex items-center gap-4">
                  {type === 'monthly' && (
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-800">
                      <Button variant="ghost" size="iconSm" onClick={handlePrevMonth} className="h-7 w-7 rounded-full hover:bg-white dark:hover:bg-slate-800 shadow-sm">
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 min-w-[120px] text-center px-2">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </span>
                      <Button variant="ghost" size="iconSm" onClick={handleNextMonth} className="h-7 w-7 rounded-full hover:bg-white dark:hover:bg-slate-800 shadow-sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
               </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 grow">
               {loading ? (
                 <div className="flex items-center justify-center h-64 animate-pulse text-slate-400">Cargando datos...</div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <TableColumn 
                      title={t('movimientos.gastos')} 
                      items={data.gastos} 
                      colorClass="bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                      totalColorClass="text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20"
                      totalAmount={totalGastos}
                      emptyMessage="No hay gastos registrados"
                    />
                    <TableColumn 
                      title={t('movimientos.ingresos')} 
                      items={data.ingresos} 
                      colorClass="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30"
                      totalColorClass="text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20"
                      totalAmount={totalIngresos}
                      emptyMessage="No hay ingresos registrados"
                    />
                 </div>
               )}
            </div>

            {/* Footer / Net Balance */}
            <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center shadow-lg z-10 shrink-0">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Balance Neto</span>
               <div className={`text-4xl font-bold flex items-center gap-2 ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                 {balance > 0 ? '+' : ''} {formatCurrencyARS(balance)}
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BalanceDetailModal;
