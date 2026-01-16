
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const ProvidersTable = ({ 
  providers, 
  onView, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}) => {
  const { t } = useTheme();

  return (
    <div className="bg-white dark:bg-[#111827] rounded-[12px] border border-gray-200 dark:border-[#374151] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#374151] bg-gray-50/50 dark:bg-[#1F2937]/50">
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('providers.name')}
              </th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                {t('providers.contact')}
              </th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                {t('providers.type')}
              </th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('providers.status')}
              </th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                {t('providers.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#374151]">
            {providers.map((provider, index) => (
              <motion.tr
                key={provider.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] transition-colors duration-150 ease-out cursor-pointer group"
                onClick={() => onView(provider)}
              >
                <td className="py-3 px-4">
                  <div className="font-semibold text-[14px] text-gray-900 dark:text-white">
                    {provider.name}
                  </div>
                </td>
                
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="flex flex-col">
                    {provider.email ? (
                      <span className="text-[12px] text-gray-600 dark:text-gray-400">{provider.email}</span>
                    ) : null}
                    {provider.phone ? (
                      <span className="text-[12px] text-gray-500 dark:text-gray-500">{provider.phone}</span>
                    ) : null}
                    {!provider.email && !provider.phone && (
                      <span className="text-[12px] text-gray-400 italic">{t('providers.noContact')}</span>
                    )}
                  </div>
                </td>

                <td className="py-3 px-4 hidden md:table-cell">
                   <span className={cn(
                     "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                     provider.catalog_provider_type?.name === 'PROVEEDOR' 
                       ? "bg-[#EFF6FF] dark:bg-[#1E3A8A] text-[#3B82F6] dark:text-[#93C5FD]"
                       : "bg-[#F3F4F6] dark:bg-[#374151] text-[#6B7280] dark:text-[#D1D5DB]"
                   )}>
                     {provider.catalog_provider_type?.name || '-'}
                   </span>
                </td>

                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                   <div className="flex items-center gap-2">
                     <Switch
                        checked={provider.is_active}
                        onCheckedChange={() => onToggleStatus(provider)}
                        className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#D1D5DB] dark:data-[state=unchecked]:bg-gray-600 h-5 w-9"
                     />
                     <span className="text-[12px] text-gray-500 dark:text-gray-400 hidden lg:inline">
                       {provider.is_active ? t('providers.active') : t('providers.inactive')}
                     </span>
                   </div>
                </td>

                <td className="py-3 px-4 text-right">
                   <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={(e) => { e.stopPropagation(); onView(provider); }}
                        className="rounded-full w-8 h-8 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={(e) => { e.stopPropagation(); onEdit(provider); }}
                        className="rounded-full w-8 h-8 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={(e) => { e.stopPropagation(); onDelete(provider); }}
                        className="rounded-full w-8 h-8 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProvidersTable;
