
import React, { useState, useEffect } from 'react';
import { kpisService } from '@/services/kpisService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import KpiCard from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const BalanceMensualBlock = ({ proyectoId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const mes = currentDate.getMonth() + 1;
  const anio = currentDate.getFullYear();
  const mesNombre = currentDate.toLocaleString('es-ES', { month: 'long' });

  useEffect(() => {
    if (proyectoId) {
      console.log(`[BalanceMensualBlock] Mounting/Updating with proyectoId: ${proyectoId} for ${mes}/${anio}`);
      loadData();
    } else {
      console.warn('[BalanceMensualBlock] No proyectoId provided');
    }
  }, [proyectoId, mes, anio]);

  const loadData = async () => {
    setLoading(true);
    console.log(`[BalanceMensualBlock] Loading balance data for ${mes}/${anio}...`);
    try {
      // Load raw lists
      const [ingresosData, gastosData, balanceData] = await Promise.all([
        kpisService.getIngresos(proyectoId, mes, anio),
        kpisService.getGastos(proyectoId, mes, anio),
        kpisService.getBalanceMensual(proyectoId, mes, anio)
      ]);

      console.log(`[BalanceMensualBlock] Data Loaded:
        Ingresos (${ingresosData.length}), 
        Gastos (${gastosData.length}), 
        Balance (${JSON.stringify(balanceData)})
      `);

      setIngresos(ingresosData);
      setGastos(gastosData);
      setBalance(balanceData);
    } catch (error) {
      console.error('[BalanceMensualBlock] Error loading balance data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los datos del balance.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    console.log('[BalanceMensualBlock] Manual Refresh triggered');
    try {
      await kpisService.calcularKpis(proyectoId);
      await loadData();
      toast({
        title: 'Actualizado',
        description: 'El balance mensual ha sido recalculado con éxito.'
      });
    } catch (error) {
      console.error('[BalanceMensualBlock] Error refreshing KPIs:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Falló el cálculo de KPIs.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 mt-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Balance {mesNombre} {anio}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Resumen financiero del período actual
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Actualizar Balance
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Ingresos Totales"
          value={formatCurrency(balance?.ingresos_totales)}
          icon={TrendingUp}
          tone="emerald"
          showBar
        />

        <KpiCard
          title="Gastos Totales"
          value={formatCurrency(balance?.gastos_totales)}
          icon={TrendingDown}
          tone="red"
          showBar
        />

        <KpiCard
          title="Resultado Neto"
          value={formatCurrency(balance?.resultado)}
          icon={DollarSign}
          tone={(balance?.resultado || 0) >= 0 ? 'blue' : 'orange'}
          valueClassName={(balance?.resultado || 0) >= 0 ? "text-emerald-600" : "text-red-600"}
        />
      </div>

      {/* Two Column Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full max-h-[400px]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Ingresos del Mes</h3>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              {ingresos.length}
            </span>
          </div>
          <div className="overflow-y-auto p-0 custom-scrollbar flex-1">
            {ingresos.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                <AlertCircle className="w-6 h-6 opacity-50" />
                <p className="text-xs">No hay ingresos confirmados este mes</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {ingresos.map((item) => (
                  <div key={item.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.descripcion}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.fecha)} • {item.categoria || 'Sin categoría'}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      +{formatCurrency(item.monto)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gastos List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full max-h-[400px]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Gastos del Mes</h3>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {gastos.length}
            </span>
          </div>
          <div className="overflow-y-auto p-0 custom-scrollbar flex-1">
            {gastos.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                <AlertCircle className="w-6 h-6 opacity-50" />
                <p className="text-xs">No hay gastos confirmados este mes</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {gastos.map((item) => (
                  <div key={item.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.descripcion}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.fecha)} • {item.categoria || 'Sin categoría'}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      -{formatCurrency(item.monto)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceMensualBlock;
