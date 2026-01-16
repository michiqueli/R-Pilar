
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const ProvidersCards = ({ 
  providers, 
  onView, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}) => {
  const { t } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.map((provider, index) => (
        <motion.div
          key={provider.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group"
        >
          <div
            className="relative bg-white dark:bg-[#111827] rounded-[12px] border border-gray-200 dark:border-[#374151] shadow-sm p-4 transition-all duration-150 ease-out hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col h-full"
            onClick={() => onView(provider)}
          >
             <div className="flex justify-between items-start mb-3">
                <span className={cn(
                   "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                   provider.catalog_provider_type?.name === 'PROVEEDOR' 
                     ? "bg-[#EFF6FF] dark:bg-[#1E3A8A] text-[#3B82F6] dark:text-[#93C5FD]"
                     : "bg-[#F3F4F6] dark:bg-[#374151] text-[#6B7280] dark:text-[#D1D5DB]"
                 )}>
                   {provider.catalog_provider_type?.name || '-'}
                 </span>

                 <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">
                      {provider.is_active ? t('providers.active') : t('providers.inactive')}
                    </span>
                    <Switch
                        checked={provider.is_active}
                        onCheckedChange={() => onToggleStatus(provider)}
                        className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#D1D5DB] dark:data-[state=unchecked]:bg-gray-600 h-4 w-8"
                    />
                 </div>
             </div>

             <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
               {provider.name}
             </h3>

             <div className="flex-1 space-y-1 mb-4">
                {provider.email ? (
                  <div className="text-[14px] text-gray-500 dark:text-gray-400 truncate">{provider.email}</div>
                ) : null}
                {provider.phone ? (
                  <div className="text-[14px] text-gray-500 dark:text-gray-400 truncate">{provider.phone}</div>
                ) : null}
                {!provider.email && !provider.phone && (
                   <div className="text-[14px] text-gray-400 italic">{t('providers.noContact')}</div>
                )}
             </div>

             <div className="pt-3 border-t border-gray-100 dark:border-[#374151] flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={(e) => { e.stopPropagation(); onView(provider); }}
                  className="rounded-full w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={(e) => { e.stopPropagation(); onEdit(provider); }}
                  className="rounded-full w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ProvidersCards;
