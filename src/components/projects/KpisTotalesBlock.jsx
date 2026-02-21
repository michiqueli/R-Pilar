import React, { useState, useEffect } from 'react';
import { kpisService } from '@/services/kpisService';
import { proyeccionService } from '@/services/proyeccionService';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Wallet, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import KpiCard from '@/components/ui/KpiCard';
import { formatCurrencyARS } from '@/lib/formatUtils';
import { Button } from '@/components/ui/Button';

const KpisTotalesBlock = ({ projectId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    ingresos_totales: 0,
    gastos_totales: 0,
    resultado_total: 0
  });
  const [totalProyeccion, setTotalProyeccion] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [result, proyeccion] = await Promise.all([
        kpisService.getKpisTotales(projectId),
        proyeccionService.getTotalEstimado(projectId)
      ]);
      setData(result);
      setTotalProyeccion(proyeccion);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los indicadores.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  const isPositive = data.resultado_total >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Finanzas Globales</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Resumen histórico acumulado del proyecto</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard
          title="Ingresos Totales"
          value={formatCurrencyARS(data.ingresos_totales)}
          icon={TrendingUp}
          tone="emerald"
          showBar
          description="Ventas y aportes operativos"
        />
        <KpiCard
          title="Gastos Totales"
          value={formatCurrencyARS(data.gastos_totales)}
          icon={TrendingDown}
          tone="red"
          showBar
          description="Pagos y devoluciones"
        />
        <KpiCard
          title="Resultado Operativo"
          value={formatCurrencyARS(data.resultado_total)}
          icon={DollarSign}
          tone={isPositive ? "blue" : "orange"}
          showBar
          description="Margen neto (Ingresos - Gastos)"
        />
        {/* NEW: Proyección KPI */}
        <KpiCard
          title="Proyección"
          value={formatCurrencyARS(totalProyeccion)}
          icon={Target}
          tone="purple"
          showBar
          description="Gastos estimados (carga manual)"
          secondaryValue={
            totalProyeccion > 0 && data.gastos_totales > 0
              ? `${Math.round((data.gastos_totales / totalProyeccion) * 100)}% ejecutado`
              : undefined
          }
        />
      </div>
    </div>
  );
};

export default KpisTotalesBlock;
