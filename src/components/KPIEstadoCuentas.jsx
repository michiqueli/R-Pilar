
import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrencyARS } from '@/lib/formatUtils';

const KPIEstadoCuentas = ({ estadoCuentas = [], horizonte = 30, onViewRisks }) => {
  const cuentasEnRiesgo = estadoCuentas.filter(c => c.enRiesgo);
  const isAllGood = cuentasEnRiesgo.length === 0;

  return (
    <div 
      className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col h-full shadow-sm cursor-pointer transition-shadow hover:shadow-md group"
      onClick={onViewRisks}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Estado de Cuentas</h3>
        <span className="text-xs text-gray-400">Horizonte {horizonte}d</span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {isAllGood ? (
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-lg">Todo OK</h4>
            <p className="text-xs text-gray-500">Todas las cuentas proyectan saldo positivo.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
               <AlertTriangle className="w-8 h-8 shrink-0" />
               <div className="leading-tight">
                 <h4 className="font-bold text-lg">{cuentasEnRiesgo.length} Cuentas en Riesgo</h4>
                 <p className="text-xs text-red-600/80 dark:text-red-400/80">Proyectan déficit en {horizonte} días</p>
               </div>
            </div>
            
            <div className="space-y-2">
               {cuentasEnRiesgo.slice(0, 2).map(cuenta => (
                 <div key={cuenta.id} className="bg-red-50 dark:bg-red-900/10 rounded-lg p-2.5 border border-red-100 dark:border-red-900/20">
                    <div className="flex justify-between items-center text-xs mb-1">
                       <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{cuenta.titulo}</span>
                       <span className="text-red-600 font-bold">{formatCurrencyARS(cuenta.saldoProyectado)}</span>
                    </div>
                    <div className="w-full bg-red-200 dark:bg-red-900/40 h-1 rounded-full overflow-hidden">
                       <div className="bg-red-500 h-full w-full animate-pulse"></div>
                    </div>
                 </div>
               ))}
               {cuentasEnRiesgo.length > 2 && (
                 <p className="text-xs text-center text-gray-500">
                   + {cuentasEnRiesgo.length - 2} otras cuentas críticas
                 </p>
               )}
            </div>
          </div>
        )}
      </div>
      
      {!isAllGood && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <span className="text-xs font-medium text-red-600 flex items-center group-hover:underline">
            Ver detalles <ArrowRight className="w-3 h-3 ml-1" />
          </span>
        </div>
      )}
    </div>
  );
};

export default KPIEstadoCuentas;
