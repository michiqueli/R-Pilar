
import React from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart2, DollarSign } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import KpiCard from '@/components/ui/KpiCard';

const CuentaDetalleKPIs = ({ stats }) => {
  const { t } = useTheme();

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* 1. Total Ingresado */}
      <KpiCard
        title={t('cuentas.kpi.totalIngresado')}
        value={formatCurrency(stats.totalIngresado)}
        icon={ArrowDownRight}
        tone="emerald"
        showBar
      />

      {/* 2. Total Gastos */}
      <KpiCard
        title={t('cuentas.kpi.totalGastos')}
        value={formatCurrency(stats.totalGastos)}
        icon={ArrowUpRight}
        tone="red"
        showBar
      />

      {/* 3. Mayor Gasto */}
      <KpiCard
        title={t('cuentas.kpi.mayorGasto')}
        value={formatCurrency(stats.mayorGasto)}
        icon={DollarSign}
        tone="orange"
        showBar
      />

      {/* 4. Cantidad Movimientos */}
      <KpiCard
        title={t('cuentas.kpi.cantidadMovimientos')}
        value={stats.cantidad}
        icon={BarChart2}
        tone="blue"
      />
    </div>
  );
};

export default CuentaDetalleKPIs;
