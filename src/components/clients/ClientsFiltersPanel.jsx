
import React from 'react';
import { Button } from '@/components/ui/Button';
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

  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.dateRange !== 'all' || 
    filters.projects !== 'all';

  const activeCount = [
    filters.status !== 'all',
    filters.dateRange !== 'all',
    filters.projects !== 'all'
  ].filter(Boolean).length;

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      dateRange: 'all',
      projects: 'all'
    });
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
    <Popover>
      <PopoverTrigger asChild>
        <FilterButton 
           activeCount={activeCount}
           label={t('clients.filters')}
        />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden" align="end">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <h4 className="font-semibold text-slate-900 dark:text-white">{t('clients.filters')}</h4>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              {t('common.clearFilters')}
            </button>
          )}
        </div>

        <div className="p-5 space-y-6 max-h-[400px] overflow-y-auto">
          {/* Status */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('clients.filterStatus')}</Label>
            <RadioGroup 
              name="status"
              value={filters.status}
              onChange={(val) => handleFilterChange('status', val)}
              options={[
                { label: t('clients.all'), value: 'all' },
                { label: t('clients.active'), value: 'active' },
                { label: t('clients.inactive'), value: 'inactive' }
              ]}
            />
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('clients.filterDate')}</Label>
            <RadioGroup 
              name="date"
              value={filters.dateRange}
              onChange={(val) => handleFilterChange('dateRange', val)}
              options={[
                { label: t('clients.all'), value: 'all' },
                { label: t('clients.today'), value: 'today' },
                { label: t('clients.week'), value: 'week' },
                { label: t('clients.month'), value: 'month' }
              ]}
            />
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          {/* Projects */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('clients.filterProjects')}</Label>
            <RadioGroup 
              name="projects"
              value={filters.projects}
              onChange={(val) => handleFilterChange('projects', val)}
              options={[
                { label: t('clients.all'), value: 'all' },
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
             onClick={() => {/* Apply happens automatically but visual button helps UX */}}
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
