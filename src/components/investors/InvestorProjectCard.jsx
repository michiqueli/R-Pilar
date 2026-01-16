
import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';

const InvestorProjectCard = ({ project, invested, returned, balance, status, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
      className="cursor-pointer bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all"
    >
       <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-2 hover:text-blue-600 transition-colors">
             {project.name}
          </h3>
          <span className={cn(
             "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
             status === 'active' 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          )}>
             {status === 'active' ? 'Activo' : 'Cerrado'}
          </span>
       </div>

       <div className="space-y-3">
          <div className="flex justify-between items-baseline">
             <span className="text-xs font-bold text-slate-400 uppercase">Invertido</span>
             <div className="text-right">
                <span className="block font-bold text-[#22C55E] text-sm">{formatCurrencyUSD(invested.usd)}</span>
                <span className="block text-xs text-slate-400">{formatCurrencyARS(invested.ars)}</span>
             </div>
          </div>
          
          <div className="flex justify-between items-baseline">
             <span className="text-xs font-bold text-slate-400 uppercase">Devuelto</span>
             <div className="text-right">
                <span className="block font-bold text-[#EF4444] text-sm">{formatCurrencyUSD(returned.usd)}</span>
                <span className="block text-xs text-slate-400">{formatCurrencyARS(returned.ars)}</span>
             </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
             <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">Saldo Pendiente</span>
             <div className="text-right">
                <span className="block font-bold text-[#3B82F6] text-base">{formatCurrencyUSD(balance.usd)}</span>
                <span className="block text-xs text-slate-400">{formatCurrencyARS(balance.ars)}</span>
             </div>
          </div>
       </div>
    </motion.div>
  );
};

export default InvestorProjectCard;
