
import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ViewToggle = ({ view, onViewChange, className }) => {
  const buttonClass = (mode) => cn(
    "flex items-center justify-center p-2 rounded-lg transition-all duration-200 h-10 w-10", // rounded-lg and sizing
    view === mode
      ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
  );

  return (
    <div className={cn("flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700", className)}>
      <button
        onClick={() => onViewChange('table')}
        className={buttonClass('table')}
        title="Vista de lista"
        type="button"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange('grid')} // Changed from 'cards' to 'grid' to match typical usage, or map it
        className={buttonClass('grid')}
        title="Vista de cuadrícula"
        type="button"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewToggle;
