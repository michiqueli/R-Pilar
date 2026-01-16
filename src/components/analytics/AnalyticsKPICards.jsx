
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, PiggyBank } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

const KPICard = ({ title, icon: Icon, valueARS, valueUSD, bgColor, iconColor, valueColorClass, showARS, showUSD }) => {
  return (
    <motion.div 
      whileHover={{ translateY: -2 }}
      className="bg-white dark:bg-[#111827] rounded-[12px] border border-gray-200 dark:border-[#374151] shadow-sm hover:shadow-md p-4 transition-all duration-150 ease-out flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-3">
         <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColor)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
         </div>
      </div>
      
      <p className="text-[12px] font-normal text-gray-500 dark:text-gray-400 mb-1">
        {title}
      </p>

      <div className="space-y-1">
        {showARS && (
          <div className="flex items-baseline justify-between">
             <span className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">ARS</span>
             <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", valueColorClass)}>
               {valueARS}
             </span>
          </div>
        )}
        {showUSD && (
          <div className="flex items-baseline justify-between">
             <span className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">USD</span>
             <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", valueColorClass)}>
               {valueUSD}
             </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

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
    if (val > 0) return "text-[#10B981] dark:text-[#6EE7B7]"; // Green
    if (val < 0) return "text-[#EF4444] dark:text-[#FCA5A5]"; // Red
    return "text-[#9CA3AF] dark:text-[#9CA3AF]"; // Gray
  };

  const getNeutralColor = (val) => {
     if (val === 0) return "text-[#9CA3AF] dark:text-[#9CA3AF]";
     return "text-[#111827] dark:text-white"; 
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
      <KPICard 
        title={t('analytics.income')}
        icon={TrendingUp}
        valueARS={formatMoney(incomeARS, 'ARS')}
        valueUSD={formatMoney(incomeUSD, 'USD')}
        bgColor="bg-[#EFF6FF] dark:bg-blue-900/20"
        iconColor="text-[#3B82F6] dark:text-[#60A5FA]"
        valueColorClass={getValueColor(1)} // Always positive/neutral logic for Income display? "green #10B981 if >0"
        showARS={showARS}
        showUSD={showUSD}
      />

      {/* 2. Expenses */}
      <KPICard 
        title={t('analytics.expenses')}
        icon={TrendingDown}
        valueARS={formatMoney(expenseARS, 'ARS')}
        valueUSD={formatMoney(expenseUSD, 'USD')}
        bgColor="bg-[#FEE2E2] dark:bg-red-900/20"
        iconColor="text-[#EF4444] dark:text-[#F87171]"
        valueColorClass="text-[#EF4444] dark:text-[#FCA5A5]" // Red if > 0
        showARS={showARS}
        showUSD={showUSD}
      />

      {/* 3. Net Result */}
      <KPICard 
        title={t('analytics.netResult')}
        icon={Activity}
        valueARS={formatMoney(netResultARS, 'ARS')}
        valueUSD={formatMoney(netResultUSD, 'USD')}
        bgColor="bg-[#ECFDF5] dark:bg-green-900/20"
        iconColor="text-[#10B981] dark:text-[#34D399]"
        valueColorClass={getValueColor(netResultARS)} // Dynamic based on result
        showARS={showARS}
        showUSD={showUSD}
      />

      {/* 4. VAT Income */}
      <KPICard 
        title={t('analytics.vatIncome')}
        icon={PiggyBank}
        valueARS={formatMoney(vatIncomeARS, 'ARS')}
        valueUSD={formatMoney(vatIncomeUSD, 'USD')}
        bgColor="bg-[#F3E8FF] dark:bg-purple-900/20"
        iconColor="text-[#A855F7] dark:text-[#C084FC]"
        valueColorClass={getNeutralColor(vatIncomeARS)}
        showARS={showARS}
        showUSD={showUSD}
      />

      {/* 5. VAT Expenses */}
      <KPICard 
        title={t('analytics.vatExpenses')}
        icon={PiggyBank}
        valueARS={formatMoney(vatExpenseARS, 'ARS')}
        valueUSD={formatMoney(vatExpenseUSD, 'USD')}
        bgColor="bg-[#FEF3C7] dark:bg-yellow-900/20"
        iconColor="text-[#D97706] dark:text-[#FBBF24]"
        valueColorClass={getNeutralColor(vatExpenseARS)}
        showARS={showARS}
        showUSD={showUSD}
      />
    </div>
  );
};

export default AnalyticsKPICards;
