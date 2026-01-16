
import React from 'react';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';

const EmptyStateFilters = ({ onClear }) => {
  const { t } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center w-full bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
        <SearchX className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {t('projects.emptyState.title')}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        {t('projects.emptyState.description')}
      </p>
      <Button 
        variant="outline" 
        onClick={onClear}
        className="min-w-[140px]"
      >
        {t('projects.emptyState.clearButton')}
      </Button>
    </div>
  );
};

export default EmptyStateFilters;
