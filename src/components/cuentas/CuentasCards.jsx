
import React from 'react';
import { Edit2, Trash2, Wallet, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CuentasCards = ({ cuentas, onEdit, onDelete, loading }) => {
  const { t } = useTheme();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {[1, 2, 3].map(i => (
           <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
         ))}
      </div>
    );
  }

  if (!cuentas?.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💳</span>
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{t('cuentas.noCuentas')}</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {t('cuentas.noCuentasDesc', 'Comienza agregando tu primera cuenta.')}
        </p>
      </div>
    );
  }

  const getIcon = (tipo) => {
     switch(tipo?.toLowerCase()) {
        case 'banco': return CreditCard;
        case 'efectivo': return Banknote;
        default: return Wallet;
     }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'activa': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'inactiva': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cuentas.map((cuenta, index) => {
        const Icon = getIcon(cuenta.tipo);
        return (
          <motion.div
            key={cuenta.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/cuentas/${cuenta.id}`)}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex flex-col h-full cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Icon className="w-6 h-6" />
               </div>
               <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                  getStatusColor(cuenta.estado)
                )}>
                  {cuenta.estado || 'activa'}
               </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {cuenta.titulo}
            </h3>
            
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
               <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium text-xs">
                 {cuenta.tipo}
               </span>
            </div>

            {cuenta.nota && (
               <p className="text-sm text-slate-400 line-clamp-2 mb-4 h-10">
                  {cuenta.nota}
               </p>
            )}

            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={(e) => { e.stopPropagation(); onEdit(cuenta); }}
                 className="h-8 px-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
               >
                 <Edit2 className="w-4 h-4 mr-1.5" />
                 {t('common.edit')}
               </Button>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={(e) => { e.stopPropagation(); onDelete(cuenta); }}
                 className="h-8 px-3 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
               >
                 <Trash2 className="w-4 h-4 mr-1.5" />
                 {t('common.delete')}
               </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CuentasCards;
