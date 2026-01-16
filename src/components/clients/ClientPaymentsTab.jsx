
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Plus, TrendingUp, AlertCircle, CheckCircle2, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

const ClientPaymentsTab = ({ clientId }) => {
  const [movements, setMovements] = useState([]); // Both invoices and payments
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ billed: 0, collected: 0, balance: 0 });
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Invoices
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });
      
      if (invError) throw invError;

      // Fetch Payments
      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

      if (payError) throw payError;

      // Combine and calculate
      const invList = (invoices || []).map(i => ({ ...i, type: 'invoice', amount: -Math.abs(i.total) })); // Invoices are debit (client owes)
      const payList = (payments || []).map(p => ({ ...p, type: 'payment', amount: Math.abs(p.amount) })); // Payments are credit (client pays)

      const combined = [...invList, ...payList].sort((a, b) => new Date(b.date) - new Date(a.date));
      setMovements(combined);

      // Stats
      const billed = (invoices || []).reduce((acc, curr) => acc + Number(curr.total), 0);
      const collected = (payments || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
      setStats({
        billed,
        collected,
        balance: billed - collected
      });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Error al cargar cuenta corriente' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchData();
  }, [clientId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  return (
    <div className="space-y-6">
       {/* Secondary KPIs */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 border-none">
             <div className="text-sm text-slate-500 mb-1">Total Facturado</div>
             <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.billed)}</div>
          </Card>
          <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-none">
             <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Total Cobrado</div>
             <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">{formatCurrency(stats.collected)}</div>
          </Card>
          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
             <div className="text-sm text-slate-500 mb-1">Saldo Pendiente</div>
             <div className={`text-2xl font-bold ${stats.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(stats.balance)}
             </div>
             <div className="text-xs text-slate-400 mt-1">
                {stats.balance > 0 ? 'El cliente debe' : 'A favor / Al día'}
             </div>
          </Card>
       </div>

       <div className="flex justify-between items-center pt-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Movimientos</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => toast({ title: "Próximamente", description: "Crear factura no implementado aún" })}>
               <Plus className="w-4 h-4 mr-2" /> Factura
            </Button>
            <Button size="sm" className="rounded-full" onClick={() => toast({ title: "Próximamente", description: "Registrar cobro no implementado aún" })}>
               <Plus className="w-4 h-4 mr-2" /> Cobro
            </Button>
          </div>
       </div>

       {/* Table */}
       <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Referencia</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    {format(new Date(mov.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="py-4 px-6">
                    {mov.type === 'invoice' ? (
                       <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium text-sm">
                          <FileText className="w-4 h-4 text-slate-400" /> Factura
                       </span>
                    ) : (
                       <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium text-sm">
                          <DollarSign className="w-4 h-4 text-emerald-500" /> Cobro
                       </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">
                    {mov.reference || '-'}
                  </td>
                  <td className="py-4 px-6 text-right font-medium">
                    <span className={mov.type === 'invoice' ? 'text-slate-900 dark:text-white' : 'text-emerald-600'}>
                       {mov.type === 'invoice' ? '-' : '+'}{formatCurrency(Math.abs(mov.amount))}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Chip 
                       label={mov.status} 
                       size="sm"
                       variant={mov.status === 'paid' || mov.status === 'approved' ? 'success' : 'default'}
                       className="capitalize"
                    />
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                 <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-500">No hay movimientos registrados</td>
                 </tr>
              )}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default ClientPaymentsTab;
