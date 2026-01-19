
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import FilterButton from '@/components/common/FilterButton';

const ClientsFiltersPanel = ({ filters, onFiltersChange }) => {
  const { t } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const hasActiveFilters = 
    localFilters.status !== 'all' || 
    localFilters.dateRange !== 'all' || 
    localFilters.projects !== 'all';

  const activeCount = [
    filters.status !== 'all',
    filters.dateRange !== 'all',
    filters.projects !== 'all'
  ].filter(Boolean).length;

  const handleFilterChange = (key, value) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const clearFilters = () => {
    const cleared = {
      status: 'all',
      dateRange: 'all',
      projects: 'all'
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setIsOpen(false);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const RadioGroup = ({ options, value, onChange, name }) => (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
          <div className={cn(
            "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
            value === option.value 
              ? "border-blue-600 bg-blue-600" 
              : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
          )}>
            {value === option.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <input 
            type="radio" 
            name={name} 
            value={option.value} 
            checked={value === option.value} 
            onChange={() => onChange(option.value)}
            className="hidden" 
          />
          <span className={cn(
            "text-sm",
            value === option.value 
              ? "text-slate-900 dark:text-white font-medium" 
              : "text-slate-600 dark:text-slate-400"
          )}>
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FilterButton 
           activeCount={activeCount}
           label={t('common.filters')}
           isActive={isOpen}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] md:w-[360px] p-0 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden" align="end">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <h4 className="font-semibold text-slate-900 dark:text-white">{t('common.filters')}</h4>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[400px] overflow-y-auto">
          {/* Status */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('clients.filterStatus')}</Label>
            <RadioGroup 
              name="status"
              value={localFilters.status}
              onChange={(val) => handleFilterChange('status', val)}
              options={[
                { label: t('common.all'), value: 'all' },
                { label: t('common.active'), value: 'active' },
                { label: t('common.inactive'), value: 'inactive' }
              ]}
            />
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('clients.filterDate')}</Label>
            <RadioGroup 
              name="date"
              value={localFilters.dateRange}
              onChange={(val) => handleFilterChange('dateRange', val)}
              options={[
                { label: t('common.all'), value: 'all' },
                { label: t('common.today'), value: 'today' },
                { label: t('common.week'), value: 'week' },
                { label: t('common.month'), value: 'month' }
              ]}
            />
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          {/* Projects */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('clients.filterProjects')}</Label>
            <RadioGroup 
              name="projects"
              value={localFilters.projects}
              onChange={(val) => handleFilterChange('projects', val)}
              options={[
                { label: t('common.all'), value: 'all' },
                { label: t('clients.withProjects'), value: 'with_projects' },
                { label: t('clients.withoutProjects'), value: 'without_projects' }
              ]}
            />
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
           <Button 
             variant="outline" 
             onClick={clearFilters}
             className="flex-1 rounded-full px-4 py-2 border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-150"
           >
             {t('common.clearFilters')}
           </Button>
           <Button 
             variant="primary" 
             onClick={handleApply}
             className="flex-1 rounded-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150"
           >
             {t('common.applyFilters')}
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ClientsFiltersPanel;
