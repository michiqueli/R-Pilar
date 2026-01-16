
import React from 'react';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';

const Input = React.forwardRef(({ className, icon: Icon, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <input
        className={cn(
          "flex w-full border bg-white dark:bg-slate-950 px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
          error 
            ? "border-red-500 focus-visible:ring-red-500" 
            : "border-slate-200 dark:border-slate-800 focus-visible:ring-[var(--theme-primary)]",
          Icon ? "pl-10" : "",
          className
        )}
        style={{ 
          borderRadius: tokens.radius.input,
          height: '42px' // Comfortable touch target
        }}
        ref={ref}
        {...props}
      />
      {error && <span className="text-xs text-red-500 absolute -bottom-5 left-1 font-medium">{error}</span>}
    </div>
  );
});
Input.displayName = "Input";

export { Input };
