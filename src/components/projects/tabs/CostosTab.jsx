import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { projectService } from '@/services/projectService';
import { formatCurrencyARS } from '@/lib/formatUtils';
import { Loader2, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CostosTab = ({ projectId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCostos = async () => {
      setLoading(true);
      try {
        const breakdown = await projectService.getPartidaBreakdown(projectId);
        setData(breakdown);
      } catch (error) {
        console.error("Error al cargar costos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCostos();
  }, [projectId]);

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const totalPresupuesto = data.reduce((acc, curr) => acc + curr.budget, 0);
  const totalGastado = data.reduce((acc, curr) => acc + curr.total_gasto, 0);

  return (
    <div className="space-y-6">
      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase">Presupuesto Total</p>
          <h3 className="text-2xl font-black text-blue-900">{formatCurrencyARS(totalPresupuesto)}</h3>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase">Total Gastado</p>
          <h3 className="text-2xl font-black text-emerald-900">{formatCurrencyARS(totalGastado)}</h3>
        </Card>
        <Card className={`p-4 ${totalPresupuesto - totalGastado < 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
          <p className="text-xs font-bold text-slate-500 uppercase">Saldo Disponible</p>
          <h3 className="text-2xl font-black text-slate-900">{formatCurrencyARS(totalPresupuesto - totalGastado)}</h3>
        </Card>
      </div>

      {/* Tabla de Costos por Partida */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold text-[10px] uppercase">
            <tr>
              <th className="px-6 py-4">Partida / Rubro</th>
              <th className="px-6 py-4">Presupuesto</th>
              <th className="px-6 py-4">Gasto Real</th>
              <th className="px-6 py-4">Desvío</th>
              <th className="px-6 py-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((item) => {
              const desvio = item.budget - item.total_gasto;
              const isOverBudget = desvio < 0;

              return (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{item.name}</td>
                  <td className="px-6 py-4 font-mono">{formatCurrencyARS(item.budget)}</td>
                  <td className="px-6 py-4 font-mono text-blue-600 font-bold">{formatCurrencyARS(item.total_gasto)}</td>
                  <td className={`px-6 py-4 font-mono ${isOverBudget ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                    {formatCurrencyARS(desvio)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {isOverBudget ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500" title="Excedido" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" title="En presupuesto" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostosTab;