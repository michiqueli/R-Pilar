
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarClock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { pendienteService } from '@/services/pendienteService';
import { formatCurrencyARS } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';
import PendingDetailModal from './PendingDetailModal';

const PendingModal = ({ isOpen, onClose, projectId }) => {
  const { t } = useTheme();
  const [loading, setLoading] = useState(true);
  const [matrix, setMatrix] = useState(null);
  
  // Detail Modal State
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    days: null,
    tipoFila: null // 'income', 'expense', 'net'
  });

  useEffect(() => {
    if (isOpen && projectId) {
      fetchMatrix();
    }
  }, [isOpen, projectId]);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const data = await pendienteService.getPendingMatrix(projectId);
      setMatrix(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (days, tipoFila) => {
    setDetailModal({
      isOpen: true,
      days,
      tipoFila
    });
  };

  const handleCloseDetail = () => {
    setDetailModal(prev => ({ ...prev, isOpen: false }));
  };

  const horizons = [7, 30, 60, 90];

  const StatCell = ({ value, type, days }) => {
    let colorClass = "text-slate-700 dark:text-slate-300";
    if (type === 'income') colorClass = "text-emerald-600 dark:text-emerald-400 font-bold";
    if (type === 'expense') colorClass = "text-red-600 dark:text-red-400 font-bold";
    if (type === 'net') {
      colorClass = value >= 0 
        ? "text-emerald-700 dark:text-emerald-400 font-extrabold" 
        : "text-red-700 dark:text-red-400 font-extrabold";
    }

    if (loading) return <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded mx-auto" />;

    return (
      <div 
        className={cn(
          "flex justify-center items-center text-sm sm:text-base cursor-pointer hover:scale-105 transition-transform duration-200", 
          colorClass
        )}
        onClick={() => handleCellClick(days, type)}
      >
         {formatCurrencyARS(value)}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-950 w-full max-w-[900px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 relative"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                   <CalendarClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('projects.pendientes')}</h2>
                   <p className="text-xs text-slate-500 dark:text-slate-400">{t('projects.resumenCobrosYPagos')}</p>
                 </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                 <X className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            {/* Matrix Body */}
            <div className="p-6 overflow-y-auto">
               <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-5 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
                     {/* Empty Corner */}
                     <div className="p-4 bg-slate-100 dark:bg-slate-900"></div>
                     
                     {/* Horizon Headers */}
                     {horizons.map(h => (
                       <div key={h} className="p-4 text-center font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 text-sm uppercase tracking-wide">
                         {h} {t('common.days', 'días')}
                       </div>
                     ))}
                  </div>

                  {/* Rows */}
                  
                  {/* Row 1: Income */}
                  <div className="grid grid-cols-5 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
                     <div className="p-4 flex items-center font-medium text-slate-600 dark:text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-900/20">
                        {t('projects.cobrosProximos')}
                     </div>
                     {horizons.map(h => (
                       <div 
                        key={h} 
                        className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all cursor-pointer group"
                        onClick={() => handleCellClick(h, 'income')}
                       >
                         <StatCell value={matrix?.[h]?.ingresos} type="income" days={h} />
                       </div>
                     ))}
                  </div>

                  {/* Row 2: Expense */}
                  <div className="grid grid-cols-5 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
                     <div className="p-4 flex items-center font-medium text-slate-600 dark:text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-900/20">
                        {t('projects.pagosProximos')}
                     </div>
                     {horizons.map(h => (
                       <div 
                        key={h} 
                        className="p-4 bg-red-50/30 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-all cursor-pointer group"
                        onClick={() => handleCellClick(h, 'expense')}
                       >
                         <StatCell value={matrix?.[h]?.gastos} type="expense" days={h} />
                       </div>
                     ))}
                  </div>

                  {/* Row 3: Net Liquidity */}
                  <div className="grid grid-cols-5 divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                     <div className="p-4 flex items-center font-bold text-slate-800 dark:text-white text-sm bg-slate-100/50 dark:bg-slate-800/50">
                        {t('projects.liquidezProyectada')}
                     </div>
                     {horizons.map(h => (
                       <div 
                        key={h} 
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                        onClick={() => handleCellClick(h, 'net')}
                       >
                         <StatCell value={matrix?.[h]?.neto} type="net" days={h} />
                       </div>
                     ))}
                  </div>
               </div>
               
               <div className="mt-4 text-xs text-slate-400 text-center">
                  * {t('projects.cobrosMenusPagos')}
               </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
               <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span className="text-sm text-slate-500 font-medium">{t('projects.liquidezNeta90')}:</span>
                  {loading ? (
                    <div className="w-20 h-5 bg-slate-100 dark:bg-slate-700 animate-pulse rounded" />
                  ) : (
                    <span className={cn(
                      "text-lg font-bold font-mono",
                      (matrix?.[90]?.neto || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                       {formatCurrencyARS(matrix?.[90]?.neto || 0)}
                    </span>
                  )}
               </div>
            </div>
          </motion.div>

          {/* Render Detail Modal on top if open */}
          <PendingDetailModal 
            isOpen={detailModal.isOpen}
            onClose={handleCloseDetail}
            projectId={projectId}
            days={detailModal.days}
            tipoFila={detailModal.tipoFila}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default PendingModal;
