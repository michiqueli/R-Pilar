
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const AnalyticsTable = ({ tableData, selectedCurrency }) => {
  const { t } = useTheme();
  
  // If "ALL" is selected, we manage internal tabs. If single currency, we just show that one.
  const [internalTab, setInternalTab] = useState('both'); // 'ars', 'usd', 'both'

  // If page filter is single currency, force that tab
  const effectiveTab = selectedCurrency === 'ALL' ? internalTab : selectedCurrency.toLowerCase();

  const formatMoney = (val, currency) => {
     if (val === 0) return <span className="text-gray-400">—</span>;
     return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
       style: 'currency',
       currency: currency,
       minimumFractionDigits: 2
     }).format(val);
  };

  const getAmountColor = (val, isResult = false) => {
    if (val === 0) return "text-gray-400";
    if (val > 0) return "text-[#10B981] dark:text-[#6EE7B7]";
    if (val < 0) return isResult ? "text-[#EF4444] dark:text-[#FCA5A5]" : "text-[#EF4444] dark:text-[#FCA5A5]"; 
    return "text-gray-900 dark:text-white";
  };
  
  const getExpenseColor = (val) => {
     if (val === 0) return "text-gray-400";
     return "text-[#EF4444] dark:text-[#FCA5A5]";
  };

  const getIncomeColor = (val) => {
     if (val === 0) return "text-gray-400";
     return "text-[#10B981] dark:text-[#6EE7B7]";
  };
  
  const getResultColor = (val) => {
     if (val === 0) return "text-gray-400";
     if (val > 0) return "text-[#10B981] dark:text-[#6EE7B7]";
     return "text-[#EF4444] dark:text-[#FCA5A5]";
  };

  const renderTable = (currency) => {
     const dataKey = currency === 'ARS' ? 'ars' : 'usd';
     const totalIncome = tableData.reduce((acc, curr) => acc + curr[`income${currency}`], 0);
     const totalExpense = tableData.reduce((acc, curr) => acc + curr[`expense${currency}`], 0);
     const totalResult = tableData.reduce((acc, curr) => acc + curr[`result${currency}`], 0);

     return (
       <div className="overflow-x-auto">
         <table className="w-full text-left border-collapse">
           <thead>
             <tr className="border-b border-gray-200 dark:border-[#374151] bg-gray-50/50 dark:bg-[#1F2937]/50">
               <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('analytics.month')}</th>
               <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">{t('analytics.income')} ({currency})</th>
               <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">{t('analytics.expenses')} ({currency})</th>
               <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">{t('analytics.result')} ({currency})</th>
               <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">{t('analytics.balance')} ({currency})</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 dark:divide-[#374151]">
             {tableData.map((row, index) => (
               <motion.tr
                 key={`${currency}-${row.month || 'row'}-${index}`}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: index * 0.02 }}
                 className="hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] transition-colors duration-150 ease-out"
               >
                 <td className="py-3 px-4 text-[14px] font-medium text-gray-900 dark:text-white capitalize">
                   {row.monthLabel || row.month || '-'}
                 </td>
                 <td className={cn("py-3 px-4 text-[14px] font-semibold text-right tabular-nums", getIncomeColor(row[`income${currency}`]))}>
                   {formatMoney(row[`income${currency}`], currency)}
                 </td>
                 <td className={cn("py-3 px-4 text-[14px] font-semibold text-right tabular-nums", getExpenseColor(row[`expense${currency}`]))}>
                   {formatMoney(row[`expense${currency}`], currency)}
                 </td>
                 <td className={cn("py-3 px-4 text-[14px] font-semibold text-right tabular-nums", getResultColor(row[`result${currency}`]))}>
                   {formatMoney(row[`result${currency}`], currency)}
                 </td>
                 <td className={cn("py-3 px-4 text-[14px] font-semibold text-right tabular-nums", getResultColor(row[`balance${currency}`]))}>
                   {formatMoney(row[`balance${currency}`], currency)}
                 </td>
               </motion.tr>
             ))}
             {/* Total Row */}
             <tr className="bg-gray-50 dark:bg-[#1F2937]/50 font-bold border-t border-gray-200 dark:border-[#374151]">
                <td className="py-3 px-4 text-[14px] text-gray-900 dark:text-white">{t('analytics.total')}</td>
                <td className={cn("py-3 px-4 text-[14px] text-right tabular-nums", getIncomeColor(totalIncome))}>{formatMoney(totalIncome, currency)}</td>
                <td className={cn("py-3 px-4 text-[14px] text-right tabular-nums", getExpenseColor(totalExpense))}>{formatMoney(totalExpense, currency)}</td>
                <td className={cn("py-3 px-4 text-[14px] text-right tabular-nums", getResultColor(totalResult))}>{formatMoney(totalResult, currency)}</td>
                <td className="py-3 px-4"></td>
             </tr>
           </tbody>
         </table>
       </div>
     );
  };

  return (
    <div className="bg-white dark:bg-[#111827] rounded-[12px] border border-gray-200 dark:border-[#374151] shadow-sm overflow-hidden">
       {/* Tabs Header */}
       <div className="border-b border-gray-200 dark:border-[#374151] px-4 pt-3 pb-0 bg-gray-50/50 dark:bg-[#1F2937]/30">
          <Tabs value={effectiveTab} onValueChange={setInternalTab} className="w-full">
            <TabsList className="bg-transparent p-0 gap-6 h-auto">
              <TabsTrigger 
                 value="ars" 
                 disabled={selectedCurrency === 'USD'}
                 className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#3B82F6] data-[state=active]:text-[#3B82F6] rounded-none px-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
              >
                ARS
              </TabsTrigger>
              <TabsTrigger 
                 value="usd" 
                 disabled={selectedCurrency === 'ARS'}
                 className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#3B82F6] data-[state=active]:text-[#3B82F6] rounded-none px-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
              >
                USD
              </TabsTrigger>
              {selectedCurrency === 'ALL' && (
                <TabsTrigger 
                   value="both" 
                   className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#3B82F6] data-[state=active]:text-[#3B82F6] rounded-none px-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
                >
                  {t('analytics.both')}
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
       </div>

       {/* Content */}
       <div className="p-0">
          {effectiveTab === 'ars' && renderTable('ARS')}
          {effectiveTab === 'usd' && renderTable('USD')}
          {effectiveTab === 'both' && (
            <div className="flex flex-col">
               <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ARS
               </div>
               {renderTable('ARS')}
               <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-t border-gray-200 dark:border-[#374151]">
                  USD
               </div>
               {renderTable('USD')}
            </div>
          )}
       </div>
    </div>
  );
};

export default AnalyticsTable;
