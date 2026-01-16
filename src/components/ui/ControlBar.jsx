
import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

const ControlBar = ({ 
  searchPlaceholder, 
  onSearch, 
  searchTerm,
  children, // For custom filters/buttons
  viewMode, 
  onViewChange 
}) => {
  const { t } = useTheme();

  return (
    <div 
       className={cn(
         "bg-white dark:bg-slate-900 p-2 pl-4 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-2 items-center w-full",
         "transition-all duration-200"
       )}
    >
       {/* Search Input Area */}
       <div className="w-full md:flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
             type="text" 
             placeholder={searchPlaceholder || t('common.search')}
             className="w-full pl-9 pr-4 py-2 bg-transparent border-none focus:outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
             value={searchTerm}
             onChange={(e) => onSearch(e.target.value)}
          />
       </div>
       
       <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden md:block mx-1"></div>

       {/* Filters & Actions Area */}
       <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto md:overflow-visible pr-2 no-scrollbar">
          {children}
       </div>

       {/* Spacer for responsive layout if needed */}
       {viewMode && (
         <>
           <div className="flex-1 md:hidden"></div>
           
           {/* View Toggle */}
           <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex items-center gap-1 shrink-0">
              <button 
                onClick={() => onViewChange('table')}
                className={cn(
                  "p-2 rounded-full transition-all",
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
                title={t('common.table')}
              >
                 <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onViewChange('grid')}
                className={cn(
                  "p-2 rounded-full transition-all",
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
                title={t('common.cards')}
              >
                 <LayoutGrid className="w-4 h-4" />
              </button>
           </div>
         </>
       )}
    </div>
  );
};

export default ControlBar;
