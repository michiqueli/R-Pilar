
import React from 'react';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';

const VatSummary = ({ netAmount, vatAmount, totalAmount, currency, vatIncluded }) => {
  const format = (val) => new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: currency || 'ARS',
    minimumFractionDigits: 2 
  }).format(val || 0);

  return (
    <div 
      className={cn(
        "bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-2 shadow-sm"
      )}
      style={{ borderRadius: tokens.radius.card }}
    >
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span>Neto Gravado</span>
        <span className="font-medium">{format(netAmount)}</span>
      </div>
      
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span>IVA {vatIncluded ? '(Incluido)' : '(Agregado)'}</span>
        <span className="font-medium">{format(vatAmount)}</span>
      </div>
      
      <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Total Final</span>
        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{format(totalAmount)}</span>
      </div>
    </div>
  );
};

export default VatSummary;
