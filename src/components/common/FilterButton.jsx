
import React from 'react';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// Using forwardRef to support being used as a Radix UI PopoverTrigger
export const FilterButton = React.forwardRef(({ 
  activeCount = 0, 
  label = "Filtros", 
  isActive = false,
  className, 
  onClick,
  ...props 
}, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2 h-10", // Explicit requirement: rounded-lg
        "border transition-all duration-200",
        isActive || activeCount > 0
          ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
        className
      )}
      {...props}
    >
      <Filter className={cn(
        "w-4 h-4 mr-2",
        isActive || activeCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
      )} />
      
      <span className="text-sm font-medium">{label}</span>
      
      {activeCount > 0 && (
        <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-full shadow-sm">
          {activeCount}
        </span>
      )}
    </Button>
  );
});

FilterButton.displayName = "FilterButton";

export default FilterButton;
