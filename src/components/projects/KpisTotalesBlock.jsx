
import React, { useState, useEffect } from 'react';
import { kpisService } from '@/services/kpisService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
      console.log(`[KpisTotalesBlock] Mounting/Updating with proyectoId: ${proyectoId}`);
      loadData();
    } else {
      console.warn('[KpisTotalesBlock] No proyectoId provided');
    }
  }, [proyectoId]);

  const loadData = async () => {
    setLoading(true);
    console.log(`[KpisTotalesBlock] Loading data for project ${proyectoId}...`);
    try {
      const result = await kpisService.getKpisTotales(proyectoId);
      console.log('[KpisTotalesBlock] Data received:', result);
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
    console.log('[KpisTotalesBlock] Manual Refresh triggered');
    try {
      // Recalculate everything fresh
      const result = await kpisService.calcularKpis(proyectoId);
      console.log('[KpisTotalesBlock] Recalculated result:', result);
      
      if (result && result.kpisTotales) {
          setData(result.kpisTotales);
      } else {
        await loadData();
      }
      
      toast({
        title: 'Actualizado',
        description: 'Los indicadores globales han sido recalculados con datos en tiempo real.'
      });
    } catch (error) {
      console.error('[KpisTotalesBlock] Error refreshing KPIs:', error);
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
        
        {/* INGRESOS */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-white to-emerald-50 dark:from-slate-900 dark:to-emerald-950/30">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <TrendingUp className="w-24 h-24 text-emerald-600" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    Ingresos Totales
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {formatCurrency(data.ingresos_totales)}
                    </div>
                    <div className="h-1.5 w-full bg-emerald-100 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Total acumulado confirmado
                    </p>
                </CardContent>
            </Card>
        </motion.div>

        {/* GASTOS */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <Card className="relative overflow-hidden border-red-200 dark:border-red-800 bg-gradient-to-br from-white to-red-50 dark:from-slate-900 dark:to-red-950/30">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <TrendingDown className="w-24 h-24 text-red-600" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900">
                        <TrendingDown className="w-4 h-4" />
                    </div>
                    Gastos Totales
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {formatCurrency(data.gastos_totales)}
                    </div>
                    <div className="h-1.5 w-full bg-red-100 dark:bg-red-900/50 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Total acumulado confirmado
                    </p>
                </CardContent>
            </Card>
        </motion.div>

        {/* RESULTADO */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Card className={cn(
                "relative overflow-hidden bg-gradient-to-br from-white dark:from-slate-900",
                isPositive 
                    ? "border-blue-200 dark:border-blue-800 to-blue-50 dark:to-blue-950/30" 
                    : "border-orange-200 dark:border-orange-800 to-orange-50 dark:to-orange-950/30"
            )}>
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <DollarSign className={cn("w-24 h-24", isPositive ? "text-blue-600" : "text-orange-600")} />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className={cn(
                        "text-sm font-medium flex items-center gap-2",
                        isPositive ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"
                    )}>
                    <div className={cn(
                        "p-1.5 rounded-full",
                        isPositive ? "bg-blue-100 dark:bg-blue-900" : "bg-orange-100 dark:bg-orange-900"
                    )}>
                        <DollarSign className="w-4 h-4" />
                    </div>
                    Resultado Total
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {formatCurrency(data.resultado_total)}
                    </div>
                    <div className={cn(
                        "h-1.5 w-full rounded-full overflow-hidden",
                        isPositive ? "bg-blue-100 dark:bg-blue-900/50" : "bg-orange-100 dark:bg-orange-900/50"
                    )}>
                        <div 
                            className={cn("h-full rounded-full", isPositive ? "bg-blue-500" : "bg-orange-500")} 
                            style={{ width: '100%' }} 
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Margen neto actual
                    </p>
                </CardContent>
            </Card>
        </motion.div>

      </div>
      
      {/* Breakdown mini-text */}
      <div className="flex justify-center text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-900/50 py-2 rounded-md border border-slate-100 dark:border-slate-800">
         <span>Cálculo: {formatCurrency(data.ingresos_totales)} (Ingresos) - {formatCurrency(data.gastos_totales)} (Gastos) = {formatCurrency(data.resultado_total)} (Resultado)</span>
      </div>
    </div>
  );
};

export default KpisTotalesBlock;
