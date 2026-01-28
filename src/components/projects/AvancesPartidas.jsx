import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AvancesPartidas = ({ projectId }) => {
  const { t } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("📊 [AvancesPartidas] Cargando datos desde work_items para:", projectId);

      // 1. Consultamos work_items (la misma tabla que el Plan de Obra)
      // Traemos también las subpartidas para calcular el promedio real si la columna 'progreso' no estuviera al día
      const { data: workItems, error } = await supabase
        .from('work_items')
        .select(`
          id, 
          nombre, 
          progreso,
          subpartidas(avance_pct)
        `)
        .eq('proyecto_id', projectId)
        .order('nombre');

      if (error) throw error;

      let totalProgressSum = 0;

      const processed = workItems.map(item => {
        let actualProgress = Number(item.progreso) || 0;
        
        // Si tiene subpartidas, recalculamos el promedio para asegurar exactitud
        if (item.subpartidas && item.subpartidas.length > 0) {
          const sum = item.subpartidas.reduce((acc, s) => acc + (Number(s.avance_pct) || 0), 0);
          actualProgress = Math.round(sum / item.subpartidas.length);
        }

        totalProgressSum += actualProgress;

        return {
          id: item.id,
          name: item.nombre,
          progress: actualProgress
        };
      });

      const globalAvg = processed.length > 0 ? Math.round(totalProgressSum / processed.length) : 0;
      
      setOverallProgress(globalAvg);
      setData(processed);
      
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          <p className="text-sm text-slate-400">Calculando avances...</p>
       </div>
    );
  }

  if (data.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay partidas configuradas en este proyecto.</p>
       </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
       {/* Header */}
       <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Avance de Obra</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Estado de todas las partidas</p>
          </div>
          <div className="text-right">
             <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{overallProgress}%</span>
             <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">Global</p>
          </div>
       </div>

       {/* Lista de Partidas - Sin límite, con scroll si excede el tamaño */}
       <div className="p-6 overflow-y-auto max-h-[500px] custom-scrollbar space-y-6">
          {data.map((item) => (
             <div key={item.id} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                   <span className="font-bold text-slate-700 dark:text-slate-200 truncate pr-4">{item.name}</span>
                   <span className="font-mono font-bold text-slate-900 dark:text-white">{item.progress}%</span>
                </div>
                
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                         <div 
                           className={cn(
                             "h-full rounded-full transition-all duration-1000 ease-in-out",
                             item.progress >= 100 ? "bg-emerald-500" : "bg-blue-600"
                           )}
                           style={{ width: `${item.progress}%` }}
                         />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-slate-900 text-white border-slate-800">
                      <p className="font-bold">{item.progress}% Completado</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
             </div>
          ))}
       </div>
    </div>
  );
};

export default AvancesPartidas;