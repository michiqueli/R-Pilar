
import React from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/dateUtils';

function ProviderMovementsTab({ movements }) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <p className="text-slate-600">No movements found for this provider.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Project</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Description</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement, index) => (
            <motion.tr
              key={movement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-slate-100 hover:bg-slate-50"
            >
              <td className="py-3 px-4 text-slate-600 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formatDate(movement.expense_date)}
                </div>
              </td>
              <td className="py-3 px-4 font-medium text-slate-900">
                {movement.projects?.name || 'Unknown Project'}
              </td>
              <td className="py-3 px-4 text-slate-600 text-sm">
                {movement.description}
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  movement.payment_status === 'PAGADO' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {movement.payment_status}
                </span>
              </td>
              <td className="py-3 px-4 text-right font-bold text-slate-700">
                {movement.currency} {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(movement.amount)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProviderMovementsTab;
