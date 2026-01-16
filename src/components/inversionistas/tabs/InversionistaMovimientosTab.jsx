
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { movimientoService } from '@/services/movimientoService';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { formatDate } from '@/lib/dateUtils';

const InversionistaMovimientosTab = ({ inversionistaId }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(true);

  const loadMovements = async () => {
    try {
      setLoadingMovements(true);
      const data = await movimientoService.getInversionistaMovements(inversionistaId);
      setMovements(data);
    } catch (error) {
      console.error("[InversionistaMovimientosTab] Error loading investor movements:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los movimientos del inversionista.'
      });
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    if (inversionistaId) {
      loadMovements();
    }
  }, [inversionistaId]);

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'INVERSION':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      case 'DEVOLUCION':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900';
      case 'INGRESO':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
      case 'GASTO':
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Title and Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Movimientos
        </h3>
        <Button 
          variant="primary" 
          onClick={() => navigate(`/movements/new?investor_id=${inversionistaId}`)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Tipo</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3 whitespace-nowrap">Proyecto</th>
                <th className="px-4 py-3 whitespace-nowrap">Cuenta</th>
                <th className="px-4 py-3 whitespace-nowrap">Fecha</th>
                <th className="px-4 py-3 whitespace-nowrap">Proveedor</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Monto ARS</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Valor USD</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Monto USD</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">IVA</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">NETO</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loadingMovements ? (
                <tr>
                  <td colSpan="12" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <p>Cargando movimientos...</p>
                    </div>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-900 dark:text-white font-medium">Sin movimientos</p>
                        <p className="text-slate-500 text-xs mt-1">Este inversionista aún no tiene movimientos registrados.</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/movements/new?investor_id=${inversionistaId}`)}
                        className="mt-2"
                      >
                        Crear primer movimiento
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getBadgeStyle(mov.type)}`}>
                        {mov.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]" title={mov.description}>
                        {mov.description}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 text-xs">
                      {mov.proyecto_nombre}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 text-xs">
                      {mov.cuenta_titulo}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {formatDate(mov.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 text-xs">
                      {mov.provider_name}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-medium text-slate-900 dark:text-white">
                      {formatCurrencyARS(mov.amount_ars)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-500 text-xs">
                      {formatCurrencyARS(mov.fx_rate)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrencyUSD(mov.usd_amount)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-500 text-xs">
                      {formatCurrencyARS(mov.vat_amount)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-600 dark:text-slate-400 font-medium">
                      {formatCurrencyARS(mov.net_amount)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                          ${mov.status === 'CONFIRMADO' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                           {mov.status || 'PENDIENTE'}
                       </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InversionistaMovimientosTab;
