
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import FilterButton from '@/components/common/FilterButton';

const InvestorsFiltersPanel = ({ filters, onFiltersChange }) => {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

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
        <FilterButton
          activeCount={activeCount}
          label={t('investors.filters')}
          isActive={open}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] md:w-[360px] p-0 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden" align="end">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
           <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{t('investors.filters')}</h3>
           <button 
             onClick={() => setOpen(false)}
             className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Status Filter */}
          <div>
             <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
               {t('investors.status')}
             </Label>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
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
                       ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                       : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                   )}
                 >
                   {opt.label}
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
           <Button
             variant="outline"
             onClick={handleClear}
             className="flex-1 rounded-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20 h-9 text-xs"
           >
             {t('common.clearFilters')}
           </Button>
           <Button
             variant="primary"
             onClick={handleApply}
             className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md h-9 text-xs"
           >
             {t('common.applyFilters')}
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InvestorsFiltersPanel;
