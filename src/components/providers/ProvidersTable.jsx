import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Phone, Mail, Eye, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { formatCurrencyARS } from '@/lib/formatUtils';

const ProvidersTable = ({ 
  providers, 
  columns, 
  onEdit, 
  onDelete,
  sortConfig,
  onSort,
  onToggleStatus
}) => {
  const navigate = useNavigate(); // Hook para navegación consistente
  const { t } = useTheme();

  const getAvatarColor = (name) => {
    const colors = [
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', 
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', 
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', 
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', 
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', 
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', 
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return <ArrowUpDown className={cn("w-3 h-3 ml-1 transition-transform", sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-blue-600 rotate-180')} />;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                {columns.name && (
                  <th 
                    className="text-left py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors group select-none"
                    onClick={() => onSort('name')}
                  >
                    <div className="flex items-center">
                      {t('providers.name')} <SortIcon column="name" />
                    </div>
                  </th>
                )}
                {columns.type && <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('providers.type')}</th>}
                
                {/* Campos Financieros de Gastos (Pendiente pagar / Total Facturado) */}
                {columns.total_billed && <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('providers.total_billed')}</th>}
                {columns.pending_pay && <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('providers.pending_pay')}</th>}

                {columns.status && <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.status')}</th>}
                {columns.actions && <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {providers.map((provider, index) => (
                <motion.tr
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 group"
                >
                  {columns.name && (
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white dark:ring-slate-900",
                          getAvatarColor(provider.name)
                        )}>
                          {provider.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div 
                            className="font-semibold text-[16px] text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors" 
                            onClick={() => navigate(`/providers/${provider.id}`)} // NAVEGACION IGUAL A CLIENTES
                          >
                            {provider.name}
                          </div>
                          <div className="flex items-center gap-2 text-[14px] text-slate-500">
                            {provider.email || '-'}
                            {provider.tax_id && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs">{provider.tax_id}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}

                  {columns.type && (
                    <td className="py-4 px-6 text-sm">
                       <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-medium border border-slate-200 dark:border-slate-700 uppercase text-[10px]">
                        {provider.type_name}
                      </span>
                    </td>
                  )}

                  {columns.total_billed && (
                    <td className="py-4 px-6 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrencyARS(provider.total_billed)}
                    </td>
                  )}

                  {columns.pending_pay && (
                    <td className="py-4 px-6 text-right">
                      <span className={cn(
                        "font-mono font-bold",
                        provider.pending_pay > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"
                      )}>
                        {formatCurrencyARS(provider.pending_pay)}
                      </span>
                    </td>
                  )}

                  {columns.status && (
                    <td className="py-4 px-6 text-center">
                      <span className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold inline-block",
                        provider.is_active 
                          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      )}>
                        {provider.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                  )}

                  {columns.actions && (
                    <td className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="iconSm" className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-lg border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <DropdownMenuItem onClick={() => navigate(`/providers/${provider.id}`)} className="rounded-lg cursor-pointer">
                            <Eye className="w-4 h-4 mr-2 text-slate-400" /> {t('common.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(provider)} className="rounded-lg cursor-pointer">
                            <Edit className="w-4 h-4 mr-2 text-slate-400" /> {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleStatus(provider)} className="rounded-lg cursor-pointer">
                            <div className="flex items-center gap-2">
                               <div className={cn("w-2 h-2 rounded-full", provider.is_active ? "bg-red-500" : "bg-green-500")} />
                               {provider.is_active ? t('common.deactivate') : t('common.activate')}
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="dark:bg-slate-800" />
                          <DropdownMenuItem onClick={() => onDelete(provider)} className="rounded-lg cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20">
                            <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProvidersTable;