
import React from 'react';
import { Card } from '@/components/ui/Card';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';

const COLORS = {
  green: "border-t-emerald-500 text-emerald-600 dark:text-emerald-400",
  red: "border-t-rose-500 text-rose-600 dark:text-rose-400",
  blue: "border-t-blue-500 text-blue-600 dark:text-blue-400",
  purple: "border-t-violet-500 text-violet-600 dark:text-violet-400",
};

const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  color = 'blue', 
  currency = 'ARS',
  onViewComposition,
  loading = false
}) => {
  const format = currency === 'USD' ? formatCurrencyUSD : formatCurrencyARS;

  return (
    <Card className={cn(
      "relative overflow-hidden border-t-4 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-900 border-x-slate-100 border-b-slate-100 dark:border-x-slate-800 dark:border-b-slate-800",
      COLORS[color]?.split(' ')[0]
    )}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase text-[10px]">
            {title}
          </p>
        </div>
        
        <div className="flex flex-col gap-1">
          {loading ? (
             <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
             <h3 className={cn("text-2xl font-bold tracking-tight", COLORS[color]?.split(' ').slice(1).join(' '))}>
               {format(value)}
             </h3>
          )}
          
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {onViewComposition && !loading && (
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50">
            <button 
              onClick={onViewComposition}
              className="group flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Ver composición
              <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KPICard;
