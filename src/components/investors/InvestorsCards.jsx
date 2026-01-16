
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { formatCurrencyUSD } from '@/lib/formatUtils';

const InvestorsCards = ({ 
  investors, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  const { t } = useTheme();

  const getAmountColor = (amount) => {
    if (amount > 0) return "text-[#10B981] dark:text-[#6EE7B7]";
    if (amount < 0) return "text-[#EF4444] dark:text-[#FCA5A5]";
    return "text-[#6B7280] dark:text-[#9CA3AF]";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {(investors || []).map((investor, index) => (
        <motion.div
          key={investor.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group"
        >
          <div
            className="relative bg-white dark:bg-[#111827] rounded-[12px] border border-gray-200 dark:border-[#374151] shadow-sm p-4 transition-all duration-150 ease-out hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col h-full"
            onClick={() => onView(investor)}
          >
             <div className="flex justify-between items-start mb-3">
                 <span className={cn(
                   "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                   investor.estado === 'activo' 
                     ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                     : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                 )}>
                   {investor.estado === 'activo' ? t('investors.active') : t('investors.inactive')}
                 </span>

                 <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Action buttons could go here or bottom */}
                 </div>
             </div>

             <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
               {investor.nombre}
             </h3>
             <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-4 h-9 overflow-hidden">
                {investor.email && <div>{investor.email}</div>}
                {investor.telefono && <div>{investor.telefono}</div>}
             </div>

             <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
                 <div>
                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">{t('investors.invested')}</div>
                    <div className="text-[14px] font-semibold text-gray-900 dark:text-white tabular-nums">
                        {formatCurrencyUSD(investor.total_invertido_usd)}
                    </div>
                 </div>
                 <div>
                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">{t('investors.returned')}</div>
                    <div className={cn("text-[14px] font-semibold tabular-nums", getAmountColor(investor.total_devuelto_usd))}>
                        {formatCurrencyUSD(investor.total_devuelto_usd)}
                    </div>
                 </div>
                 <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-end">
                       <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">{t('investors.netBalance')}</div>
                       <div className={cn("text-[16px] font-bold tabular-nums", getAmountColor(investor.saldo_neto_usd))}>
                           {formatCurrencyUSD(investor.saldo_neto_usd)}
                       </div>
                    </div>
                 </div>
             </div>

             <div className="mt-auto pt-2 border-t border-gray-100 dark:border-[#374151] flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={(e) => { e.stopPropagation(); onView(investor); }}
                  className="rounded-full w-[44px] h-[44px] p-0 flex items-center justify-center hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] text-[#6B7280] hover:text-[#3B82F6] dark:text-[#9CA3AF] dark:hover:text-blue-400 transition-colors duration-150"
                >
                  <Eye className="w-[18px] h-[18px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={(e) => { e.stopPropagation(); onEdit(investor); }}
                  className="rounded-full w-[44px] h-[44px] p-0 flex items-center justify-center hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] text-[#6B7280] hover:text-[#3B82F6] dark:text-[#9CA3AF] dark:hover:text-blue-400 transition-colors duration-150"
                >
                  <Edit className="w-[18px] h-[18px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={(e) => { e.stopPropagation(); onDelete(investor); }}
                  className="rounded-full w-[44px] h-[44px] p-0 flex items-center justify-center hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] text-[#6B7280] hover:text-[#EF4444] dark:text-[#9CA3AF] dark:hover:text-[#FCA5A5] transition-colors duration-150"
                >
                  <Trash2 className="w-[18px] h-[18px]" />
                </Button>
             </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default InvestorsCards;
