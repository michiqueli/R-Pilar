
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { ArrowUpCircle, ArrowDownCircle, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const InvestmentActivityTimeline = ({ recentActivity = [], onViewAll, onAdd }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 dark:text-white">Actividad Reciente</h3>
        <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs text-blue-500 hover:text-blue-600">
          Ver todos <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {recentActivity.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm py-8 gap-3">
            <p>No hay movimientos registrados</p>
            {onAdd && (
                <Button size="sm" onClick={onAdd} className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-full">
                    <Plus className="w-4 h-4 mr-2" /> Registrar inversión
                </Button>
            )}
          </div>
        ) : (
          <div className="relative space-y-6 pl-2">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />

            {recentActivity.map((mov) => {
              const isIncome = mov.type === 'INVERSION_RECIBIDA';
              return (
                <div key={mov.id} className="relative flex gap-4 group">
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 shrink-0 
                    ${isIncome ? 'border-green-100 text-green-500' : 'border-red-100 text-red-500'}`}
                  >
                    {isIncome ? <ArrowUpCircle className="w-full h-full" /> : <ArrowDownCircle className="w-full h-full" />}
                  </div>

                  <div 
                     className="flex-1 min-w-0 pb-1 cursor-pointer" 
                     onClick={() => navigate(isIncome ? `/incomes/${mov.id}` : `/expenses/${mov.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium mb-0.5">{formatDate(mov.date)}</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-500 transition-colors">
                          {isIncome ? 'Ingreso de Inversión' : 'Devolución de Inversión'}
                        </span>
                        <span 
                           className="text-xs text-slate-500 truncate hover:underline" 
                           onClick={(e) => { e.stopPropagation(); navigate(`/projects/${mov.project_id}`); }}
                        >
                           {mov.project_name || 'Proyecto desconocido'}
                        </span>
                      </div>
                      <div className="text-right">
                         <span className={`block text-sm font-bold font-mono whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '-'}{formatCurrencyUSD(mov.usd_amount)}
                         </span>
                         <span className="block text-xs text-slate-400 font-mono">
                            {formatCurrencyARS(mov.amount_ars)}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentActivityTimeline;
