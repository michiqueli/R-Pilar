
import React from 'react';
import { Wallet, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';

const KPI = ({ label, valueMain, valueSub, icon: Icon, color, className }) => (
  <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow ${className}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
           <h3 className="text-xl font-bold text-slate-900 dark:text-white">{valueMain}</h3>
           {valueSub && (
             <span className="text-xs text-slate-400">{valueSub}</span>
           )}
        </div>
      </div>
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const CuentasKPIs = () => {
  const { t } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {/* 1. Saldo Total */}
      <KPI 
        label={t('cuentas.kpi.saldoTotal')}
        valueMain="$ 0,00"
        valueSub="u$s 0,00"
        icon={Wallet}
        color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
      />

      {/* 2. Proximos Pagos */}
      <KPI 
        label={t('cuentas.kpi.proximosPagos')}
        valueMain="$ 0,00"
        valueSub="u$s 0,00"
        icon={TrendingUp}
        color="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
      />

      {/* 3. Proximos Ingresos */}
      <KPI 
        label={t('cuentas.kpi.proximosIngresos')}
        valueMain="$ 0,00"
        valueSub="u$s 0,00"
        icon={DollarSign}
        color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
      />

      {/* 4. Alerta de Liquidez */}
      <KPI 
        label={t('cuentas.kpi.alertaLiquidez')}
        valueMain="OK"
        icon={AlertCircle}
        color="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
      />
    </div>
  );
};

export default CuentasKPIs;
