import React, { useState, useEffect } from 'react';
import { kpisService } from '@/services/kpisService';
import { Button } from '@/components/ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import KpiCard from '@/components/ui/KpiCard'; // Asegúrate de que la ruta sea correcta

const KpisTotalesBlock = ({ proyectoId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    ingresos_totales: 0,
    gastos_totales: 0,
    resultado_total: 0
  });

  useEffect(() => {
    if (proyectoId) {
      loadData();
    }
  }, [proyectoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await kpisService.getKpisTotales(proyectoId);
      setData(result);
    } catch (error) {
      console.error('[KpisTotalesBlock] Error loading total KPIs:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los indicadores totales.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await kpisService.calcularKpis(proyectoId);
      if (result && result.kpisTotales) {
        setData(result.kpisTotales);
      } else {
        await loadData();
      }
      toast({
        title: 'Actualizado',
        description: 'Los indicadores globales han sido recalculados.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Falló el cálculo de KPIs globales.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const isPositive = data.resultado_total >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            Finanzas Globales
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Resumen histórico acumulado del proyecto
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
          Actualizar Datos
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <KpiCard
            title="Ingresos Totales"
            value={formatCurrency(data.ingresos_totales)}
            icon={TrendingUp}
            tone="emerald"
            showBar
            description="Total acumulado confirmado"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <KpiCard
            title="Gastos Totales"
            value={formatCurrency(data.gastos_totales)}
            icon={TrendingDown}
            tone="red"
            showBar
            description="Total acumulado confirmado"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <KpiCard
            title="Resultado Total"
            value={formatCurrency(data.resultado_total)}
            icon={DollarSign}
            tone={isPositive ? "blue" : "orange"}
            showBar
            description="Margen neto actual"
          />
        </motion.div>
      </div>
      
      {/* Breakdown mini-text */}
      <div className="flex justify-center text-center text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-900/50 py-2 px-4 rounded-md border border-slate-100 dark:border-slate-800">
         <span>
            Cálculo: {formatCurrency(data.ingresos_totales)} (Ing) - {formatCurrency(data.gastos_totales)} (Gas) = {formatCurrency(data.resultado_total)} (Res)
         </span>
      </div>
    </div>
  );
};

export default KpisTotalesBlock;