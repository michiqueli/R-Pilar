
import React from 'react';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function FilterButton({ onClick, activeCount = 0, isOpen, className }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "group relative flex items-center gap-2 h-[44px] px-5 rounded-full border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        isOpen 
          ? "bg-slate-100 border-slate-300 text-slate-900" 
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
        className
      )}
    >
      <Filter className={cn(
        "w-4 h-4 transition-colors",
        isOpen ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
      )} />
      
      <span className="font-medium text-sm">Filtros</span>
      
      {activeCount > 0 && (
        <span className="ml-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-full shadow-sm">
          {activeCount}
        </span>
      )}
    </button>
  );
}

export default FilterButton;
