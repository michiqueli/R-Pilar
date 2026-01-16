
import React from 'react';
import { TrendingUp, TrendingDown, Activity, PiggyBank } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';

function AnalyticsKPIs({ data, currencyFilter }) {
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const calculateTotals = (currency) => {
    const relevantIncomes = data.incomes.filter(i => i.currency === currency);
    const relevantExpenses = data.expenses.filter(e => e.currency === currency);

    const totalIncome = relevantIncomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const totalExpenses = relevantExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalVatIncome = relevantIncomes.reduce((sum, i) => sum + parseFloat(i.vat_amount || 0), 0);
    const totalVatExpenses = relevantExpenses.reduce((sum, e) => sum + parseFloat(e.vat_amount || 0), 0);
    const result = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, totalVatIncome, totalVatExpenses, result };
  };

  const arsTotals = calculateTotals('ARS');
  const usdTotals = calculateTotals('USD');

  const showARS = currencyFilter === 'ALL' || currencyFilter === 'ARS';
  const showUSD = currencyFilter === 'ALL' || currencyFilter === 'USD';

  const renderCard = (title, arsValue, usdValue, icon, tone, valueClass) => {
    return (
      <KpiCard title={title} icon={icon} tone={tone}>
        <div className="space-y-2">
          {showARS && (
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 font-medium">ARS</span>
              <span className={`text-lg font-bold ${valueClass}`}>
                {formatCurrency(arsValue, 'ARS')}
              </span>
            </div>
          )}
          {showUSD && (
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 font-medium">USD</span>
              <span className={`text-lg font-bold ${valueClass}`}>
                {formatCurrency(usdValue, 'USD')}
              </span>
            </div>
          )}
        </div>
      </KpiCard>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      {renderCard('Total Income', arsTotals.totalIncome, usdTotals.totalIncome, TrendingUp, 'emerald', 'text-emerald-600')}
      {renderCard('Total Expenses', arsTotals.totalExpenses, usdTotals.totalExpenses, TrendingDown, 'red', 'text-red-600')}
      {renderCard('Net Result', arsTotals.result, usdTotals.result, Activity, arsTotals.result >= 0 ? 'blue' : 'orange', arsTotals.result >= 0 ? 'text-blue-600' : 'text-orange-600')}
      {renderCard('VAT Income', arsTotals.totalVatIncome, usdTotals.totalVatIncome, PiggyBank, 'purple', 'text-purple-600')}
      {renderCard('VAT Expenses', arsTotals.totalVatExpenses, usdTotals.totalVatExpenses, PiggyBank, 'amber', 'text-amber-600')}
    </div>
  );
}

export default AnalyticsKPIs;
