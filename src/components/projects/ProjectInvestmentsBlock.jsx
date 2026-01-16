
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrencyARS } from '@/lib/formatUtils';
import TablaMovimientosInversion from '@/components/proyectos/TablaMovimientosInversion';
import { inversionesService } from '@/services/inversionesService';

const ProjectInvestmentsBlock = ({ projectId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState({ aportes: 0, devoluciones: 0, saldoNeto: 0, cantidad: 0 });
  
  useEffect(() => {
    if (projectId) {
      loadMovimientos();
    }
  }, [projectId]);

  const loadMovimientos = async () => {
    setLoading(true);
    try {
      const [movs, res] = await Promise.all([
        inversionesService.getMovimientosInversion(projectId),
        inversionesService.getResumenInversiones(projectId)
      ]);
      setMovimientos(movs);
      setResumen(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = (type) => {
    navigate(`/movements/new?project_id=${projectId}&type=${type}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
           <TrendingUp className="w-5 h-5 text-blue-600" />
           <h3 className="font-bold text-lg text-slate-800 dark:text-white">Inversiones del Proyecto</h3>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <Button 
              size="sm" 
              onClick={() => handleNew('INVERSION')}
              className="flex-1 sm:flex-none rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
           >
              <TrendingUp className="w-3.5 h-3.5 mr-2" /> Ingreso
           </Button>
           <Button 
              size="sm" 
              onClick={() => handleNew('DEVOLUCION')}
              className="flex-1 sm:flex-none rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
           >
              <TrendingDown className="w-3.5 h-3.5 mr-2" /> Devolución
           </Button>
        </div>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pb-2">
         {/* Aportes */}
         <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-4 border border-emerald-100 dark:border-emerald-900/20">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
               Total Aportes
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
               {formatCurrencyARS(resumen.aportes)}
            </div>
         </div>

         {/* Devoluciones */}
         <div className="bg-rose-50 dark:bg-rose-900/10 rounded-lg p-4 border border-rose-100 dark:border-rose-900/20">
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
               Total Devoluciones
            </div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
               {formatCurrencyARS(resumen.devoluciones)}
            </div>
         </div>

         {/* Saldo Neto */}
         <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/20">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
               Saldo Neto
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
               {formatCurrencyARS(resumen.saldoNeto)}
            </div>
         </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-6 pt-2">
         <TablaMovimientosInversion 
            proyectoId={projectId}
            movimientos={movimientos}
            loading={loading}
            onRefresh={loadMovimientos}
         />
      </div>

      {/* Footer / Summary Text */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-sm">
         <div className="text-slate-500">
            <span className="font-bold">APORTES:</span> <span className="text-emerald-600 font-bold">{formatCurrencyARS(resumen.aportes)}</span>
            <span className="mx-3 text-slate-300">|</span>
            <span className="font-bold">DEVOLUCIONES:</span> <span className="text-rose-600 font-bold">{formatCurrencyARS(resumen.devoluciones)}</span>
         </div>
         <div className="text-lg">
            <span className="font-bold text-slate-700 dark:text-slate-300 mr-2">Saldo Neto:</span>
            <span className="font-bold text-blue-600">{formatCurrencyARS(resumen.saldoNeto)}</span>
         </div>
      </div>
    </div>
  );
};

export default ProjectInvestmentsBlock;
