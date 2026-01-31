import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Plus, Receipt, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrencyARS } from '@/lib/formatUtils';

const ProviderMovementsTab = ({ providerId }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // En proveedores buscamos en 'inversiones' donde proveedor_id coincida
      const { data, error } = await supabase
        .from('inversiones')
        .select(`
          *,
          projects (name)
        `)
        .eq('proveedor_id', providerId)
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Normalizamos la data para que la tabla sea idéntica a la de clientes
      const normalized = (data || []).map(m => ({
        id: m.id,
        date: m.fecha,
        type: m.tipo, // GASTO, DEVOLUCION, etc.
        reference: m.descripcion || 'Sin descripción',
        project: m.projects?.name || 'Sin proyecto',
        amount: m.tipo === 'GASTO' ? -Math.abs(m.monto_ars) : Math.abs(m.monto_ars),
        status: m.estado
      }));

      setMovements(normalized);
    } catch (error) {
      console.error("Error al cargar movimientos de proveedor:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudieron cargar los movimientos' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (providerId) fetchData();
  }, [providerId]);

  const getStatusVariant = (status) => {
    const s = status?.toLowerCase();
    if (s === 'confirmado' || s === 'pagado' || s === 'approved') return 'success';
    if (s === 'pendiente') return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pt-2">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Historial de Movimientos</h3>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-full"
            onClick={() => toast({ title: "Info", description: "Use el botón 'Nuevo' en la página principal" })}
          >
            <Plus className="w-4 h-4 mr-2" /> Gasto
          </Button>
        </div>
      </div>

      {/* Table - Diseño idéntico a ClientPaymentsTab */}
      <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
              <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan="5" className="py-12 text-center text-slate-400">Cargando movimientos...</td></tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="w-8 h-8 text-slate-200" />
                    <p className="text-slate-500 font-medium">No hay movimientos registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400 font-mono">
                    {mov.date ? format(new Date(mov.date + 'T12:00:00'), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                      {mov.project}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {mov.reference}
                  </td>
                  <td className="py-4 px-6 text-right font-bold font-mono">
                    <span className={mov.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'}>
                      {mov.amount < 0 ? '-' : '+'}{formatCurrencyARS(Math.abs(mov.amount))}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Chip 
                      label={mov.status} 
                      size="sm"
                      variant={getStatusVariant(mov.status)}
                      className="capitalize font-bold text-[10px]"
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

export default ProviderMovementsTab;