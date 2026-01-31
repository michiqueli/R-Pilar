import React from 'react';
import { Edit2, Trash2, Wallet, CreditCard, Banknote, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyARS } from '@/lib/formatUtils';

const CuentasCards = ({ cuentas, onEdit, onDelete, loading }) => {
  const { t } = useTheme();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-52 rounded-[32px] bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!cuentas?.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 p-16 text-center">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-10 h-10 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('cuentas.noCuentas')}</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {t('cuentas.noCuentasDesc', 'Comienza agregando tu primera cuenta bancaria o caja.')}
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cuentas.map((cuenta, index) => {
        const Icon = getIcon(cuenta.tipo);
        const esPositivo = (cuenta.saldo_calculado || 0) >= 0;

        return (
          <motion.div
            key={cuenta.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/cuentas/${cuenta.id}`)}
            className="group relative bg-white dark:bg-slate-900 rounded-[32px] p-7 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 flex flex-col h-full cursor-pointer overflow-hidden"
          >
            {/* Indicador de Salud Financiera sutil al fondo */}
            <div className={cn(
              "absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.03] transition-transform group-hover:scale-125",
              esPositivo ? "bg-emerald-500" : "bg-red-500"
            )} />

            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "p-3 rounded-2xl shadow-sm transition-colors",
                esPositivo ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border",
                esPositivo 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800" 
                  : "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:border-red-800"
              )}>
                {esPositivo ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {esPositivo ? 'Saneada' : 'En Deuda'}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                {cuenta.titulo}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {cuenta.tipo}
              </p>
            </div>

            {/* Saldo Calculado - La parte más importante */}
            <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo Disponible</p>
              <h4 className={cn(
                "text-2xl font-mono font-bold tracking-tighter",
                esPositivo ? "text-slate-900 dark:text-white" : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrencyARS(cuenta.saldo_calculado || 0)}
              </h4>
            </div>

            {/* Acciones flotantes al hacer hover */}
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
               <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={(e) => { e.stopPropagation(); onEdit(cuenta); }}
                  className="rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:text-blue-600 shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={(e) => { e.stopPropagation(); onDelete(cuenta); }}
                  className="rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:text-red-600 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CuentasCards;