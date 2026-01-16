
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate, formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { useTheme } from '@/contexts/ThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const MovimientosCards = ({ movimientos, onCardClick, onAction, loading }) => {
  const { t } = useTheme();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-[12px] h-48 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {movimientos.map((mov, index) => {
        const isIncome = mov.type === 'ingreso';
        const amountColor = isIncome 
          ? 'text-[#10B981] dark:text-[#6EE7B7]' 
          : 'text-[#EF4444] dark:text-[#FCA5A5]';
        
        return (
          <motion.div
            key={`${mov.type}-${mov.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group"
          >
            <div
              className="relative bg-white dark:bg-[#111827] rounded-[12px] border border-gray-200 dark:border-[#374151] shadow-sm p-4 transition-all duration-150 ease-out hover:shadow-lg dark:hover:shadow-md hover:-translate-y-0.5 cursor-pointer h-full flex flex-col"
              onClick={() => onCardClick && onCardClick(mov)}
            >
              <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      isIncome 
                        ? "bg-green-50 dark:bg-[#047857]/20 text-[#10B981] dark:text-[#6EE7B7]" 
                        : "bg-red-50 dark:bg-[#DC2626]/20 text-[#EF4444] dark:text-[#FCA5A5]"
                    )}>
                       {isIncome ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                    </div>
                    <div>
                       <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">{formatDate(mov.date)}</span>
                       <span className="text-[10px] uppercase font-bold tracking-wide text-gray-400 dark:text-gray-500">{mov.partida || mov.category || 'General'}</span>
                    </div>
                 </div>
                 
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button 
                         variant="ghost" 
                         size="iconSm" 
                         className="rounded-full -mr-2 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" 
                         onClick={(e) => e.stopPropagation()}
                       >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-[12px] border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] shadow-lg p-1">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction('view', mov); }} className="rounded-[8px]">
                        <Eye className="w-4 h-4 mr-2" /> {t('common.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction('edit', mov); }} className="rounded-[8px]">
                        <Edit className="w-4 h-4 mr-2" /> {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800"/>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onAction('delete', mov); }} 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-[8px]"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              <div className="mb-4 flex-1">
                 <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-tight">
                   {mov.description}
                 </h3>
                 {mov.projects?.name && (
                   <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                     {mov.projects.name}
                   </p>
                 )}
                 <div className="flex items-baseline gap-2 flex-wrap mt-2">
                   <span className={cn("text-xl font-bold", amountColor)}>
                     {isIncome ? '+' : '-'} {formatCurrencyARS(mov.amount_ars)}
                   </span>
                   {mov.usd_equivalent > 0 && (
                     <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                        ({formatCurrencyUSD(mov.usd_equivalent)})
                     </span>
                   )}
                 </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#374151]">
                 <span className={cn(
                   "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                   mov.status === 'PAGADO' || mov.status === 'COBRADO' 
                     ? "bg-green-50 dark:bg-[#047857]/20 text-[#10B981] dark:text-[#6EE7B7]"
                     : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                 )}>
                   {mov.status}
                 </span>
                 <span className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate max-w-[120px]">
                   {mov.responsible || '-'}
                 </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MovimientosCards;
