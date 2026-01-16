
import React from 'react';
import { TrendingUp, TrendingDown, Activity, PiggyBank } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import KpiCard from '@/components/ui/KpiCard';

const AnalyticsKPICards = ({ kpiData, selectedCurrency }) => {
  const { t } = useTheme();

  const showARS = selectedCurrency === 'ALL' || selectedCurrency === 'ARS';
  const showUSD = selectedCurrency === 'ALL' || selectedCurrency === 'USD';

  const formatMoney = (amount, currency) => {
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getValueColor = (val) => {
    if (val > 0) return "text-emerald-600 dark:text-emerald-300";
    if (val < 0) return "text-red-600 dark:text-red-300";
    return "text-slate-500 dark:text-slate-400";
  };

  const getNeutralColor = (val) => {
     if (val === 0) return "text-slate-500 dark:text-slate-400";
     return "text-slate-900 dark:text-white";
  };
  
  // Data Extraction
  const { 
    incomeARS, incomeUSD, 
    expenseARS, expenseUSD, 
    vatIncomeARS, vatIncomeUSD, 
    vatExpenseARS, vatExpenseUSD 
  } = kpiData;

  const netResultARS = incomeARS - expenseARS;
  const netResultUSD = incomeUSD - expenseUSD;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {/* 1. Income */}
      <KpiCard
        title={t('analytics.income')}
        icon={TrendingUp}
        tone="emerald"
      >
        <div className="space-y-2">
          {showARS && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">ARS</span>
              <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", getValueColor(1))}>
                {formatMoney(incomeARS, 'ARS')}
              </span>
            </div>
          )}
          {showUSD && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">USD</span>
              <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", getValueColor(1))}>
                {formatMoney(incomeUSD, 'USD')}
              </span>
            </div>
          )}
        </div>
      </KpiCard>

      {/* 2. Expenses */}
      <KpiCard
        title={t('analytics.expenses')}
        icon={TrendingDown}
        tone="red"
      >
        <div className="space-y-2">
          {showARS && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">ARS</span>
              <span className="text-[18px] font-bold tabular-nums tracking-tight text-red-600 dark:text-red-300">
                {formatMoney(expenseARS, 'ARS')}
              </span>
            </div>
          )}
          {showUSD && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">USD</span>
              <span className="text-[18px] font-bold tabular-nums tracking-tight text-red-600 dark:text-red-300">
                {formatMoney(expenseUSD, 'USD')}
              </span>
            </div>
          )}
        </div>
      </KpiCard>

      {/* 3. Net Result */}
      <KpiCard
        title={t('analytics.netResult')}
        icon={Activity}
        tone={netResultARS >= 0 ? 'blue' : 'orange'}
      >
        <div className="space-y-2">
          {showARS && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">ARS</span>
              <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", getValueColor(netResultARS))}>
                {formatMoney(netResultARS, 'ARS')}
              </span>
            </div>
          )}
          {showUSD && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">USD</span>
              <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", getValueColor(netResultUSD))}>
                {formatMoney(netResultUSD, 'USD')}
              </span>
            </div>
          )}
        </div>
      </KpiCard>

      {/* 4. VAT Income */}
      <KpiCard
        title={t('analytics.vatIncome')}
        icon={PiggyBank}
        tone="purple"
      >
        <div className="space-y-2">
          {showARS && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">ARS</span>
              <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", getNeutralColor(vatIncomeARS))}>
                {formatMoney(vatIncomeARS, 'ARS')}
              </span>
            </div>
          )}
          {showUSD && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">USD</span>
              <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", getNeutralColor(vatIncomeUSD))}>
                {formatMoney(vatIncomeUSD, 'USD')}
              </span>
            </div>
          )}
        </div>
      </KpiCard>

      {/* 5. VAT Expenses */}
      <KpiCard
        title={t('analytics.vatExpenses')}
        icon={PiggyBank}
        tone="amber"
      >
        <div className="space-y-2">
          {showARS && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">ARS</span>
              <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", getNeutralColor(vatExpenseARS))}>
                {formatMoney(vatExpenseARS, 'ARS')}
              </span>
            </div>
          )}
          {showUSD && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">USD</span>
              <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", getNeutralColor(vatExpenseUSD))}>
                {formatMoney(vatExpenseUSD, 'USD')}
              </span>
            </div>
          )}
        </div>
      </KpiCard>
    </div>
  );
};

export default AnalyticsKPICards;
