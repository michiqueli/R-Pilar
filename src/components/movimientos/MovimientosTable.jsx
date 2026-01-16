
import React from 'react';
import { useTheme } from '@/contexts/ThemeProvider';
import { ArrowUpDown, MoreVertical, Eye, Edit, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrencyARS, formatDate } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MovimientosTable = ({ 
  movimientos, 
  columns, 
  sortBy, 
  sortOrder, 
  onSort, 
  onRowClick, 
  onAction,
  loading 
}) => {
  const { t } = useTheme();

  // Helper to check if column is visible
  const isVisible = (col) => columns.includes(col);

  // Helper to render sort icon
  const renderSortIcon = (column) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300" />;
    return <ArrowUpDown className={`w-3 h-3 ml-1 ${sortOrder === 'asc' ? 'text-blue-500 rotate-180' : 'text-blue-500'}`} />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {isVisible('type') && (
                <th 
                  className="px-6 py-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  onClick={() => onSort('type')}
                >
                  <div className="flex items-center">
                    {t('common.type')}
                    {renderSortIcon('type')}
                  </div>
                </th>
              )}
              {isVisible('description') && (
                <th 
                  className="px-6 py-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  onClick={() => onSort('description')}
                >
                  <div className="flex items-center">
                    {t('common.description')}
                    {renderSortIcon('description')}
                  </div>
                </th>
              )}
              {/* New Cuentas Column Header */}
              {isVisible('cuentas') && (
                <th 
                  className="px-6 py-4 font-semibold whitespace-nowrap text-slate-500 dark:text-slate-400"
                >
                  <div className="flex items-center">
                    {t('finanzas.cuentas')}
                  </div>
                </th>
              )}
              {isVisible('date') && (
                <th 
                  className="px-6 py-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  onClick={() => onSort('date')}
                >
                  <div className="flex items-center">
                    {t('common.date')}
                    {renderSortIcon('date')}
                  </div>
                </th>
              )}
              {isVisible('amount') && (
                <th 
                  className="px-6 py-4 font-semibold whitespace-nowrap text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  onClick={() => onSort('amount')}
                >
                  <div className="flex items-center justify-end">
                    {t('common.amount')}
                    {renderSortIcon('amount')}
                  </div>
                </th>
              )}
              {isVisible('status') && (
                <th 
                  className="px-6 py-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  onClick={() => onSort('status')}
                >
                  <div className="flex items-center">
                    {t('common.status')}
                    {renderSortIcon('status')}
                  </div>
                </th>
              )}
              {isVisible('actions') && (
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {movimientos.map((item, index) => (
              <tr 
                key={`${item.id}-${index}`} 
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                onClick={() => onRowClick && onRowClick(item)}
              >
                {isVisible('type') && (
                  <td className="px-6 py-4">
                    <span className={cn(
                       "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border",
                       item.type === 'ingreso' 
                         ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                         : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                    )}>
                      {item.type === 'ingreso' ? <ArrowDownCircle className="w-3 h-3 mr-1" /> : <ArrowUpCircle className="w-3 h-3 mr-1" />}
                      {t(`movimientos.${item.type}`)}
                    </span>
                  </td>
                )}
                {isVisible('description') && (
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white max-w-[200px] truncate" title={item.description}>
                      {item.description}
                    </div>
                    {item.projects?.name && (
                      <div className="text-xs text-slate-500 mt-0.5">{item.projects.name}</div>
                    )}
                  </td>
                )}
                {/* New Cuentas Column Body */}
                {isVisible('cuentas') && (
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                    {item.cuenta_nombre !== '—' ? (
                       <span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{item.cuenta_nombre}</span>
                          {' '}
                          <span className="text-slate-500 dark:text-slate-500 text-xs">
                             {item.cuenta_tipo} ({item.cuenta_moneda})
                          </span>
                       </span>
                    ) : (
                       <span className="text-slate-400">—</span>
                    )}
                  </td>
                )}
                {isVisible('date') && (
                  <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                     {formatDate(item.date)}
                  </td>
                )}
                {isVisible('amount') && (
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                     {formatCurrencyARS(item.amount_ars)}
                     {item.usd_equivalent > 0 && (
                        <div className="text-xs text-slate-400 font-normal">
                          US$ {item.usd_equivalent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                     )}
                  </td>
                )}
                {isVisible('status') && (
                  <td className="px-6 py-4">
                    <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
                        (item.status === 'CONFIRMADO' || item.status === 'COBRADO' || item.status === 'PAGADO')
                           ? "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20" 
                           : "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20"
                     )}>
                        {item.status}
                     </span>
                  </td>
                )}
                {isVisible('actions') && (
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onAction && onAction('view', item)}>
                          <Eye className="mr-2 h-4 w-4" /> {t('common.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction && onAction('edit', item)}>
                          <Edit className="mr-2 h-4 w-4" /> {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAction && onAction('delete', item)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                          <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MovimientosTable;
