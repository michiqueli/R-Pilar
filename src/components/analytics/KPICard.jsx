
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import KpiCard from '@/components/ui/KpiCard';

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
  const tone = color === 'green' ? 'emerald' : color === 'red' ? 'red' : color === 'purple' ? 'purple' : 'blue';

  return (
    <KpiCard
      title={title}
      value={loading ? '...' : format(value)}
      description={subtitle}
      tone={tone}
      showBar
    >
      {loading ? (
        <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
      ) : (
        <>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {format(value)}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </>
      )}
      {onViewComposition && !loading && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center">
          <button
            onClick={onViewComposition}
            className="group flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Ver composición
            <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </KpiCard>
  );
};

export default KPICard;
