
import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

const InvestorsFiltersPanel = ({ filters, onFiltersChange }) => {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared = { status: 'all' };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setOpen(false);
  };

  const activeCount = filters.status && filters.status !== 'all' ? 1 : 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn(
          "rounded-[8px] px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 border-gray-200 dark:border-gray-700 bg-transparent h-9",
          open && "bg-gray-100 dark:bg-gray-800"
        )}>
          <Filter className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300 text-sm">{t('investors.filters')}</span>
          {activeCount > 0 && (
            <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white rounded-full bg-[#3B82F6] shadow-sm">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 rounded-[12px] shadow-lg border border-gray-200 dark:border-[#374151] bg-white dark:bg-[#111827] overflow-hidden" align="start">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
           <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('investors.filters')}</h3>
           <button 
             onClick={() => setOpen(false)}
             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Status Filter */}
          <div>
             <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
               {t('investors.status')}
             </Label>
             <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
               {[
                 { label: t('common.all'), value: 'all' },
                 { label: t('investors.active'), value: 'active' },
                 { label: t('investors.inactive'), value: 'inactive' }
               ].map(opt => (
                 <button
                   key={opt.value}
                   onClick={() => setLocalFilters({ ...localFilters, status: opt.value })}
                   className={cn(
                     "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                     localFilters.status === opt.value
                       ? "bg-white dark:bg-gray-700 text-[#3B82F6] dark:text-[#93C5FD] shadow-sm"
                       : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                   )}
                 >
                   {opt.label}
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex gap-3">
           <Button
             variant="outline"
             onClick={handleClear}
             className="flex-1 rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 h-9 text-xs"
           >
             {t('common.clearFilters')}
           </Button>
           <Button
             variant="primary"
             onClick={handleApply}
             className="flex-1 rounded-full bg-[#3B82F6] hover:bg-blue-700 text-white shadow-md h-9 text-xs"
           >
             {t('common.applyFilters')}
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InvestorsFiltersPanel;
