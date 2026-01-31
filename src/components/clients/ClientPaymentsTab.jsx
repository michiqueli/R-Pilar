import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Plus, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const ClientPaymentsTab = ({ clientId }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Facturas (Tabla: invoices)
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });
      
      if (invError) throw invError;

      // 2. Cobros (Tabla: inversiones)
      // CORRECCIÓN: Ordenamos por 'fecha', no por 'date'
      const { data: payments, error: payError } = await supabase
        .from('inversiones')
        .select('*')
        .eq('cliente_id', clientId)
        .order('fecha', { ascending: false });

      if (payError) throw payError;

      // 3. Normalización de datos
      const invList = (invoices || []).map(i => ({ 
          id: i.id,
          date: i.date, 
          type: 'invoice', 
          amount: -Math.abs(Number(i.total)), // Negativo porque es deuda
          reference: i.number || 'Sin ref',
          status: i.status 
      })); 

      const payList = (payments || []).map(p => ({ 
          id: p.id,
          date: p.fecha, // CORRECCIÓN: Usamos 'fecha'
          type: 'payment', 
          amount: Math.abs(Number(p.monto_ars)), // CORRECCIÓN: Usamos 'monto_ars'
          reference: p.descripcion || 'Cobro', // Usamos la descripción como referencia
          status: p.estado 
      }));

      // 4. Unificar y Ordenar
      const combined = [...invList, ...payList].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
      );
      
      setMovements(combined);

    } catch (error) {
      console.error("Error al cargar movimientos:", error);
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

  // Función auxiliar para traducir estados a colores de Chip
  const getStatusVariant = (status, type) => {
      const s = status?.toLowerCase();
      if (s === 'paid' || s === 'confirmado' || s === 'approved') return 'success';
      if (s === 'pendiente' || s === 'sent') return 'warning';
      return 'default';
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center pt-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Cuenta Corriente</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full">
               <Plus className="w-4 h-4 mr-2" /> Factura
            </Button>
            <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
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
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                 <tr><td colSpan="5" className="py-8 text-center text-slate-400">Cargando movimientos...</td></tr>
              ) : movements.length === 0 ? (
                 <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-500">No hay movimientos registrados</td>
                 </tr>
              ) : (
                 movements.map((mov) => (
                    <tr key={`${mov.type}-${mov.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {mov.date ? format(new Date(mov.date), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="py-4 px-6">
                        {mov.type === 'invoice' ? (
                           <span className="inline-flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wide bg-slate-100 px-2 py-1 rounded">
                              <FileText className="w-3 h-3" /> Factura
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wide bg-emerald-50 px-2 py-1 rounded">
                              <DollarSign className="w-3 h-3" /> Cobro
                           </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {mov.reference}
                      </td>
                      <td className="py-4 px-6 text-right font-bold font-mono">
                        <span className={mov.type === 'invoice' ? 'text-slate-600' : 'text-emerald-600'}>
                           {mov.type === 'invoice' ? '-' : '+'}{formatCurrency(Math.abs(mov.amount))}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Chip 
                           label={mov.status} 
                           size="sm"
                           variant={getStatusVariant(mov.status, mov.type)}
                           className="capitalize"
                        />
                      </td>
                    </tr>
                 ))
              )}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default ClientPaymentsTab;