
import React from 'react';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

const AnalyticsControlBar = ({ 
  projects, 
  selectedProject, 
  onProjectChange, 
  years, 
  selectedYear, 
  onYearChange, 
  currencies, 
  selectedCurrency, 
  onCurrencyChange 
}) => {
  const { t } = useTheme();

  return (
    <div className="rounded-[12px] border border-gray-200 dark:border-[#374151] bg-gray-50 dark:bg-[#111827] shadow-sm p-3 flex flex-col md:flex-row items-center gap-2 h-auto md:h-12 w-full mb-6">
      
      {/* 1. Project Selector */}
      <div className="w-full md:w-auto md:min-w-[240px]">
         <select
           value={selectedProject}
           onChange={(e) => onProjectChange(e.target.value)}
           className="w-full bg-transparent border-none focus:ring-2 focus:ring-[#3B82F6] rounded-[8px] text-sm font-medium text-gray-900 dark:text-white px-3 py-1.5 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
         >
           <option value="ALL">{t('analytics.allProjects')}</option>
           {projects.map(p => (
             <option key={p.id} value={p.id}>{p.name}</option>
           ))}
         </select>
      </div>

      {/* Separator */}
      <div className="w-full md:w-px h-px md:h-6 bg-gray-200 dark:bg-gray-700 hidden md:block mx-1"></div>

      {/* 2. Year Selector */}
      <div className="w-full md:w-auto">
         <select
           value={selectedYear}
           onChange={(e) => onYearChange(e.target.value)}
           className="w-full bg-transparent border-none focus:ring-2 focus:ring-[#3B82F6] rounded-[8px] text-sm font-medium text-gray-900 dark:text-white px-3 py-1.5 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
         >
           {years.map(y => (
             <option key={y} value={y}>{y}</option>
           ))}
         </select>
      </div>

      {/* Separator */}
      <div className="w-full md:w-px h-px md:h-6 bg-gray-200 dark:bg-gray-700 hidden md:block mx-1"></div>

      {/* 3. Currency Selector */}
      <div className="w-full md:w-auto">
         <select
           value={selectedCurrency}
           onChange={(e) => onCurrencyChange(e.target.value)}
           className="w-full bg-transparent border-none focus:ring-2 focus:ring-[#3B82F6] rounded-[8px] text-sm font-medium text-gray-900 dark:text-white px-3 py-1.5 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
         >
           <option value="ALL">{t('analytics.allCurrencies')}</option>
           <option value="ARS">ARS</option>
           <option value="USD">USD</option>
         </select>
      </div>
    </div>
  );
};

export default AnalyticsControlBar;
