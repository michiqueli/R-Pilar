
import React from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart2, DollarSign } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';

const KPI = ({ label, value, icon: Icon, color, className }) => (
  <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow ${className}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{value}</h3>
      </div>
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const CuentaDetalleKPIs = ({ stats }) => {
  const { t } = useTheme();

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* 1. Total Ingresado */}
      <KPI 
        label={t('cuentas.kpi.totalIngresado')}
        value={formatCurrency(stats.totalIngresado)}
        icon={ArrowDownRight}
        color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
      />

      {/* 2. Total Gastos */}
      <KPI 
        label={t('cuentas.kpi.totalGastos')}
        value={formatCurrency(stats.totalGastos)}
        icon={ArrowUpRight}
        color="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
      />

      {/* 3. Mayor Gasto */}
      <KPI 
        label={t('cuentas.kpi.mayorGasto')}
        value={formatCurrency(stats.mayorGasto)}
        icon={DollarSign}
        color="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
      />

      {/* 4. Cantidad Movimientos */}
      <KPI 
        label={t('cuentas.kpi.cantidadMovimientos')}
        value={stats.cantidad}
        icon={BarChart2}
        color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
      />
    </div>
  );
};

export default CuentaDetalleKPIs;
