
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { investmentService } from '@/services/investmentService';
import { formatCurrencyARS, formatDate } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';
import { Button } from '@/components/ui/Button';
import InvestmentMovementModal from '@/components/movimientos/InvestmentMovementModal';
import { useToast } from '@/components/ui/use-toast';

const InvestmentDetailModal = ({ isOpen, onClose, projectId }) => {
  const { t } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState([]);
  const [movementModalType, setMovementModalType] = useState(null); // 'INVERSION_RECIBIDA' | 'DEVOLUCION_INVERSION'

  useEffect(() => {
    if (isOpen && projectId) {
      fetchMovements();
    }
  }, [isOpen, projectId]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const data = await investmentService.getInvestmentMovements(projectId);
      setMovements(data);
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

  const handleSuccess = () => {
    setMovementModalType(null);
    fetchMovements();
  };

  // Filter Data
  const aportes = movements.filter(m => m.tipo === 'INVERSION_RECIBIDA' || m.tipo === 'APORTE');
  const devoluciones = movements.filter(m => m.tipo === 'DEVOLUCION_INVERSION' || m.tipo === 'DEVOLUCION');

  const totalAportes = aportes.reduce((sum, m) => sum + Number(m.monto_ars || 0), 0);
  const totalDevoluciones = devoluciones.reduce((sum, m) => sum + Number(m.monto_ars || 0), 0);
  const saldoNeto = totalAportes - totalDevoluciones;

  const MovementList = ({ items, type }) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-white/50 dark:bg-black/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-sm italic">
            {type === 'aporte' ? t('projects.noAportesRegistrados') : t('projects.noDevoluciones')}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={cn(
              "p-3 rounded-lg border shadow-sm transition-all hover:shadow-md bg-white dark:bg-slate-900",
              type === 'aporte' 
                ? "border-l-4 border-l-emerald-500 border-slate-100 dark:border-slate-800" 
                : "border-l-4 border-l-red-500 border-slate-100 dark:border-slate-800"
            )}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {item.investor_name}
              </span>
              <span className={cn(
                "font-mono font-bold text-sm",
                type === 'aporte' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {type === 'aporte' ? '+' : '-'} {formatCurrencyARS(item.monto_ars)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(item.fecha)}</span>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                item.estado === 'COMPLETADO' || item.estado === 'CONFIRMADO' || item.estado === 'PAGADO' || item.estado === 'COBRADO'
                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              )}>
                {item.estado}
              </span>
            </div>
          </div>
        ))}
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
            className="bg-white dark:bg-slate-950 w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 relative max-h-[90vh]"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
               <div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    {t('projects.detalleInversiones')}
                 </h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400">{t('projects.resumenAportesYDevoluciones')}</p>
               </div>
               
               <div className="flex items-center gap-3">
                  {/* Desktop Actions */}
                  <div className="hidden sm:flex gap-2">
                    <Button 
                       size="sm" 
                       onClick={() => setMovementModalType('INVERSION_RECIBIDA')}
                       className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm"
                    >
                       <TrendingUp className="w-4 h-4 mr-2" /> {t('projects.agregarAporte')}
                    </Button>
                    <Button 
                       size="sm" 
                       onClick={() => setMovementModalType('DEVOLUCION_INVERSION')}
                       className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
                    >
                       <TrendingDown className="w-4 h-4 mr-2" /> {t('projects.agregarDevolucion')}
                    </Button>
                  </div>
                  
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors ml-2">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
               </div>
            </div>

            {/* Mobile Actions (Visible only on small screens) */}
            <div className="sm:hidden px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto">
               <Button 
                  size="sm" 
                  onClick={() => setMovementModalType('INVERSION_RECIBIDA')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm flex-1 whitespace-nowrap"
               >
                  <TrendingUp className="w-4 h-4 mr-2" /> Aporte
               </Button>
               <Button 
                  size="sm" 
                  onClick={() => setMovementModalType('DEVOLUCION_INVERSION')}
                  className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm flex-1 whitespace-nowrap"
               >
                  <TrendingDown className="w-4 h-4 mr-2" /> Devolución
               </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                   <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                   <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                   {/* Left Panel: Aportes */}
                   <div className="flex flex-col h-full bg-emerald-50/40 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden">
                      <div className="p-4 border-b border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20">
                         <h3 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                           <TrendingUp className="w-5 h-5" /> {t('projects.aportes')}
                         </h3>
                         <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-full">
                           {aportes.length}
                         </span>
                      </div>
                      <div className="p-4 flex-1 overflow-hidden">
                        <MovementList items={aportes} type="aporte" />
                      </div>
                      <div className="p-4 bg-emerald-100/50 dark:bg-emerald-900/30 border-t border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Total Aportes</span>
                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                          {formatCurrencyARS(totalAportes)}
                        </span>
                      </div>
                   </div>

                   {/* Right Panel: Devoluciones */}
                   <div className="flex flex-col h-full bg-red-50/40 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                      <div className="p-4 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
                         <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                           <TrendingDown className="w-5 h-5" /> {t('projects.devoluciones')}
                         </h3>
                         <span className="px-2 py-0.5 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs font-bold rounded-full">
                           {devoluciones.length}
                         </span>
                      </div>
                      <div className="p-4 flex-1 overflow-hidden">
                        <MovementList items={devoluciones} type="devolucion" />
                      </div>
                      <div className="p-4 bg-red-100/50 dark:bg-red-900/30 border-t border-red-100 dark:border-red-900/30 flex justify-between items-center">
                        <span className="text-sm font-medium text-red-800 dark:text-red-400">Total Devoluciones</span>
                        <span className="text-xl font-bold text-red-700 dark:text-red-300">
                          {formatCurrencyARS(totalDevoluciones)}
                        </span>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Footer / Net Balance */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center relative shrink-0">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                 {t('projects.saldoNetoInversion')}
               </span>
               <div className={cn(
                 "text-4xl sm:text-5xl font-extrabold tracking-tight",
                 saldoNeto > 0 ? "text-emerald-600 dark:text-emerald-400" : 
                 saldoNeto < 0 ? "text-red-600 dark:text-red-400" : 
                 "text-slate-600 dark:text-slate-400"
               )}>
                 {saldoNeto > 0 ? '+' : ''} {formatCurrencyARS(saldoNeto)}
               </div>
            </div>
            
            {/* Movement Create Modal */}
            {movementModalType && (
              <InvestmentMovementModal 
                 isOpen={!!movementModalType}
                 onClose={() => setMovementModalType(null)}
                 onSuccess={handleSuccess}
                 type={movementModalType}
                 preselectedProjectId={projectId}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvestmentDetailModal;
