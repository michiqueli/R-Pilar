
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { movimientoService } from '@/services/movimientoService';
import { formatDate, formatCurrencyARS } from '@/lib/formatUtils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const BalanceDetailDrawer = ({ isOpen, onClose, projectId, type = 'monthly', initialMonth = new Date().getMonth(), initialYear = new Date().getFullYear() }) => {
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

  const TableBlock = ({ items, type, color }) => (
    <div className={`flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800`}>
      <div className={`p-4 border-b border-slate-200 dark:border-slate-800 font-bold flex items-center gap-2 ${color}`}>
        {type === 'ingreso' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {type === 'ingreso' ? t('movimientos.ingresos') : t('movimientos.gastos')}
        <span className="ml-auto bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-sm shadow-sm">
          {items.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {items.map(item => (
          <div 
            key={item.id} 
            className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => window.open(item.type === 'gasto' ? `/expenses/${item.id}` : `/incomes/${item.id}`, '_self')}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-sm text-slate-700 dark:text-slate-200 line-clamp-2">{item.description}</span>
              <span className={`font-bold text-sm ${type === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyARS(item.amount_ars)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>{formatDate(item.date)}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 font-medium">Ver detalle &rarr;</span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm italic">No hay movimientos</div>
        )}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center">
        <span className="text-sm font-bold text-slate-500 uppercase">{t('movimientos.subtotal')}</span>
        <span className={`text-lg font-bold ${type === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrencyARS(type === 'ingreso' ? totalIngresos : totalGastos)}
        </span>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full max-w-4xl sm:max-w-4xl flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
           <div className="flex items-center justify-between pr-8">
             <div>
               <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white">
                 {type === 'monthly' ? t('movimientos.balance_mensual') : t('movimientos.balance_total')}
               </SheetTitle>
               {type === 'monthly' && (
                 <div className="flex items-center gap-4 mt-2">
                    <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0 rounded-full">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 w-32 text-center">
                      {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0 rounded-full">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                 </div>
               )}
             </div>
           </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden p-6 bg-slate-50/50 dark:bg-slate-900/50">
           {loading ? (
             <div className="flex items-center justify-center h-full animate-pulse text-slate-400">Cargando datos...</div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <TableBlock items={data.gastos} type="gasto" color="text-red-600" />
                <TableBlock items={data.ingresos} type="ingreso" color="text-green-600" />
             </div>
           )}
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-lg z-10">
           <div>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Balance Neto</p>
             <p className="text-xs text-slate-400">Ingresos - Gastos</p>
           </div>
           <div className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
             {balance > 0 ? '+' : ''} {formatCurrencyARS(balance)}
           </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BalanceDetailDrawer;
