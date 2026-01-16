
import React from 'react';
import { Wallet, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import KpiCard from '@/components/ui/KpiCard';

const CuentasKPIs = () => {
  const { t } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {/* 1. Saldo Total */}
      <KpiCard
        title={t('cuentas.kpi.saldoTotal')}
        value="$ 0,00"
        secondaryValue="u$s 0,00"
        icon={Wallet}
        tone="blue"
        showBar
      />

      {/* 2. Proximos Pagos */}
      <KpiCard
        title={t('cuentas.kpi.proximosPagos')}
        value="$ 0,00"
        secondaryValue="u$s 0,00"
        icon={TrendingUp}
        tone="red"
        showBar
      />

      {/* 3. Proximos Ingresos */}
      <KpiCard
        title={t('cuentas.kpi.proximosIngresos')}
        value="$ 0,00"
        secondaryValue="u$s 0,00"
        icon={DollarSign}
        tone="emerald"
        showBar
      />

      {/* 4. Alerta de Liquidez */}
      <KpiCard
        title={t('cuentas.kpi.alertaLiquidez')}
        value="OK"
        icon={AlertCircle}
        tone="purple"
      />
    </div>
  );
};

export default CuentasKPIs;
