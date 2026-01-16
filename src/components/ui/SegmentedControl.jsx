
import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';

const SegmentedControl = ({ options, value, onChange, className }) => {
  const { t } = useTheme();

  return (
    <div 
      className={cn(
        "flex p-1 gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg", // Changed base container style slightly for better contrast inside pills
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative px-3 py-1.5 flex items-center justify-center",
              "transition-all duration-150 cursor-pointer rounded-md border",
              isActive 
                ? [
                    "bg-[#EFF6FF] text-[#3B82F6] border-[#3B82F6]",
                    "dark:bg-[#1E3A8A] dark:text-[#93C5FD] dark:border-[#3B82F6]",
                    "shadow-sm"
                  ].join(" ")
                : [
                    "bg-transparent border-transparent",
                    "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                    "hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  ].join(" ")
            )}
            title={t ? t(option.label) : option.label}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
};

export { SegmentedControl };
