
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
      console.log("📊 [AvancesPartidas] Iniciando carga de datos para el proyecto:", projectId);

      // 1. Fetch main Work Items (Partidas) for the project
      // These are considered 'main' as they don't have a partida_padre_id
      const { data: mainPartidas, error: errorMainPartidas } = await supabase
        .from('partidas')
        .select('id, nombre, presupuesto, avance') // Include 'avance' from the main partida table
        .eq('proyecto_id', projectId)
        .is('partida_padre_id', null) // Filter for main partidas
        .order('nombre');

      if (errorMainPartidas) throw errorMainPartidas;
      console.log("Partidas principales encontradas:", mainPartidas.length, mainPartidas);

      // 2. Fetch all Subpartidas for the project to calculate average for each main partida
      const { data: subpartidas, error: errorSubs } = await supabase
        .from('subpartidas')
        .select('id, partida_id, nombre, avance_pct');

      if (errorSubs) throw errorSubs;
      console.log("Subpartidas cargadas:", subpartidas.length, subpartidas);

      let totalProgressSum = 0;
      let countOfPartidasWithProgress = 0;

      const processedPartidas = mainPartidas.map((partida) => {
        const relatedSubpartidas = subpartidas.filter(s => s.partida_id === partida.id);
        
        let avgProgressForPartida = 0;
        if (relatedSubpartidas.length > 0) {
          // Calculate average progress for this main partida based on its subpartidas
          avgProgressForPartida = relatedSubpartidas.reduce((acc, curr) => acc + (curr.avance_pct || 0), 0) / relatedSubpartidas.length;
        } else {
          // If no subpartidas, use the 'avance' directly from the main partida if it exists
          // Otherwise, it defaults to 0
          avgProgressForPartida = partida.avance || 0;
        }

        const roundedProgress = Math.round(avgProgressForPartida);
        
        console.log(`Partida: ${partida.nombre}, Progreso calculado: ${roundedProgress}%`);

        if (mainPartidas.length > 0) { // Only add to sum if there are partidas to average
          totalProgressSum += roundedProgress;
          countOfPartidasWithProgress++;
        }

        return {
          id: partida.id,
          name: partida.nombre,
          progress: roundedProgress
        };
      });

      // Calculate overall simple average progress for all main partidas
      console.log("Suma total de avances:", totalProgressSum);
      console.log("Cantidad de partidas:", countOfPartidasWithProgress);

      const globalAvg = countOfPartidasWithProgress > 0 ? (totalProgressSum / countOfPartidasWithProgress) : 0;
      const roundedGlobalAvg = Math.round(globalAvg);
      
      console.log("Avance promedio global (simple):", roundedGlobalAvg + "%");
      setOverallProgress(roundedGlobalAvg);
      setData(processedPartidas);
      
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center h-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          <p className="text-sm text-slate-400">Calculando avances...</p>
       </div>
    );
  }

  if (data.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center h-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay datos de avance disponibles.</p>
       </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
       {/* Header with Global Progress */}
       <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Progreso de Obra</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Avance general</p>
          </div>
          <div className="text-right">
             <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{overallProgress}%</span>
             <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Total</p>
          </div>
       </div>

       {/* List of Progress Bars */}
       <div className="space-y-5">
          {data.map((item) => (
             <div key={item.id} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                   <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-4">{item.name}</span>
                   <span className="font-bold text-slate-900 dark:text-white">{item.progress}%</span>
                </div>
                
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden cursor-help relative group">
                         <div 
                           className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700 ease-out relative"
                           style={{ width: `${item.progress}%` }}
                         />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className="bg-slate-900 text-white border-slate-800"
                      sideOffset={5}
                    >
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
