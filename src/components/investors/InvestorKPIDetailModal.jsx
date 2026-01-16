
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrencyARS, formatCurrencyUSD, formatDate } from '@/lib/formatUtils';
import { tokens } from '@/lib/designTokens';
import { useNavigate } from 'react-router-dom';

const InvestorKPIDetailModal = ({ isOpen, onClose, title, movements = [] }) => {
  const navigate = useNavigate();

  const totalUSD = movements.reduce((acc, m) => acc + (Number(m.usd_amount) || 0), 0);
  const totalARS = movements.reduce((acc, m) => acc + (Number(m.amount_ars) || 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-[900px] h-[80vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            style={{ borderRadius: tokens.radius.modal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
               <Button variant="ghost" size="iconSm" onClick={onClose} className="rounded-full">
                 <X className="w-5 h-5 text-slate-400" />
               </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-100 dark:border-slate-800 sticky top-0">
                    <tr>
                       <th className="px-6 py-3 font-semibold">Fecha</th>
                       <th className="px-6 py-3 font-semibold">Proyecto</th>
                       <th className="px-6 py-3 font-semibold">Tipo</th>
                       <th className="px-6 py-3 font-semibold text-right">Monto USD</th>
                       <th className="px-6 py-3 font-semibold text-right">Monto ARS</th>
                       <th className="px-6 py-3 font-semibold">Notas</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {movements.length === 0 ? (
                       <tr><td colSpan="6" className="p-8 text-center text-slate-400">No hay movimientos registrados</td></tr>
                    ) : (
                       movements.map(m => (
                          <tr 
                             key={m.id} 
                             className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                             onClick={() => {
                                onClose();
                                navigate(m.type === 'INVERSION_RECIBIDA' ? `/incomes/${m.id}` : `/expenses/${m.id}`);
                             }}
                          >
                             <td className="px-6 py-4 text-slate-500">{formatDate(m.date)}</td>
                             <td className="px-6 py-4 font-medium">{m.project_name || '-'}</td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                                   m.type === 'INVERSION_RECIBIDA' 
                                     ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                     : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                   {m.type === 'INVERSION_RECIBIDA' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                   {m.type === 'INVERSION_RECIBIDA' ? 'Ingreso' : 'Devolución'}
                                </span>
                             </td>
                             <td className={`px-6 py-4 text-right font-mono font-bold ${m.type === 'INVERSION_RECIBIDA' ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrencyUSD(m.usd_amount)}
                             </td>
                             <td className="px-6 py-4 text-right font-mono text-slate-500">
                                {formatCurrencyARS(m.amount_ars)}
                             </td>
                             <td className="px-6 py-4 text-slate-500 text-xs max-w-[150px] truncate">{m.notes}</td>
                          </tr>
                       ))
                    )}
                 </tbody>
               </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-6 shrink-0">
               <div className="text-right">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Total USD</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrencyUSD(totalUSD)}</span>
               </div>
               <div className="text-right">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Total ARS</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrencyARS(totalARS)}</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvestorKPIDetailModal;
