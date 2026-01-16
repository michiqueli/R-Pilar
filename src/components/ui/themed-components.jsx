import React from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';

// --- BUTTONS ---
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
  {
    variants: {
      variant: {
        primary: "bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:brightness-110 shadow-sm",
        secondary: "border-2 border-[var(--theme-border)] bg-transparent text-[var(--theme-foreground)] hover:bg-[var(--theme-secondary)]",
        danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        ghost: "bg-transparent text-[var(--theme-foreground)] hover:bg-[var(--theme-secondary)]",
        link: "text-[var(--theme-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-8 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-10 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export const ThemedButton = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      style={{ 
        outlineColor: 'var(--theme-ring)',
        borderColor: variant === 'secondary' ? 'var(--theme-border)' : undefined
      }}
      ref={ref}
      {...props}
    />
  );
});
ThemedButton.displayName = "ThemedButton";


// --- INPUTS ---
export const ThemedInput = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <input
        className={cn(
          "flex h-11 w-full rounded-xl border px-4 py-2 text-sm ring-offset-[var(--theme-background)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--theme-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm",
          error ? "border-red-500 focus-visible:ring-red-500" : "border-[var(--theme-border)] focus-visible:ring-[var(--theme-ring)]",
          className
        )}
        style={{
          backgroundColor: 'var(--theme-input)',
          color: 'var(--theme-foreground)',
        }}
        ref={ref}
        {...props}
      />
      {error && <span className="text-xs text-red-500 absolute -bottom-5 left-1">{error}</span>}
    </div>
  );
});
ThemedInput.displayName = "ThemedInput";


// --- SELECT ---
export const ThemedSelect = React.forwardRef(({ className, children, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          "flex h-11 w-full rounded-xl border px-4 py-2 text-sm ring-offset-[var(--theme-background)] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm appearance-none",
          error ? "border-red-500 focus-visible:ring-red-500" : "border-[var(--theme-border)] focus-visible:ring-[var(--theme-ring)]",
          className
        )}
        style={{
          backgroundColor: 'var(--theme-input)',
          color: 'var(--theme-foreground)',
        }}
        ref={ref}
        {...props}
      >
        {children}
      </select>
       {/* Custom Arrow Icon could go here, but native appearance-none + bg-image is usually easier for pure CSS or just relying on native with styling */}
      {error && <span className="text-xs text-red-500 absolute -bottom-5 left-1">{error}</span>}
    </div>
  );
});
ThemedSelect.displayName = "ThemedSelect";


// --- CARD ---
export const ThemedCard = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("rounded-2xl border shadow-sm p-6 transition-colors", className)}
      style={{
        backgroundColor: 'var(--theme-background)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-foreground)'
      }}
      {...props}
    >
      {children}
    </div>
  );
});
ThemedCard.displayName = "ThemedCard";


// --- CHIP/BADGE ---
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent text-[var(--theme-primary-foreground)]",
        secondary: "border-transparent text-[var(--theme-secondary-foreground)]",
        outline: "text-[var(--theme-foreground)]",
        success: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        warning: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        destructive: "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const ThemedBadge = ({ className, variant, style, ...props }) => {
  const dynamicStyle = variant === 'default' 
    ? { backgroundColor: 'var(--theme-primary)', ...style } 
    : variant === 'secondary'
    ? { backgroundColor: 'var(--theme-secondary)', ...style }
    : variant === 'outline'
    ? { borderColor: 'var(--theme-border)', ...style }
    : style;

  return (
    <div className={cn(badgeVariants({ variant }), className)} style={dynamicStyle} {...props} />
  );
};