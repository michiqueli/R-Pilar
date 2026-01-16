
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { formatCurrencyUSD } from '@/lib/formatUtils';

const InvestorsTable = ({ 
  investors, 
  visibleColumns,
  onView, 
  onEdit, 
  onDelete 
}) => {
  const { t } = useTheme();

  const getAmountColor = (amount) => {
    if (amount > 0) return "text-[#10B981] dark:text-[#6EE7B7]"; // Green
    if (amount < 0) return "text-[#EF4444] dark:text-[#FCA5A5]"; // Red
    return "text-[#6B7280] dark:text-[#9CA3AF]"; // Gray
  };

  const getInvestedColor = (amount) => {
      // Invested is neutral/info usually, or emphasized blue
      return "text-gray-900 dark:text-white"; 
  };

  return (
    <div className="bg-white dark:bg-[#111827] rounded-[12px] border border-gray-200 dark:border-[#374151] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#374151] bg-gray-50/50 dark:bg-[#1F2937]/50">
              {visibleColumns.includes('name') && (
                <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('investors.name')}
                </th>
              )}
              {visibleColumns.includes('contact') && (
                <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  {t('investors.contact')}
                </th>
              )}
              {visibleColumns.includes('status') && (
                <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('investors.status')}
                </th>
              )}
              {visibleColumns.includes('invested') && (
                <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  {t('investors.invested')}
                </th>
              )}
              {visibleColumns.includes('returned') && (
                <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  {t('investors.returned')}
                </th>
              )}
              {visibleColumns.includes('netBalance') && (
                <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  {t('investors.netBalance')}
                </th>
              )}
              {visibleColumns.includes('actions') && (
                <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  {t('investors.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#374151]">
            {(investors || []).map((investor, index) => (
              <motion.tr
                key={investor.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] transition-colors duration-150 ease-out cursor-pointer group"
                onClick={() => onView(investor)}
              >
                {visibleColumns.includes('name') && (
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[14px] text-gray-900 dark:text-white">
                      {investor.nombre}
                    </div>
                  </td>
                )}
                
                {visibleColumns.includes('contact') && (
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <div className="flex flex-col">
                      {investor.email ? (
                        <span className="text-[12px] text-gray-600 dark:text-gray-400">{investor.email}</span>
                      ) : null}
                      {investor.telefono ? (
                        <span className="text-[12px] text-gray-500 dark:text-gray-500">{investor.telefono}</span>
                      ) : null}
                    </div>
                  </td>
                )}

                {visibleColumns.includes('status') && (
                  <td className="py-3 px-4">
                     <span className={cn(
                       "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                       investor.estado === 'activo' 
                         ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                         : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                     )}>
                       {investor.estado === 'activo' ? t('investors.active') : t('investors.inactive')}
                     </span>
                  </td>
                )}

                {visibleColumns.includes('invested') && (
                  <td className="py-3 px-4 text-right">
                    <span className={cn("text-[14px] font-semibold tabular-nums", getInvestedColor(investor.total_invertido_usd))}>
                      {formatCurrencyUSD(investor.total_invertido_usd)}
                    </span>
                  </td>
                )}

                {visibleColumns.includes('returned') && (
                  <td className="py-3 px-4 text-right">
                    <span className={cn("text-[14px] font-semibold tabular-nums", getAmountColor(investor.total_devuelto_usd))}>
                      {formatCurrencyUSD(investor.total_devuelto_usd)}
                    </span>
                  </td>
                )}

                {visibleColumns.includes('netBalance') && (
                  <td className="py-3 px-4 text-right">
                    <span className={cn("text-[14px] font-semibold tabular-nums", getAmountColor(investor.saldo_neto_usd))}>
                      {formatCurrencyUSD(investor.saldo_neto_usd)}
                    </span>
                  </td>
                )}

                {visibleColumns.includes('actions') && (
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                     <div className="flex items-center justify-end gap-1">
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
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestorsTable;
