
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoginButton = ({
  label,
  onClick,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'secondary'
  fullWidth = false,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
        variant === 'primary' 
          ? "bg-[#FFC107] text-slate-900 hover:opacity-90 rounded-full" 
          : "bg-transparent border-2 border-[#FFC107] text-[#FFC107] hover:bg-[#FFC107]/10 rounded-lg",
        fullWidth ? "w-full" : "",
        "px-6 py-3 text-base shadow-md"
      )}
    >
      {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
      {label}
    </button>
  );
};

export default LoginButton;
