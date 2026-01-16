
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowRight, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/dateUtils';

function SummaryTab({ expenses, income, currency }) {
  const navigate = useNavigate();

  const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalVATIncome = income.reduce((sum, item) => sum + parseFloat(item.vat_amount || 0), 0);
  const totalVATExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.vat_amount || 0), 0);
  
  const result = totalIncome - totalExpenses;
  const accumulatedBalance = result;

  // Recent transactions
  const allTransactions = [
    ...income.map(i => ({ ...i, type: 'income', date: i.income_date })),
    ...expenses.map(e => ({ ...e, type: 'expense', date: e.expense_date }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Income',
      value: totalIncome,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Total Expenses',
      value: totalExpenses,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Net Result',
      value: result,
      icon: DollarSign,
      color: result >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor: result >= 0 ? 'bg-blue-50' : 'bg-orange-50',
      borderColor: result >= 0 ? 'border-blue-200' : 'border-orange-200'
    },
    {
      title: 'Accumulated Balance',
      value: accumulatedBalance,
      icon: Wallet,
      color: accumulatedBalance >= 0 ? 'text-purple-600' : 'text-red-600',
      bgColor: accumulatedBalance >= 0 ? 'bg-purple-50' : 'bg-red-50',
      borderColor: accumulatedBalance >= 0 ? 'border-purple-200' : 'border-red-200'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-xl border ${stat.bgColor} ${stat.borderColor}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{stat.title}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>
              {currency} {formatCurrency(stat.value)}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-slate-500">
             <PiggyBank className="w-4 h-4" />
             <span className="text-sm font-medium">VAT Analysis</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
             <span className="text-sm text-slate-600">VAT Income</span>
             <span className="font-semibold text-green-600">{currency} {formatCurrency(totalVATIncome)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
             <span className="text-sm text-slate-600">VAT Expenses</span>
             <span className="font-semibold text-red-600">{currency} {formatCurrency(totalVATExpenses)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end p-4">
          <Button 
            variant="outline" 
            className="w-full h-full flex flex-col gap-2 border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
            onClick={() => navigate('/analytics')}
          >
            <TrendingUp className="w-6 h-6" />
            <span className="font-semibold">View Full Analytics</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/expenses')}>View All</Button>
        </div>
        <table className="w-full">
          <tbody className="divide-y divide-slate-100">
            {allTransactions.map((tx, idx) => (
               <tr key={tx.id || idx} className="hover:bg-slate-50">
                 <td className="px-6 py-3 text-sm text-slate-500">{formatDate(tx.date)}</td>
                 <td className="px-6 py-3 text-sm font-medium text-slate-900">{tx.description}</td>
                 <td className="px-6 py-3 text-sm text-right">
                   <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                     {tx.type === 'income' ? '+' : '-'} {currency} {formatCurrency(tx.amount)}
                   </span>
                 </td>
               </tr>
            ))}
            {allTransactions.length === 0 && (
              <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">No recent transactions</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SummaryTab;
