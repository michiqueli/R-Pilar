
import React from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';

const COLORS = [
  'bg-blue-500',   // #3b82f6
  'bg-emerald-500', // #10b981
  'bg-amber-500',   // #f59e0b
  'bg-violet-500'   // #8b5cf6
];

const BarraComposicion = ({ datos = [], total = 0, titulo, moneda = 'ARS' }) => {
  if (!datos || datos.length === 0 || total === 0) {
    return (
      <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-400">
        Sin datos
      </div>
    );
  }

  // Take top 3 + Others
  const top3 = datos.slice(0, 3);
  const others = datos.slice(3);
  
  const othersTotal = others.reduce((acc, curr) => acc + curr.monto, 0);
  
  const displayItems = [...top3];
  if (othersTotal > 0) {
    displayItems.push({ nombre: 'Otros', monto: othersTotal });
  }

  const format = moneda === 'USD' ? formatCurrencyUSD : formatCurrencyARS;

  return (
    <div className="w-full space-y-2">
      <div className="flex w-full h-4 rounded-full overflow-hidden shadow-sm">
        {displayItems.map((item, index) => {
          const percentage = (item.monto / total) * 100;
          if (percentage < 0.5) return null; // Hide too small segments

          return (
            <TooltipProvider key={index}>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div 
                    className={`${COLORS[index % COLORS.length]} hover:opacity-80 transition-opacity cursor-pointer h-full`}
                    style={{ width: `${percentage}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white border-none text-xs">
                  <p className="font-bold mb-1">{item.nombre}</p>
                  <p>{format(item.monto)} — {percentage.toFixed(1)}%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {displayItems.map((item, index) => {
           const percentage = (item.monto / total) * 100;
           return (
             <div key={index} className="flex items-center gap-1.5">
               <div className={`w-2 h-2 rounded-full ${COLORS[index % COLORS.length]}`} />
               <span className="text-slate-600 dark:text-slate-400 truncate max-w-[100px]" title={item.nombre}>
                 {item.nombre}
               </span>
               <span className="font-medium text-slate-900 dark:text-slate-200">
                 {percentage.toFixed(0)}%
               </span>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default BarraComposicion;
