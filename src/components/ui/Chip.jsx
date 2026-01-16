
import React from 'react';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/designTokens';

const variantStyles = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  primary: "bg-blue-50 text-blue-700 border-blue-100",
  success: "bg-green-50 text-green-700 border-green-100",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-100",
  danger: "bg-red-50 text-red-700 border-red-100",
  outline: "bg-transparent border-slate-300 text-slate-600",
  
  // Specific statuses often used
  ACTIVO: "bg-emerald-50 text-emerald-700 border-emerald-100",
  PAUSADO: "bg-amber-50 text-amber-700 border-amber-100",
  FINALIZADO: "bg-slate-100 text-slate-600 border-slate-200",
  
  PAGADO: "bg-green-50 text-green-700 border-green-100",
  A_PAGAR: "bg-orange-50 text-orange-700 border-orange-100",
};

const Chip = ({ label, variant = 'default', className, size = 'default', ...props }) => {
  // Try to match variant directly, or fallback to default if not found, 
  // allows passing status strings directly like "ACTIVO"
  const styleClass = variantStyles[variant] || variantStyles[variant?.toUpperCase()] || variantStyles.default;
  
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium border",
        styleClass,
        sizeClass,
        className
      )}
      style={{ borderRadius: tokens.radius.badge }}
      {...props}
    >
      {label}
    </span>
  );
};

export { Chip };
