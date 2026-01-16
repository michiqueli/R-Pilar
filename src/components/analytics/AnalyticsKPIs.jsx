
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const renderCard = (title, arsValue, usdValue, icon, colorClass, bgClass) => {
    const Icon = icon;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          <div className={`p-2 rounded-lg ${bgClass}`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
        </div>
        <div className="space-y-1">
          {showARS && (
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 font-medium">ARS</span>
              <span className={`text-lg font-bold ${colorClass}`}>
                {formatCurrency(arsValue, 'ARS')}
              </span>
            </div>
          )}
          {showUSD && (
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 font-medium">USD</span>
              <span className={`text-lg font-bold ${colorClass}`}>
                {formatCurrency(usdValue, 'USD')}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      {renderCard('Total Income', arsTotals.totalIncome, usdTotals.totalIncome, TrendingUp, 'text-green-600', 'bg-green-50')}
      {renderCard('Total Expenses', arsTotals.totalExpenses, usdTotals.totalExpenses, TrendingDown, 'text-red-600', 'bg-red-50')}
      {renderCard('Net Result', arsTotals.result, usdTotals.result, Activity, arsTotals.result >= 0 ? 'text-blue-600' : 'text-orange-600', arsTotals.result >= 0 ? 'bg-blue-50' : 'bg-orange-50')}
      {renderCard('VAT Income', arsTotals.totalVatIncome, usdTotals.totalVatIncome, PiggyBank, 'text-purple-600', 'bg-purple-50')}
      {renderCard('VAT Expenses', arsTotals.totalVatExpenses, usdTotals.totalVatExpenses, PiggyBank, 'text-indigo-600', 'bg-indigo-50')}
    </div>
  );
}

export default AnalyticsKPIs;
