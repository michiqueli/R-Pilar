
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart3, TrendingUp, AlertTriangle, CalendarDays, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyARS } from '@/lib/formatUtils';

const GraficoLiquidezMejorado = ({ 
  datos = [], // Array of daily data { date, [accountName]: value, ... }
  cuentas = [], // Array of account definitions { id, titulo, color? }
  horizonte, 
  onHorizonteChange,
  soloEnRiesgo,
  onSoloEnRiesgoChange,
  resumen, // { totalCuentas, cuentasEnRiesgoCount, peorSaldo }
  modo,
  onModoChange
}) => {
  const [activeSeries, setActiveSeries] = useState([]);

  // Determine colors for series
  const generateColor = (index) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
      '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'
    ];
    return colors[index % colors.length];
  };

  useEffect(() => {
    // When accounts or risk filter changes, update active series
    if (cuentas.length > 0) {
      const series = cuentas.map((c, idx) => ({
        key: c.titulo, // Use title as key matching data keys
        color: generateColor(idx),
        name: c.titulo,
        id: c.id
      }));
      setActiveSeries(series);
    }
  }, [cuentas, soloEnRiesgo]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Sort payload by value (ascending to show negatives first)
      const sortedPayload = [...payload].sort((a, b) => a.value - b.value);
      
      const total = sortedPayload.reduce((sum, entry) => sum + entry.value, 0);

      return (
        <div className="bg-white dark:bg-slate-900 p-3 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl text-xs max-w-[250px] z-50">
          <p className="font-bold text-gray-700 dark:text-gray-200 mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">
            {format(parseISO(label), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
          <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
            {sortedPayload.map((entry, index) => (
              <div key={index} className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className={cn(
                    "truncate",
                    entry.value < 0 ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {entry.name}
                  </span>
                </div>
                <span className={cn(
                  "font-mono whitespace-nowrap",
                  entry.value < 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
                )}>
                  {formatCurrencyARS(entry.value)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center font-bold">
            <span className="text-gray-500">Total Proyectado</span>
            <span className={total < 0 ? "text-red-600" : "text-green-600"}>
              {formatCurrencyARS(total)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-1 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Proyección de Liquidez
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Evolución de saldos proyectada a {horizonte} días.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => onModoChange('lineas')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                    modo === 'lineas' 
                      ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Líneas
                </button>
                <button
                  onClick={() => onModoChange('barras')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                    modo === 'barras' 
                      ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Barras
                </button>
             </div>

             <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

             <div className="flex items-center gap-2">
                <Switch 
                  id="risk-filter" 
                  checked={soloEnRiesgo} 
                  onCheckedChange={onSoloEnRiesgoChange} 
                />
                <Label htmlFor="risk-filter" className="text-xs cursor-pointer select-none">
                  Solo Riesgo
                </Label>
             </div>

             <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {[7, 30, 60, 90].map(days => (
                   <button
                     key={days}
                     onClick={() => onHorizonteChange(days)}
                     className={cn(
                       "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                       horizonte === days 
                         ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" 
                         : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                     )}
                   >
                     {days}d
                   </button>
                ))}
             </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Risk Summary Banner */}
        {resumen && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-5 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                   <Maximize2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                   <p className="text-xs text-muted-foreground uppercase font-semibold">Cuentas Analizadas</p>
                   <p className="text-lg font-bold text-gray-900 dark:text-white">{resumen.totalCuentas}</p>
                </div>
             </div>

             <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full", resumen.cuentasEnRiesgoCount > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30")}>
                   <AlertTriangle className={cn("w-4 h-4", resumen.cuentasEnRiesgoCount > 0 ? "text-red-600" : "text-green-600")} />
                </div>
                <div>
                   <p className="text-xs text-muted-foreground uppercase font-semibold">Cuentas en Riesgo</p>
                   <p className={cn("text-lg font-bold", resumen.cuentasEnRiesgoCount > 0 ? "text-red-600" : "text-green-600")}>
                      {resumen.cuentasEnRiesgoCount}
                   </p>
                </div>
             </div>

             <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                   <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                   <p className="text-xs text-muted-foreground uppercase font-semibold">Peor Saldo Proyectado</p>
                   <div className="flex flex-col leading-tight">
                     <span className={cn("text-lg font-bold font-mono", resumen.peorSaldo?.amount < 0 ? "text-red-600" : "text-gray-900 dark:text-gray-100")}>
                        {formatCurrencyARS(resumen.peorSaldo?.amount || 0)}
                     </span>
                     {resumen.peorSaldo?.date && (
                       <span className="text-[10px] text-gray-500">
                         el {format(parseISO(resumen.peorSaldo.date), "d MMM", { locale: es })} ({resumen.peorSaldo.account})
                       </span>
                     )}
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            {modo === 'lineas' ? (
              <LineChart data={datos} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(parseISO(val), 'd MMM', { locale: es })}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tickFormatter={(val) => new Intl.NumberFormat('es-AR', { notation: 'compact', compactDisplay: 'short' }).format(val)}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" opacity={0.5} />
                
                {activeSeries.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={datos} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(parseISO(val), 'd MMM', { locale: es })}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tickFormatter={(val) => new Intl.NumberFormat('es-AR', { notation: 'compact', compactDisplay: 'short' }).format(val)}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" opacity={0.5} />

                {activeSeries.map((series) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    name={series.name}
                    fill={series.color}
                    stackId="a" // Remove stackId="a" if you want grouped bars instead of stacked
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GraficoLiquidezMejorado;
