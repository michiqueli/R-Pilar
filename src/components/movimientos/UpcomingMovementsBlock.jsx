
import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { movimientoService } from '@/services/movimientoService';
import { formatDate, formatCurrencyARS } from '@/lib/formatUtils';
import { useNavigate } from 'react-router-dom';

const UpcomingMovementsBlock = ({ projectId }) => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inc, exp] = await Promise.all([
        movimientoService.getPendingIncome(projectId),
        movimientoService.getPendingExpense(projectId)
      ]);
      setIncomes(inc.slice(0, 5));
      setExpenses(exp.slice(0, 5));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const MovementTable = ({ title, items, type, color }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col h-full shadow-sm">
      <div className={`px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center ${type === 'income' ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-red-50/50 dark:bg-red-900/10'}`}>
         <h3 className={`font-semibold text-sm text-gray-700 dark:text-gray-300`}>{title}</h3>
         <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8 rounded-full hover:bg-white/50 dark:hover:bg-black/20"
            onClick={() => navigate('/movimientos')}
          >
            {t('movimientos.ver_todos')}
         </Button>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
              <th className="px-6 py-3 font-semibold">{t('common.description')}</th>
              <th className="px-6 py-3 font-semibold whitespace-nowrap">{t('movimientos.due_date')}</th>
              <th className="px-6 py-3 font-semibold text-right">{t('common.amount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {items.map((item) => (
              <tr 
                key={item.id} 
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                onClick={() => navigate(type === 'income' ? `/incomes/${item.id}` : `/expenses/${item.id}`)}
              >
                <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                  {item.description}
                </td>
                <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.date)}
                  </div>
                </td>
                <td className={`px-6 py-3 text-right font-bold ${color}`}>
                  {formatCurrencyARS(item.amount_ars)}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-slate-400 italic">
                  No hay movimientos pendientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase">{t('movimientos.subtotal')}</span>
        <span className={`font-bold ${color}`}>
          {formatCurrencyARS(items.reduce((s, i) => s + (parseFloat(i.amount_ars) || 0), 0))}
        </span>
      </div>
    </div>
  );

  if (loading) return <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-900 animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
         <AlertCircle className="w-5 h-5 text-blue-600" />
         <h3 className="font-bold text-slate-800 dark:text-white">{t('movimientos.proximos_movimientos')}</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MovementTable 
          title={t('movimientos.pendiente_cobrar')} 
          items={incomes} 
          type="income" 
          color="text-green-600" 
        />
        <MovementTable 
          title={t('movimientos.pendiente_pagar')} 
          items={expenses} 
          type="expense" 
          color="text-red-600" 
        />
      </div>
    </div>
  );
};

export default UpcomingMovementsBlock;
