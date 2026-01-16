
import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';

const InvestorKPICard = ({ label, usdValue, arsValue, color, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "cursor-pointer rounded-xl p-6 shadow-md border bg-white dark:bg-slate-900 transition-all hover:shadow-lg relative overflow-hidden group",
        color === 'green' && "border-green-100 dark:border-green-900/30",
        color === 'red' && "border-red-100 dark:border-red-900/30",
        color === 'blue' && "border-blue-100 dark:border-blue-900/30"
      )}
    >
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        color === 'green' && "bg-[#22C55E]",
        color === 'red' && "bg-[#EF4444]",
        color === 'blue' && "bg-[#3B82F6]"
      )} />
      
      <div className="space-y-1">
         <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
         <h3 className={cn(
            "text-2xl font-bold",
            color === 'green' && "text-[#22C55E]",
            color === 'red' && "text-[#EF4444]",
            color === 'blue' && "text-[#3B82F6]"
         )}>
            {formatCurrencyUSD(usdValue)}
         </h3>
         <p className="text-sm font-medium text-slate-400">
            {formatCurrencyARS(arsValue)}
         </p>
      </div>
    </motion.div>
  );
};

export default InvestorKPICard;
