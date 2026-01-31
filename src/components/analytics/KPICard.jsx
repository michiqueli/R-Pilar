import React from 'react';
import { TrendingUp, TrendingDown, Activity, Wallet } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';

const AnalyticsKPICards = ({ kpiData, moneda, loading }) => {
  const format = moneda === 'USD' ? formatCurrencyUSD : formatCurrencyARS;
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-[32px]" />)}
      </div>
    );
  }
console.log(kpiData)
  const { ingresos, egresos, beneficio, saldoTotal } = kpiData;
  const margen = ingresos > 0 ? ((beneficio / ingresos) * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Ingresos Totales"
        value={format(ingresos)}
        description="Cobrado en el periodo"
        icon={TrendingUp}
        tone="emerald"
        showBar
      />

      <KpiCard
        title="Egresos Totales"
        value={format(egresos)}
        description="Pagado en el periodo"
        icon={TrendingDown}
        tone="red"
        showBar
      />

      <KpiCard
        title="Beneficio Neto"
        value={format(beneficio)}
        secondaryValue={`Margen: ${margen}%`}
        icon={Activity}
        tone="blue"
        showBar
      />

      <KpiCard
        title="Saldo en Caja"
        value={format(saldoTotal)}
        description="Disponibilidad actual real"
        icon={Wallet}
        tone="purple"
        showBar
      />
    </div>
  );
};

export default AnalyticsKPICards;