
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowRightCircle, ArrowLeftCircle, DollarSign, Wallet } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { pendienteService } from '@/services/pendienteService';
import { formatCurrencyARS, formatDate } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';
import { useToast } from '@/components/ui/use-toast';

const PendingDetailModal = ({ isOpen, onClose, projectId, days, tipoFila }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isOpen && projectId && days && tipoFila) {
      fetchDetail();
    }
  }, [isOpen, projectId, days, tipoFila]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const result = await pendienteService.getPendingDetailByHorizon(projectId, days, tipoFila);
      setData(result);
    } catch (error) {
      console.error(error);
      toast({
        title: t('common.error'),
        description: t('messages.error_loading'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    const horizonText = `${days} ${t('common.days')}`;
    if (tipoFila === 'income') return `${t('projects.cobrosProximos')} (${horizonText})`;
    if (tipoFila === 'expense') return `${t('projects.pagosProximos')} (${horizonText})`;
    if (tipoFila === 'net') return `${t('projects.liquidezProyectada')} (${horizonText})`;
    return t('common.details');
  };

  const MovementTable = ({ movements, type }) => {
    if (!movements || movements.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 italic">
          {t('projects.noMovimientos')}
        </div>
      );
    }

    const isIncome = type === 'income';
    const accentColor = isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
    const headerBg = isIncome ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20';
    
    return (
      <div className="w-full overflow-hidden border rounded-lg border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className={`text-xs uppercase font-semibold text-slate-600 dark:text-slate-300 ${headerBg}`}>
            <tr>
              <th className="px-4 py-3 text-left">{t('common.date')}</th>
              <th className="px-4 py-3 text-left">{t('common.description')}</th>
              <th className="px-4 py-3 text-left">{isIncome ? t('common.client') : t('common.provider')}</th>
              <th className="px-4 py-3 text-right">{t('common.amount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                  {formatDate(m.date)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">
                  {m.description}
                  {m.partida && (
                    <div className="text-xs text-slate-400 font-normal">{m.partida}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {m.responsible || '-'}
                </td>
                <td className={cn("px-4 py-3 text-right font-bold whitespace-nowrap", accentColor)}>
                  {formatCurrencyARS(m.amount_ars || m.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white dark:bg-slate-950 w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
               <div className="flex items-center gap-3">
                 <div className={cn("p-2 rounded-lg", 
                    tipoFila === 'income' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" :
                    tipoFila === 'expense' ? "bg-red-100 dark:bg-red-900/30 text-red-600" :
                    "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                 )}>
                   {tipoFila === 'income' && <ArrowLeftCircle className="w-5 h-5" />}
                   {tipoFila === 'expense' && <ArrowRightCircle className="w-5 h-5" />}
                   {tipoFila === 'net' && <Wallet className="w-5 h-5" />}
                 </div>
                 <div>
                   <h2 className="text-lg font-bold text-slate-900 dark:text-white">{getTitle()}</h2>
                   <p className="text-xs text-slate-500 dark:text-slate-400">{t('projects.movimientosPendientes')}</p>
                 </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                 <X className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                   <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                   <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                </div>
              ) : (
                <>
                  {/* Case 1: Income Detail */}
                  {tipoFila === 'income' && (
                    <div className="space-y-4">
                      <MovementTable movements={data?.ingresos} type="income" />
                      <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="text-right">
                          <p className="text-sm text-slate-500">{t('projects.totalCobros')}</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrencyARS(data?.total || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Case 2: Expense Detail */}
                  {tipoFila === 'expense' && (
                    <div className="space-y-4">
                       <MovementTable movements={data?.gastos} type="expense" />
                       <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="text-right">
                          <p className="text-sm text-slate-500">{t('projects.totalPagos')}</p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {formatCurrencyARS(data?.total || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Case 3: Liquidity (Net) Detail */}
                  {tipoFila === 'net' && (
                    <div className="space-y-8">
                       {/* Incomes Section */}
                       <div className="space-y-2">
                          <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                             <ArrowLeftCircle className="w-4 h-4" /> {t('projects.cobrosProximos')}
                          </h3>
                          <MovementTable movements={data?.ingresos} type="income" />
                          <div className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                            Total: {formatCurrencyARS(data?.totalIngresos || 0)}
                          </div>
                       </div>

                       {/* Expenses Section */}
                       <div className="space-y-2">
                          <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                             <ArrowRightCircle className="w-4 h-4" /> {t('projects.pagosProximos')}
                          </h3>
                          <MovementTable movements={data?.gastos} type="expense" />
                          <div className="text-right font-bold text-red-600 dark:text-red-400">
                            Total: {formatCurrencyARS(data?.totalGastos || 0)}
                          </div>
                       </div>

                       {/* Net Summary Block */}
                       <div className={cn("mt-6 p-6 rounded-xl border flex justify-between items-center shadow-sm",
                          (data?.neto || 0) >= 0 
                            ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30" 
                            : "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30"
                       )}>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{t('projects.liquidezNeta')}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                               {t('projects.cobrosMenusPagos')}
                            </p>
                          </div>
                          <div className={cn("text-3xl font-bold", 
                             (data?.neto || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          )}>
                             {formatCurrencyARS(data?.neto || 0)}
                          </div>
                       </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium text-sm"
              >
                {t('common.close')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PendingDetailModal;
