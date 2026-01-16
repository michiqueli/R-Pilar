
import React from 'react';
import { Eye, Plus, Minus, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { formatCurrencyUSD, formatCurrencyARS } from '@/lib/formatUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const InvestorsList = ({ 
  investors = [], 
  loading = false, 
  error = null,
  onViewInvestor,
  onAddIncome,
  onAddRefund,
  onEditInvestor,
  onDeleteInvestor 
}) => {
  const { t } = useTheme();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-xl border border-red-200 dark:border-red-800 text-center">
        <p className="font-medium">{t('common.error')}: {error}</p>
      </div>
    );
  }

  if (!investors || !investors.length) {
    return null; // Empty state should be handled by parent or use this component for only table
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">{t('investors.name') || "Nombre"}</th>
              <th className="px-6 py-4 font-semibold hidden md:table-cell">{t('investors.contact') || "Contacto"}</th>
              <th className="px-6 py-4 font-semibold text-center">{t('investors.status') || "Estado"}</th>
              <th className="px-6 py-4 font-semibold text-right text-green-600">{t('investors.invested_usd') || "Total Inv. (USD)"}</th>
              <th className="px-6 py-4 font-semibold text-right text-red-600 hidden lg:table-cell">{t('investors.returned_usd') || "Devuelto (USD)"}</th>
              <th className="px-6 py-4 font-semibold text-right text-blue-600">{t('investors.net_balance') || "Saldo Neto"}</th>
              <th className="px-6 py-4 font-semibold text-center w-[200px]">{t('common.actions') || "Acciones"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(investors || []).map((inv) => (
              <tr 
                key={inv.id} 
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                onClick={() => onViewInvestor(inv)}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 dark:text-white">{inv.nombre}</div>
                  <div className="text-xs text-slate-500 lg:hidden">{inv.email}</div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="flex flex-col">
                    <span className="text-slate-700 dark:text-slate-300">{inv.email || '-'}</span>
                    <span className="text-xs text-slate-500">{inv.telefono}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                    inv.estado === 'activo' 
                      ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  )}>
                    {inv.estado === 'activo' ? (t('status.active') || 'Activo') : (t('status.inactive') || 'Inactivo')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400 tabular-nums">
                  {formatCurrencyUSD(inv.total_invertido_usd)}
                </td>
                <td className="px-6 py-4 text-right font-medium text-red-600 dark:text-red-400 tabular-nums hidden lg:table-cell">
                  {formatCurrencyUSD(inv.total_devuelto_usd)}
                </td>
                <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {formatCurrencyUSD(inv.saldo_neto_usd)}
                </td>
                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={() => onAddIncome(inv)}
                      className="p-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                      title={t('actions.add_investment') || "Ingreso"}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onAddRefund(inv)}
                      className="p-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                      title={t('actions.refund_investment') || "Devolución"}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button 
                      onClick={() => onViewInvestor(inv)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title={t('actions.view') || "Ver Detalle"}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onEditInvestor(inv)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                      title={t('actions.edit') || "Editar"}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteInvestor(inv)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title={t('actions.delete') || "Eliminar"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestorsList;
