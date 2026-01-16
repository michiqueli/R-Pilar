
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { Loader2, CalendarRange, Filter } from 'lucide-react';

import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { formatCurrencyARS, formatCurrencyUSD } from '@/lib/formatUtils';
import { analiticaService } from '@/services/analiticaService';
import PageHeader from '@/components/layout/PageHeader';

// New Components
import KPICard from '@/components/analytics/KPICard';
import ComposicionModal from '@/components/analytics/ComposicionModal';
import RankingObras from '@/components/analytics/RankingObras';

const AnalyticsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Filters State
  const [periodo, setPeriodo] = useState('anio'); // 'mes' | 'anio'
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [moneda, setMoneda] = useState('ARS'); // 'ARS' | 'USD'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('ingresos');

  // Data State
  const [kpis, setKpis] = useState({ ingresos: 0, egresos: 0, beneficio: 0, saldoTotal: 0 });
  const [ingresosProyectos, setIngresosProyectos] = useState({ datos: [], total: 0 });
  const [egresosProyectos, setEgresosProyectos] = useState({ datos: [], total: 0 });
  const [chartData, setChartData] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  const [topProveedores, setTopProveedores] = useState([]);
  const [topClientes, setTopClientes] = useState([]);

  // Fetch Data
  useEffect(() => {
    loadData();
  }, [periodo, year, month, moneda]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log("Loading Analytics Data...");
      const [
        kpisData,
        ingresosP,
        egresosP,
        chart,
        ranking,
        provs,
        clientes
      ] = await Promise.all([
        analiticaService.getKPIs(periodo, year, month, moneda),
        analiticaService.getIngresosPorProyecto(periodo, year, month, moneda),
        analiticaService.getEgresosPorProyecto(periodo, year, month, moneda),
        analiticaService.getIngresosVsEgresos(periodo, year, month, moneda),
        analiticaService.getTopBottomObras(periodo, year, month, moneda),
        analiticaService.getTopProveedores(periodo, year, month, moneda),
        analiticaService.getTopClientes(periodo, year, month, moneda)
      ]);

      setKpis(kpisData);
      setIngresosProyectos(ingresosP);
      setEgresosProyectos(egresosP);
      setChartData(chart);
      setRankingData(ranking);
      setTopProveedores(provs);
      setTopClientes(clientes);

    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({ 
        variant: "destructive", 
        title: "Error al cargar datos", 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenComposition = (tab) => {
    setModalTab(tab);
    setModalOpen(true);
  };

  const formatMoney = (val) => moneda === 'USD' ? formatCurrencyUSD(val) : formatCurrencyARS(val);

  return (
    <div className="flex flex-col h-full space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* 1. Header & Compact Filters */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Analítica Financiera" 
          description="Monitoreo de rendimiento, flujo de fondos y rentabilidad de proyectos."
        />
        
        {/* Compact Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Period Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
              <button
                onClick={() => setPeriodo('mes')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                  periodo === 'mes' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setPeriodo('anio')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                  periodo === 'anio' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Anual
              </button>
            </div>

            {/* Date Selectors */}
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[85px] h-8 text-xs border-0 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-0">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map(i => {
                  const y = new Date().getFullYear() - i;
                  return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                })}
              </SelectContent>
            </Select>

            {periodo === 'mes' && (
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[110px] h-8 text-xs border-0 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-0">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Currency */}
            <Select value={moneda} onValueChange={setMoneda}>
              <SelectTrigger className="w-[85px] h-8 text-xs font-bold text-blue-600 dark:text-blue-400 border-0 bg-blue-50/50 dark:bg-blue-900/20 focus:ring-0 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">🇦🇷 ARS</SelectItem>
                <SelectItem value="USD">🇺🇸 USD</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      {/* 2. KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Ingresos Totales"
          value={kpis.ingresos}
          subtitle="Cobrado en el periodo"
          color="green"
          currency={moneda}
          loading={loading}
          onViewComposition={() => handleOpenComposition('ingresos')}
        />
        <KPICard 
          title="Egresos Totales"
          value={kpis.egresos}
          subtitle="Pagado en el periodo"
          color="red"
          currency={moneda}
          loading={loading}
          onViewComposition={() => handleOpenComposition('egresos')}
        />
        <KPICard 
          title="Beneficio Neto"
          value={kpis.beneficio}
          subtitle={`Margen: ${kpis.ingresos > 0 ? ((kpis.beneficio / kpis.ingresos) * 100).toFixed(1) : 0}%`}
          color="blue"
          currency={moneda}
          loading={loading}
        />
        <KPICard 
          title="Saldo en Caja (Real)"
          value={kpis.saldoTotal}
          subtitle="Disponibilidad total actual"
          color="purple"
          currency={moneda}
          loading={loading}
        />
      </div>

      {/* 3. Main Chart & Ranking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart (2/3 width) */}
        <Card className="lg:col-span-2 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Flujo de Fondos: Ingresos vs Egresos</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
               <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1"/> Ingresos</span>
               <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-rose-500 mr-1"/> Egresos</span>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15)',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: '#0f172a'
                    }}
                    formatter={(value) => formatMoney(value)}
                  />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  <Bar dataKey="egresos" name="Egresos" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Ranking Obras (1/3 width) */}
        <div className="lg:col-span-1 h-full">
           <RankingObras 
             data={rankingData} 
             loading={loading} 
             moneda={moneda} 
           />
        </div>
      </div>

      {/* 4. Bottom Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Proveedores */}
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Top Proveedores (Gastos)</h3>
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Acumulado Periodo</span>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                 <tr>
                   <th className="px-4 py-2 text-left font-medium text-xs">Proveedor</th>
                   <th className="px-4 py-2 text-center font-medium text-xs">Movs</th>
                   <th className="px-4 py-2 text-right font-medium text-xs">Total</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {loading ? (
                   <tr><td colSpan="3" className="p-8 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-300" /></td></tr>
                 ) : topProveedores.length === 0 ? (
                   <tr><td colSpan="3" className="p-4 text-center text-slate-400 text-xs">Sin datos</td></tr>
                 ) : (
                   topProveedores.map((prov, i) => (
                     <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{prov.nombre}</td>
                       <td className="px-4 py-3 text-center text-slate-500 text-xs">{prov.cantidad}</td>
                       <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatMoney(prov.monto)}</td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </Card>

        {/* Top Clientes */}
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Top Clientes (Rentabilidad)</h3>
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Beneficio Neto</span>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                 <tr>
                   <th className="px-4 py-2 text-left font-medium text-xs">Cliente</th>
                   <th className="px-4 py-2 text-center font-medium text-xs">Proyectos</th>
                   <th className="px-4 py-2 text-right font-medium text-xs">Beneficio</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {loading ? (
                   <tr><td colSpan="3" className="p-8 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-300" /></td></tr>
                 ) : topClientes.length === 0 ? (
                   <tr><td colSpan="3" className="p-4 text-center text-slate-400 text-xs">Sin datos</td></tr>
                 ) : (
                   topClientes.map((cli, i) => (
                     <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{cli.nombre}</td>
                       <td className="px-4 py-3 text-center text-slate-500 text-xs">{cli.nroProyectos}</td>
                       <td className={`px-4 py-3 text-right font-bold ${cli.beneficio >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {formatMoney(cli.beneficio)}
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </Card>
      </div>

      {/* Composition Modal */}
      <ComposicionModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab={modalTab}
        dataIngresos={ingresosProyectos}
        dataEgresos={egresosProyectos}
        moneda={moneda}
      />
    </div>
  );
};

export default AnalyticsPage;
