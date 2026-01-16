
import React from 'react';
import { Info } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

const FXTooltip = ({ rate, date, originalAmount, calculatedAmount, currency }) => {
  if (currency === 'ARS' || !rate) return null;

  return (
    <div className="group relative inline-flex items-center ml-1 align-middle">
      <Info className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
      
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
        <div className="space-y-1">
          <p className="font-semibold text-blue-200 border-b border-white/10 pb-1 mb-1">
            Detalle de Conversión
          </p>
          <div className="flex justify-between">
            <span className="text-slate-400">Tasa (FX):</span>
            <span className="font-mono">${rate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Fecha FX:</span>
            <span>{formatDate(date)}</span>
          </div>
          {originalAmount && (
             <div className="mt-1 pt-1 border-t border-white/10 font-mono text-center">
               USD {originalAmount} × {rate} <br/> = <span className="text-green-400">ARS {calculatedAmount}</span>
             </div>
          )}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  );
};

export default FXTooltip;
