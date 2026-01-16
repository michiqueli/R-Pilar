
import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SearchBar = ({ value, onChange, placeholder, className, ...props }) => {
  return (
    <div className={cn("relative w-full group", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-200 pointer-events-none z-10" />
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Buscar..."}
        className={cn(
          // Layout & Sizing - Apple iOS generous touch targets
          "w-full pl-12 pr-6 py-3 text-sm font-medium",
          
          // Shape
          "rounded-3xl", 
          
          // Colors & Borders
          "bg-white dark:bg-slate-950",
          "border border-gray-200 dark:border-gray-700",
          "text-slate-900 dark:text-white",
          "placeholder:text-slate-400",
          
          // Shadow & Depth
          "shadow-sm hover:shadow-md",
          
          // Interaction & Transitions
          "transition-all duration-300 ease-in-out",
          "focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500",
          
          // Hover state for border
          "hover:border-blue-300 dark:hover:border-blue-700"
        )}
        {...props}
      />
    </div>
  );
};

export default SearchBar;
