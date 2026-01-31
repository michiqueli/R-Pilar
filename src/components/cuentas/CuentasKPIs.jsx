import React, { useMemo } from 'react';
import { Wallet, TrendingDown, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import { formatCurrencyARS } from '@/lib/formatUtils';

const CuentasKPIs = ({ cuentas = [], proyecciones = { pagos: 0, ingresos: 0 }, loading }) => {
  const stats = useMemo(() => {
    const saldoTotal = cuentas.reduce((acc, c) => acc + (c.saldo_calculado || 0), 0);
    const cuentasConDeuda = cuentas.filter(c => c.saldo_calculado < 0).length;

    return {
      saldoTotal,
      cuentasConDeuda,
      hayRiesgo: cuentasConDeuda > 0 || (saldoTotal < proyecciones.pagos)
    };
  }, [cuentas, proyecciones]);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 animate-pulse">
    {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-3xl" />)}
  </div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {/* 1. Saldo Real Total */}
      <KpiCard
        title="Saldo Total Actual"
        value={formatCurrencyARS(stats.saldoTotal)}
        icon={Wallet}
        tone="blue"
        showBar
      />

      {/* 2. Próximos Pagos (Pendientes GASTO) */}
      <KpiCard
        title="Próximos Pagos"
        value={formatCurrencyARS(proyecciones.pagos)}
        description="Gastos pendientes de confirmar"
        icon={TrendingDown}
        tone="red"
        valueClassName="text-red-600"
        showBar
      />

      {/* 3. Próximos Ingresos (Pendientes INGRESO) */}
      <KpiCard
        title="Próximos Ingresos"
        value={formatCurrencyARS(proyecciones.ingresos)}
        description="Cobros pendientes de confirmar"
        icon={DollarSign}
        tone="emerald"
        valueClassName="text-emerald-600"
        showBar
      />

      {/* 4. Estado de Liquidez */}
      <KpiCard
        title="Estado de Liquidez"
        value={stats.hayRiesgo ? 'ALERTA' : 'ESTABLE'}
        icon={stats.hayRiesgo ? AlertCircle : CheckCircle2}
        tone={stats.hayRiesgo ? "amber" : "emerald"}
        description={stats.hayRiesgo ? "Los pagos pendientes superan el saldo o hay cuentas en rojo" : "Saldos positivos y controlados"}
      />
    </div>
  );
};

export default CuentasKPIs;