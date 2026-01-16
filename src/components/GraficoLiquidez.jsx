
import React from 'react';
import { BarChart3, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatCurrencyARS } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';

const GraficoLiquidez = ({ 
  datos = { cuentas: [] }, 
  horizonte, 
  onHorizonteChange,
  soloEnRiesgo,
  onSoloEnRiesgoChange
}) => {
  
  const cuentasToShow = soloEnRiesgo 
    ? (datos.cuentas || []).filter(c => c.enRiesgo) 
    : (datos.cuentas || []);

  const maxVal = Math.max(
    ...cuentasToShow.map(c => Math.abs(c.saldoProyectado || 0)),
    1000 // min scale
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
           <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
             <BarChart3 className="w-5 h-5 text-blue-500" />
             Liquidez Proyectada
           </h3>
           <p className="text-sm text-gray-500 mt-1">
             Proyección de saldo disponible por cuenta tras movimientos pendientes.
           </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center gap-2 mr-2">
              <Switch id="risk-mode" checked={soloEnRiesgo} onCheckedChange={onSoloEnRiesgoChange} />
              <Label htmlFor="risk-mode" className="text-xs cursor-pointer">Solo Riesgo</Label>
           </div>
           
           <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              {[7, 30, 60, 90].map(days => (
                 <button
                   key={days}
                   onClick={() => onHorizonteChange(days)}
                   className={cn(
                     "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                     horizonte === days 
                       ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" 
                       : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                   )}
                 >
                   {days}d
                 </button>
              ))}
           </div>
        </div>
      </div>

      {/* Custom Bar Chart using Flexbox/Grid */}
      <div className="relative min-h-[300px] border-l border-b border-gray-200 dark:border-gray-700 ml-4 pb-2 pr-4">
         {/* Zero Line */}
         <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300 dark:bg-gray-600 z-0 border-t border-dashed border-gray-400"></div>
         <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400 w-10 text-right">0</div>
         
         {/* Content */}
         {cuentasToShow.length === 0 ? (
           <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
             No hay datos para mostrar con los filtros actuales.
           </div>
         ) : (
           <div className="absolute inset-0 flex items-end justify-around px-4 z-10 gap-2 sm:gap-4 h-full">
              {cuentasToShow.map((cuenta, idx) => {
                 const isPositive = (cuenta.saldoProyectado || 0) >= 0;
                 // Calculate height percentage relative to maxVal
                 // Max height is 50% of container for positive, 50% for negative
                 // The container center is 0.
                 const val = cuenta.saldoProyectado || 0;
                 const absPercentage = Math.min((Math.abs(val) / maxVal) * 45, 45); // Limit to 45% to leave space
                 
                 return (
                   <div key={cuenta.id || idx} className="flex flex-col items-center justify-center h-full w-full max-w-[60px] group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 pointer-events-none">
                         <div className="font-bold">{cuenta.titulo}</div>
                         <div>Saldo: {formatCurrencyARS(val)}</div>
                         <div className="text-[10px] text-gray-300">Pagos: {formatCurrencyARS(cuenta.pagosProyectados)}</div>
                         <div className="text-[10px] text-gray-300">Cobros: {formatCurrencyARS(cuenta.cobrosProyectados)}</div>
                      </div>

                      {/* Positive Bar */}
                      <div className="flex-1 w-full flex items-end justify-center pb-[1px]">
                         {isPositive && val !== 0 && (
                            <div 
                              className="w-full sm:w-8 bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-all relative group-hover:shadow-lg"
                              style={{ height: `${absPercentage}%` }}
                            ></div>
                         )}
                      </div>
                      
                      {/* Axis Spacer */}
                      <div className="h-[2px] w-full bg-transparent"></div>

                      {/* Negative Bar */}
                      <div className="flex-1 w-full flex items-start justify-center pt-[1px]">
                         {!isPositive && val !== 0 && (
                            <div 
                              className="w-full sm:w-8 bg-red-500 hover:bg-red-600 rounded-b-sm transition-all relative group-hover:shadow-lg"
                              style={{ height: `${absPercentage}%` }}
                            >
                               <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                               </div>
                            </div>
                         )}
                      </div>

                      {/* Label */}
                      <div className="absolute bottom-0 translate-y-full pt-2 text-[10px] text-gray-500 truncate w-full text-center" title={cuenta.titulo}>
                        {cuenta.titulo}
                      </div>
                   </div>
                 );
              })}
           </div>
         )}
      </div>
      
      {/* Legend / Summary Footer */}
      <div className="mt-12 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
         <div>
            <span className="text-xs text-gray-500 uppercase">Cuentas Analizadas</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{datos.cuentas?.length || 0}</p>
         </div>
         <div>
            <span className="text-xs text-gray-500 uppercase">En Riesgo</span>
            <p className={`text-xl font-bold ${(datos.cuentas || []).some(c => c.enRiesgo) ? 'text-red-600' : 'text-green-600'}`}>
               {(datos.cuentas || []).filter(c => c.enRiesgo).length}
            </p>
         </div>
         <div>
            <span className="text-xs text-gray-500 uppercase">Peor Saldo Proyectado</span>
            <p className="text-xl font-bold font-mono text-gray-900 dark:text-white">
              {formatCurrencyARS(Math.min(...(datos.cuentas || []).map(c => c.saldoProyectado || 0)))}
            </p>
         </div>
      </div>
    </div>
  );
};

export default GraficoLiquidez;
